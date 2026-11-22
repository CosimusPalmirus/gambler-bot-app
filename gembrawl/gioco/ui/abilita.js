// GAMBLER BRAWL — sezione ABILITÀ nella scheda eroe (21/11), come le schede di Gambler Smash: per ogni abilità
// (attacco, super, gadget e la passiva se c'è) nome, descrizione, qualche numero chiaro e il mini video in loop.
// I video sono registrazioni di partite vere (strumenti/clip_abilita.mjs) in abilita_video/<eroe>_<abilita>.mp4;
// quali ci sono lo dice abilita_video/indice.json. Se la clip manca si vede il segnaposto «video in arrivo».
// Aggancio: gioco.js, in aggiornaScheda, chiama ABILITA.mostra($('d-kit'), id, LANG) e la sezione prende il posto dell'elenco.
(function (root) {
  'use strict';
  var E = root.EROI;
  var COL = { att: '#ff9f1c', sup: '#ffd23b', gad: '#3bff8b', pas: '#1ad7ff', kat: '#ff5a4a', ksu: '#ff3355', kga: '#ff6f8f', ktr: '#ffb23b' };   // k* = Fante in forma Cavaliere (23/11)
  var ICO = {
    att: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="2.4" fill="currentColor"/><path d="M12 1v5M12 18v5M1 12h5M18 12h5" stroke="currentColor" stroke-width="2.4"/></svg>',
    sup: '<svg viewBox="0 0 24 24"><path d="M14 1 4 14h7l-2 9 10-13h-7l2-9Z" fill="currentColor"/></svg>',
    gad: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.8 2.8M16.2 16.2 19 19M19 5l-2.8 2.8M7.8 16.2 5 19" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    pas: '<svg viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5l-8-3Z" fill="currentColor"/><path d="m8.5 12 2.5 2.5 4.5-5" fill="none" stroke="#120824" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  // 23/11 Cavaliere: stesse icone, la trasformazione è un rombo
  ICO.kat = ICO.att; ICO.ksu = ICO.sup; ICO.kga = ICO.gad;
  ICO.ktr = '<svg viewBox="0 0 24 24"><path d="M12 1.5 21 12l-9 10.5L3 12 12 1.5Z" fill="currentColor"/><path d="M12 6.5 16.5 12 12 17.5 7.5 12 12 6.5Z" fill="#120824" opacity=".35"/></svg>';
  var CAVK = ['kat', 'ksu', 'kga', 'ktr'];
  var TX = {
    it: { titolo: 'Abilità', att: 'Attacco', sup: 'Super', gad: 'Gadget', pas: 'Passiva', danno: 'Danno', gitt: 'Gittata', ric: 'Ricarica', carica: 'Carica', dur: 'Durata', usi: 'Usi', area: 'Area', arrivo: 'Video in arrivo', mischia: 'mischia', colpi: 'attacchi', sempre: 'sempre attiva',
      agguato_n: 'Agguato', agguato_d: 'Se attacca uscendo da un cespuglio, il primo colpo fa il 25% in più.',
      cav: 'Cavaliere', kat: 'Attacco', ksu: 'Super', kga: 'Gadget', ktr: 'Corazza', stun: 'Stordisce', corazza: 'Corazza', scoppio: 'Scoppio' },
    en: { titolo: 'Abilities', att: 'Attack', sup: 'Super', gad: 'Gadget', pas: 'Passive', danno: 'Damage', gitt: 'Range', ric: 'Reload', carica: 'Charge', dur: 'Duration', usi: 'Uses', area: 'Area', arrivo: 'Video coming soon', mischia: 'melee', colpi: 'attacks', sempre: 'always on',
      agguato_n: 'Ambush', agguato_d: 'Attacking right out of a bush, the first hit deals 25% more.',
      cav: 'Knight', kat: 'Attack', ksu: 'Super', kga: 'Gadget', ktr: 'Armor', stun: 'Stun', corazza: 'Armor', scoppio: 'Blast' }
  };
  // quanti colpi fa un attacco (per scrivere «400 ×3»)
  var COLPI = { slot: 3, doppio_artiglio: 2, pizza_rotante: 2 };

  var INDICE = null, attesa = [];
  function caricaIndice(fatto) {
    if (INDICE) { fatto(INDICE); return; }
    attesa.push(fatto);
    if (attesa.length > 1) return;
    var fine = function (x) { INDICE = x || { clip: {} }; var a = attesa; attesa = []; a.forEach(function (f) { f(INDICE); }); };
    try { fetch('abilita_video/indice.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(fine, function () { fine(null); }); }
    catch (e) { fine(null); }
  }

  function n10(v) { return Math.round(v / 10) * 10; }
  function num(v) { return (Math.round(v * 100) / 100).toString().replace('.', ','); }
  function numeri(d, k, L) {
    var o = d[k], kk = d.k || 1, out = [], t = TX[L], cz = d.corazza;
    // 23/11 forma Cavaliere del Fante
    if (k === 'kat') return [[t.danno, n10(cz.mazzata.danno * kk)], [t.gitt, num(cz.mazzata.gitt) + ' · ' + t.mischia], [t.ric, num(cz.mazzata.ric) + ' s']];
    if (k === 'ksu') return [[t.danno, n10(d.sup.cav.danno * kk)], [t.gitt, num(d.sup.cav.dist)], [t.stun, num(d.sup.cav.stun) + ' s']];
    if (k === 'kga') return [[t.danno, n10(d.gad.balzo.danno * kk)], [t.gitt, num(d.gad.balzo.gitt)], [t.stun, num(d.gad.balzo.stun) + ' s'], [t.usi, '×' + (d.gad.usi || 3)]];   // 23/11: Balzo del Cavaliere (prima Spallata)
    if (k === 'ktr') return [[t.corazza, n10(cz.scudo * kk)], [t.dur, num(cz.dur) + ' s'], [t.scoppio, n10(cz.esplode.danno * kk)]];
    if (k === 'pas') { if (d.passiva_it && d.portiere) return [[t.ric, num(d.portiere.cd) + ' s'], [t.sempre, '']]; if (d.agguato > 1) return [['Bonus', '+' + Math.round((d.agguato - 1) * 100) + '%'], [t.sempre, '']]; if (d.pollice) return [[t.dur, '×' + d.pollice], [t.sempre, '']]; return [[t.sempre, '']]; }
    var dn = o.danno;
    if (k === 'sup' && o.ultimo) out.push([t.danno, n10(dn * kk) + ' → ' + n10(o.ultimo * kk)]);
    else if (dn) out.push([t.danno, n10(dn * kk) + ((o.n || (k === 'att' && COLPI[o.tipo])) ? ' ×' + (o.n || COLPI[o.tipo]) : '')]);
    var g = o.gitt || (o.mira && o.mira.gitt) || o.dist || o.raggio;
    if (g) out.push([t.gitt, g <= 3.5 && k === 'att' ? num(g) + ' · ' + t.mischia : num(g)]);
    else if (o.area) out.push([t.area, num(o.area)]);
    if (k === 'att' && o.ric) out.push([t.ric, num(o.ric) + ' s']);
    if (k === 'sup' && o.carica) out.push([t.carica, num(o.carica) + ' ' + t.colpi]);
    if (o.dur && k !== 'att') out.push([t.dur, num(o.dur) + ' s']);
    if (k === 'gad') out.push([t.usi, '×' + (o.usi || 3)]);
    return out.slice(0, 4);
  }
  // le abilità dell'eroe: attacco, super, gadget e (se c'è) la passiva
  function abilita(d, L) {
    var t = TX[L], a = ['att', 'sup', 'gad'].map(function (k) {
      var o = d[k]; return { k: k, nome: L === 'en' ? o.nome_en : o.nome_it, desc: L === 'en' ? o.desc_en : o.desc_it };
    });
    // 23/11: senza passiva_nome_* il nome è la parte prima dei due punti («Duello: …», «Corazza di Quadri: …»)
    var pn = function (s) { var m = /^([^:]{2,28}):\s/.exec(s || ''); return m ? m[1] : ''; };
    if (d.passiva_it) a.push({ k: 'pas', nome: L === 'en' ? (d.passiva_nome_en || pn(d.passiva_en) || 'At the Door') : (d.passiva_nome_it || pn(d.passiva_it) || 'Alla porta'), desc: L === 'en' ? d.passiva_en : d.passiva_it });
    else if (d.agguato > 1) a.push({ k: 'pas', nome: t.agguato_n, desc: t.agguato_d });
    // 23/11 (proprietario): il Fante ha anche la forma CAVALIERE, con le sue linguette (testi da eroi.js e CARTE_PROPOSTA.md)
    if (d.corazza) {
      var en = L === 'en', cz = d.corazza;
      a.push({ k: 'kat', cav: 1, nome: en ? 'Mace Blow' : 'Mazzata', desc: en ? 'As the Knight the sceptre becomes a greatsword: slash, backhand and an overhead mace blow that strikes the ground. Wide hits that push back.' : "Da Cavaliere lo scettro diventa uno spadone: fendente, rovescio e una mazzata dall'alto che batte a terra. Colpi larghi che spingono." });
      a.push({ k: 'ksu', cav: 1, nome: en ? d.sup.cav.nome_en : d.sup.cav.nome_it, desc: en ? 'Charges ' + d.sup.cav.dist + ' tiles behind the shield: runs over whoever it meets, pushes them back and stuns them.' : 'Corre avanti di ' + d.sup.cav.dist + ' caselle dietro lo scudo: travolge chi incontra, lo spinge e lo stordisce.' });
      a.push({ k: 'kga', cav: 1, nome: en ? d.gad.balzo.nome_en : d.gad.balzo.nome_it, desc: en ? d.gad.balzo.desc_en : d.gad.balzo.desc_it });
      a.push({ k: 'ktr', cav: 1, nome: en ? 'Transformation' : 'Trasformazione', desc: en ? 'After ' + cz.colpi + ' hits the Jack becomes the KNIGHT for ' + cz.dur + ' s: an armor that absorbs ' + n10(cz.scudo * (d.k || 1)) + ', no knockback or stun. At the end the armor explodes and hurts whoever is close.' : 'Dopo ' + cz.colpi + ' colpi a segno il Fante diventa il CAVALIERE per ' + cz.dur + ' s: corazza che assorbe ' + n10(cz.scudo * (d.k || 1)) + ', niente spinte né stordimenti. Alla fine la corazza esplode e ferisce chi è vicino.' });
    }
    return a;
  }

  var stato = { el: null, id: '', k: 'att', L: 'it' };
  function mostra(el, id, L) {
    var d = E && E[id]; if (!el || !d) return;
    L = L === 'en' ? 'en' : 'it';
    if (stato.id !== id) stato.k = 'att';
    stato.el = el; stato.id = id; stato.L = L;
    var lista = abilita(d, L), t = TX[L];
    if (!lista.some(function (a) { return a.k === stato.k; })) stato.k = 'att';
    var base = lista.filter(function (a) { return !a.cav; }), cav = lista.filter(function (a) { return a.cav; });
    var tasto = function (a) {
      return '<button class="ab-t' + (a.k === stato.k ? ' on' : '') + '" role="tab" data-nav data-k="' + a.k + '" style="--ka:' + COL[a.k] + '" aria-selected="' + (a.k === stato.k) + '">' +
        '<span class="ab-ti">' + ICO[a.k] + '</span><span class="ab-tl">' + t[a.k] + '</span></button>';
    };
    var h = '<div class="ab-sez"><div class="ab-tit">' + t.titolo + '</div><div class="ab-tab q' + base.length + '" role="tablist">' + base.map(tasto).join('') + '</div>';
    // 23/11: seconda fila «CAVALIERE» (forma trasformata del Fante)
    if (cav.length) h += '<div class="ab-tit ab-cav">' + ICO.ktr + t.cav + '</div><div class="ab-tab ab-tcav q' + cav.length + '" role="tablist">' + cav.map(tasto).join('') + '</div>';
    h += '<div class="ab-scena"></div></div>';
    el.innerHTML = h;
    el.classList.add('ab-on');
    Array.prototype.forEach.call(el.querySelectorAll('.ab-t'), function (b) {
      b.onclick = function () { if (stato.k === b.dataset.k) return; stato.k = b.dataset.k; try { if (root.Suoni && Suoni.passa) Suoni.passa(); } catch (e) { }
        Array.prototype.forEach.call(el.querySelectorAll('.ab-t'), function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
        scena(el, d, lista, L); };
    });
    scena(el, d, lista, L);
  }
  function scena(el, d, lista, L) {
    var a = lista.filter(function (x) { return x.k === stato.k; })[0], t = TX[L], box = el.querySelector('.ab-scena'), nome = d.id + '_' + a.k;
    var nums = numeri(d, a.k, L).map(function (x) { return '<span class="ab-n"><small>' + x[0] + '</small>' + x[1] + '</span>'; }).join('');
    box.style.setProperty('--ka', COL[a.k]);
    box.innerHTML = '<div class="ab-vid"><div class="ab-vuoto"><span class="ab-vi">' + ICO[a.k] + '</span><span class="ab-vl">' + t.arrivo + '</span></div></div>' +
      '<div class="ab-testo"><b><small>' + (a.cav ? t.cav + ' · ' : '') + t[a.k] + (a.k === 'gad' ? ' ×' + (d.gad.usi || 3) : '') + '</small>' + a.nome + '</b><p>' + a.desc + '</p><div class="ab-nums">' + nums + '</div></div>';
    caricaIndice(function (ind) {
      var c = ind.clip && ind.clip[nome];
      if (!c || stato.el !== el || stato.id !== d.id || stato.k !== a.k) return;
      var v = document.createElement('video');
      v.muted = true; v.defaultMuted = true; v.loop = true; v.autoplay = true; v.playsInline = true; v.preload = 'auto';
      v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', ''); v.setAttribute('disablepictureinpicture', '');
      v.className = 'ab-v'; v.src = 'abilita_video/' + nome + '.mp4?v=' + encodeURIComponent(c.fatto || '1');
      v.onloadeddata = function () { v.classList.add('pronto'); };
      v.onerror = function () { v.remove(); };
      box.querySelector('.ab-vid').appendChild(v);
      var pr = v.play(); if (pr && pr.catch) pr.catch(function () { });
    });
  }
  // il video gira solo mentre la scheda è aperta
  function guardaSchermo() {
    var s = document.getElementById('s-scheda'); if (!s || !root.MutationObserver) return;
    new MutationObserver(function () {
      var v = s.querySelector('.ab-v'); if (!v) return;
      if (s.classList.contains('on')) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () { }); } else v.pause();
    }).observe(s, { attributes: true, attributeFilter: ['class'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', guardaSchermo); else guardaSchermo();
  root.ABILITA = { mostra: mostra, abilita: abilita, numeri: numeri, stato: stato };
})(window);
