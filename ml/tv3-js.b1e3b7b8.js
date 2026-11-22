(function () {
  'use strict';
  if (window.TV3 || window.TV3_OFF) return;
  try { if (localStorage.getItem('gb_tv3') === '0') return; } catch (e) { }
  if (typeof window.tvlCards !== 'function' || typeof window.qnRender !== 'function' || typeof TVL_SKIN === 'undefined' || typeof QN === 'undefined') return;
  var TV3 = window.TV3 = { ver: '20261117', orig: { tvlCards: window.tvlCards, qnRender: window.qnRender, qnSblocco: window.qnSblocco },
    sel: {}, firma: '' };
  function L(it, en) { return (typeof qnT === 'function') ? qnT(it, en) : it; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function warn(d, e) { try { console.warn('[TV3] ' + d, e); } catch (_) { } }
  function $(id) { return document.getElementById(id); }
  function dc() { return document.documentElement.classList.contains('gxdc'); }
  var RIDOTTO = false; try { RIDOTTO = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { }
  function lite() { try { return (typeof dd3Lite === 'function') ? dd3Lite() : localStorage.getItem('gb_lite') === '1'; } catch (e) { return false; } }
  function frase(t) {
    t = String(t || '');
    if (!t || t !== t.toUpperCase() || t === t.toLowerCase()) return t;
    var s = t.toLowerCase(), i = s.search(/[a-zà-ɏ]/);
    s = i < 0 ? s : s.slice(0, i) + s.charAt(i).toUpperCase() + s.slice(i + 1);
    return s.replace(/«([a-zà-ɏ])/g, function (m, c) { return '«' + c.toUpperCase(); }).replace(/\b(1v1|gb)\b/gi, function (m) { return m.toUpperCase(); });
  }
  function nome(o) { return frase(typeof qnNome === 'function' ? qnNome(o) : (o && o.name) || ''); }
  function desc(o) { return typeof qnDesc === 'function' ? qnDesc(o) : (o && o.desc) || ''; }
  var SLOT = ['dd', 'db', 'gp'];
  var SLOT_NOME = { dd: ['Dadi', 'Dice'], db: ['Dorso delle carte', 'Card back'], gp: ['Pallina del golf', 'Golf ball'], st: ['Stecca da biliardo', 'Pool cue'] };
  var DI_SERIE = {
    dd: { it: 'Dadi avorio', en: 'Ivory dice', d: ['I dadi di serie: avorio, punti neri e l’asso rosso.', 'The stock dice: ivory, black pips and a red ace.'] },
    db: { it: 'Dorso rosso', en: 'Red back', d: ['Il dorso di serie: rosso e oro col marchio della Casa.', 'The stock back: red and gold with the House mark.'] },
    gp: { it: 'Pallina bianca', en: 'White ball', d: ['La pallina di serie, con la fascia del tuo colore.', 'The stock ball, with your colour band.'] },
    st: { it: 'Stecca d’acero', en: 'Maple cue', d: ['La stecca di serie: acero e noce, due anelli d’oro.', 'The stock cue: maple and walnut with two gold rings.'] }
  };
  var DOVE = {
    dd: { giochi: [['gbx_pv_dice.webp', 'Dadi', 'Dice'], ['gbx_ic_dice.webp', 'Duello a dadi', 'Dice duel']],
          nota: ['I tuoi dadi in 3D quando tiri, e nel duello li vede anche l’avversario.', 'Your 3D dice when you roll; in a duel your opponent sees them too.'] },
    db: { giochi: [['gbx_pv_bj1v1.webp', 'Blackjack 1v1', 'Blackjack 1v1'], ['gbx_pv_pk1v1.webp', 'Poker 1v1', 'Poker 1v1']],
          nota: ['Le tue carte coperte al tavolo: l’avversario vede il tuo dorso.', 'Your face-down cards at the table: your opponent sees your back.'] },
    gp: { giochi: [['gbx_pv_golf.webp', 'Golf', 'Golf']],
          nota: ['Pallina e scia sul green, in 3D e in 2D: la vede anche l’avversario.', 'Ball and trail on the green, in 3D and 2D: your opponent sees it too.'] },
    st: { giochi: [['gbx_pv_pool8.webp', 'Biliardo', 'Pool 8-ball'], ['gbx_pv_pool8.webp', 'Biliardo 8-15', 'Pool 8-15']],
          nota: ['La tua stecca quando miri e tiri: la vede anche l’avversario.', 'Your cue when you aim and shoot: your opponent sees it too.'] }
  };
  var RAR = { common: ['Comune', 'Common'], rare: ['Rara', 'Rare'], epic: ['Epica', 'Epic'], legend: ['Leggendaria', 'Legendary'] };
  var RAR_COL = { common: '#aeaeb2', rare: '#5a96ff', epic: '#a59df7', legend: '#f5b14c' };
  function rarNome(r) { var m = RAR[r] || RAR.common; return L(m[0], m[1]); }
  function look() { try { return tvlLook(); } catch (e) { return { dd: 0, db: 0, gp: 0 }; } }
  function posseduti() { try { return tvlPosseduti() || []; } catch (e) { return []; } }
  function questDi(id) { try { return qnDiSkin('tavolo', id); } catch (e) { return null; } }
  function voci(slot) {
    var d = DI_SERIE[slot], out = [{ stock: true, slot: slot, idx: 0, id: 'serie_' + slot, rarity: 'common', name: d.it, name_en: d.en, desc: d.d[0], desc_en: d.d[1] }];
    TVL_SKIN.forEach(function (s) { if (s.slot === slot) out.push(s); });
    return out;
  }
  function stato(v, lk, pos) {
    if ((lk[v.slot] | 0) === (v.idx | 0)) return 'eq';
    if (v.stock || pos.indexOf(v.id) >= 0) return 'mio';
    var q = questDi(v.id);
    if (q && q.fatta && !q.presa) return 'pronta';
    if (q) return 'quest';
    return 'presto';
  }
  var IC = {
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5v-3a3.5 3.5 0 0 1 7 0v3"/></svg>',
    dono: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="10.5" rx="1.5"/><path d="M3 7h18v3H3zM12 7v13.5M12 7C10.5 3.5 6.5 3.5 6.5 5.8 6.5 7 9 7 12 7zM12 7c1.5-3.5 5.5-3.5 5.5-1.2C17.5 7 15 7 12 7z"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
    giro: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v4h-4"/></svg>',
    freccia: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5.5l6.5 6.5L9 18.5"/></svg>',
    orologio: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.2 2"/></svg>',
    occhio: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    dado: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3.2"/><circle cx="8.6" cy="8.6" r=".9"/><circle cx="15.4" cy="8.6" r=".9"/><circle cx="12" cy="12" r=".9"/><circle cx="8.6" cy="15.4" r=".9"/><circle cx="15.4" cy="15.4" r=".9"/></svg>',
    carte: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.2" y="6.4" width="9.6" height="13.4" rx="1.8" transform="rotate(-10 9 13.1)"/><rect x="10.4" y="4.4" width="9.6" height="13.4" rx="1.8" transform="rotate(9 15.2 11.1)"/></svg>',
    golf: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 20.5V3.5l8 3.6-8 3.6"/><ellipse cx="12" cy="20.5" rx="7" ry="1.6"/></svg>'
  };
  IC.stecca = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 20.5L17 7"/><path d="M15.5 8.5l3-3 1.5 1.5-3 3z"/><circle cx="20" cy="18.5" r="2"/></svg>';
  var SLOT_IC = { dd: IC.dado, db: IC.carte, gp: IC.golf, st: IC.stecca };
  function tondo(x, X, Y, W, H, r) { r = Math.min(r, W / 2, H / 2); x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + W, Y, X + W, Y + H, r); x.arcTo(X + W, Y + H, X, Y + H, r); x.arcTo(X, Y + H, X, Y, r); x.arcTo(X, Y, X + W, Y, r); x.closePath(); }
  function tela(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function eoc(u) { u = clamp(u, 0, 1); return 1 - Math.pow(1 - u, 3); }
  function eio(u) { u = clamp(u, 0, 1); return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }
  function rnd(seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  var CACHE = {}, NCACHE = 0;
  function cache(k, w, h, fai) {
    var c = CACHE[k]; if (c) return c;
    if (NCACHE > 90) { CACHE = {}; NCACHE = 0; }
    c = tela(w, h); try { fai(c.getContext('2d'), c.width, c.height); } catch (e) { warn('cache ' + k, e); }
    CACHE[k] = c; NCACHE++; return c;
  }
  var MARCHIO = null;
  function marchio() {
    if (!MARCHIO) { MARCHIO = new Image(); MARCHIO.onload = function () { for (var k in CACHE) if (k.indexOf('dorso|0|') === 0) { delete CACHE[k]; NCACHE--; } }; MARCHIO.src = 'xb_marchio.webp'; }
    return MARCHIO.complete && MARCHIO.naturalWidth ? MARCHIO : null;
  }
  function panno(kind, W, H) {
    return cache('panno|' + kind + '|' + W + 'x' + H, W, H, function (x, w, h) {
      var g, i, r = rnd(7 + w + h), n = Math.min(4200, (w * h / 90) | 0);
      if (kind === 'dd') {
        g = x.createRadialGradient(w * .5, h * .42, h * .08, w * .5, h * .55, Math.max(w, h) * .8);
        g.addColorStop(0, '#26262e'); g.addColorStop(.55, '#121216'); g.addColorStop(1, '#050506');
      } else if (kind === 'db') {
        g = x.createRadialGradient(w * .5, h * .45, h * .1, w * .5, h * .5, Math.max(w, h) * .78);
        g.addColorStop(0, '#13724a'); g.addColorStop(.6, '#0a4a2f'); g.addColorStop(1, '#03170e');
      } else {
        g = x.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#0b1020'); g.addColorStop(.3, '#1a2a44'); g.addColorStop(.42, '#24405e'); g.addColorStop(1, '#0b1020');
      }
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      if (kind === 'gp') {
        var oy = h * .36;
        var gg = x.createLinearGradient(0, oy, 0, h); gg.addColorStop(0, '#2f7d3d'); gg.addColorStop(1, '#1d5a2a');
        x.fillStyle = gg; x.fillRect(0, oy, w, h - oy);
        for (i = 0; i < 9; i++) {
          var a0 = i / 9, a1 = (i + .5) / 9;
          x.fillStyle = 'rgba(255,255,255,.045)';
          x.beginPath(); x.moveTo(w * (.5 + (a0 - .5) * .9), oy); x.lineTo(w * (.5 + (a1 - .5) * .9), oy);
          x.lineTo(w * (.5 + (a1 - .5) * 3.2), h); x.lineTo(w * (.5 + (a0 - .5) * 3.2), h); x.closePath(); x.fill();
        }
        var fr = x.createLinearGradient(0, oy - h * .015, 0, oy + h * .05); fr.addColorStop(0, 'rgba(10,30,14,.9)'); fr.addColorStop(1, 'rgba(10,30,14,0)');
        x.fillStyle = fr; x.fillRect(0, oy - h * .015, w, h * .065);
        x.fillStyle = '#132238'; x.beginPath(); x.moveTo(0, oy);
        for (i = 0; i <= 12; i++) x.lineTo(w * i / 12, oy - h * (.04 + .035 * Math.sin(i * 1.7) + .02 * Math.sin(i * 4.1)));
        x.lineTo(w, oy); x.closePath(); x.fill();
        var vg = x.createRadialGradient(w * .5, h * .7, h * .2, w * .5, h * .7, w * .8); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)');
        x.fillStyle = vg; x.fillRect(0, 0, w, h);
        return;
      }
      for (i = 0; i < n; i++) {
        var a = r() * .07; x.fillStyle = r() < .5 ? 'rgba(255,255,255,' + a + ')' : 'rgba(0,0,0,' + (a * 1.5) + ')';
        x.fillRect(r() * w, r() * h, 1 + r() * 2, 1);
      }
      if (kind === 'db') {
        x.strokeStyle = 'rgba(232,193,90,.22)'; x.lineWidth = Math.max(1, h * .008);
        x.beginPath(); x.ellipse(w * .5, h * 1.02, w * .62, h * .78, 0, Math.PI, 2 * Math.PI); x.stroke();
      } else {
        x.strokeStyle = 'rgba(255,255,255,.06)'; x.lineWidth = Math.max(1, h * .008);
        tondo(x, w * .05, h * .07, w * .9, h * .86, h * .06); x.stroke();
      }
      var lu = x.createRadialGradient(w * .5, h * .1, 0, w * .5, h * .1, h * 1.1); lu.addColorStop(0, 'rgba(255,240,210,.10)'); lu.addColorStop(1, 'rgba(255,240,210,0)');
      x.fillStyle = lu; x.fillRect(0, 0, w, h);
    });
  }
  var DSTY = [
    { c: ['#fbfaf5', '#e3ded2'], lato: '#a9a293', pip: ['#050505', '#3a3a3a'], pip1: ['#9e0b22', '#e8364f'], bordo: 'rgba(0,0,0,.10)', luce: .55, met: 0 },
    { c: ['#ffe27a', '#b8860b'], lato: '#5e4100', pip: ['#0b0802', '#2a1d05'], pip1: null, bordo: 'rgba(255,248,210,.6)', luce: .75, met: 1 },
    { c: ['#ff5a74', '#6a0014'], lato: '#33000a', pip: ['#d9a400', '#fff1b0'], pip1: null, bordo: 'rgba(255,200,210,.45)', luce: .6, met: 0 }
  ];
  var PIPS = { 1: [[.5, .5]], 2: [[.27, .27], [.73, .73]], 3: [[.25, .25], [.5, .5], [.75, .75]], 4: [[.27, .27], [.73, .27], [.27, .73], [.73, .73]],
    5: [[.25, .25], [.75, .25], [.5, .5], [.25, .75], [.75, .75]], 6: [[.27, .23], [.73, .23], [.27, .5], [.73, .5], [.27, .77], [.73, .77]] };
  function faccia(idx, val, px) {
    px = Math.max(8, Math.round(px));
    return cache('faccia|' + idx + '|' + val + '|' + px, px, px, function (x, S) {
      var st = DSTY[idx] || DSTY[0], r = S * .2;
      var g = x.createLinearGradient(0, 0, S, S);
      g.addColorStop(0, st.c[0]); if (st.met) { g.addColorStop(.38, '#fff4c2'); g.addColorStop(.55, st.c[0]); } g.addColorStop(1, st.c[1]);
      x.fillStyle = g; tondo(x, 0, 0, S, S, r); x.fill();
      var b = x.createLinearGradient(0, 0, S, S); b.addColorStop(0, 'rgba(255,255,255,' + st.luce + ')'); b.addColorStop(.45, 'rgba(255,255,255,0)'); b.addColorStop(1, 'rgba(0,0,0,.35)');
      x.strokeStyle = b; x.lineWidth = S * .06; tondo(x, S * .03, S * .03, S * .94, S * .94, r * .85); x.stroke();
      x.strokeStyle = st.bordo; x.lineWidth = S * .02; tondo(x, S * .09, S * .09, S * .82, S * .82, r * .6); x.stroke();
      var P = PIPS[val] || PIPS[1], rr = S * (val === 1 ? .12 : .088);
      for (var i = 0; i < P.length; i++) {
        var cx = P[i][0] * S, cy = P[i][1] * S, c = (val === 1 && st.pip1) ? st.pip1 : st.pip;
        var gp = x.createRadialGradient(cx - rr * .35, cy - rr * .35, rr * .1, cx, cy, rr);
        gp.addColorStop(0, c[1]); gp.addColorStop(1, c[0]);
        x.fillStyle = gp; x.beginPath(); x.arc(cx, cy, rr, 0, 6.2832); x.fill();
        x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = S * .012; x.beginPath(); x.arc(cx, cy, rr * .98, .6, 2.4); x.stroke();
      }
    });
  }
  function dado(x, cx, cy, S, ang, val, idx, h, sq, glint, k) {
    var st = DSTY[idx] || DSTY[0];
    var sr = S * (.62 + h / (S * 5)), sa = .5 * Math.max(.2, 1 - h / (S * 2.4));
    var go = x.createRadialGradient(cx + S * .06, cy + S * .16, 0, cx + S * .06, cy + S * .16, sr);
    go.addColorStop(0, 'rgba(0,0,0,' + sa + ')'); go.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = go; x.beginPath(); x.ellipse(cx + S * .06, cy + S * .16, sr, sr * .62, 0, 0, 6.2832); x.fill();
    if (idx === 1 && h < S * .2) {
      var gr = x.createRadialGradient(cx, cy + S * .1, 0, cx, cy + S * .1, S * .9); gr.addColorStop(0, 'rgba(255,200,60,.16)'); gr.addColorStop(1, 'rgba(255,200,60,0)');
      x.fillStyle = gr; x.fillRect(cx - S, cy - S, S * 2, S * 2);
    }
    var y = cy - h;
    x.save(); x.translate(cx, y + S * .13); x.rotate(ang); x.scale(1 + sq, 1 - sq);
    var gl = x.createLinearGradient(0, -S / 2, 0, S / 2); gl.addColorStop(0, st.lato); gl.addColorStop(1, 'rgba(0,0,0,.9)');
    x.fillStyle = gl; tondo(x, -S / 2, -S / 2, S, S, S * .2); x.fill(); x.restore();
    x.save(); x.translate(cx, y); x.rotate(ang); x.scale(1 + sq, 1 - sq);
    x.drawImage(faccia(idx, val, S * k), -S / 2, -S / 2, S, S);
    if (glint > 0 && glint < 1) {
      x.save(); tondo(x, -S / 2, -S / 2, S, S, S * .2); x.clip();
      var p = -S * 1.2 + glint * S * 2.4, gg = x.createLinearGradient(p - S * .3, p - S * .3, p + S * .3, p + S * .3);
      gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(.5, 'rgba(255,255,255,' + (idx === 1 ? .75 : .5) + ')'); gg.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = gg; x.fillRect(-S / 2, -S / 2, S, S); x.restore();
    }
    x.restore();
  }
  var DUR_DD = 3.9;
  function scenaDadi(x, W, H, t, idx, seed, k) {
    x.drawImage(panno('dd', W * k | 0, H * k | 0), 0, 0, W, H);
    var r = rnd(seed), cmp = W < 200, S = cmp ? Math.min(H * .38, W * .3) : Math.min(H * .3, W * .19);
    var fin = [1 + ((r() * 6) | 0), 1 + ((r() * 6) | 0)];
    var dadi = [{ ex: W * .42, ey: H * .62, sy: H * .28, d: 0, spin: 8 + r() * 4, ae: -.35 + r() * .3 },
                { ex: W * .62, ey: H * .52, sy: H * .44, d: .09, spin: -(7 + r() * 4), ae: .1 + r() * .35 }];
    var dur = 1.15, fade = t > DUR_DD - .3 ? clamp((DUR_DD - t) / .3, 0, 1) : 1;
    x.globalAlpha = fade;
    dadi.forEach(function (D, i) {
      var u = clamp((t - D.d) / dur, 0, 1), e = eoc(u);
      var cx = W * 1.12 + (D.ex - W * 1.12) * e, cy = D.sy + (D.ey - D.sy) * e;
      var bo = Math.abs(Math.cos(u * Math.PI * 2.6)), h = S * 1.7 * Math.pow(1 - u, 1.7) * bo;
      var ang = D.ae + D.spin * Math.pow(1 - u, 2.4);
      var dopo = t - D.d - dur; if (dopo > 0) ang += Math.sin(dopo * 22) * .05 * Math.exp(-dopo * 7);
      var sq = (u < .92 && bo < .22) ? .07 * (1 - u) : 0;
      var val = u < .84 ? 1 + ((Math.floor(t * 13) + i * 3 + (seed & 7)) % 6) : fin[i];
      var gl = idx > 0 ? (t - 1.55 - i * .12) / .55 : (t - 1.6 - i * .12) / .7;
      dado(x, cx, cy, S, ang, val, idx, h, sq, idx > 0 ? gl : -1, k);
    });
    x.globalAlpha = 1;
  }
  function dorso(idx, w, h) {
    var m = marchio();
    return cache('dorso|' + idx + '|' + (m ? 'm' : '') + '|' + w + 'x' + h, w, h, function (x, W, H) {
      tvlDorso(x, 0, 0, W, H, idx);
      if (idx === 0 && m) {
        x.fillStyle = '#3a050d'; x.beginPath(); x.ellipse(W / 2, H / 2, W * .27, W * .27, 0, 0, 7); x.fill();
        x.strokeStyle = '#e8c15a'; x.lineWidth = Math.max(1, W * .02); x.stroke();
        var s = W * .4; x.drawImage(m, W / 2 - s / 2, H / 2 - s / 2 + W * .005, s, s);
      }
    });
  }
  function faccia1(w, h) {
    return cache('asso|' + w + 'x' + h, w, h, function (x, W, H) {
      var g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#ece9e1');
      x.fillStyle = g; tondo(x, 0, 0, W, H, W * .09); x.fill();
      x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = Math.max(1, W * .012); tondo(x, W * .006, W * .006, W * .988, H - W * .012, W * .085); x.stroke();
      x.fillStyle = '#111'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = '800 ' + (W * .2) + "px Georgia,'Times New Roman',serif"; x.fillText('A', W * .16, H * .11);
      x.font = (W * .15) + "px Georgia,serif"; x.fillText('♠︎', W * .16, H * .23);
      x.save(); x.translate(W * .84, H * .89); x.rotate(Math.PI); x.font = '800 ' + (W * .2) + "px Georgia,serif"; x.fillText('A', 0, 0); x.restore();
      x.font = (W * .62) + "px Georgia,serif"; x.fillText('♠︎', W / 2, H * .53);
    });
  }
  var DUR_DB = 4.8;
  function carta(x, cx, cy, cw, ch, rot, sx, lift, im, luce) {
    x.save(); x.translate(cx, cy - lift); x.rotate(rot);
    x.fillStyle = 'rgba(0,0,0,' + (.38 - lift / (ch * 2)) + ')'; tondo(x, -cw * sx / 2 + cw * .04 + lift * .3, -ch / 2 + ch * .05 + lift * .6, cw * sx, ch, cw * .09); x.fill();
    x.scale(Math.max(.02, sx), 1);
    x.drawImage(im, -cw / 2, -ch / 2, cw, ch);
    if (luce > 0 && luce < 1) {
      x.save(); tondo(x, -cw / 2, -ch / 2, cw, ch, cw * .09); x.clip();
      var p = -ch + luce * ch * 2, g = x.createLinearGradient(p - cw * .4, p - ch * .5, p + cw * .4, p + ch * .5);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.globalCompositeOperation = 'lighter'; x.fillStyle = g; x.fillRect(-cw / 2, -ch / 2, cw, ch); x.restore();
    }
    x.restore();
  }
  function scenaDorso(x, W, H, t, idx, seed, k) {
    x.drawImage(panno('db', W * k | 0, H * k | 0), 0, 0, W, H);
    var ch = Math.min(H * .66, W * .5), cw = ch / 1.4;
    var bk = dorso(idx, cw * k, ch * k), fc = faccia1(cw * k, ch * k);
    var fade = t > DUR_DB - .3 ? clamp((DUR_DB - t) / .3, 0, 1) : 1;
    x.globalAlpha = fade;
    var mx = W * .86, my = H * .2;
    for (var i = 2; i >= 0; i--) carta(x, mx + i * 1.2, my + i * 1.6, cw * .62, ch * .62, .42, 1, 0, bk, 0);
    var C = [{ ex: W * .4, ey: H * .58, er: -.1, d: 0 }, { ex: W * .6, ey: H * .56, er: .08, d: .32 }];
    C.forEach(function (c, i) {
      var u = eoc((t - c.d) / .6); if (t < c.d) return;
      var cx = mx + (c.ex - mx) * u, cy = my + (c.ey - my) * u, sc = .62 + .38 * u, rot = .42 + (c.er - .42) * u;
      var lift = Math.sin(u * Math.PI) * ch * .12, sx = 1, im = bk, luce = (t - 1.05 - i * .15) / .6;
      if (i === 1) {
        var f1 = (t - 2.05) / .38, f2 = (t - 3.35) / .38, ff = 0;
        if (f1 > 0 && f1 < 1) ff = f1; else if (f1 >= 1 && f2 <= 0) ff = 1; else if (f2 > 0 && f2 < 1) ff = 2 - f2; else if (f2 >= 1) ff = 2;
        var ang = ff * Math.PI; sx = Math.abs(Math.cos(ang)); im = (ff > .5 && ff < 1.5) ? fc : bk;
        lift += Math.sin(clamp(ff, 0, 2) * Math.PI) * ch * .06 * (ff < 2 ? 1 : 0);
        if (im === fc) luce = -1;
      }
      carta(x, cx, cy, cw * sc, ch * sc, rot, sx, lift, im, luce);
    });
    x.globalAlpha = 1;
  }
  var PALL = [
    { g: ['#ffffff', '#eef2f7', '#b8bec8'], scia: [56, 189, 248], a: 1, w: 1, glow: null, banda: '#38bdf8' },
    { g: ['#fff3b8', '#e6b422', '#9a6c00'], scia: [255, 207, 64], a: 1.6, w: 1, glow: 'rgba(255,200,40,.75)', banda: '#38bdf8' },
    { g: ['#f2fdff', '#7fe3ff', '#0e8fc4'], scia: [125, 249, 255], a: 2.2, w: 1.5, glow: 'rgba(120,240,255,.75)', banda: '#38bdf8' }
  ];
  function pallina(x, cx, cy, R, idx, rot, dir, al) {
    var st = PALL[idx] || PALL[0];
    x.save(); x.globalAlpha *= al;
    if (st.glow) { x.shadowColor = st.glow; x.shadowBlur = R * 1.4; }
    var g = x.createRadialGradient(cx - R * .35, cy - R * .4, R * .1, cx, cy, R);
    g.addColorStop(0, st.g[0]); g.addColorStop(.55, st.g[1]); g.addColorStop(1, st.g[2]);
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R, 0, 6.2832); x.fill(); x.shadowBlur = 0;
    x.save(); x.beginPath(); x.arc(cx, cy, R, 0, 6.2832); x.clip();
    x.translate(cx, cy); x.rotate(dir);
    var o = Math.sin(rot) * R * .85, vis = Math.cos(rot);
    if (vis > -.2) { x.save(); x.fillStyle = st.banda; x.globalAlpha *= clamp(vis + .2, 0, 1); x.fillRect(o - R * .14, -R, R * .28, R * 2); x.restore(); }
    x.fillStyle = idx === 1 ? 'rgba(80,50,0,.28)' : idx === 2 ? 'rgba(0,40,60,.2)' : 'rgba(0,0,0,.13)';
    for (var i = 0; i < 10; i++) { var aa = i * 2.39996, rr = R * (.2 + .7 * ((i * 37) % 10) / 10), px = Math.cos(aa) * rr + Math.sin(rot) * R * .5, py = Math.sin(aa) * rr;
      px = ((px + R * 1.5) % (R * 3)) - R * 1.5; x.beginPath(); x.arc(px, py, R * .085, 0, 6.2832); x.fill(); }
    x.restore();
    var sp = x.createRadialGradient(cx - R * .38, cy - R * .42, 0, cx - R * .38, cy - R * .42, R * .7);
    sp.addColorStop(0, 'rgba(255,255,255,' + (idx === 1 ? .95 : .8) + ')'); sp.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = sp; x.beginPath(); x.arc(cx, cy, R, 0, 6.2832); x.fill();
    x.restore();
  }
  var DUR_GP = 3.9;
  function scenaGolf(x, W, H, t, idx, seed, k) {
    x.drawImage(panno('gp', W * k | 0, H * k | 0), 0, 0, W, H);
    var st = PALL[idx] || PALL[0], cmp = W < 200, hx = W * .72, hy = H * .5, hr = H * (cmp ? .06 : .045);
    x.fillStyle = '#05140a'; x.beginPath(); x.ellipse(hx, hy, hr * 1.5, hr * .62, 0, 0, 6.2832); x.fill();
    x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = Math.max(1, H * .005); x.beginPath(); x.ellipse(hx, hy, hr * 1.5, hr * .62, 0, Math.PI, 2 * Math.PI); x.stroke();
    var ph = hy - H * .34, fw = W * .1, onda = Math.sin(t * 5.2) * H * .012;
    x.strokeStyle = '#e8edf5'; x.lineWidth = Math.max(1.5, H * .009); x.beginPath(); x.moveTo(hx, hy); x.lineTo(hx, ph); x.stroke();
    x.fillStyle = '#ef4444'; x.beginPath(); x.moveTo(hx, ph); x.quadraticCurveTo(hx + fw * .6, ph - H * .015 + onda, hx + fw, ph + H * .05 + onda);
    x.quadraticCurveTo(hx + fw * .55, ph + H * .07, hx, ph + H * .1); x.closePath(); x.fill();
    var P0 = [W * .1, H * .95], P1 = [W * .3, H * .62], P2 = [W * .62, H * .7], P3 = [hx - hr * .2, hy];
    function pt(s) { var a = 1 - s; return [a * a * a * P0[0] + 3 * a * a * s * P1[0] + 3 * a * s * s * P2[0] + s * s * s * P3[0], a * a * a * P0[1] + 3 * a * a * s * P1[1] + 3 * a * s * s * P2[1] + s * s * s * P3[1]]; }
    var TR = 2.3;
    function sDi(tt) { var u = clamp(tt / TR, 0, 1); return 1 - Math.pow(1 - u, 2.1); }
    function rag(y) { return H * (.028 + .05 * clamp((y - hy) / (H - hy), 0, 1)) * (cmp ? 1.7 : 1); }
    var fade = t > DUR_GP - .3 ? clamp((DUR_GP - t) / .3, 0, 1) : 1;
    x.globalAlpha = fade;
    var s = sDi(t), p = pt(s), R = rag(p[1]);
    var NS = 18, vel = clamp((sDi(t) - sDi(t - .1)) / .1 * 2.2, 0, 1);
    if (t < TR + .4 && vel > .02) {
      x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
      var prev = p;
      for (var i = 1; i < NS; i++) {
        var q = pt(sDi(t - i * .045)), ww = R * 1.1 * (1 - i / NS) * st.w, al = Math.min(1, (1 - i / NS) * .32 * st.a * 1.35) * vel;
        if (al <= .01) break;
        x.strokeStyle = 'rgba(' + st.scia[0] + ',' + st.scia[1] + ',' + st.scia[2] + ',' + al.toFixed(3) + ')';
        x.lineWidth = Math.max(1, ww * 2); x.beginPath(); x.moveTo(prev[0], prev[1]); x.lineTo(q[0], q[1]); x.stroke(); prev = q;
      }
      x.restore();
    }
    var dentro = t > TR, dk = clamp((t - TR) / .28, 0, 1);
    if (!dentro || dk < 1) {
      var q2 = pt(Math.max(0, s - .01)), dir = Math.atan2(p[1] - q2[1], p[0] - q2[0]) + Math.PI / 2;
      var giu = dentro ? dk : 0, yy = p[1] + giu * R * .9, RR = R * (1 - giu * .45);
      x.fillStyle = 'rgba(0,0,0,' + (.32 * (1 - giu)) + ')'; x.beginPath(); x.ellipse(p[0] + R * .25, p[1] + R * .55, R * 1.05, R * .45, 0, 0, 6.2832); x.fill();
      if (dentro) { x.save(); x.beginPath(); x.rect(0, 0, W, hy + hr * .1); x.clip(); }
      pallina(x, p[0], yy, RR, idx, s * 26, dir, 1 - giu * .6);
      if (dentro) x.restore();
    }
    if (dentro) {
      var e = (t - TR) / .8;
      if (e < 1) {
        x.strokeStyle = 'rgba(' + st.scia.join(',') + ',' + (1 - e) * .9 + ')'; x.lineWidth = Math.max(1.5, H * .008);
        x.beginPath(); x.ellipse(hx, hy, hr * (1.5 + e * 4), hr * (.62 + e * 1.6), 0, 0, 6.2832); x.stroke();
        var r2 = rnd(seed + 3);
        for (var j = 0; j < 16; j++) { var a = r2() * Math.PI, v = (.5 + r2()) * H * .32 * e; x.fillStyle = 'rgba(' + (j % 2 ? '255,213,74' : st.scia.join(',')) + ',' + (1 - e) + ')';
          x.beginPath(); x.arc(hx + Math.cos(a) * v * 1.4, hy - Math.sin(a) * v + e * e * H * .25, Math.max(1, H * .01 * (1 - e)), 0, 6.2832); x.fill(); }
      }
    }
    x.globalAlpha = 1;
  }
  var STECCHE = [
    { id: 'st_serie', idx: 0, rarity: 'common', punta: ['#2f5fb8', '#6f9ff0', '#244c96'], ghiera: ['#cfc9b8', '#fffdf5', '#bdb6a3'], fusto: ['#b68a4e', '#f1d9a8', '#a47a42'],
      giunto: ['#8a8a8a', '#f4f4f4', '#7a7a7a'], collare: ['#1a0d06', '#5c3218', '#1a0d06'], calcio: ['#2b140a', '#7b4220', '#2b140a'], impugnatura: ['#0d0d0d', '#444444', '#0d0d0d'],
      anelli: [[0.86, 0.006, 'rgba(255,215,64,.9)'], [0.95, 0.003, 'rgba(255,215,64,.9)']], motivo: null, bagliore: null, scia: null },
    { id: 'tv_stecca_bottega', idx: 1, rarity: 'rare', name: 'STECCA DI BOTTEGA', name_en: 'WORKSHOP CUE',
      desc: 'Acero chiaro e calcio di noce, ghiera d\'ottone: quella del biliardo sotto casa.', desc_en: 'Light maple shaft, walnut butt, brass ferrule: the one from the pool hall downstairs.',
      punta: ['#2f5fb8', '#6f9ff0', '#244c96'], ghiera: ['#8c6b2a', '#f0d48a', '#7a5a1c'], fusto: ['#c99a5b', '#f6e2b8', '#b08049'],
      giunto: ['#8c6b2a', '#f0d48a', '#7a5a1c'], collare: ['#3b1408', '#8a3c18', '#3b1408'], calcio: ['#3b1408', '#a4532a', '#3b1408'], impugnatura: ['#1f140c', '#5a4632', '#1f140c'],
      anelli: [[0.73, 0.004, '#d4a84a'], [0.86, 0.005, '#d4a84a'], [1.11, 0.004, '#d4a84a']], motivo: 'radica', motivoCol: 'rgba(30,8,2,.45)', bagliore: null, scia: null },
    { id: 'tv_stecca_ebano', idx: 2, rarity: 'epic', name: 'EBANO E ORO', name_en: 'EBONY & GOLD',
      desc: 'Ebano nero con intarsi a punta d\'oro: si porta nella custodia di pelle.', desc_en: 'Black ebony with gold point inlays: it travels in a leather case.',
      punta: ['#1e3a8a', '#3b82f6', '#1e3a8a'], ghiera: ['#f5f0e1', '#ffffff', '#d9d0b8'], fusto: ['#d9c79e', '#fbf1d6', '#c2ad80'],
      giunto: ['#9a7400', '#ffe58a', '#8a6400'], collare: ['#050505', '#2b2b2b', '#050505'], calcio: ['#030303', '#2a2a2a', '#030303'], impugnatura: ['#0a0a0a', '#3a3a3a', '#0a0a0a'],
      anelli: [[0.72, 0.004, '#e8c15a'], [1.12, 0.004, '#e8c15a'], [1.2, 0.003, '#e8c15a']], motivo: 'intarsio', motivoCol: '#e8c15a', bagliore: null, scia: null },
    { id: 'tv_stecca_carbonio', idx: 3, rarity: 'rare', name: 'CARBONIO NEON', name_en: 'NEON CARBON',
      desc: 'Fibra di carbonio a trama e una riga di neon ciano lungo il fusto.', desc_en: 'Woven carbon fibre with a cyan neon line along the shaft.',
      punta: ['#0e7490', '#22d3ee', '#0e7490'], ghiera: ['#e5e7eb', '#ffffff', '#cbd5e1'], fusto: ['#3a414c', '#a3adbd', '#3a414c'],
      giunto: ['#0e7490', '#67e8f9', '#0e7490'], collare: ['#0b0d10', '#2a2f38', '#0b0d10'], calcio: ['#0b0d10', '#323844', '#0b0d10'], impugnatura: ['#06070a', '#262a33', '#06070a'],
      anelli: [[0.72, 0.003, '#22d3ee'], [1.12, 0.003, '#22d3ee']], motivo: 'carbonio', motivoCol: '#22d3ee', neonFusto: '#22d3ee', bagliore: 'rgba(34,211,238,.85)', scia: '#22d3ee' },
    { id: 'tv_stecca_casa', idx: 4, rarity: 'epic', name: 'LA STECCA DELLA CASA', name_en: 'THE HOUSE CUE',
      desc: 'Bordeaux e oro col sigillo della Casa sul calcio: la danno a chi non sbaglia mai.', desc_en: 'Burgundy and gold with the House seal on the butt: given to those who never foul.',
      punta: ['#4a0712', '#b91c3c', '#4a0712'], ghiera: ['#f5f0e1', '#ffffff', '#d9d0b8'], fusto: ['#cbb98f', '#f4e8c8', '#b5a173'],
      giunto: ['#9a7400', '#facc15', '#8a6400'], collare: ['#2a0309', '#6b0f1f', '#2a0309'], calcio: ['#2a0309', '#9b1b30', '#2a0309'], impugnatura: ['#1a0206', '#4a0a14', '#1a0206'],
      anelli: [[0.72, 0.004, '#facc15'], [1.0, 0.003, '#facc15'], [1.12, 0.004, '#facc15']], motivo: 'sigillo', motivoCol: '#facc15', bagliore: 'rgba(250,204,21,.3)', scia: null },
    { id: 'tv_stecca_drago', idx: 5, rarity: 'epic', name: 'STECCA DEL DRAGO', name_en: 'DRAGON CUE',
      desc: 'Squame verde scuro e un drago d\'oro attorcigliato fino alla punta.', desc_en: 'Dark green scales and a golden dragon coiled up to the tip.',
      punta: ['#14532d', '#22c55e', '#14532d'], ghiera: ['#f3e3c0', '#fff7e0', '#d6c08f'], fusto: ['#b88a52', '#efd3a0', '#a07444'],
      giunto: ['#9a7400', '#ffd54a', '#8a6400'], collare: ['#03170c', '#14532d', '#03170c'], calcio: ['#03170c', '#166534', '#03170c'], impugnatura: ['#020d07', '#0f3d22', '#020d07'],
      anelli: [[0.72, 0.004, '#f5c542'], [1.12, 0.004, '#f5c542']], motivo: 'scaglie', motivoCol: 'rgba(170,240,180,.35)', spirale: '#f5c542', bagliore: 'rgba(245,197,66,.45)', scia: '#f5c542' },
    { id: 'tv_stecca_leggenda', idx: 6, rarity: 'legend', name: 'LA LEGGENDA', name_en: 'THE LEGEND',
      desc: 'Avorio e oro bianco, una scia di luce dopo ogni colpo: spacca e chiudi senza lasciare il tavolo.', desc_en: 'Ivory and white gold, a trail of light after every shot: break and run without leaving the table.',
      punta: ['#1e3a8a', '#60a5fa', '#1e3a8a'], ghiera: ['#e5e4e2', '#ffffff', '#c9c8c4'], fusto: ['#efe6d0', '#fffdf6', '#d8ccb0'],
      giunto: ['#a8a7a3', '#ffffff', '#9a9995'], collare: ['#d8ccb0', '#fffaf0', '#c9bb98'], calcio: ['#cdbf9c', '#fff8e8', '#bfae86'], impugnatura: ['#8f8e8a', '#e5e4e2', '#8f8e8a'],
      anelli: [[0.72, 0.005, '#ffffff'], [0.9, 0.003, '#f5d77a'], [1.12, 0.005, '#ffffff']], motivo: 'perla', motivoCol: '#ffffff', bagliore: 'rgba(255,246,208,.85)', scia: '#fff6d0' }
  ];
  TV3.STECCHE = STECCHE;
  function steccaDisegna(c, x0, len, sk, o) {
    o = o || {}; var k = o.k || 1, t = o.t || 0;
    var r0 = 0.0062 * k, r1 = 0.0068 * k, r2 = 0.0092 * k, r3 = 0.0122 * k, r4 = 0.0140 * k, s = len / 1.25;
    function seg(a, b, ra, rb, cols, blur) {
      var g = c.createLinearGradient(0, -Math.max(ra, rb), 0, Math.max(ra, rb));
      cols.forEach(function (cc, i) { g.addColorStop(i / (cols.length - 1), cc); });
      c.fillStyle = g; c.beginPath(); c.moveTo(a, -ra); c.lineTo(b, -rb); c.lineTo(b, rb); c.lineTo(a, ra); c.closePath();
      if (blur) { c.shadowColor = blur; c.shadowBlur = o.blur || 8; }
      c.fill(); c.shadowBlur = 0;
    }
    var X = function (u) { return x0 + u * s; };
    seg(X(0), X(0.005), r0, r0, sk.punta);
    seg(X(0.005), X(0.024), r0, r1, sk.ghiera);
    seg(X(0.024), X(0.66), r1, r2, sk.fusto);
    seg(X(0.66), X(0.675), r2, r2, sk.giunto);
    seg(X(0.675), X(0.72), r2, r2 + 0.0004 * k, sk.collare);
    seg(X(0.72), X(1.12), r2 + 0.0004 * k, r3, sk.calcio, sk.bagliore);
    seg(X(1.12), X(1.25), r3, r4, sk.impugnatura);
    if (sk.motivo) {
      c.save(); c.beginPath(); c.moveTo(X(0.72), -(r2 + 0.0004 * k)); c.lineTo(X(1.12), -r3); c.lineTo(X(1.12), r3); c.lineTo(X(0.72), r2 + 0.0004 * k); c.closePath(); c.clip();
      var a = X(0.72), b = X(1.12), i, n, rr = r3;
      c.fillStyle = c.strokeStyle = sk.motivoCol;
      if (sk.motivo === 'radica') {
        c.lineWidth = rr * 0.16;
        for (i = 0; i < 9; i++) { c.beginPath(); var y0 = -rr + (i + .5) * rr * 2 / 9; c.moveTo(a, y0);
          for (var u = 0; u <= 1.0001; u += 0.05) c.lineTo(a + (b - a) * u, y0 + Math.sin(u * 23 + i * 1.7) * rr * 0.22 + Math.sin(u * 61 + i) * rr * 0.08); c.stroke(); }
      } else if (sk.motivo === 'intarsio') {
        for (i = 0; i < 4; i++) { var cx = a + (b - a) * (0.12 + i * 0.12), w = (b - a) * 0.045;
          c.beginPath(); c.moveTo(cx - w, 0); c.lineTo(cx, -rr * 0.62); c.lineTo(cx + w, 0); c.lineTo(cx, rr * 0.62); c.closePath(); c.fill(); }
        c.fillStyle = 'rgba(240,235,255,.85)';
        for (i = 0; i < 4; i++) { c.beginPath(); c.arc(a + (b - a) * (0.18 + i * 0.12), 0, rr * 0.13, 0, 6.2832); c.fill(); }
      } else if (sk.motivo === 'carbonio') {
        c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = rr * 0.12; n = 60;
        for (i = 0; i < n; i++) { var px = a + (b - a) * i / n; c.beginPath(); c.moveTo(px, -rr); c.lineTo(px + rr * 2, rr); c.stroke(); }
        var pul = 0.6 + 0.4 * Math.sin(t * 4);
        c.strokeStyle = sk.motivoCol; c.globalAlpha *= pul; c.lineWidth = rr * 0.22; c.shadowColor = sk.motivoCol; c.shadowBlur = (o.blur || 8) * 1.2;
        c.beginPath(); c.moveTo(a, 0); c.lineTo(b, 0); c.stroke(); c.shadowBlur = 0;
      } else if (sk.motivo === 'finestre') {
        for (i = 0; i < 7; i++) { var fx = a + (b - a) * (0.08 + i * 0.13), fw = (b - a) * 0.045;
          c.fillRect(fx, -rr * 0.55, fw, rr * 0.38); c.fillRect(fx, rr * 0.17, fw, rr * 0.38); }
        c.lineWidth = rr * 0.14; c.beginPath(); c.moveTo(a + (b - a) * 0.02, rr * 0.7);
        for (i = 0; i < 12; i++) c.lineTo(a + (b - a) * (0.06 + i * 0.08), (i % 2 ? rr * 0.7 : rr * 0.45)); c.stroke();
      } else if (sk.motivo === 'sigillo') {
        c.lineWidth = rr * 0.1;
        for (i = 0; i < 2; i++) { c.beginPath(); c.moveTo(a, (i ? 1 : -1) * rr * 0.78); c.lineTo(b, (i ? 1 : -1) * rr * 0.78); c.stroke(); }
        var sx0 = a + (b - a) * 0.55, sr = rr * 0.72;
        c.beginPath(); c.arc(sx0, 0, sr, 0, 6.2832); c.fill();
        c.fillStyle = '#4a0712'; c.beginPath(); c.arc(sx0, 0, sr * 0.8, 0, 6.2832); c.fill();
        c.fillStyle = sk.motivoCol; c.beginPath(); c.moveTo(sx0 - sr * 0.5, -sr * 0.05); c.lineTo(sx0, -sr * 0.5); c.lineTo(sx0 + sr * 0.5, -sr * 0.05); c.closePath(); c.fill();
        c.fillRect(sx0 - sr * 0.38, -sr * 0.02, sr * 0.76, sr * 0.45);
        c.fillStyle = '#4a0712'; for (i = 0; i < 3; i++) c.fillRect(sx0 - sr * 0.3 + i * sr * 0.22, sr * 0.06, sr * 0.14, sr * 0.14);
      } else if (sk.motivo === 'scaglie') {
        c.lineWidth = rr * 0.12; var sw = rr * 0.7;
        for (var row = -2; row <= 2; row++) for (i = 0; i < 80; i++) { var sx = a + i * sw + (row % 2 ? sw / 2 : 0), sy = row * rr * 0.45; if (sx > b) break;
          c.beginPath(); c.arc(sx, sy, sw * 0.55, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); }
      } else if (sk.motivo === 'perla') {
        c.lineWidth = rr * 0.1; c.strokeStyle = 'rgba(255,255,255,.55)';
        c.beginPath(); for (var u2 = 0; u2 <= 1.0001; u2 += 0.02) c.lineTo(a + (b - a) * u2, Math.sin(u2 * 40) * rr * 0.5); c.stroke();
        c.fillStyle = '#ffffff';
        for (i = 0; i < 6; i++) { var gx = a + (b - a) * (0.1 + i * 0.15), gs = rr * (0.35 + 0.15 * Math.sin(t * 5 + i * 1.3));
          c.beginPath(); c.moveTo(gx - gs, 0); c.lineTo(gx, -gs * 0.35); c.lineTo(gx + gs, 0); c.lineTo(gx, gs * 0.35); c.closePath(); c.fill();
          c.beginPath(); c.moveTo(gx, -gs * 0.9); c.lineTo(gx + gs * 0.18, 0); c.lineTo(gx, gs * 0.9); c.lineTo(gx - gs * 0.18, 0); c.closePath(); c.fill(); }
      }
      c.restore();
    }
    for (var j = 0; j < (sk.anelli || []).length; j++) {
      var an = sk.anelli[j], at = X(an[0]), aw = an[1] * s, rr2 = an[0] < 0.72 ? r2 : r2 + (r3 - r2) * Math.min(1, (an[0] - 0.72) / 0.4);
      if (an[0] > 1.12) rr2 = r3 + (r4 - r3) * (an[0] - 1.12) / 0.13;
      c.fillStyle = an[2]; c.fillRect(at, -rr2 * 0.95, aw, rr2 * 1.9);
    }
    if (sk.neonFusto) {
      c.save(); c.globalAlpha *= 0.65 + 0.35 * Math.sin(t * 4); c.strokeStyle = sk.neonFusto; c.lineWidth = r1 * 0.35; c.shadowColor = sk.neonFusto; c.shadowBlur = (o.blur || 8);
      c.beginPath(); c.moveTo(X(0.03), 0); c.lineTo(X(0.655), 0); c.stroke(); c.restore();
    }
    if (sk.spirale) {
      c.save(); c.strokeStyle = sk.spirale; c.lineWidth = r1 * 0.32; c.beginPath();
      for (var u3 = 0.03; u3 <= 1.12; u3 += 0.004) { var rad = u3 < 0.66 ? r1 + (r2 - r1) * u3 / 0.66 : r2 + (r3 - r2) * Math.min(1, (u3 - 0.66) / 0.46), yy = Math.sin(u3 * 38) * rad * 0.85;
        if (Math.cos(u3 * 38) < 0) { c.stroke(); c.beginPath(); c.moveTo(X(u3), yy); } else c.lineTo(X(u3), yy); }
      c.stroke(); c.fillStyle = sk.spirale; c.beginPath(); c.arc(X(0.035), 0, r1 * 0.55, 0, 6.2832); c.fill(); c.restore();
    }
    if (o.luce > 0 && o.luce < 1) {
      var p = x0 + len * (o.luce * 1.4 - 0.2), gl = c.createLinearGradient(p - len * 0.12, 0, p + len * 0.12, 0);
      gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(0.5, 'rgba(255,255,255,.55)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gl;
      c.beginPath(); c.moveTo(x0, -r0); c.lineTo(x0 + len, -r4); c.lineTo(x0 + len, r4); c.lineTo(x0, r0); c.closePath(); c.fill(); c.restore();
    }
  }
  TV3.steccaDisegna = steccaDisegna;
  function bilia(x, cx, cy, R, otto) {
    var g = x.createRadialGradient(cx - R * .35, cy - R * .4, R * .1, cx, cy, R);
    if (otto) { g.addColorStop(0, '#5a5a5a'); g.addColorStop(.5, '#141414'); g.addColorStop(1, '#000'); } else { g.addColorStop(0, '#ffffff'); g.addColorStop(.6, '#f1ecdc'); g.addColorStop(1, '#a89f86'); }
    x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(cx + R * .25, cy + R * .35, R * 1.05, R * .8, 0, 0, 6.2832); x.fill();
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R, 0, 6.2832); x.fill();
    if (otto) { x.fillStyle = '#fff'; x.beginPath(); x.arc(cx - R * .1, cy - R * .1, R * .42, 0, 6.2832); x.fill(); x.fillStyle = '#111'; x.font = '700 ' + (R * .6) + 'px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('8', cx - R * .1, cy - R * .06); }
    var sp = x.createRadialGradient(cx - R * .4, cy - R * .45, 0, cx - R * .4, cy - R * .45, R * .6); sp.addColorStop(0, 'rgba(255,255,255,.85)'); sp.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = sp; x.beginPath(); x.arc(cx, cy, R, 0, 6.2832); x.fill();
  }
  var DUR_ST = 3.8;
  function scenaStecca(x, W, H, t, idx, seed, k) {
    var sk = STECCHE[idx] || STECCHE[0];
    x.drawImage(cache('panno|st|' + (W * k | 0) + 'x' + (H * k | 0), W * k | 0, H * k | 0, function (c, w, h) {
      var g = c.createRadialGradient(w * .5, h * .45, h * .1, w * .5, h * .5, Math.max(w, h) * .75);
      g.addColorStop(0, '#16804f'); g.addColorStop(.6, '#0e5c3a'); g.addColorStop(1, '#063322'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      var r = rnd(11); for (var i = 0; i < Math.min(4000, w * h / 90); i++) { var a = r() * .06; c.fillStyle = r() < .5 ? 'rgba(255,255,255,' + a + ')' : 'rgba(0,0,0,' + a * 1.5 + ')'; c.fillRect(r() * w, r() * h, 1 + r() * 2, 1); }
      c.fillStyle = '#4a250f'; c.fillRect(0, 0, w, h * .07); c.fillRect(0, h * .93, w, h * .07);
      c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, h * .07, w, h * .02); c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(0, h * .91, w, h * .02);
      c.fillStyle = '#d8ffe8'; for (var d = 1; d < 4; d++) { c.beginPath(); c.arc(w * d / 4, h * .035, Math.max(1.5, h * .01), 0, 6.2832); c.fill(); c.beginPath(); c.arc(w * d / 4, h * .965, Math.max(1.5, h * .01), 0, 6.2832); c.fill(); }
    }), 0, 0, W, H);
    var fade = t > DUR_ST - .3 ? clamp((DUR_ST - t) / .3, 0, 1) : 1; x.globalAlpha = fade;
    if (W < 200) {
      x.save(); x.translate(W * .08, H * .84); x.rotate(-Math.atan2(H * .68, W * .84));
      var lm = Math.hypot(W * .84, H * .68), scm = lm / 1.25;
      x.scale(-scm, scm); x.translate(-1.25, 0);
      x.fillStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.moveTo(0, .03); x.lineTo(1.25, .045); x.lineTo(1.25, .09); x.lineTo(0, .05); x.fill();
      steccaDisegna(x, 0, 1.25, sk, { k: 4.2, luce: ((t * .35) % 1.6) - .3, t: t, blur: 8 * k });
      x.restore(); x.globalAlpha = 1; return;
    }
    var R = H * .062, cy = H * .55, bx0 = W * .64, ox = W * .87, oy = cy - H * .05;
    var TC = 1.55;
    var ub = clamp((t - TC) / .38, 0, 1), bx = t < TC ? bx0 : bx0 + (ox - R * 1.9 - bx0) * eoc(ub), by = t < TC ? cy : cy + (oy + R * .5 - cy) * eoc(ub);
    if (t > TC + .38) { var ud = clamp((t - TC - .38) / .9, 0, 1); bx += -R * .8 * eoc(ud); by += R * 1.6 * eoc(ud); }
    var o8x = ox, o8y = oy; if (t > TC + .38) { var u8 = clamp((t - TC - .38) / 1.2, 0, 1); o8x += W * .2 * eoc(u8); o8y -= H * .14 * eoc(u8); }
    bilia(x, o8x, o8y, R, true);
    if (sk.scia && t > TC && t < TC + .7) {
      var al = 1 - (t - TC) / .7; x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = sk.scia; x.globalAlpha = fade * al * .6; x.lineCap = 'round'; x.lineWidth = R * 1.1;
      x.shadowColor = sk.scia; x.shadowBlur = 12 * k; x.beginPath(); x.moveTo(bx0, cy); x.lineTo(bx, by); x.stroke(); x.restore();
    }
    bilia(x, bx, by, R, false);
    var gap;
    if (t < .5) gap = .9 - .7 * eoc(t / .5);
    else if (t < 1.35) gap = .2 + .55 * eio((t - .5) / .85);
    else if (t < TC) gap = .75 - .75 * Math.pow((t - 1.35) / (TC - 1.35), 2);
    else gap = -.18 * eoc((t - TC) / .25) + (t > TC + .5 ? .4 * eio((t - TC - .5) / .9) : 0);
    var len = 1.25, sc = W * .52 / len, ang = -.07;
    x.save(); x.translate(bx0 - R - gap * R * 1.6, cy); x.rotate(Math.PI + ang); x.scale(sc, sc);
    x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.moveTo(0, .025); x.lineTo(len, .04); x.lineTo(len, .085); x.lineTo(0, .045); x.fill();
    steccaDisegna(x, 0, len, sk, { k: 3.6, luce: (t - .4) / .9, t: t, blur: 10 * k });
    x.restore();
    if (t >= TC && t < TC + .18) {
      var e = (t - TC) / .18; x.fillStyle = 'rgba(255,255,255,' + (1 - e) * .55 + ')'; x.beginPath(); x.arc(bx0 - R * .9, cy, R * (0.3 + e * .8), 0, 6.2832); x.fill();
    }
    x.globalAlpha = 1;
  }
  function stDi(cl, faint) {
    try {
      var uid = faint ? (cl.raw && cl.raw.turn) : (cl.play ? cl.play.who : cl.me);
      if (uid == null) uid = cl.raw && cl.raw.turn;
      var v = (uid != null && String(uid) === String(cl.me)) ? (look().st | 0) : ((((window.RTD && RTD.profiles) || {})[uid] || {}).tvl || {}).st | 0;
      return (v >= 1 && v < STECCHE.length) ? v : 0;
    } catch (e) { return 0; }
  }
  function agganciaPool() {
    var P2 = window.POOL2; if (!P2 || !P2.Client || P2.Client.prototype.__tv3) return;
    var od = P2.Client.prototype.drawCue;
    P2.Client.prototype.__tv3 = 1;
    P2.Client.prototype.drawCue = function (cue, ang, gap, alpha, faint) {
      var idx = stDi(this, faint), PF = window.PF;
      if (!idx || !PF || !PF.R) return od.apply(this, arguments);
      var c = this.ctx;
      try {
        c.save(); c.globalAlpha = alpha * (faint ? 0.85 : 1);
        var RAIL = 0.078;
        c.beginPath(); c.rect(-RAIL - 0.02, -RAIL - 0.02, PF.W + 2 * RAIL + 0.04, PF.L + 2 * RAIL + 0.04); c.clip();
        c.translate(cue[0], cue[1]); c.rotate(ang + Math.PI);
        var x0 = PF.R + gap, len = 1.25;
        c.fillStyle = 'rgba(0,0,0,.28)';
        c.beginPath(); c.moveTo(x0 + 0.01, 0.012 - 0.004); c.lineTo(x0 + len, 0.018 - 0.011); c.lineTo(x0 + len, 0.018 + 0.011); c.lineTo(x0 + 0.01, 0.012 + 0.004); c.fill();
        steccaDisegna(c, x0, len, STECCHE[idx], { t: performance.now() / 1000, blur: 6 * (this.dpr || 1) });
        c.restore();
        var sk2 = STECCHE[idx], st2 = this.strike;
        if (sk2.scia && st2 && !faint) {
          var k2 = (performance.now() - st2.t0) / 450;
          if (k2 > 0 && k2 < 1) {
            c.save(); c.beginPath(); c.rect(-RAIL, -RAIL, PF.W + 2 * RAIL, PF.L + 2 * RAIL); c.clip();
            var pb = (this.pos && this.pos[0]) || [st2.x + Math.cos(st2.ang) * 0.3, st2.y + Math.sin(st2.ang) * 0.3];
            var gs = c.createLinearGradient(st2.x, st2.y, pb[0], pb[1]); gs.addColorStop(0, 'rgba(255,255,255,0)'); gs.addColorStop(1, sk2.scia);
            c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - k2) * 0.5; c.strokeStyle = gs; c.lineCap = 'round'; c.lineWidth = PF.R * 0.9;
            c.beginPath(); c.moveTo(st2.x, st2.y); c.lineTo(pb[0], pb[1]); c.stroke(); c.restore();
          }
        }
      } catch (e) { try { c.restore(); } catch (_) { } return od.apply(this, arguments); }
    };
  }
  var SCENE = { dd: [scenaDadi, DUR_DD, 2.7], db: [scenaDorso, DUR_DB, 1.75], gp: [scenaGolf, DUR_GP, 1.2], st: [scenaStecca, DUR_ST, 1.3] };
  var A = { recs: [], raf: 0, io: null };
  function ioGet() {
    if (A.io || typeof IntersectionObserver === 'undefined') return A.io;
    A.io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { var r = e.target.__tv3; if (r) { r.vis = e.isIntersecting; if (r.vis) kick(); } });
    }, { rootMargin: '60px 0px' });
    return A.io;
  }
  function registra(cv, slot, idx, anim) {
    if (!cv || !SCENE[slot]) return null;
    var r = { cv: cv, slot: slot, idx: idx | 0, anim: !!anim && !RIDOTTO, seed: anim ? (Math.random() * 1e9) | 0 : 4242, t0: 0, vis: !ioGet(), fatto: false, w: 0, h: 0, ult: 0 };
    cv.__tv3 = r; A.recs.push(r);
    if (A.io) A.io.observe(cv);
    kick(); return r;
  }
  function rigioca(r) { if (!r) return; r.t0 = 0; r.seed = (Math.random() * 1e9) | 0; r.fatto = false; if (RIDOTTO) r.statico = 0; kick(); }
  function misura(r) {
    var w = r.cv.clientWidth, h = r.cv.clientHeight; if (!w || !h) return false;
    var k = Math.min(window.devicePixelRatio || 1, lite() ? 1.25 : 2);
    if (w !== r.w || h !== r.h || k !== r.k) { r.w = w; r.h = h; r.k = k; r.cv.width = Math.round(w * k); r.cv.height = Math.round(h * k); r.fatto = false; }
    return true;
  }
  function disegna(r, now) {
    var sc = SCENE[r.slot], x = r.cv.getContext('2d'); if (!x) return;
    var t;
    if (!r.anim) t = sc[2];
    else { if (!r.t0) r.t0 = now; t = ((now - r.t0) / 1000); if (t > sc[1]) { r.t0 = now; t = 0; r.seed = (r.seed * 1103515245 + 12345) >>> 0; } }
    x.setTransform(r.k, 0, 0, r.k, 0, 0);
    try { sc[0](x, r.w, r.h, t, r.idx, r.seed, r.k); } catch (e) { warn('scena ' + r.slot, e); r.anim = false; }
    r.fatto = true;
  }
  function kick() { if (!A.raf) A.raf = requestAnimationFrame(passo); }
  function passo(now) {
    A.raf = 0;
    var ancora = false, passo30 = lite();
    for (var i = A.recs.length - 1; i >= 0; i--) {
      var r = A.recs[i];
      if (!r.cv.isConnected) { if (A.io) A.io.unobserve(r.cv); r.cv.__tv3 = null; A.recs.splice(i, 1); continue; }
      if (!r.vis || document.hidden || r.cv.offsetParent === null) continue;
      if (!misura(r)) continue;
      if (r.anim) {
        ancora = true;
        if (passo30 && now - r.ult < 31) continue;
        r.ult = now; disegna(r, now);
      } else if (!r.fatto) disegna(r, now);
    }
    if (ancora) A.raf = requestAnimationFrame(passo);
  }
  TV3.stato = function () { return { tele: A.recs.length, animate: A.recs.filter(function (r) { return r.anim && r.vis && r.cv.offsetParent !== null; }).length, raf: !!A.raf, d3: !!(D3V.fr) }; };
  TV3.ferma = function () { if (A.raf) cancelAnimationFrame(A.raf); A.raf = 0; ferma3d(); };
  var D3V = { fr: null, api: null, stage: null, idx: 0, t: 0, ro: null, vals: [5, 6] };
  function vuole3d() {
    if (RIDOTTO || lite() || window.TV3_NO3D) return false;
    try { if (localStorage.getItem('gb_tv3_3d') === '0') return false; } catch (e) { }
    try { if (typeof dd3Vuole !== 'function' || !dd3Vuole()) return false; } catch (e) { return false; }
    try { var c = navigator.connection; if (c && c.saveData) return false; } catch (e) { }
    if (navigator.deviceMemory && navigator.deviceMemory < 3) return false;
    return true;
  }
  function ferma3d() {
    clearTimeout(D3V.t); D3V.t = 0;
    try { if (D3V.ro) D3V.ro.disconnect(); } catch (e) { } D3V.ro = null;
    try { if (D3V.api && D3V.api.nascondi) D3V.api.nascondi(); } catch (e) { }
    if (D3V.fr) { try { D3V.fr.remove(); } catch (e) { } }
    if (D3V.stage) D3V.stage.classList.remove('tv3-3d-on');
    D3V.fr = null; D3V.api = null; D3V.stage = null;
  }
  function lancia3d() {
    var a = D3V.api; if (!a) return false;
    try {
      var v = [1 + ((Math.random() * 6) | 0), 1 + ((Math.random() * 6) | 0)]; D3V.vals = v;
      a.monta({ stile: 'casino', riposo: v, lite: false, skin: { casino: D3V.idx, tu: D3V.idx, lui: D3V.idx } });
      a.lancia(v, { vince: -1 }, function () { });
      return true;
    } catch (e) { warn('3D lancia', e); ferma3d(); return false; }
  }
  function misura3d() {
    var a = D3V.api, s = D3V.stage; if (!a || !s) return;
    var w = s.clientWidth, h = s.clientHeight; if (w < 40 || h < 40) return;
    try { a.misura(w, h, Math.min(2, window.devicePixelRatio || 1)); } catch (e) { warn('3D misura', e); ferma3d(); }
  }
  function monta3d(stage, idx) {
    if (!vuole3d() || !stage) return;
    D3V.idx = idx | 0;
    if (D3V.fr && D3V.stage === stage) { if (D3V.api) lancia3d(); return; }
    ferma3d();
    var f = document.createElement('iframe');
    f.className = 'tv3-3d'; f.setAttribute('aria-hidden', 'true'); f.setAttribute('tabindex', '-1'); f.setAttribute('allowtransparency', 'true');
    f.src = 'dadi3d.html?v=' + (typeof DD3_VER !== 'undefined' ? DD3_VER : '1');
    D3V.fr = f; D3V.stage = stage; stage.appendChild(f);
    var t0 = Date.now();
    (function guarda() {
      if (D3V.fr !== f) return;
      var a = null; try { a = f.contentWindow && f.contentWindow.DADI3D; } catch (e) { }
      if (a && a.errore) { warn('3D ' + a.errore); ferma3d(); return; }
      if (a && a.pronto) {
        D3V.api = a; a.cadi = function (m) { warn('3D giu: ' + m); ferma3d(); };
        misura3d(); lancia3d();
        setTimeout(function () { if (D3V.fr === f) stage.classList.add('tv3-3d-on'); }, 120);
        try { if (typeof ResizeObserver !== 'undefined') { D3V.ro = new ResizeObserver(misura3d); D3V.ro.observe(stage); } } catch (e) { }
        return;
      }
      if (Date.now() - t0 > 15000) { ferma3d(); return; }
      D3V.t = setTimeout(guarda, 150);
    })();
  }
  var IO3 = null;
  function osserva3d(stage, idx) {
    if (!vuole3d() || typeof IntersectionObserver === 'undefined') return;
    if (IO3) IO3.disconnect();
    var tim = 0;
    IO3 = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        clearTimeout(tim);
        if (e.isIntersecting && e.intersectionRatio > .55 && D3V.stage !== stage) tim = setTimeout(function () { if (stage.isConnected && stage.offsetParent !== null && D3V.stage !== stage) monta3d(stage, TV3.sel.dd != null ? TV3.sel.dd : idx); }, 450);
      });
    }, { threshold: [0, .55, 1] });
    IO3.observe(stage);
  }
  function badge(st, q) {
    if (st === 'eq') return '<span class="tv3-bd eq">' + IC.check + L('In uso', 'Equipped') + '</span>';
    if (st === 'mio') return '<span class="tv3-bd mio">' + L('Tuo', 'Owned') + '</span>';
    if (st === 'pronta') return '<span class="tv3-bd pronta">' + IC.dono + L('Pronto', 'Ready') + '</span>';
    if (st === 'quest' && q) return '<span class="tv3-bd chiuso">' + IC.lock + Math.min(q.prog | 0, q.goal | 0) + '/' + (q.goal | 0) + '</span>';
    return '<span class="tv3-bd chiuso">' + IC.lock + L('Presto', 'Soon') + '</span>';
  }
  function sceltaDi(slot, vv, lk, pos) {
    var s = TV3.sel[slot];
    if (s != null && vv.some(function (v) { return v.idx === s; })) return s;
    var eq = lk[slot] | 0; if (eq) return eq;
    var pr = vv.filter(function (v) { return stato(v, lk, pos) === 'pronta'; })[0]; if (pr) return pr.idx;
    var mio = vv.filter(function (v) { return !v.stock && stato(v, lk, pos) === 'mio'; })[0]; if (mio) return mio.idx;
    return vv[1] ? vv[1].idx : 0;
  }
  function barra(q) {
    var g = q.goal | 0 || 1, p = Math.min(q.prog | 0, g), k = p / g;
    return '<div class="tv3-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + g + '" aria-valuenow="' + p + '"><i style="--k:' + k.toFixed(3) + '"></i></div>';
  }
  function info(slot, v, st, q) {
    var h = '<div class="tv3-info"><div class="tv3-nm"><span class="tv3-rar r-' + (v.rarity || 'common') + '">' + rarNome(v.rarity) + '</span><b>' + esc(nome(v)) + '</b></div>'
      + '<p class="tv3-ds">' + esc(desc(v)) + '</p>';
    if ((st === 'quest' || st === 'pronta') && q) {
      var g = q.goal | 0 || 1, p = Math.min(q.prog | 0, g);
      h += '<div class="tv3-qb"><div class="tv3-qt">' + IC.lock.replace('<svg', '<svg class="ic"') + '<span>' + L('Si sblocca con la quest', 'Unlocks with the quest') + ' <b>«' + esc(frase(nome(q))) + '»</b></span></div>'
        + '<div class="tv3-qd">' + esc(dc() && q.conta === 'soldi' ? L('Si sblocca giocando nella mini app di Telegram.', 'Unlocks by playing in the Telegram mini app.') : desc(q)) + '</div>' + barra(q)
        + '<div class="tv3-qp"><span>' + (q.tipo === 'max' ? L('Migliore: ', 'Best: ') : '') + p + ' / ' + g + '</span><span>' + (st === 'pronta' ? '<b class="ok">' + L('Completata', 'Complete') + '</b>' : L('ne mancano ', '') + (g - p) + L('', ' to go')) + '</span></div></div>';
    } else if (st === 'presto') {
      h += '<div class="tv3-qb"><div class="tv3-qt">' + IC.orologio.replace('<svg', '<svg class="ic"') + '<span>' + L('Si sblocca con una quest in arrivo.', 'Unlocks with an upcoming quest.') + '</span></div></div>';
    }
    var b = '';
    if (st === 'eq') b = '<button class="tv3-btn eq" disabled>' + IC.check + L('In uso', 'Equipped') + '</button>' + (v.idx ? '<button class="tv3-btn sec" onclick="tvlEquip(\'' + slot + '\',0)">' + L('Torna di serie', 'Back to stock') + '</button>' : '');
    else if (st === 'mio') b = '<button class="tv3-btn pri" onclick="tvlEquip(\'' + slot + '\',' + (v.idx | 0) + ')">' + L('Equipaggia', 'Equip') + '</button>';
    else if (st === 'pronta' && q) b = '<button class="tv3-btn pri glow" onclick="qnClaim(\'' + q.id + '\')">' + IC.dono + L('Riscuoti', 'Claim') + '</button>';
    else if (st === 'quest' && q) b = '<button class="tv3-btn pri" onclick="TV3.vaiQuest(\'' + q.id + '\')">' + L('Vai alla quest', 'Go to the quest') + IC.freccia + '</button>' + gioca(q, 'sec');
    else b = '<button class="tv3-btn sec" disabled>' + IC.orologio + L('In arrivo', 'Coming soon') + '</button>';
    return h + '<div class="tv3-btns">' + b + '</div></div>';
  }
  function dove(slot) {
    var d = DOVE[slot], h = '<div class="tv3-dove"><div class="tv3-dt">' + IC.occhio.replace('<svg', '<svg class="ic"') + L('Dove si vede', 'Where it shows') + '</div><div class="tv3-dg">';
    d.giochi.forEach(function (g) { h += '<span class="tv3-gc"><img src="' + g[0] + '" alt="" loading="lazy" decoding="async" onerror="this.style.visibility=\'hidden\'"><b>' + esc(L(g[1], g[2])) + '</b></span>'; });
    return h + '</div><p>' + esc(L(d.nota[0], d.nota[1])) + '</p></div>';
  }
  function slotHtml(slot, lk, pos) {
    var vv = voci(slot), sel = sceltaDi(slot, vv, lk, pos), v = vv.filter(function (x) { return x.idx === sel; })[0] || vv[0];
    TV3.sel[slot] = v.idx;
    var st = stato(v, lk, pos), q = v.stock ? null : questDi(v.id);
    var tuoi = vv.filter(function (x) { return !x.stock && (pos.indexOf(x.id) >= 0); }).length;
    var h = '<section class="tv3-slot" id="tv3-slot-' + slot + '" data-slot="' + slot + '">'
      + '<header class="tv3-sh"><span class="ic">' + SLOT_IC[slot] + '</span><h3>' + esc(L(SLOT_NOME[slot][0], SLOT_NOME[slot][1])) + '</h3>'
      + '<span class="tv3-cnt">' + tuoi + '/' + (vv.length - 1) + ' ' + L('sbloccati', 'unlocked') + '</span></header>'
      + '<div class="tv3-stage r-' + (v.rarity || 'common') + ' st-' + st + '" data-slot="' + slot + '" role="button" tabindex="0" aria-label="' + esc(L('Rigioca l’anteprima', 'Replay the preview')) + '">'
      + '<canvas class="tv3-cv" data-slot="' + slot + '" data-idx="' + v.idx + '"></canvas>'
      + '<span class="tv3-sr r-' + (v.rarity || 'common') + '">' + rarNome(v.rarity) + '</span>' + badge(st, q)
      + '<span class="tv3-hint">' + IC.giro + L('Tocca per rigiocare', 'Tap to replay') + '</span></div>'
      + '<div class="tv3-pick' + (vv.length > 3 ? ' molti' : '') + '" role="radiogroup" aria-label="' + esc(L(SLOT_NOME[slot][0], SLOT_NOME[slot][1])) + '">';
    vv.forEach(function (x) {
      var s2 = stato(x, lk, pos), q2 = x.stock ? null : questDi(x.id);
      h += '<button class="tv3-op r-' + (x.rarity || 'common') + ' st-' + s2 + (x.idx === v.idx ? ' on' : '') + '" role="radio" aria-checked="' + (x.idx === v.idx) + '" onclick="TV3.scegli(\'' + slot + '\',' + x.idx + ')">'
        + '<canvas class="tv3-th" data-slot="' + slot + '" data-idx="' + x.idx + '"></canvas>'
        + '<span class="tv3-on">' + esc(x.stock ? L('Di serie', 'Stock') : nome(x)) + '</span>'
        + '<span class="tv3-os">' + (s2 === 'eq' ? IC.check + L('In uso', 'In use') : s2 === 'mio' ? L('Tuo', 'Owned') : s2 === 'pronta' ? IC.dono + L('Pronto', 'Ready') : s2 === 'quest' && q2 ? IC.lock + Math.min(q2.prog | 0, q2.goal | 0) + '/' + (q2.goal | 0) : IC.lock + L('Presto', 'Soon')) + '</span></button>';
    });
    h += '</div>' + info(slot, v, st, q) + dove(slot) + '</section>';
    return h;
  }
  function firma(lk, pos) {
    var qs = (QN.lista || []).filter(function (q) { return q.premio && q.premio.mode === 'tavolo'; }).map(function (q) { return q.id + ':' + q.prog + ':' + (q.fatta ? 1 : 0) + (q.presa ? 1 : 0); });
    return JSON.stringify([lk, pos, qs, TV3.sel, L('it', 'en'), !!QN.lista, TV3.slotsDaMostrare ? TV3.slotsDaMostrare() : 0]);
  }
  function tavolo(host) {
    if (!host) return;
    try { if (typeof qnCss === 'function') qnCss(); } catch (e) { }
    if (!QN.lista && !QN.carica && !QN.tentato && window.S && S.userId) { QN.carica = 1; qnCarica(function () { QN.carica = 0; if (window._COS_MODE === 'tavolo') window.tvlCards(host); }); }
    var lk = look(), pos = posseduti();
    var lista = TV3.slotsDaMostrare ? TV3.slotsDaMostrare() : SLOT;
    lista.forEach(function (s) { TV3.sel[s] = sceltaDi(s, voci(s), lk, pos); });
    var f = firma(lk, pos), vivo = host.querySelector(':scope>.tv3');
    if (vivo && TV3.firma === f) return;
    TV3.firma = f;
    ferma3d();
    var h = '<div class="tv3"><p class="tv3-intro">' + L('Il tuo tavolo: dadi, dorso delle carte e pallina del golf. Li vedi tu e li vede chi gioca contro di te.', 'Your table: dice, card back and golf ball. You see them, and so does whoever plays against you.') + '</p>';
    if (TV3.barraGiochi) h += TV3.barraGiochi(lk, pos);
    lista.forEach(function (s) { h += slotHtml(s, lk, pos); });
    h += '</div>';
    host.innerHTML = h;
    monta(host);
  }
  function monta(host) {
    [].forEach.call(host.querySelectorAll('canvas.tv3-cv'), function (cv) {
      var slot = cv.getAttribute('data-slot'), idx = +cv.getAttribute('data-idx');
      var r = registra(cv, slot, idx, true), st = cv.parentNode;
      st.addEventListener('click', function () { rigioca(r); if (slot === 'dd' && D3V.api && D3V.stage === st) lancia3d(); });
      st.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); st.click(); } });
      if (slot === 'dd') osserva3d(st, idx);
    });
    [].forEach.call(host.querySelectorAll('canvas.tv3-th'), function (cv) { registra(cv, cv.getAttribute('data-slot'), +cv.getAttribute('data-idx'), false); });
  }
  TV3.scegli = function (slot, idx) {
    TV3.sel[slot] = idx | 0;
    var host = $('cos-cards'); if (!host) return;
    var sec = $('tv3-slot-' + slot); if (!sec) { tavolo(host); return; }
    var lk = look(), pos = posseduti();
    var tmp = document.createElement('div'); tmp.innerHTML = slotHtml(slot, lk, pos);
    var nuovo = tmp.firstChild;
    if (slot === 'dd' && D3V.stage && sec.contains(D3V.stage)) {
      var stN = nuovo.querySelector('.tv3-stage'), fr = D3V.fr;
      sec.parentNode.replaceChild(nuovo, sec);
      if (fr) { stN.appendChild(fr); D3V.stage = stN; stN.classList.add('tv3-3d-on'); try { if (D3V.ro) { D3V.ro.disconnect(); D3V.ro.observe(stN); } } catch (e) { } }
      monta(nuovo); D3V.idx = idx | 0; lancia3d();
    } else {
      sec.parentNode.replaceChild(nuovo, sec);
      monta(nuovo);
    }
    TV3.firma = firma(lk, pos);
    try { if (window.Telegram && Telegram.WebApp && Telegram.WebApp.HapticFeedback) Telegram.WebApp.HapticFeedback.selectionChanged(); } catch (e) { }
  };
  TV3.vaiQuest = function (id) {
    TV3.dopoRender = function () {
      var c = $('qnc_' + id); if (!c) return;
      try { c.scrollIntoView({ block: 'center', behavior: RIDOTTO ? 'auto' : 'smooth' }); } catch (e) { c.scrollIntoView(); }
      c.classList.remove('tv3-flash'); void c.offsetWidth; c.classList.add('tv3-flash');
    };
    chSwitchTab('nuove');
  };
  TV3.vaiSkin = function (slot, idx) {
    TV3.sel[slot] = idx | 0; TV3.firma = '';
    chSwitchTab('cosmetics'); cosSwitchMode('tavolo');
    setTimeout(function () { var s = $('tv3-slot-' + slot); if (s) try { s.scrollIntoView({ block: 'start', behavior: RIDOTTO ? 'auto' : 'smooth' }); } catch (e) { s.scrollIntoView(); } }, 60);
  };
  var GIOCA = { bj1v1: "window.RTD_GAME='bj1v1';go('arc')", pk1v1: "window.RTD_GAME='pk1v1';go('arc')", golf: "window.RTD_GAME='golf';go('arc')",
    snake: "window.RTD_GAME='snake';go('arc')", dama: "window.RTD_GAME='dama';go('arc')", backg: "window.RTD_GAME='backg';go('arc')",
    calcio: "window.RTD_GAME='calcio';go('arc')", shove: "window.RTD_GAME='shove';go('arc')", basket: "window.RTD_GAME='basket';go('arc')",
    pool8: "window.RTD_GAME='pool8';go('arc')", pool15: "window.RTD_GAME='pool15';go('arc')",
    dice: "go('duel')", grun: "go('grun')" };
  function gioca(q, cls) {
    var a = q && GIOCA[q.gioco]; if (!a || dc()) return '';
    return '<button class="tv3-btn ' + (cls || 'sec') + '" onclick="' + a + '">' + IC.play + L('Gioca', 'Play') + '</button>';
  }
  var GIOCO_NOMI = { bj1v1: 'Blackjack 1v1', pk1v1: 'Poker 1v1', golf: 'Golf', snake: 'Snake', dama: ['Dama', 'Checkers'], chess: ['Scacchi', 'Chess'],
    backg: 'Backgammon', dice: ['Dadi', 'Dice'], calcio: 'Derby', shove: 'Shove', basket: 'Basket', grun: 'Gambler Run', pool8: ['Biliardo', 'Pool'], pool15: ['Biliardo', 'Pool'],
    kaiju: 'Kaiju', smash: 'Smash', sbanca: 'Sbanca', abisso: ['Drago', 'Dragon'], race: 'Street Race', geo: 'Geo Bet', deadmoney: 'Dead Money',
    settemezzo: ['Sette e mezzo', 'Seven and a half'], briscola: 'Briscola', tappo: ['Bisca', 'Bisca'], damaru: ['Dama russa', 'Russian checkers'], hop: 'Hop Clash' };
  function giocoChiave(g) { return g === 'pool15' ? 'pool8' : (g === 'backg' || g === 'chess' || g === 'damaru') ? 'dama' : (g === 'basket' ? 'shove' : g); }
  function giocoNome(g) { var n = GIOCO_NOMI[giocoChiave(g)] || GIOCO_NOMI[g]; return n ? (typeof n === 'string' ? n : L(n[0], n[1])) : String(g || '').toUpperCase(); }
  function targa(cv, pr) {
    var x = cv.getContext('2d'), W = cv.width, H = cv.height, col = RAR_COL[pr.rarity] || '#8b83f0';
    var bg = x.createRadialGradient(W / 2, H * .42, 4, W / 2, H / 2, W * .7); bg.addColorStop(0, '#2a2a32'); bg.addColorStop(1, '#0b0b0e');
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    var pw = W * .86, ph = H * .42, px = (W - pw) / 2, py = H * .3;
    var g = x.createLinearGradient(0, py, 0, py + ph); g.addColorStop(0, '#3a3a44'); g.addColorStop(1, '#17171c');
    x.fillStyle = g; tondo(x, px, py, pw, ph, ph * .28); x.fill();
    x.strokeStyle = col; x.lineWidth = Math.max(2, W * .018); tondo(x, px, py, pw, ph, ph * .28); x.stroke();
    x.fillStyle = col; x.font = '600 ' + (W * .075) + 'px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(L('TITOLO', 'TITLE'), W / 2, py - H * .08);
    var t = nome(pr) || '', fs = W * .12; x.font = '700 ' + fs + 'px system-ui,sans-serif';
    while (fs > W * .055 && x.measureText(t).width > pw * .9) { fs -= 1; x.font = '700 ' + fs + 'px system-ui,sans-serif'; }
    x.fillStyle = '#fff'; x.fillText(t, W / 2, py + ph / 2, pw * .92);
  }
  function anteprimaPremio(cv, pr) {
    if (!cv || !pr) return;
    try {
      if (pr.tipo === 'titolo') { targa(cv, pr); return; }
      qnAnteprima(cv, pr);
    } catch (e) { warn('anteprima', e); }
  }
  function premioNome(pr) { if (!pr) return ''; if (pr.tipo === 'cent') return typeof qnEuro === 'function' ? qnEuro(pr.cent) : ''; return nome(pr); }
  function eqPremio(pr) { try { return qnEquipaggiata(pr); } catch (e) { return false; } }
  function gruppoDi(q) { if (q.fatta && !q.presa) return 'pronte'; if (q.presa) return 'fatte'; return 'corso'; }
  function qCard(q, gr) {
    var pr = q.premio || {}, rar = q.rarity || 'rare', g = q.goal | 0 || 1, p = Math.min(q.prog | 0, g), k = p / g;
    var tv = pr.tipo === 'skin' && pr.mode === 'tavolo', soldi = q.conta === 'soldi';
    var stt = gr === 'pronte' ? 'pronta' : gr === 'fatte' ? (pr.tipo === 'skin' ? (eqPremio(pr) ? 'eq' : 'mio') : 'presa') : 'corso';
    var art = '<div class="tv3q-art r-' + (pr.rarity || rar) + '">'
      + (tv ? '<canvas class="tv3-qa" data-slot="' + pr.slot + '" data-idx="' + (pr.idx | 0) + '"></canvas>'
            : '<canvas class="tv3-qs" data-q="' + esc(q.id) + '" width="240" height="240"></canvas>')
      + (stt === 'eq' ? '<span class="tv3-bd eq">' + IC.check + L('In uso', 'Equipped') + '</span>' : '') + '</div>';
    var serie = q.serie === 'grun' ? 'Gambler Run' : (q.gioco ? giocoNome(q.gioco) : L('Giochi nuovi', 'New games'));
    var meta = '<div class="tv3q-meta"><span class="tv3-rar r-' + rar + '">' + rarNome(rar) + '</span><span class="tv3q-tag">' + esc(serie) + '</span>'
      + (soldi && !dc() ? '<span class="tv3q-tag soldi">' + L('Solo a soldi', 'Real money only') + '</span>' : '') + '</div>';
    var prem = '<div class="tv3q-pr">' + L('Premio', 'Reward') + ' <b>' + esc(premioNome(pr)) + '</b>'
      + (tv ? ' <button class="tv3-lnk" onclick="TV3.vaiSkin(\'' + pr.slot + '\',' + (pr.idx | 0) + ')">' + L('Vedi al tavolo', 'See it on the table') + IC.freccia + '</button>' : '') + '</div>';
    var prog = '';
    if (gr !== 'fatte') {
      prog = barra(q) + '<div class="tv3-qp"><span>' + (q.tipo === 'max' ? L('Migliore: ', 'Best: ') : '') + '<b>' + p + '</b> / ' + g + '</span><span>'
        + (gr === 'pronte' ? '<b class="ok">' + L('Completata', 'Complete') + '</b>' : (Math.round(k * 100) + '%')) + '</span></div>';
    }
    var cta = '';
    if (gr === 'pronte') cta = '<button class="tv3-btn pri glow qn-claim" onclick="qnClaim(\'' + q.id + '\')">' + IC.dono + L('Riscuoti', 'Claim') + '</button>';
    else if (gr === 'fatte') {
      if (pr.tipo === 'titolo') cta = '<div class="tv3q-ok">' + IC.check + L('Titolo sbloccato', 'Title unlocked') + '</div>';
      else if (pr.tipo === 'skin') cta = stt === 'eq' ? '<button class="tv3-btn eq" disabled>' + IC.check + L('Equipaggiata', 'Equipped') + '</button>'
        : '<button class="tv3-btn pri" onclick="qnEquip(\'' + q.id + '\')">' + L('Equipaggia', 'Equip') + '</button>';
      else cta = '<div class="tv3q-ok">' + IC.check + L('Riscossa', 'Claimed') + '</div>';
    } else cta = gioca(q, 'sec');
    return '<article class="tv3q st-' + stt + ' g-' + gr + '" id="qnc_' + esc(q.id) + '">' + art
      + '<div class="tv3q-b">' + meta + '<h4>' + esc(frase(nome(q))) + '</h4><p>' + esc(desc(q)) + '</p>' + prem + prog + '</div>'
      + (cta ? '<div class="tv3q-cta">' + cta + '</div>' : '') + '</article>';
  }
  TV3.aperte = { fatte: false };
  TV3.filtra = function (k) { TV3.filtro = k || ''; window.qnRender(); };
  TV3.apri = function (k) { TV3.aperte[k] = !TV3.aperte[k]; window.qnRender(); };
  TV3.apriPresto = function () { TV3.apri('presto'); };
  function nuove() {
    var c = $('qn-list'); if (!c) return;
    try { if (typeof qnCss === 'function') qnCss(); } catch (e) { }
    c.classList.add('tv3-nl');
    if (!window.S || !S.userId) { c.innerHTML = '<div class="tv3-vuoto">' + L('Apri in Telegram', 'Open in Telegram') + '</div>'; return; }
    if (!QN.lista) {
      if (QN.carica) return;
      if (QN.tentato) { c.innerHTML = '<div class="tv3-vuoto">' + L('Non riesco a caricare le quest.', 'Could not load the quests.') + '<button class="tv3-btn sec" onclick="qnRiprova()">' + IC.giro + L('Riprova', 'Retry') + '</button></div>'; return; }
      QN.carica = 1; c.innerHTML = (typeof gbSkel === 'function') ? gbSkel(4, 96) : '';
      qnCarica(function () { QN.carica = 0; window.qnRender(); }); return;
    }
    var l = QN.lista.filter(function (q) { return q && !(dc() && (q.conta === 'soldi' || (q.premio && q.premio.tipo === 'cent'))); });
    var cnt = {}, ord = [];
    l.forEach(function (q) { var k = q.serie === 'grun' ? 'grun' : giocoChiave(q.gioco || ''); if (!cnt[k]) { cnt[k] = 0; ord.push(k); } cnt[k]++; });
    var fil = TV3.filtro && cnt[TV3.filtro] ? TV3.filtro : '';
    if (fil) l = l.filter(function (q) { return (q.serie === 'grun' ? 'grun' : giocoChiave(q.gioco || '')) === fil; });
    var chips = '';
    if (ord.length > 4) {
      chips = '<div class="tv3n-fil" role="tablist"><button class="' + (fil ? '' : 'on') + '" onclick="TV3.filtra(\'\')">' + L('Tutti', 'All') + ' <em>' + QN.lista.length + '</em></button>';
      ord.forEach(function (k) { chips += '<button class="' + (fil === k ? 'on' : '') + '" onclick="TV3.filtra(\'' + k + '\')">' + esc(k === 'grun' ? 'Gambler Run' : giocoNome(k)) + ' <em>' + cnt[k] + '</em></button>'; });
      chips += '</div>';
    }
    var G = { pronte: [], corso: [], fatte: [] };
    l.forEach(function (q) { G[gruppoDi(q)].push(q); });
    G.corso.sort(function (a, b) { return ((b.prog | 0) / (b.goal || 1)) - ((a.prog | 0) / (a.goal || 1)); });
    var presto = TVL_SKIN.filter(function (s) { return !questDi(s.id) && posseduti().indexOf(s.id) < 0; });
    var tot = l.length, nf = G.fatte.length, np = G.pronte.length;
    var h = '<div class="tv3n">';
    var vicina = G.corso[0], testa = np ? '<b>' + np + '</b><span>' + (np === 1 ? L('premio da riscuotere', 'reward to claim') : L('premi da riscuotere', 'rewards to claim')) + '</span>'
      : '<b>' + nf + '<small>/' + tot + '</small></b><span>' + L('completate', 'completed') + '</span>';
    h += '<div class="tv3n-sum"><div class="tv3n-num">' + testa + '</div>'
      + (!np && vicina ? '<div class="tv3n-next">' + L('La più vicina: ', 'Closest: ') + '<b>' + esc(frase(nome(vicina))) + '</b> · ' + Math.min(vicina.prog | 0, vicina.goal | 0) + '/' + (vicina.goal | 0) + ' · ' + L('premio ', 'reward ') + esc(premioNome(vicina.premio)) + '</div>' : '')
      + '<div class="tv3n-seg" aria-hidden="true"><i class="f" style="flex:' + nf + '"></i><i class="p" style="flex:' + np + '"></i><i class="c" style="flex:' + G.corso.length + '"></i></div>'
      + '<div class="tv3n-leg"><span class="p">' + np + ' ' + L('pronte', 'ready') + '</span><span class="c">' + G.corso.length + ' ' + L('in corso', 'in progress') + '</span><span class="f">' + nf + '/' + tot + ' ' + L('completate', 'done') + '</span></div>'
      + chips + '<p class="tv3n-reg">' + (dc() ? L('Contano le partite contro persone. Mai contro i bot.', 'Matches against people count. Never bots.') : L('Contano le partite a soldi, di torneo o gratis contro persone. Mai contro i bot.', 'Real-money, tournament or free matches against people count. Never bots.')) + '</p></div>';
    function gruppo(k, tit, arr, chiuso) {
      if (!arr.length) return '';
      var s = '<div class="tv3n-gh g-' + k + '"><span>' + tit + '</span><em>' + arr.length + '</em>'
        + (chiuso != null ? '<button class="tv3-lnk" onclick="TV3.apri(\'' + k + '\')">' + (chiuso ? L('Mostra', 'Show') : L('Nascondi', 'Hide')) + '</button>' : '') + '</div>';
      if (chiuso) return s;
      arr.forEach(function (q) { s += qCard(q, k); });
      return s;
    }
    h += gruppo('pronte', L('Da riscuotere', 'Ready to claim'), G.pronte);
    h += gruppo('corso', L('In corso', 'In progress'), G.corso);
    var chiudiFatte = !TV3.aperte.fatte && (G.pronte.length + G.corso.length) > 0;
    h += gruppo('fatte', L('Completate', 'Completed'), G.fatte, chiudiFatte);
    if (presto.length) {
      var chiudiPresto = presto.length > 4 && !TV3.aperte.presto;
      h += '<div class="tv3n-gh g-presto"><span>' + L('In arrivo', 'Coming soon') + '</span><em>' + presto.length + '</em>'
        + (presto.length > 4 ? '<button class="tv3-lnk" onclick="TV3.apriPresto()">' + (chiudiPresto ? L('Mostra', 'Show') : L('Nascondi', 'Hide')) + '</button>' : '') + '</div>';
      (chiudiPresto ? [] : presto).forEach(function (s) {
        h += '<article class="tv3q st-presto g-presto"><div class="tv3q-art r-' + s.rarity + '"><canvas class="tv3-qa" data-slot="' + s.slot + '" data-idx="' + s.idx + '" data-statico="1"></canvas></div>'
          + '<div class="tv3q-b"><div class="tv3q-meta"><span class="tv3-rar r-' + s.rarity + '">' + rarNome(s.rarity) + '</span><span class="tv3q-tag">' + esc(L(SLOT_NOME[s.slot][0], SLOT_NOME[s.slot][1])) + '</span></div>'
          + '<h4>' + esc(nome(s)) + '</h4><p>' + L('La sua quest arriva presto.', 'Its quest is coming soon.') + '</p></div></article>';
      });
    }
    if (!tot && !presto.length) h += '<div class="tv3-vuoto">' + L('Nessuna quest nuova per ora.', 'No new quests right now.') + '</div>';
    h += '</div>';
    c.innerHTML = h;
    [].forEach.call(c.querySelectorAll('canvas.tv3-qa'), function (cv) { registra(cv, cv.getAttribute('data-slot'), +cv.getAttribute('data-idx'), !cv.getAttribute('data-statico')); });
    [].forEach.call(c.querySelectorAll('canvas.tv3-qs'), function (cv) {
      var q = (typeof qnDi === 'function') ? qnDi(cv.getAttribute('data-q')) : null;
      if (q) anteprimaPremio(cv, q.premio);
    });
    try { qTabPunti(); } catch (e) { }
    if (TV3.dopoRender) { var fn = TV3.dopoRender; TV3.dopoRender = null; setTimeout(fn, 40); }
  }
  function coriandoli(cv, col) {
    var x = cv.getContext('2d'), W = cv.clientWidth, H = cv.clientHeight, k = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * k; cv.height = H * k;
    var P = [], cols = [col, '#ffffff', '#ffd54a', col, '#8b83f0'], n = lite() ? 40 : 90, cx = W / 2, cy = H * .42;
    for (var i = 0; i < n; i++) { var a = Math.random() * Math.PI * 2, v = 160 + Math.random() * 420;
      P.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 220, r: 2 + Math.random() * 4, c: cols[i % cols.length], g: 380 + Math.random() * 300, rot: Math.random() * 6, vr: (Math.random() - .5) * 14, q: Math.random() < .5 }); }
    var t0 = 0, last = 0;
    (function f(now) {
      if (!cv.isConnected) return;
      if (!t0) { t0 = now; last = now; }
      var dt = Math.min(.05, (now - last) / 1000), t = (now - t0) / 1000; last = now;
      x.setTransform(k, 0, 0, k, 0, 0); x.clearRect(0, 0, W, H);
      P.forEach(function (p) { p.vy += p.g * dt; p.vx *= .992; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        x.globalAlpha = clamp(1.6 - t * .6, 0, 1); x.fillStyle = p.c; x.save(); x.translate(p.x, p.y); x.rotate(p.rot);
        if (p.q) x.fillRect(-p.r, -p.r * .55, p.r * 2, p.r * 1.1); else { x.beginPath(); x.arc(0, 0, p.r * .7, 0, 6.2832); x.fill(); } x.restore(); });
      x.globalAlpha = 1;
      if (t < 2.8) requestAnimationFrame(f); else x.clearRect(0, 0, W, H);
    })(performance.now());
  }
  function sblocco(q) {
    try { if (typeof qnCss === 'function') qnCss(); } catch (e) { }
    var pr = q.premio || {}, cent = pr.tipo === 'cent', tv = pr.tipo === 'skin' && pr.mode === 'tavolo';
    var rar = pr.rarity || q.rarity || 'rare', col = RAR_COL[rar] || '#8b83f0';
    var fc0 = $('qnc_' + q.id); if (fc0) { fc0.classList.remove('tv3-flash'); void fc0.offsetWidth; fc0.classList.add('tv3-flash'); }
    var o = document.createElement('div'); o.className = 'tv3-ov r-' + rar; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true');
    o.style.setProperty('--rc', col);
    var dv = tv ? '<div class="tv3-ov-dove">' + L('Si vede in', 'Shows in') + ' ' + DOVE[pr.slot].giochi.map(function (g) { return '<b>' + esc(L(g[1], g[2])) + '</b>'; }).join(' · ') + '</div>' : '';
    o.innerHTML = '<div class="tv3-ov-raggi"></div><canvas class="tv3-ov-fx"></canvas>'
      + '<div class="tv3-ov-box">'
      + '<div class="tv3-ov-k">' + L('Quest completata', 'Quest complete') + ' · ' + esc(frase(nome(q))) + '</div>'
      + '<div class="tv3-ov-tit">' + (cent ? L('Premio!', 'Reward!') : L('Sbloccata!', 'Unlocked!')) + '</div>'
      + '<div class="tv3-ov-art">' + (tv ? '<canvas class="tv3-oa" data-slot="' + pr.slot + '" data-idx="' + (pr.idx | 0) + '"></canvas>' : '<canvas class="tv3-os" width="440" height="440"></canvas>') + '</div>'
      + (cent ? '' : '<span class="tv3-rar r-' + rar + '">' + rarNome(rar) + '</span>')
      + '<div class="tv3-ov-nm">' + (cent ? '<span class="tv3-ov-cifra" data-c="' + (pr.cent | 0) + '">' + esc(premioNome({ tipo: 'cent', cent: 0 })) + '</span>' : esc(premioNome(pr))) + '</div>'
      + '<div class="tv3-ov-ds">' + esc(cent ? L('Accreditati sul tuo saldo.', 'Added to your balance.') : desc(pr)) + '</div>' + dv
      + '<div class="tv3-ov-btns">' + (cent || pr.tipo === 'titolo' ? '' : '<button class="tv3-btn pri" data-a="eq">' + L('Equipaggia ora', 'Equip now') + '</button>')
      + '<button class="tv3-btn sec" data-a="x">' + (cent ? L('Fantastico', 'Great') : L('Chiudi', 'Close')) + '</button></div></div>';
    document.body.appendChild(o);
    if (tv) registra(o.querySelector('canvas.tv3-oa'), pr.slot, pr.idx | 0, true);
    else anteprimaPremio(o.querySelector('canvas.tv3-os'), pr);
    if (!RIDOTTO) setTimeout(function () { try { coriandoli(o.querySelector('.tv3-ov-fx'), col); } catch (e) { } }, 180);
    if (cent) {
      var el = o.querySelector('.tv3-ov-cifra'), fin = pr.cent | 0, t0 = 0;
      if (RIDOTTO) el.textContent = premioNome(pr);
      else (function f(now) { if (!el.isConnected) return; if (!t0) t0 = now; var u = eoc((now - t0) / 900); el.textContent = premioNome({ tipo: 'cent', cent: Math.round(fin * u) }); if (u < 1) requestAnimationFrame(f); })(performance.now());
    }
    try { TWS.play('gold', 0.9); } catch (e) { }
    try { if (window.Telegram && Telegram.WebApp && Telegram.WebApp.HapticFeedback) Telegram.WebApp.HapticFeedback.notificationOccurred('success'); } catch (e) { }
    var chiudi = function () { o.classList.add('via'); setTimeout(function () { try { o.remove(); } catch (e) { } }, 260); };
    o.addEventListener('click', function (ev) {
      var b = ev.target && ev.target.closest && ev.target.closest('[data-a]'), a = b && b.getAttribute('data-a');
      if (a === 'eq') { qnEquip(q.id); chiudi(); }
      else if (a === 'x' || ev.target === o || (ev.target && ev.target.classList && ev.target.classList.contains('tv3-ov-fx'))) chiudi();
    });
  }
  var CSS = ''
    + '#cos-cards .tv3{display:flex;flex-direction:column;gap:22px;min-width:0;width:100%;max-width:1080px;margin:0 auto}'
    + '#challenges .tv3-intro{margin:0 4px;font:400 13px/1.4 var(--x-body,system-ui);color:#8e8e93}'
    + '#challenges .tv3-slot{display:flex;flex-direction:column;gap:12px;padding:14px;border-radius:24px;background:var(--x-vetro,rgba(255,255,255,.05));border:var(--x-vetro-filo,.5px solid rgba(255,255,255,.13));box-shadow:var(--x-vetro-ombra,none);min-width:0}'
    + '#challenges .tv3-sh{display:flex;align-items:center;gap:10px;margin:0 2px}'
    + '#challenges .tv3-sh .ic svg,#challenges .tv3 svg.ic,#challenges .tv3n svg.ic{width:18px;height:18px;fill:none;stroke:#8b83f0;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;flex:none}'
    + '#challenges .tv3-sh h3{flex:1;margin:0;font:600 17px/1.2 var(--x-disp,system-ui);letter-spacing:-.01em;color:#fff}'
    + '#challenges .tv3-cnt{font:400 12.5px var(--x-body,system-ui);color:#8e8e93;font-variant-numeric:tabular-nums}'
    + '#challenges .tv3-stage{position:relative;aspect-ratio:16/10;border-radius:18px;overflow:hidden;cursor:pointer;background:#0b0b0e;box-shadow:inset 0 0 0 .5px rgba(255,255,255,.1);-webkit-tap-highlight-color:transparent;outline:none;isolation:isolate}'
    + '#challenges .tv3-stage::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rc,#8b83f0) 45%,transparent),inset 0 -40px 60px -30px color-mix(in srgb,var(--rc,#8b83f0) 30%,transparent);z-index:3}'
    + '#challenges .tv3-stage:focus-visible{box-shadow:0 0 0 2px #8b83f0}'
    + '#challenges .tv3-stage canvas.tv3-cv{position:absolute;inset:0;width:100%;height:100%;display:block}'
    + '#challenges .tv3-stage iframe.tv3-3d{position:absolute;inset:0;width:100%;height:100%;border:0;display:block;pointer-events:none;opacity:0;transition:opacity .45s;z-index:1;background:transparent}'
    + '#challenges .tv3-stage.tv3-3d-on iframe.tv3-3d{opacity:1}'
    + '#challenges .tv3-stage.st-quest canvas,#challenges .tv3-stage.st-presto canvas{filter:saturate(.8) brightness(.9)}'
    + '#challenges .tv3-sr,#challenges .tv3-rar{display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 9px;border-radius:11px;font:500 11.5px var(--x-body,system-ui);color:#fff;background:rgba(0,0,0,.55);white-space:nowrap}'
    + '#challenges .tv3-sr::before,#challenges .tv3-rar::before,.tv3-ov .tv3-rar::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--rc,#aeaeb2)}'
    + '#challenges .tv3-sr{position:absolute;left:9px;bottom:9px;z-index:4}'
    + '.r-common{--rc:#aeaeb2}.r-rare{--rc:#5a96ff}.r-epic{--rc:#a59df7}.r-legend{--rc:#f5b14c}'
    + '#challenges .tv3-bd,.tv3-ov .tv3-bd{position:absolute;right:9px;top:9px;z-index:4;display:inline-flex;align-items:center;gap:4px;height:24px;padding:0 9px;border-radius:12px;font:600 12px var(--x-body,system-ui);font-variant-numeric:tabular-nums}'
    + '#challenges .tv3-bd svg,#challenges .tv3-btn svg,#challenges .tv3-os svg,#challenges .tv3-hint svg,#challenges .tv3-lnk svg,#challenges .tv3q-ok svg,.tv3-ov .tv3-btn svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round;flex:none}'
    + '#challenges .tv3-bd.eq{background:#8b83f0;color:#fff}#challenges .tv3-bd.mio{background:rgba(255,255,255,.22);color:#fff}'
    + '#challenges .tv3-bd.pronta{background:#fff;color:#000}#challenges .tv3-bd.chiuso{background:rgba(0,0,0,.6);color:#d1d1d6}'
    + '#challenges .tv3-hint{position:absolute;right:9px;bottom:9px;z-index:4;display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 8px;border-radius:11px;background:rgba(0,0,0,.45);font:500 11px var(--x-body,system-ui);color:rgba(255,255,255,.8);pointer-events:none}'
    + '#challenges .tv3-pick{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}'
    + '#challenges .tv3-pick.molti{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding-bottom:2px}#challenges .tv3-pick.molti::-webkit-scrollbar{display:none}'
    + '#challenges .tv3-pick.molti .tv3-op{flex:0 0 calc((100% - 16px) / 3.3);scroll-snap-align:start}'
    + '#challenges .tv3-op{all:unset;box-sizing:border-box;display:flex;flex-direction:column;gap:5px;min-width:0;padding:5px 5px 8px;border-radius:15px;cursor:pointer;background:rgba(255,255,255,.04);box-shadow:inset 0 0 0 .5px rgba(255,255,255,.1);transition:box-shadow .2s,background .2s,scale .15s;-webkit-tap-highlight-color:transparent}'
    + '#challenges .tv3-op:active{scale:.96}'
    + '#challenges .tv3-op.on{background:rgba(255,255,255,.09);box-shadow:inset 0 0 0 1.5px #fff}'
    + '#challenges .tv3-op:focus-visible{box-shadow:inset 0 0 0 2px #8b83f0}'
    + '#challenges .tv3-op canvas{width:100%;aspect-ratio:4/3;border-radius:11px;display:block;background:#111}'
    + '#challenges .tv3-op.st-quest canvas,#challenges .tv3-op.st-presto canvas{filter:saturate(.7) brightness(.8)}'
    + '#challenges .tv3-on{font:600 12.5px/1.2 var(--x-body,system-ui);color:#fff;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;min-height:2.4em;padding:0 3px;overflow-wrap:anywhere}'
    + '#challenges .tv3-os{display:inline-flex;align-items:center;gap:3px;font:500 11.5px var(--x-body,system-ui);color:#8e8e93;padding:0 3px;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden}'
    + '#challenges .tv3-op.st-eq .tv3-os{color:#b9b3ff}#challenges .tv3-op.st-pronta .tv3-os{color:#fff}#challenges .tv3-op.st-mio .tv3-os{color:#d1d1d6}'
    + '#challenges .tv3-op .tv3-os svg{width:12px;height:12px}'
    + '#challenges .tv3-info{display:flex;flex-direction:column;gap:8px;padding:2px 2px 0}'
    + '#challenges .tv3-nm{display:flex;align-items:center;gap:8px;flex-wrap:wrap}'
    + '#challenges .tv3-nm b{font:600 20px/1.2 var(--x-disp,system-ui);letter-spacing:-.015em;color:#fff}'
    + '#challenges .tv3-ds{margin:0;font:400 13.5px/1.4 var(--x-body,system-ui);color:#a1a1a6}'
    + '#challenges .tv3-qb{display:flex;flex-direction:column;gap:6px;padding:11px 12px;border-radius:14px;background:rgba(255,255,255,.05)}'
    + '#challenges .tv3-qt{display:flex;align-items:flex-start;gap:7px;font:400 13px/1.35 var(--x-body,system-ui);color:#d1d1d6}#challenges .tv3-qt b{color:#fff;font-weight:600}'
    + '#challenges .tv3-qd{font:400 12.5px/1.35 var(--x-body,system-ui);color:#8e8e93}'
    + '#challenges .tv3-bar{position:relative;height:8px;border-radius:4px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:2px}'
    + '#challenges .tv3-bar i{position:absolute;inset:0;border-radius:4px;transform-origin:0 50%;transform:scaleX(var(--k,0));background:linear-gradient(90deg,#8b83f0,color-mix(in srgb,var(--rc,#8b83f0) 70%,#fff));animation:tv3Bar .9s cubic-bezier(.2,.8,.2,1) both}'
    + '@keyframes tv3Bar{from{transform:scaleX(0)}}'
    + '#challenges .tv3-qp{display:flex;justify-content:space-between;gap:8px;font:400 12.5px var(--x-body,system-ui);color:#8e8e93;font-variant-numeric:tabular-nums}#challenges .tv3-qp b{color:#fff;font-weight:600}#challenges .tv3-qp b.ok{color:#b9b3ff}'
    + '#challenges .tv3-btns{display:flex;gap:8px;margin-top:2px}'
    + '#challenges .tv3-btn,.tv3-ov .tv3-btn{all:unset;box-sizing:border-box;flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:44px;padding:0 14px;border-radius:22px;cursor:pointer;font:600 15px var(--x-body,system-ui);letter-spacing:-.01em;white-space:nowrap;transition:scale .15s,opacity .2s;-webkit-tap-highlight-color:transparent}'
    + '#challenges .tv3-btn:not(:disabled):active,.tv3-ov .tv3-btn:active{scale:.96}'
    + '#challenges .tv3-btn:focus-visible,.tv3-ov .tv3-btn:focus-visible{outline:2px solid #8b83f0;outline-offset:2px}'
    + '#challenges .tv3-btn.pri,.tv3-ov .tv3-btn.pri{background:#fff;color:#000}'
    + '#challenges .tv3-btn.sec,.tv3-ov .tv3-btn.sec{background:rgba(255,255,255,.12);color:#fff}'
    + '#challenges .tv3-btn.eq{background:transparent;color:#b9b3ff;box-shadow:inset 0 0 0 1px rgba(139,131,240,.6);cursor:default}'
    + '#challenges .tv3-btn:disabled{cursor:default}#challenges .tv3-btn.sec:disabled{color:#8e8e93}'
    + '#challenges .tv3-btn.glow{box-shadow:0 0 0 0 rgba(255,255,255,.5);animation:tv3Pulsa 2.2s ease-out infinite}'
    + '@keyframes tv3Pulsa{0%{box-shadow:0 0 0 0 rgba(255,255,255,.45)}70%,100%{box-shadow:0 0 0 12px rgba(255,255,255,0)}}'
    + '#challenges .tv3-dove{display:flex;flex-direction:column;gap:8px;padding-top:12px;border-top:.5px solid rgba(255,255,255,.1)}'
    + '#challenges .tv3-dt{display:flex;align-items:center;gap:6px;font:600 13px var(--x-body,system-ui);color:#fff}'
    + '#challenges .tv3-dg{display:flex;flex-wrap:wrap;gap:8px}'
    + '#challenges .tv3-gc{display:inline-flex;align-items:center;gap:8px;padding:4px 12px 4px 4px;border-radius:14px;background:rgba(255,255,255,.07);font:500 13px var(--x-body,system-ui);color:#fff}'
    + '#challenges .tv3-gc img{width:30px;height:30px;border-radius:10px;object-fit:cover;background:#1c1c1e;display:block}#challenges .tv3-gc b{font-weight:500}'
    + '#challenges .tv3-dove p{margin:0;font:400 12.5px/1.4 var(--x-body,system-ui);color:#8e8e93}'
    + '#challenges .tv3-lnk{all:unset;display:inline-flex;align-items:center;gap:2px;cursor:pointer;font:500 12.5px var(--x-body,system-ui);color:#b9b3ff;margin-left:auto}'
    + '#challenges .tv3-lnk svg{width:12px;height:12px}'
    + '#qn-list.tv3-nl{gap:0!important}'
    + '#challenges .tv3n{display:flex;flex-direction:column;gap:10px;min-width:0;width:100%;max-width:760px;margin:0 auto}'
    + '#challenges .tv3n-sum{padding:16px;border-radius:22px;background:var(--x-vetro,rgba(255,255,255,.05));border:var(--x-vetro-filo,.5px solid rgba(255,255,255,.13));box-shadow:var(--x-vetro-ombra,none);display:flex;flex-direction:column;gap:10px}'
    + '#challenges .tv3n-num{display:flex;align-items:baseline;gap:8px}#challenges .tv3n-num b{font:700 34px/1 var(--x-disp,system-ui);color:#fff;letter-spacing:-.02em;font-variant-numeric:tabular-nums}#challenges .tv3n-num span{font:500 15px var(--x-body,system-ui);color:#d1d1d6}'
    + '#challenges .tv3n-num small{font-size:20px;color:#8e8e93;font-weight:600}#challenges .tv3n-next{font:400 13px/1.4 var(--x-body,system-ui);color:#a1a1a6}#challenges .tv3n-next b{color:#fff;font-weight:600}'
    + '#challenges .tv3n-seg{display:flex;gap:3px;height:8px;border-radius:4px;overflow:hidden;background:rgba(255,255,255,.08)}#challenges .tv3n-seg i{min-width:0;border-radius:2px}'
    + '#challenges .tv3n-seg .f{background:#8b83f0}#challenges .tv3n-seg .p{background:#fff}#challenges .tv3n-seg .c{background:rgba(255,255,255,.18)}'
    + '#challenges .tv3n-leg{display:flex;flex-wrap:wrap;gap:6px 14px;font:400 12.5px var(--x-body,system-ui);color:#8e8e93;font-variant-numeric:tabular-nums}'
    + '#challenges .tv3n-leg span{display:inline-flex;align-items:center;gap:5px}#challenges .tv3n-leg span::before{content:"";width:8px;height:8px;border-radius:2px}'
    + '#challenges .tv3n-leg .p::before{background:#fff}#challenges .tv3n-leg .c::before{background:rgba(255,255,255,.25)}#challenges .tv3n-leg .f::before{background:#8b83f0}'
    + '#challenges .tv3n-fil{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:2px -2px 0;padding:2px}#challenges .tv3n-fil::-webkit-scrollbar{display:none}'
    + '#challenges .tv3n-fil button{all:unset;flex:none;cursor:pointer;height:30px;padding:0 12px;border-radius:15px;background:rgba(255,255,255,.08);font:500 13px var(--x-body,system-ui);color:#d1d1d6;white-space:nowrap}'
    + '#challenges .tv3n-fil button.on{background:#fff;color:#000}#challenges .tv3n-fil em{font-style:normal;opacity:.6;font-variant-numeric:tabular-nums}'
    + '#challenges .tv3n-reg{margin:0;font:400 12px/1.4 var(--x-body,system-ui);color:#636366}'
    + '#challenges .tv3n-gh{display:flex;align-items:center;gap:8px;margin:12px 4px 2px;font:600 17px var(--x-disp,system-ui);color:#fff;letter-spacing:-.01em}'
    + '#challenges .tv3n-gh em{font:500 13px var(--x-body,system-ui);font-style:normal;color:#8e8e93;font-variant-numeric:tabular-nums}'
    + '#challenges .tv3q{display:grid;grid-template-columns:96px minmax(0,1fr);grid-template-areas:"art b" "cta cta";gap:12px 14px;padding:14px;border-radius:22px;background:var(--x-vetro,rgba(255,255,255,.05));border:var(--x-vetro-filo,.5px solid rgba(255,255,255,.13));box-shadow:var(--x-vetro-ombra,none);min-width:0}'
    + '#challenges .tv3q.g-pronte{border-color:rgba(255,255,255,.55)!important;box-shadow:0 0 0 .5px rgba(255,255,255,.4),0 8px 30px -10px rgba(139,131,240,.55),var(--x-vetro-ombra,none)}'
    + '#challenges .tv3q.g-fatte{opacity:.82}#challenges .tv3q.st-presto{opacity:.7}'
    + '#challenges .tv3q-art{grid-area:art;position:relative;width:96px;height:96px;border-radius:16px;overflow:hidden;background:radial-gradient(120% 90% at 50% 38%,#2a2a32 0%,#141418 58%,#0b0b0e 100%);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rc,#8b83f0) 40%,transparent)}'
    + '#challenges .tv3q-art canvas{position:absolute;inset:0;width:100%;height:100%;display:block}'
    + '#challenges .tv3q-art .tv3-bd{right:5px;top:5px;height:20px;padding:0 6px;font-size:10.5px}'
    + '#challenges .tv3q-b{grid-area:b;min-width:0;display:flex;flex-direction:column;gap:5px}'
    + '#challenges .tv3q-meta{display:flex;flex-wrap:wrap;gap:5px}#challenges .tv3q-meta .tv3-rar{background:rgba(255,255,255,.08);height:20px;font-size:11px;padding:0 8px}'
    + '#challenges .tv3q-tag{display:inline-flex;align-items:center;height:20px;padding:0 8px;border-radius:10px;background:rgba(255,255,255,.06);font:500 11px var(--x-body,system-ui);color:#a1a1a6;white-space:nowrap}'
    + '#challenges .tv3q-tag.soldi{background:rgba(57,255,20,.1);color:#7ee787}'
    + '#challenges .tv3q h4{margin:2px 0 0;font:600 17px/1.2 var(--x-disp,system-ui);letter-spacing:-.01em;color:#fff}'
    + '#challenges .tv3q p{margin:0;font:400 13px/1.35 var(--x-body,system-ui);color:#a1a1a6}'
    + '#challenges .tv3q-pr{display:flex;align-items:center;flex-wrap:wrap;gap:4px;font:400 12.5px var(--x-body,system-ui);color:#8e8e93}#challenges .tv3q-pr b{color:#fff;font-weight:600}'
    + '#challenges .tv3q .tv3-bar{margin-top:4px}'
    + '#challenges .tv3q-cta{grid-area:cta;display:flex;gap:8px}#challenges .tv3q-cta:empty{display:none}'
    + '#challenges .tv3q-ok{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:36px;font:500 14px var(--x-body,system-ui);color:#8e8e93}'
    + '#challenges .tv3q.g-corso .tv3q-cta .tv3-btn{min-height:38px;font-size:14px}'
    + '#challenges .tv3-flash{animation:tv3Flash 1.4s ease-out}'
    + '@keyframes tv3Flash{0%,30%{box-shadow:0 0 0 2px #fff,0 0 40px rgba(139,131,240,.7)}100%{box-shadow:0 0 0 0 rgba(255,255,255,0)}}'
    + '#challenges .tv3-vuoto{display:flex;flex-direction:column;align-items:center;gap:12px;padding:30px 16px;text-align:center;font:500 14px var(--x-body,system-ui);color:#8e8e93}'
    + '#challenges .tv3-vuoto .tv3-btn{flex:none;min-width:150px}'
    + '.tv3-ov{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.78);animation:tv3In .25s ease-out;overflow:hidden;font-family:var(--x-body,system-ui)}'
    + '.tv3-ov.via{animation:tv3Out .25s ease-in forwards}'
    + '.tv3-ov-raggi{position:absolute;left:50%;top:42%;width:760px;height:760px;margin:-380px 0 0 -380px;border-radius:50%;pointer-events:none;background:repeating-conic-gradient(color-mix(in srgb,var(--rc) 22%,transparent) 0 9deg,transparent 9deg 18deg);animation:tv3Gira 14s linear infinite;-webkit-mask:radial-gradient(circle,#000 14%,transparent 64%);mask:radial-gradient(circle,#000 14%,transparent 64%)}'
    + '.tv3-ov-fx{position:absolute;inset:0;width:100%;height:100%;z-index:2}'
    + '.tv3-ov-box{position:relative;z-index:1;width:min(360px,100%);max-height:100%;overflow:auto;display:flex;flex-direction:column;align-items:center;gap:8px;padding:20px 18px 18px;border-radius:28px;text-align:center;background:linear-gradient(165deg,#2a2a30,#161619);box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 0 0 .5px rgba(255,255,255,.14),0 30px 80px -20px color-mix(in srgb,var(--rc) 55%,transparent);animation:tv3Pop .6s cubic-bezier(.2,1.4,.4,1) both}'
    + '.tv3-ov-k{font:500 12.5px var(--x-body,system-ui);color:#8e8e93}'
    + '.tv3-ov-tit{font:700 30px/1.1 var(--x-disp,system-ui);letter-spacing:-.02em;color:#fff;animation:tv3Slam .55s .1s cubic-bezier(.2,1.6,.4,1) both}'
    + '.tv3-ov-art{position:relative;width:100%;aspect-ratio:16/11;border-radius:20px;overflow:hidden;margin:4px 0 2px;background:#0b0b0e;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rc) 50%,transparent),0 0 40px -6px color-mix(in srgb,var(--rc) 50%,transparent);animation:tv3Rivela .7s .15s cubic-bezier(.2,1.3,.4,1) both}'
    + '.tv3-ov-art canvas{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:contain}'
    + '.tv3-ov .tv3-rar{display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 9px;border-radius:11px;font:500 11.5px var(--x-body,system-ui);color:#fff;background:rgba(255,255,255,.1)}'
    + '.tv3-ov-nm{font:700 22px/1.2 var(--x-disp,system-ui);color:#fff;letter-spacing:-.015em;font-variant-numeric:tabular-nums}'
    + '.tv3-ov-ds{font:400 13.5px/1.4 var(--x-body,system-ui);color:#a1a1a6;margin:0 4px}'
    + '.tv3-ov-dove{font:400 12.5px var(--x-body,system-ui);color:#8e8e93}.tv3-ov-dove b{color:#fff;font-weight:500}'
    + '.tv3-ov-btns{display:flex;flex-direction:column;gap:8px;width:100%;margin-top:6px}'
    + '@keyframes tv3In{from{opacity:0}to{opacity:1}}@keyframes tv3Out{to{opacity:0}}@keyframes tv3Gira{to{transform:rotate(360deg)}}'
    + '@keyframes tv3Pop{0%{transform:scale(.7);opacity:0}100%{transform:scale(1);opacity:1}}'
    + '@keyframes tv3Slam{0%{transform:scale(1.9);opacity:0}100%{transform:scale(1);opacity:1}}'
    + '@keyframes tv3Rivela{0%{transform:scale(.4) rotate(-6deg);opacity:0;filter:brightness(3)}60%{filter:brightness(1.4)}100%{transform:none;opacity:1;filter:none}}'
    + '@media (min-width:700px){#challenges .tv3-slot{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);grid-template-areas:"sh sh" "st info" "pk info" "dv dv";gap:12px 18px;align-items:start}'
    + '#challenges .tv3-sh{grid-area:sh}#challenges .tv3-stage{grid-area:st}#challenges .tv3-pick{grid-area:pk}#challenges .tv3-info{grid-area:info}#challenges .tv3-dove{grid-area:dv}}'
    + '@media (max-height:500px){.tv3-ov-box{width:min(620px,100%);display:grid;grid-template-columns:1fr 1fr;align-items:center;justify-items:start;column-gap:16px;text-align:left;overflow-x:hidden}.tv3-ov-btns{justify-self:stretch}'
    + '.tv3-ov-art{grid-row:1/span 7;grid-column:1}.tv3-ov-box>:not(.tv3-ov-art){grid-column:2}.tv3-ov-btns{flex-direction:row}}'
    + '@media (prefers-reduced-motion:reduce){#challenges .tv3-btn.glow,.tv3-ov-raggi,.tv3-ov-box,.tv3-ov-tit,.tv3-ov-art,#challenges .tv3-bar i,#challenges .tv3-flash{animation:none!important}}';
  function css() { if ($('tv3-css')) return; var s = document.createElement('style'); s.id = 'tv3-css'; s.textContent = CSS; document.head.appendChild(s); }
  TV3._int = { SCENE: SCENE, SLOT: SLOT, SLOT_NOME: SLOT_NOME, DI_SERIE: DI_SERIE, DOVE: DOVE, SLOT_IC: SLOT_IC, L: L, esc: esc, frase: frase, tondo: tondo, clamp: clamp,
    eoc: eoc, eio: eio, rnd: rnd, cache: cache, questDi: questDi, DSTY: DSTY, PALL: PALL, registra: registra };
  css();
  if (!window.TV3_STECCHE_OFF) {
    SLOT.push('st');
    try { TVL_DEF.st = 0; TVL_MAX.st = STECCHE.length - 1; } catch (e) { }
    try { if (typeof TVL_SLOT !== 'undefined') TVL_SLOT.st = ['STECCA DA BILIARDO', 'POOL CUE']; if (typeof TVL_SLOT_ICO !== 'undefined') TVL_SLOT_ICO.st = 'bersaglio'; } catch (e) { }
    STECCHE.forEach(function (s) { if (s.idx && !TVL_SKIN.some(function (x) { return x.id === s.id; })) TVL_SKIN.push({ id: s.id, slot: 'st', idx: s.idx, rarity: s.rarity, name: s.name, name_en: s.name_en, desc: s.desc, desc_en: s.desc_en }); });
    agganciaPool();
  }
  window.tvlCards = function (host) { try { css(); tavolo(host); } catch (e) { warn('tavolo', e); try { TV3.orig.tvlCards(host); } catch (_) { } } };
  window.qnRender = function () { try { css(); nuove(); } catch (e) { warn('nuove', e); try { TV3.orig.qnRender(); } catch (_) { } } };
  window.qnSblocco = function (q) { try { css(); sblocco(q); } catch (e) { warn('sblocco', e); try { TV3.orig.qnSblocco(q); } catch (_) { } } };
  function lascia(nuovaTab) { if (nuovaTab !== 'cosmetics' || window._COS_MODE !== 'tavolo') ferma3d(); }
  var _sw = window.chSwitchTab;
  if (typeof _sw === 'function') window.chSwitchTab = function (t) { lascia(t); TV3.firma = ''; return _sw.apply(this, arguments); };
  var _cm = window.cosSwitchMode;
  if (typeof _cm === 'function') window.cosSwitchMode = function (m) { if (m !== 'tavolo') ferma3d(); TV3.firma = ''; return _cm.apply(this, arguments); };
  document.addEventListener('gbx:screen', function (e) { if (!e.detail || e.detail.id !== 'challenges') ferma3d(); else kick(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
})();
