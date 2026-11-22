(function(){
'use strict';
var L = document.getElementById('loading'); if (!L || window.XCAR) return;
var D = document, H = D.documentElement, now = function(){ return Date.now(); };
var t0 = now(), p = 0, ultimoP = t0, fatto = false, uscito = false, dcl = false, errore = false, lento = false, finale = false, mozza = false;
var bar = L.querySelector('.xl-bar'), tx = L.querySelector('.xl-tx');
function ridotto(){ try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){ return false; } }
try { var cv = /Chrome\/(\d+)/.exec(navigator.userAgent || ''); if (localStorage.getItem('gb_lite') === '1' || (cv && +cv[1] < 110)) L.classList.add('xl-lite'); } catch(e){}
function lite(){ return L.classList.contains('xl-lite') || H.classList.contains('gb-lite'); }
var en = false;
try {
var gl = localStorage.getItem('gb_lang');
if (gl) en = gl === 'en';
else { var m = /language_code%(?:25)?22%(?:25)?3A%(?:25)?22([a-zA-Z-]+)/.exec(location.hash || '') || /language_code":"([a-zA-Z-]+)/.exec(decodeURIComponent(location.hash || ''));
if (m) en = !/^it/i.test(m[1]); }
} catch(e){}
var T = en ? {
avvio: 'Starting', carico: 'Loading the games', prep: 'Getting your home ready', pronto: 'Ready',
lento: 'Slow connection, almost there', ferma: 'The connection stopped', lungo: 'Taking longer than usual', offline: 'You are offline', riprova: 'Try again',
tips: ['40+ games, free to play against bots', 'Challenge real players live in the Arena', 'Every match levels you up',
'Provably fair: every bet can be verified', 'Invite friends from the gift at the top'] } : {
avvio: 'Avvio', carico: 'Carico i giochi', prep: 'Preparo la home', pronto: 'Pronto',
lento: 'Connessione lenta, ancora un attimo', ferma: 'La connessione si è fermata', lungo: 'Ci sta mettendo più del solito', offline: 'Sei offline', riprova: 'Riprova',
tips: ['Più di 40 giochi, anche gratis contro i bot', 'Nell’Arena sfidi giocatori veri, dal vivo', 'Ogni partita fa salire il tuo livello',
'Equità dimostrabile: ogni giocata si può verificare', 'Invita gli amici dal regalo in alto'] };
var rb = L.querySelector('.xl-retry'); if (rb) { rb.textContent = T.riprova; rb.onclick = function(){ try { location.reload(); } catch(e){} }; }
var riga = '';
function scrivi(s){
if (!tx || s === riga) return; riga = s;
var vec = tx.querySelector('span:not(.xl-fuori)'), nu = D.createElement('span');
nu.className = 'xl-entra'; nu.textContent = s; tx.appendChild(nu);
if (vec) { vec.className = 'xl-fuori'; setTimeout(function(){ if (vec.parentNode) vec.parentNode.removeChild(vec); }, 500); }
void nu.offsetWidth; nu.className = '';
}
function manda(fase){ try { window.dispatchEvent(new CustomEvent('gbx:caricamento', {detail: {p: Math.round(p * 1000) / 1000, fase: fase}})); } catch(e){} }
function metti(v, fase){
if (fatto || !(v > p)) return;
p = Math.min(1, v); ultimoP = now();
if (errore) { errore = false; L.classList.remove('xl-errore'); riga = ''; }
if (bar) { clearTimeout(XCAR && XCAR._c); bar.style.setProperty('--xl-pt', '.6s'); bar.style.setProperty('--xl-p', p.toFixed(3)); }
L.setAttribute('aria-valuenow', Math.round(p * 100));
manda(fase || 'pagina');
}
var XCAR = window.XCAR = {
p: function(q, nx){
if (q >= 1) finale = true;
metti(.04 + .84 * q, 'pagina');
if (nx > q && bar && !fatto) {
var dove = .04 + .84 * (q + .85 * (nx - q)), dur = 4 + 40 * (nx - q);
clearTimeout(XCAR._c);
XCAR._c = setTimeout(function(){ if (fatto) return; bar.style.setProperty('--xl-pt', dur.toFixed(1) + 's'); bar.style.setProperty('--xl-p', dove.toFixed(3)); }, 650);
}
},
stato: function(){ return {p: p, dcl: dcl, lento: lento, errore: errore, uscito: uscito, ms: now() - t0}; }
};
scrivi(T.avvio); metti(.04, 'inizio');
var tip = Math.floor(Math.random() * T.tips.length), tiT = 0, giri = 0;
function giro(){
if (fatto) return;
if (errore) { tiT = setTimeout(giro, 1000); return; }
var ms = now() - t0;
if (!dcl && ms > 8000 && !lento) { lento = true; giri = 0; L.classList.add('xl-lento'); scrivi(T.lento); manda('lento'); }
else if (!dcl && lento) { scrivi(++giri % 2 ? T.tips[tip++ % T.tips.length] : T.lento); }
else if (!dcl && ms > 1800) { scrivi(T.tips[tip++ % T.tips.length]); }
if (!dcl && !sonda && now() - Math.max(ultimoP, sondaT) > 20000) prova();
if (!dcl && now() - ultimoP > 45000) guasto(T.lungo);
if (dcl && dclT && now() - dclT > 10000) esci();
tiT = setTimeout(giro, 3400);
}
setTimeout(giro, 1800);
var sonda = false, sondaT = 0;
function prova(){
if (!window.fetch) return; sonda = true;
var ac = null; try { ac = new AbortController(); } catch(e){}
var tm = setTimeout(function(){ try { ac && ac.abort(); } catch(e){} }, 9000);
fetch('gbx_favicon_32.png?xl=' + now(), {cache: 'no-store', signal: ac ? ac.signal : undefined})
.then(function(r){ clearTimeout(tm); sonda = false; if (r && r.ok) sondaT = now(); else guasto(T.ferma); },
function(){ clearTimeout(tm); sonda = false; if (!dcl) guasto(T.ferma); });
}
function guasto(s){
if (errore || fatto) return; errore = true;
L.classList.add('xl-errore'); scrivi(s); manda('errore');
}
try { addEventListener('offline', function(){ if (!dcl) guasto(T.offline); }); } catch(e){}
var dclT = 0;
D.addEventListener('DOMContentLoaded', function(){
if (!finale || !D.getElementById('gbx-js')) { mozza = true; errore = false; guasto(T.ferma); manda('mozza'); return; }
dcl = true; dclT = now(); L.classList.remove('xl-errore'); errore = false;
if (lento) { lento = false; L.classList.remove('xl-lento'); }
scrivi(T.prep); metti(.94, 'dcl');
});
try {
new MutationObserver(function(){ if (L.classList.contains('hide') || L.style.display === 'none') esci(); })
.observe(L, {attributes: true, attributeFilter: ['class', 'style']});
} catch(e){}
function benvenuto(){
try {
return !localStorage.getItem('gb_onboarded') && !(window.TRN && TRN.want) && !(window.LOB && LOB.want) && !window.GB_DEEP
&& typeof window.obOpen === 'function' && !!D.getElementById('onboard');
} catch(e){ return false; }
}
var attesa = false;
function esci(daBenvenuto){
if (uscito || mozza) return;
if (attesa && daBenvenuto !== true) return;
if (!attesa && benvenuto()) {
attesa = true; L.classList.add('xl-tieni'); scrivi(T.pronto); metti(.98, 'benvenuto');
var ob = D.getElementById('onboard'), via = function(){ if (mo) mo.disconnect(); clearTimeout(tm); esci(true); }, mo = null;
var tm = setTimeout(via, 1600);
try { mo = new MutationObserver(function(){ if (ob.classList.contains('show')) { mo.disconnect(); clearTimeout(tm); tm = setTimeout(via, 180); } });
mo.observe(ob, {attributes: true, attributeFilter: ['class']}); } catch(e){}
return;
}
uscito = true; clearTimeout(tiT);
metti(1, 'uscita'); fatto = true; scrivi(T.pronto);
var piano = lite() || ridotto();
L.classList.add('xl-esce');
var durata = piano ? 260 : 460, volato = false;
if (!piano && !attesa) { try { volato = vola(); } catch(e){} }
if (!volato) L.classList.add('xl-svanisci');
try { if (!piano) entra(); } catch(e){}
setTimeout(function(){
L.classList.add('xl-via'); H.classList.add('xl-pronto');
try { window.dispatchEvent(new CustomEvent('gbx:avvio-fine', {detail: {ms: now() - t0, volato: volato}})); } catch(e){}
manda('via');
}, durata);
}
function vola(){
var home = D.querySelector('#home.active');
var im = home && home.querySelector('.xh-large .xh-badge img');
var fly = L.querySelector('.xl-fly');
if (!im || !fly || !im.complete || !im.naturalWidth || !/marchio/.test(im.currentSrc || im.src)) return false;
var a = fly.getBoundingClientRect(), b = im.getBoundingClientRect();
if (!b.width || b.bottom < 0 || b.top > innerHeight) return false;
var s = (b.height * .531) / a.height;
var dx = (b.left + b.width / 2) - (a.left + a.width / 2), dy = (b.top + b.height / 2) - (a.top + a.height / 2);
if (!fly.animate) return false;
XCAR.volo = [Math.round(a.left), Math.round(a.top), Math.round(a.width), Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(dx), Math.round(dy), +s.toFixed(3)];
fly.animate([{transform: 'none', opacity: 1}, {transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')', opacity: 1, offset: .82},
{transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')', opacity: 0}],
{duration: 460, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards'});
im.animate([{opacity: 0}, {opacity: 0, offset: .74}, {opacity: 1}], {duration: 460, easing: 'linear'});
return true;
}
function entra(){
var home = D.querySelector('#home.active'); if (!home) return;
try { if (!localStorage.getItem('gb_onboarded')) return; } catch(e){ return; }
var root = home.querySelector('#xh-root'); if (!root || !root.animate) return;
var vh = innerHeight, k = 0, lista = [];
var wm = home.querySelector('.xh-large .xh-wm'); if (wm) lista.push([wm, 'x']);
[].forEach.call(root.children, function(c){
if (c.classList.contains('xh-large')) return;
var r = c.getBoundingClientRect(); if (r.height && r.top < vh && r.bottom > 0) lista.push([c, 'y']);
});
lista.slice(0, 8).forEach(function(x){ su(x[0], x[1] === 'x' ? '-10px 0' : '0 12px', 20 + k++ * 30); });
var nav = D.querySelector('.bnav'); if (nav) su(nav, '0 16px', 80);
}
function su(el, da, rit){
var o = {duration: 460, delay: rit, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards'};
el.animate([{opacity: 0}, {opacity: 1}], o);
o.composite = 'add';
el.animate([{translate: da}, {translate: '0 0'}], o);
}
})();