/* TUTORIAL_2011 — SBANCA!: il tutorial gira TUTTO nella pagina (?modo=tutorial, senza rt=1). Niente server, niente rete.
   La "WebSocket" della pagina diventa un lettore: riproduce i fotogrammi registrati dal MOTORE VERO (sbanca_rt.py, giro
   salto 20/11) con strumenti/registra_sbanca_tutorial.py, e li fa avanzare solo quando il giocatore fa il gesto del passo
   (tiene ▶, salta di lato, doppio salto, sceglie l'arma, mira/potenza entro la tolleranza). Rami e "riprova" = altri pezzi
   registrati dallo stesso stato. Il tempo dei fotogrammi e i numeri degli eventi si rifanno qui (sempre in avanti).
   Guscio (index, stessa origine): postMessage {sm:'tut2011', g:'sbanca', ev:'pronto'|'esci'|'fine', fai:'gioca'|'allena'|''};
   giu': {sm:'tut2011_io', nome, foto}. Stato per le prove: window.__TUT2011. Niente gestori in linea (CSP di Discord). */
(function(){
"use strict";
var DATI = window.__TUT2011_DATI;
var QQ = new URLSearchParams(location.search);
if (QQ.get('modo') !== 'tutorial' || QQ.get('rt') === '1' || !DATI) return;
var EN = (function(){ try { return LANG === 'en'; } catch (e) { return QQ.get('lang') === 'en'; } })();
var IN_FR = window.parent !== window;
var ORIG = location.origin;
var STATO = window.__TUT2011 = { g: 'sbanca', passo: 0, tot: 8, finito: false, rete: 0, id: 'carica', prove: 0, eventi: [] };
function su(o){ if (!IN_FR) return; try { o.sm = 'tut2011'; o.g = 'sbanca'; window.parent.postMessage(o, ORIG); } catch (e) {} }

// ── rete: nel tutorial non esce niente (solo i file della pagina: arte/, tutorial.js) ──
(function(){
  function nostro(u){
    try { var x = new URL(String(u), location.href); return x.origin === location.origin && !/\/(api|ws)(\/|$|\?)/.test(x.pathname) && !/^\/(duel|lobby|foto)\//.test(x.pathname); }
    catch (e) { return false; }
  }
  var f0 = window.fetch;
  if (f0) window.fetch = function(u, o){
    var url = (typeof u === 'string') ? u : (u && u.url) || '';
    if (nostro(url)) return f0.apply(this, arguments);
    STATO.rete++; return Promise.reject(new Error('tutorial: niente rete'));
  };
  var X = window.XMLHttpRequest;
  if (X) { var op = X.prototype.open; X.prototype.open = function(m, u){ if (!nostro(u)) { STATO.rete++; throw new Error('tutorial: niente rete'); } return op.apply(this, arguments); }; }
  try { if (navigator.sendBeacon) navigator.sendBeacon = function(){ STATO.rete++; return false; }; } catch (e) {}
  try { window.EventSource = function(){ STATO.rete++; throw new Error('tutorial: niente rete'); }; } catch (e) {}
})();

// ── localStorage: le scritture del tutorial restano in memoria (le partite vere non cambiano) ──
var MEM = {};
window.__TUT2011_LS = function(k, v){
  if (v === undefined) { if (Object.prototype.hasOwnProperty.call(MEM, k)) return MEM[k]; try { return localStorage.getItem('sbanca_' + k); } catch (e) { return null; } }
  MEM[k] = String(v); return undefined;
};

// ── i fotogrammi registrati (delta: il primo pieno, poi solo le chiavi cambiate; '-' = chiavi tolte) ──
function decodifica(lista){
  var out = [], cur = null;
  for (var i = 0; i < lista.length; i++) {
    var d = lista[i], n = cur ? Object.assign({}, cur, d) : Object.assign({}, d);
    if (d['-']) { for (var j = 0; j < d['-'].length; j++) delete n[d['-'][j]]; }
    delete n['-'];
    n.feed = d.feed || [];
    out.push(n); cur = n;
  }
  return out;
}
var PZ = {};
Object.keys(DATI.pz).forEach(function(k){
  if (k === 'doppio_D') { PZ.D = {}; Object.keys(DATI.pz.doppio_D).forEach(function(j){ PZ.D[j] = decodifica(DATI.pz.doppio_D[j]); }); }
  else PZ[k] = decodifica(DATI.pz[k]);
});
var META = DATI.meta;

// ── testi ──
var TT = EN ? {
  passo: 'STEP', di: 'of', avanti: 'Next', salta: 'Skip tutorial', fine: 'TUTORIAL',
  benv: ['Welcome to SBANCA!', 'A short guided match against a practice bot, at your own pace. It is turn based: on your turn you move and fire one shot. The ring at the top is your turn timer: during the tutorial it waits for you.'],
  cam_t: 'Walk', cam_tel: 'Put your finger on <b>▶</b> and keep it there: you walk. <b>◀ ▶</b> work like a joystick: slide your finger from one side to the other to turn.', cam_pc: 'Hold <kbd>D</kbd> (or <kbd>→</kbd>) to walk right. <kbd>A</kbd> walks back.',
  cam_no: 'The other way: towards the bot, to the right.',
  sd_t: 'Jump sideways', sd_tel: 'Keep <b>▶</b> pressed and tap <b>▲</b>: you jump that way. With the joystick: finger on <b>▶</b> and push up.', sd_pc: 'Hold <kbd>D</kbd> and press <kbd>W</kbd> (or <kbd>↑</kbd>): you jump that way. <kbd>W</kbd> alone jumps straight up.',
  sd_v: 'That was a straight jump. Now keep ▶ pressed while you jump.', sd_l: 'Towards the bot: keep ▶ (right) pressed while you jump.',
  dj_t: 'Double jump', dj_tel: 'Tap <b>▲</b> and, while you are in the air, tap <b>▲</b> again. With the joystick: up, down and up again.', dj_pc: 'Press <kbd>W</kbd>, then <kbd>W</kbd> again while in the air.',
  dj_tardi: 'Almost! Press ▲ a second time while you are still in the air.', dj_cap: 'That is the high back flip. For the double jump press ▲ twice.',
  ar_t: 'Weapons', ar_tel: 'Your weapon is shown here: <b>{a}</b>. Tap it to open the list. You start with a few; the others come from the crates that fall during the match.', ar_pc: 'Your weapon: <b>{a}</b>. Right click opens the weapon wheel, <kbd>Tab</kbd> changes group, <kbd>1</kbd>-<kbd>9</kbd> pick directly.',
  mi_t: 'Aim and power', mi_tel: 'Drag from your character along the dashed line: the longer the drag, the stronger the shot. Then tap <b>FIRE</b>. The wind is light now (arrow at the top).', mi_pc: 'Move the mouse onto the dashed line, then hold the left button: power grows. Release at the mark on the bar. The wind is light now (arrow at the top).',
  mi_alto: 'A bit higher', mi_basso: 'A bit lower', mi_forte: 'A bit stronger', mi_piano: 'A bit softer', mi_arma: 'For this shot use {a}.', mi_aiuto: 'Close enough: I will help you with this one.',
  bot_t: 'The bot\'s turn', bot_p: 'Now it is the bot\'s turn. The wind is strong: watch how it pushes its shot.',
  ve_t: 'The wind', ve_p: 'The wind changed and is strong against you (arrow at the top). <b>{s}</b> feels the wind; <b>{c}</b> does not: it bounces and goes off after 3 seconds. Pick <b>{c}</b>.', ve_pc: ' (right click or <kbd>Tab</kbd>)',
  t2_t: 'Finish it', t2_p: 'Aim along the dashed line and fire. The fuse is 3 seconds.', t2_arma: 'With this wind {s} goes long: pick {c}.',
  pr_t: 'Not yet', pr_p: 'Follow the current step first.',
  fi_t: 'You finished the tutorial', fi_p: 'You can walk, jump sideways, double jump, pick a weapon, aim with power and read the wind.', gioca: 'Play now', allena: 'Practice with bots', rivedi: 'Replay'
} : {
  passo: 'PASSO', di: 'di', avanti: 'Avanti', salta: 'Salta tutorial', fine: 'TUTORIAL',
  benv: ['Benvenuto in SBANCA!', 'Una partita guidata contro un bot di prova, con calma. Si gioca a turni: nel tuo turno ti muovi e fai un colpo. Il cerchio in alto è il tempo del turno: nel tutorial ti aspetta.'],
  cam_t: 'Camminare', cam_tel: 'Metti il dito su <b>▶</b> e tienilo: cammini. <b>◀ ▶</b> sono una levetta: scorri col dito da una parte all\'altra per girarti.', cam_pc: 'Tieni premuto <kbd>D</kbd> (o <kbd>→</kbd>) per camminare a destra. <kbd>A</kbd> torna indietro.',
  cam_no: 'Dall\'altra parte: verso il bot, a destra.',
  sd_t: 'Salto di lato', sd_tel: 'Tieni <b>▶</b> e tocca <b>▲</b>: salti da quella parte. Con la levetta: dito su <b>▶</b> e spingi in su.', sd_pc: 'Tieni <kbd>D</kbd> e premi <kbd>W</kbd> (o <kbd>↑</kbd>): salti da quella parte. <kbd>W</kbd> da solo salta dritto in su.',
  sd_v: 'Questo era un salto dritto. Ora tieni ▶ mentre salti.', sd_l: 'Verso il bot: tieni ▶ (destra) mentre salti.',
  dj_t: 'Doppio salto', dj_tel: 'Tocca <b>▲</b> e, mentre sei in aria, tocca di nuovo <b>▲</b>. Con la levetta: su, giù e di nuovo su.', dj_pc: 'Premi <kbd>W</kbd> e di nuovo <kbd>W</kbd> mentre sei in aria.',
  dj_tardi: 'Quasi! Premi ▲ una seconda volta mentre sei ancora in aria.', dj_cap: 'Quello è il salto alto all\'indietro. Per il doppio salto premi ▲ due volte.',
  ar_t: 'Le armi', ar_tel: 'Qui c\'è l\'arma scelta: <b>{a}</b>. Toccala per aprire l\'elenco. Si parte con poche armi; le altre arrivano dagli scrigni che cadono durante la partita.', ar_pc: 'La tua arma: <b>{a}</b>. Il tasto destro apre la ruota delle armi, <kbd>Tab</kbd> cambia gruppo, <kbd>1</kbd>-<kbd>9</kbd> le scelgono subito.',
  mi_t: 'Mira e potenza', mi_tel: 'Trascina dal tuo personaggio lungo la linea tratteggiata: più è lunga, più il colpo è forte. Poi tocca <b>SPARA</b>. Ora il vento è leggero (freccia in alto).', mi_pc: 'Porta il mouse sulla linea tratteggiata, poi tieni premuto il tasto sinistro: la potenza sale. Lascia alla tacca della barra. Ora il vento è leggero (freccia in alto).',
  mi_alto: 'Un po\' più in alto', mi_basso: 'Un po\' più in basso', mi_forte: 'Un po\' più forte', mi_piano: 'Un po\' più piano', mi_arma: 'Per questo colpo usa {a}.', mi_aiuto: 'Ci sei quasi: questo te lo aggiusto io.',
  bot_t: 'Tocca al bot', bot_p: 'Ora tocca al bot. Il vento è forte: guarda come spinge il suo colpo.',
  ve_t: 'Il vento', ve_p: 'Il vento è cambiato ed è forte contro di te (freccia in alto). <b>{s}</b> sente il vento; <b>{c}</b> no: rimbalza e scoppia dopo 3 secondi. Scegli <b>{c}</b>.', ve_pc: ' (tasto destro o <kbd>Tab</kbd>)',
  t2_t: 'Il colpo finale', t2_p: 'Mira lungo la linea tratteggiata e spara. La miccia è di 3 secondi.', t2_arma: 'Con questo vento {s} va lungo: prendi {c}.',
  pr_t: 'Non ancora', pr_p: 'Prima segui il passo di adesso.',
  fi_t: 'Hai finito il tutorial', fi_p: 'Sai camminare, saltare di lato, fare il doppio salto, scegliere l\'arma, mirare con la potenza giusta e leggere il vento.', gioca: 'Gioca ora', allena: 'Allenati coi bot', rivedi: 'Rivedi'
};
function arma(k){ try { return nomeArma(k); } catch (e) { return k; } }

// ── stile (solo CSS: niente script in linea) ──
var css = document.createElement('style');
css.textContent =
  '#tut.t11{pointer-events:auto}#tut.t11 .t11h{display:flex;align-items:center;justify-content:space-between;gap:8px}' +
  '#tut.t11 .t11x{background:none!important;padding:6px 2px!important;font:700 11px/1 var(--x-disp)!important;color:rgba(255,255,255,.62)!important;border-radius:8px!important}' +
  '#tut.t11 .t11b{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}#tut.t11 .t11b button.sec{background:rgba(255,255,255,.12)}' +
  '#tut.t11 p kbd{display:inline-block;min-width:18px;padding:2px 5px;border-radius:5px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);font:700 11px/1.2 var(--x-disp);text-align:center}' +
  '#tut.t11 .t11n{margin-top:8px;font:700 12px/1.3 var(--x-disp);color:var(--x-gold);min-height:0}' +
  '#tut.t11.fin{top:50%!important;transform:translate(-50%,-50%)!important;text-align:center}#tut.t11.fin b{font-size:22px}#tut.t11.fin .t11b{justify-content:center}' +
  '.t11ring{position:fixed;z-index:13;pointer-events:none;border-radius:16px;border:2.5px solid var(--x-gold);box-shadow:0 0 0 4px rgba(245,177,76,.22),0 0 22px rgba(245,177,76,.55);display:none;animation:t11p 1.1s ease-in-out infinite}' +
  '@keyframes t11p{50%{box-shadow:0 0 0 9px rgba(245,177,76,.06),0 0 30px rgba(245,177,76,.75)}}' +
  '#t11tacca{position:absolute;top:0;width:3px;height:100%;background:#fff;box-shadow:0 0 4px #000}' +
  'body.rm .t11ring{animation:none}#tut.t11 p b{display:inline;font:inherit;font-weight:800;margin:0;color:#fff}';
document.head.appendChild(css);

// ── il riquadro (#tut della pagina) ──
var BOX = null, RING = null, RING_T = null;
function box(){ if (!BOX) { BOX = document.getElementById('tut'); BOX.classList.add('t11'); } return BOX; }
function el(tag, cls, html){ var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
function mostra(o){
  var b = box(); b.innerHTML = ''; b.classList.toggle('fin', !!o.fin);
  var h = el('div', 't11h');
  h.appendChild(el('small', '', o.fin ? TT.fine : (TT.passo + ' ' + STATO.passo + ' ' + TT.di + ' ' + STATO.tot)));
  if (!o.fin) { var x = el('button', 't11x', TT.salta); x.type = 'button'; x.addEventListener('click', esci); h.appendChild(x); }
  b.appendChild(h);
  b.appendChild(el('b', '', o.t));
  b.appendChild(el('p', '', o.p));
  var n = el('div', 't11n', ''); b.appendChild(n);
  if (!o.fin) {
    var dots = el('div', 'dots'); for (var i = 1; i <= STATO.tot; i++) dots.appendChild(el('i', i <= STATO.passo ? 'on' : '')); b.appendChild(dots);
  }
  if (o.bottoni && o.bottoni.length) {
    var bb = el('div', 't11b');
    o.bottoni.forEach(function(x){ var k = el('button', x.sec ? 'sec' : '', x.t); k.type = 'button'; k.setAttribute('data-t11', x.id || ''); k.addEventListener('click', x.fa); bb.appendChild(k); });
    b.appendChild(bb);
  }
  b.classList.add('on');
  evidenzia(o.ev || null);
}
function nota(t){ var b = box(); var n = b.querySelector('.t11n'); if (n) n.textContent = t || ''; if (t) { try { aptico('light'); } catch (e) {} } }
function nascondi(){ if (BOX) BOX.classList.remove('on'); evidenzia(null); }
// un anello per ogni comando da guardare (selettori separati da virgola)
function evidenzia(sel){
  RING_T = sel ? sel.split(',') : [];
  if (!RING) RING = [];
  while (RING.length < RING_T.length) { var r = el('div', 't11ring'); document.body.appendChild(r); RING.push(r); }
  for (var i = 0; i < RING.length; i++) if (i >= RING_T.length) RING[i].style.display = 'none';
}
function ringFrame(){
  if (RING && RING_T) {
    for (var i = 0; i < RING_T.length; i++) {
      var R = RING[i], e = document.querySelector(RING_T[i]);
      var q = (e && e.offsetParent) ? e.getBoundingClientRect() : null;
      if (!q || q.width < 2) { R.style.display = 'none'; continue; }
      R.style.display = 'block'; R.style.left = (q.left - 6) + 'px'; R.style.top = (q.top - 6) + 'px';
      R.style.width = (q.width + 12) + 'px'; R.style.height = (q.height + 12) + 'px';
    }
  }
  requestAnimationFrame(ringFrame);
}
requestAnimationFrame(ringFrame);
function pc(){ try { return !!PC; } catch (e) { return false; } }

// ── la WebSocket finta: il lettore ──
var IN = { mx: 0, my: 0 }, ARMA = 'tiro_secco', SOCK = null, T = 0, SEQ = 0, ULT = null, TIMER = null;
var M = { lista: null, i: 0, modo: 'hold', gate: null, fine: null, nAuto: 0 };
var PLAY = { su: [] };
function invia(o){ if (SOCK && SOCK.readyState === 1 && SOCK.onmessage) { try { SOCK.onmessage({ data: JSON.stringify(o) }); } catch (e) { console.error('TUT2011', e); } } }
function emetti(f){
  T = Math.round((T + 0.05) * 100) / 100;
  var s = Object.assign({}, f);
  s.t = T;
  s.feed = (f.feed || []).map(function(e){ var x = Object.assign({}, e); x.t = T; x.s = ++SEQ; if (e.k === 'end' || e.k === 'turno') STATO.eventi.push(e.k); return x; });
  ULT = f;
  invia({ t: 's', s: s });
}
function tieni(){
  if (!ULT) return;
  var f = Object.assign({}, ULT); f.feed = [];
  if (f.turno === 'tu' && (f.st === 'turno' || f.st === 'pre') && f.ars && f.ars[ARMA] !== 0) f.sel = ARMA;
  var keep = ULT; emetti(f); ULT = keep;
}
function suona(lista, modo, gate, fine){ M.lista = lista; M.i = 0; M.modo = modo; M.gate = gate || null; M.fine = fine || null; }
function giro(){
  if (M.modo === 'hold' || !M.lista) { tieni(); return; }
  if (M.modo === 'gate' && M.gate && !M.gate(M.i)) { tieni(); return; }
  emetti(M.lista[M.i]); M.i++;
  if (M.onFrame) M.onFrame(M.i);
  if (M.i >= M.lista.length) { var f = M.fine; M.modo = 'hold'; M.lista = null; if (f) f(); }
}
function FintaWS(url){
  var me = this; this.url = String(url); this.readyState = 0; this.binaryType = 'blob'; this.bufferedAmount = 0; this.extensions = ''; this.protocol = '';
  this.onopen = this.onmessage = this.onclose = this.onerror = null;
  SOCK = this;
  setTimeout(function(){
    me.readyState = 1; try { if (me.onopen) me.onopen({ type: 'open' }); } catch (e) {}
    su({ ev: 'pronto' });
    // il nome e la foto veri arrivano dal guscio subito dopo «pronto»: si aspettano un attimo prima dello start
    setTimeout(avvia, IN_FR ? 450 : 0);
  }, 0);
}
FintaWS.CONNECTING = 0; FintaWS.OPEN = 1; FintaWS.CLOSING = 2; FintaWS.CLOSED = 3;
FintaWS.prototype.send = function(raw){ var o; try { o = JSON.parse(raw); } catch (e) { return; } if (o && typeof o === 'object') riceve(o); };
FintaWS.prototype.close = function(){ this.readyState = 3; };
FintaWS.prototype.addEventListener = function(){}; FintaWS.prototype.removeEventListener = function(){};
var IO = null;
window.addEventListener('message', function(ev){
  if (ev.origin !== ORIG || ev.source !== window.parent) return;
  var d = ev.data; if (!d || d.sm !== 'tut2011_io') return;
  var n = String(d.nome || '').replace(/[\u0000-\u001f<>&"]/g, '').trim().slice(0, 22);
  var f = String(d.foto || ''); if (!/^(https:\/\/|data:image\/(jpeg|png|webp);base64,|\/)[^\s"'<>]{1,2000}$/.test(f)) f = '';
  IO = { nome: n, foto: f };
});
var avviato = false;
function avvia(){
  if (avviato) return; avviato = true;
  var st = JSON.parse(JSON.stringify(DATI.start));
  if (IO && st.map && st.map.squadre && st.map.squadre.tu) { if (IO.nome) st.map.squadre.tu.nome = IO.nome; if (IO.foto) st.map.squadre.tu.foto = IO.foto; }
  invia(st);
  T = PZ.intro[0].t - 0.05;
  suona(PZ.intro, 'auto', null, passoBenvenuto);
  TIMER = setInterval(giro, 50);
}
// i messaggi della pagina
var GESTO = null;   // il passo di adesso decide cosa fare dei gesti
function riceve(o){
  if (o.t === 'in') { IN.mx = +o.mx || 0; IN.my = +o.my || 0; if (GESTO && GESTO.in) GESTO.in(); return; }
  if (o.t === 'act') {
    if (o.a === 'arma' && typeof o.ax === 'string' && /^[a-z_]{1,24}$/.test(o.ax) && o.ax.indexOf('sc_') !== 0) { ARMA = o.ax; if (GESTO && GESTO.arma) GESTO.arma(o.ax); return; }
    if (o.a === 'salto' || o.a === 'capriola') { if (GESTO && GESTO.salto) GESTO.salto(o.a); return; }
    if (o.a === 'spara') { if (GESTO && GESTO.spara) GESTO.spara(o); else if (GESTO && !GESTO.libero) nota(TT.pr_p); return; }
  }
}

// ── la guida di mira: linea tratteggiata dal personaggio + tacca sulla barra della potenza ──
var GUIDA = null;
function lunghezza(){ try { return Math.min(260, Math.min(VW, VH) * .42); } catch (e) { return 200; } }
function miaUnita(){ try { if (!S) return null; for (var i = 0; i < S.U.length; i++) if (S.U[i][0] === 0) return S.U[i]; } catch (e) {} return null; }
STATO.mira = function(){
  var u = miaUnita(); if (!u || !GUIDA) return null;
  var ux = (u[1] - cam.x) * cam.s + VW / 2, uy = (u[2] - cam.y) * cam.s + VH / 2, a = GUIDA.ang * Math.PI / 180, L = GUIDA.p * lunghezza();
  return { ux: ux, uy: uy, ang: GUIDA.ang, p: GUIDA.p, L: L, x: ux + Math.cos(a) * L, y: uy + Math.sin(a) * L };
};
function disegnaGuida(){
  var m = STATO.mira(); if (!m) return;
  try {
    ctx.save(); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.setLineDash([7, 7]); ctx.lineDashOffset = -(performance.now() / 40) % 14;
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 4;
    ctx.beginPath(); ctx.moveTo(m.ux, m.uy); ctx.lineTo(m.x, m.y); ctx.stroke();
    ctx.setLineDash([]); ctx.strokeStyle = '#f5b14c'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(m.x, m.y, 11 + Math.sin(performance.now() / 180) * 2, 0, Math.PI * 2); ctx.stroke();
    ctx.font = '800 12px Inter,sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText(Math.round(m.p * 100) + '%', m.x, m.y - 18);
    ctx.restore();
  } catch (e) {}
}
function tacca(){
  var pb = document.getElementById('pbar'); if (!pb) return;
  var t = document.getElementById('t11tacca');
  if (!GUIDA) { if (t) t.remove(); return; }
  if (!t) { t = el('i'); t.id = 't11tacca'; pb.appendChild(t); }
  t.style.left = 'calc(' + (GUIDA.p * 100).toFixed(1) + '% - 1px)';
}

// ── i passi ──
function vai(n, id){ STATO.passo = n; STATO.id = id; }
function passoBenvenuto(){
  vai(1, 'benvenuto'); GESTO = { libero: false };
  mostra({ t: TT.benv[0], p: TT.benv[1], ev: '#timer', bottoni: [{ id: 'avanti', t: TT.avanti, fa: passoCammina }] });
}
function passoCammina(){
  vai(2, 'cammina');
  var tx = function(){ return pc() ? TT.cam_pc : TT.cam_tel; };
  mostra({ t: TT.cam_t, p: tx(), ev: pc() ? null : '#br' });
  var n = META.cammina_n;
  suona(PZ.cammina, 'gate', function(i){ return i >= n || IN.mx > 0.3; }, passoSaltoLato);
  GESTO = { in: function(){ if (IN.mx < -0.3) nota(TT.cam_no); else nota(''); } };
}
function passoSaltoLato(){
  vai(3, 'salto_lato');
  mostra({ t: TT.sd_t, p: pc() ? TT.sd_pc : TT.sd_tel, ev: pc() ? null : '#br,#bj' });
  var corre = false;
  GESTO = { salto: function(a){
    if (corre || a !== 'salto') return;
    if (IN.mx > 0.3) { corre = true; nota(''); suona(PZ.salto_d, 'auto', null, passoDoppio); }
    else if (IN.mx < -0.3) nota(TT.sd_l);
    else { corre = true; suona(PZ.salto_v, 'auto', null, function(){ corre = false; nota(TT.sd_v); }); }
  } };
}
function passoDoppio(){
  vai(4, 'doppio');
  mostra({ t: TT.dj_t, p: pc() ? TT.dj_pc : TT.dj_tel, ev: pc() ? null : '#bj,#br' });
  var stato = 0;   // 0 a terra, 1 in aria col primo salto, 2 doppio partito
  GESTO = { salto: function(a){
    if (a === 'capriola') { if (!stato) nota(TT.dj_cap); return; }
    if (stato === 0) {
      stato = 1; nota('');
      suona(PZ.doppio_S, 'auto', null, function(){ stato = 0; M.onFrame = null; nota(TT.dj_tardi); });
      return;
    }
    if (stato === 1 && M.lista === PZ.doppio_S) {
      var j = String(M.i);     // fotogrammi gia' mandati = tick fatti dopo il primo salto
      if (PZ.D[j]) { stato = 2; nota(''); suona(PZ.D[j], 'auto', null, passoArmi); }
    }
  } };
}
function passoArmi(){
  vai(5, 'armi'); GESTO = { libero: false };
  mostra({ t: TT.ar_t, p: (pc() ? TT.ar_pc : TT.ar_tel).replace('{a}', arma('tiro_secco')), ev: pc() ? null : '#armi',
    bottoni: [{ id: 'avanti', t: TT.avanti, fa: passoMira }] });
}
function controllaTiro(o, g, prove){
  var ax = +o.ax, ay = +o.ay, p = +o.p;
  if (!isFinite(ax) || !isFinite(ay) || !isFinite(p)) return 'no';
  var ang = Math.atan2(ay, ax) * 180 / Math.PI, da = ang - g.ang, dp = p - g.p;
  var ta = prove >= 2 ? 10 : 6, tp = prove >= 2 ? .18 : .11;
  if (prove >= 4) return 'aiuto';
  if (Math.abs(da) <= ta && Math.abs(dp) <= tp) return 'ok';
  // angoli negativi = in alto: piu' negativo = piu' alto (verso destra)
  if (Math.abs(da) > ta) return da > 0 ? 'alto' : 'basso';
  return dp < 0 ? 'forte' : 'piano';
}
function passoMira(){
  vai(6, 'mira');
  try { selArma('tiro_secco'); } catch (e) {}
  GUIDA = { ang: META.tiro1.ang, p: META.tiro1.p }; tacca();
  mostra({ t: TT.mi_t, p: pc() ? TT.mi_pc : TT.mi_tel, ev: pc() ? null : '#fire' });
  var prove = 0, via = false;
  GESTO = { spara: function(o){
    if (via) return;
    if (ARMA !== 'tiro_secco') { nota(TT.mi_arma.replace('{a}', arma('tiro_secco'))); return; }
    var r = controllaTiro(o, GUIDA, prove); prove++; STATO.prove = prove;
    if (r === 'ok' || r === 'aiuto') {
      via = true; if (r === 'aiuto') nota(TT.mi_aiuto); else nota('');
      GUIDA = null; tacca();
      setTimeout(function(){ nascondi(); }, r === 'aiuto' ? 1400 : 300);
      suona(PZ.tiro1, 'auto', null, passoVento);
      M.onFrame = function(i){ if (i === META.tiro1.bot_i) { mostra({ t: TT.bot_t, p: TT.bot_p, ev: '#wind' }); } };
      GESTO = { libero: true };
      return;
    }
    nota({ alto: TT.mi_alto, basso: TT.mi_basso, forte: TT.mi_forte, piano: TT.mi_piano }[r] || '');
  } };
}
function passoVento(){
  M.onFrame = null;
  vai(7, 'vento');
  var s = arma('tiro_secco'), c = arma('fiche_calda');
  mostra({ t: TT.ve_t, p: TT.ve_p.replace(/\{s\}/g, s).replace(/\{c\}/g, c) + (pc() ? TT.ve_pc : ''), ev: pc() ? '#wind' : '#wind,#armi' });
  var fatto = false;
  var ok = function(){ if (fatto) return; fatto = true; passoTiro2(); };
  GESTO = { arma: function(k){ if (k === 'fiche_calda') ok(); }, spara: function(){ nota(TT.t2_arma.replace('{s}', s).replace('{c}', c)); } };
  if (ARMA === 'fiche_calda') setTimeout(ok, 600);
}
function passoTiro2(){
  vai(8, 'tiro2');
  var s = arma('tiro_secco'), c = arma('fiche_calda');
  GUIDA = { ang: META.tiro2.ang, p: META.tiro2.p }; tacca();
  mostra({ t: TT.t2_t, p: TT.t2_p, ev: pc() ? null : '#fire' });
  var prove = 0, via = false;
  GESTO = { arma: function(){}, spara: function(o){
    if (via) return;
    if (ARMA !== 'fiche_calda') { nota(TT.t2_arma.replace('{s}', s).replace('{c}', c)); return; }
    var r = controllaTiro(o, GUIDA, prove); prove++; STATO.prove = prove;
    if (r === 'ok' || r === 'aiuto') {
      via = true; nota(r === 'aiuto' ? TT.mi_aiuto : '');
      GUIDA = null; tacca();
      setTimeout(nascondi, r === 'aiuto' ? 1400 : 300);
      GESTO = { libero: true };
      suona(PZ.tiro2, 'auto', null, function(){ setTimeout(passoFine, 1500); });
      return;
    }
    nota({ alto: TT.mi_alto, basso: TT.mi_basso, forte: TT.mi_forte, piano: TT.mi_piano }[r] || '');
  } };
}
var FINITO = false;
function passoFine(){
  if (FINITO) return; FINITO = true;
  STATO.finito = true; STATO.id = 'fine'; STATO.passo = STATO.tot;
  try { var fe = document.getElementById('fine'); if (fe) fe.classList.remove('on'); } catch (e) {}
  GESTO = { libero: true };
  mostra({ fin: true, t: TT.fi_t, p: TT.fi_p, bottoni: [
    { id: 'gioca', t: TT.gioca, fa: function(){ chiudi('gioca'); } },
    { id: 'allena', t: TT.allena, sec: true, fa: function(){ chiudi('allena'); } },
    { id: 'rivedi', t: TT.rivedi, sec: true, fa: function(){ location.reload(); } }] });
}
function ferma(){ if (TIMER) { clearInterval(TIMER); TIMER = null; } }
function chiudi(fai){
  ferma(); su({ ev: 'fine', fai: fai });
  if (!IN_FR) {
    try { location.href = fai === 'allena' ? shUrl({ modo: 'bot', lv: 'facile', lang: EN ? 'en' : '' }) : urlMenu(); } catch (e) {}
  }
}
function esci(){
  ferma(); su({ ev: 'esci', fai: '' });
  if (!IN_FR) { try { location.href = urlMenu(); } catch (e) {} }
}

// ── dentro la pagina: si aggancia DOPO che lo script principale ha definito tutto (chiamato da __TUT2011_AVVIA) ──
window.__TUT2011_INIT = function(){
  window.WebSocket = FintaWS;
  try { window.tutorial = function(){}; } catch (e) {}                 // il vecchio tutorial a 3 turni (serviva il server di prova)
  try { window.shManda = function(){}; } catch (e) {}                  // niente messaggi «inizio/fine» al guscio: e' un tutorial
  try { window.vaiMenu = esci; } catch (e) {}
  try { var f0 = window.fineSchermo; window.fineSchermo = function(){ passoFine(); }; } catch (e) {}
  try { var d0 = window.disegna; window.disegna = function(dt){ d0(dt); if (GUIDA) disegnaGuida(); }; } catch (e) {}
  try { if (typeof rivincita === 'function') window.rivincita = function(){ location.reload(); }; } catch (e) {}
};
})();
