/* =====================================================================
   GBR — CAST CONDIVISO del Gambler Bot (roster_1410)
   24 personaggi vettoriali disegnati in codice, per l'arena (tipo Brawl)
   e per il picchiaduro a piattaforme (tipo Smash).
   Script classico, nessuna dipendenza. Espone window.GBR.

   Come funziona (in breve):
   - ogni personaggio è fatto di PEZZI (testa x 6 espressioni, busto,
     braccia, mani, gambe, arma, oggetto della mano dietro, pezzo dietro
     la schiena) disegnati in vettoriale in unità "da 100" (altezza 100);
   - i pezzi si CUOCIONO una volta (atlante per personaggio) col contorno
     esterno spesso fatto per dilatazione: a runtime draw() compone ~14
     drawImage con rotazioni -> animazione continua, mira a 360° libera,
     nessun fotogramma da precuocere per posa;
   - draw() cuoce da solo (pigro) il personaggio la prima volta che serve;
     prebake(h,dpr) lo fa prima per tutti (o per una lista di id).
   ===================================================================== */
(function (W) {
'use strict';

var OUT = '#1d1530';          // inchiostro dei contorni
var LW = 2.1;                 // linea interna (unità)
var OLW = 1.9;                // contorno esterno in più (unità), per dilatazione
var TAU = Math.PI * 2, PI = Math.PI;
var KPX = 1;                   // px per unità durante la cottura (per shadowBlur)

/* ---------------- colori ---------------- */
var _cc = {};
function rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; var n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function toHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0;
  if (mx !== mn) { var d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = (g - b) / d + (g < b ? 6 : 0); else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; }
  return [h, s, l];
}
function hsl(h, s, l) { return 'hsl(' + (((h % 360) + 360) % 360).toFixed(1) + ',' + (Math.max(0, Math.min(1, s)) * 100).toFixed(1) + '%,' + (Math.max(0, Math.min(1, l)) * 100).toFixed(1) + '%)'; }
function SHc(c) { // ombra netta: più scura, un filo più satura, tinta verso il blu-viola
  var k = 's' + c; if (_cc[k]) return _cc[k];
  if (c[0] !== '#') return (_cc[k] = c);
  var x = rgb(c), q = toHsl(x[0], x[1], x[2]), dh = ((250 - q[0] + 540) % 360) - 180;
  return (_cc[k] = hsl(q[0] + dh * 0.05, Math.min(q[1], 0.85) * 0.92 + 0.02, q[2] * (q[2] > 0.75 ? 0.82 : 0.76)));
}
function LTc(c) {
  var k = 'l' + c; if (_cc[k]) return _cc[k];
  if (c[0] !== '#') return (_cc[k] = c);
  var x = rgb(c), q = toHsl(x[0], x[1], x[2]);
  return (_cc[k] = hsl(q[0], q[1] * 0.92, q[2] + (1 - q[2]) * 0.5));
}
function DKc(c, f) { var x = rgb(c), q = toHsl(x[0], x[1], x[2]); return hsl(q[0], q[1], q[2] * f); }

/* ---------------- forme ---------------- */
var _pc = {};
function P(d) { return _pc[d] || (_pc[d] = new Path2D(d)); }
function bbOf(d) {
  var k = '#' + d; if (_pc[k]) return _pc[k];
  var n = d.match(/-?\d*\.?\d+/g).map(Number), x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (var i = 0; i + 1 < n.length; i += 2) { if (n[i] < x0) x0 = n[i]; if (n[i] > x1) x1 = n[i]; if (n[i + 1] < y0) y0 = n[i + 1]; if (n[i + 1] > y1) y1 = n[i + 1]; }
  return (_pc[k] = [x0, y0, x1 - x0, y1 - y0]);
}
// riempimento "cel": ombra netta in basso a sinistra (luce dall'alto davanti) + riflesso
function fs(g, p, col, bb, o) {
  o = o || 0;
  var rule = o.eo ? 'evenodd' : 'nonzero';
  if (o.flat) { g.fillStyle = col; g.fill(p, rule); }
  else {
    g.fillStyle = SHc(col); g.fill(p, rule);
    var d = o.d != null ? o.d : Math.max(1.3, Math.min(bb[2], bb[3]) * 0.12);
    g.save(); g.clip(p, rule); g.translate(d * 0.55, -d); g.fillStyle = col; g.fill(p, rule); g.restore();
    if (o.hl !== false && bb[2] > 7 && bb[3] > 7) {
      g.save(); g.clip(p, rule); g.fillStyle = LTc(col); g.beginPath();
      g.ellipse(bb[0] + bb[2] * 0.67, bb[1] + bb[3] * 0.23, Math.max(1.2, bb[2] * 0.15), Math.max(0.9, bb[3] * 0.085), -0.5, 0, TAU);
      g.fill(); g.restore();
    }
  }
  if (o.lw !== 0) { g.lineWidth = o.lw || LW; g.strokeStyle = OUT; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(p); }
}
function S(g, d, col, o) { fs(g, P(d), col, bbOf(d), o); }
function E(g, cx, cy, rx, ry, col, o) { var p = new Path2D(); p.ellipse(cx, cy, rx, ry, (o && o.rot) || 0, 0, TAU); fs(g, p, col, [cx - rx, cy - ry, 2 * rx, 2 * ry], o); }
function rrp(x, y, w, h, r) {
  var p = new Path2D(); if (typeof r === 'number') r = [r, r, r, r];
  var m = Math.min(w, h) / 2, a = Math.min(r[0], m), b = Math.min(r[1], m), c = Math.min(r[2], m), e = Math.min(r[3], m);
  p.moveTo(x + a, y); p.arcTo(x + w, y, x + w, y + h, b); p.arcTo(x + w, y + h, x, y + h, c); p.arcTo(x, y + h, x, y, e); p.arcTo(x, y, x + w, y, a); p.closePath(); return p;
}
function R(g, x, y, w, h, r, col, o) { fs(g, rrp(x, y, w, h, r), col, [x, y, w, h], o); }
function capP(x1, y1, x2, y2, r) {
  var a = Math.atan2(y2 - y1, x2 - x1), p = new Path2D();
  p.arc(x2, y2, r, a - PI / 2, a + PI / 2); p.arc(x1, y1, r, a + PI / 2, a + PI * 1.5); p.closePath(); return p;
}
function C(g, x1, y1, x2, y2, r, col, o) { fs(g, capP(x1, y1, x2, y2, r), col, [Math.min(x1, x2) - r, Math.min(y1, y2) - r, Math.abs(x2 - x1) + 2 * r, Math.abs(y2 - y1) + 2 * r], o); }
function L(g, d, lw, col) { g.lineWidth = lw; g.strokeStyle = col || OUT; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(P(d)); }
function F(g, d, col) { g.fillStyle = col; g.fill(P(d)); }
function dot(g, x, y, r, col) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
function ring(g, x, y, r, lw, col) { g.lineWidth = lw; g.strokeStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); }
function T(g, s, x, y, size, col, rot) {
  g.save(); g.translate(x, y); if (rot) g.rotate(rot);
  g.font = '900 ' + size + 'px "Arial Black", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = size * 0.22; g.strokeStyle = OUT; g.lineJoin = 'round'; g.strokeText(s, 0, 0); g.fillStyle = col; g.fillText(s, 0, 0); g.restore();
}
// cerchio a punte (criniere, pellicce, ciuffi)
function spkP(cx, cy, rx, ry, n, dep, ph, sharp) {
  var p = new Path2D(), st = PI / n;
  for (var i = 0; i < n; i++) {
    var a0 = ph + i * 2 * st, a1 = a0 + st, a2 = a0 + 2 * st;
    var ix = cx + Math.cos(a0) * rx, iy = cy + Math.sin(a0) * ry;
    var tx = cx + Math.cos(a1) * (rx + dep), ty = cy + Math.sin(a1) * (ry + dep);
    var jx = cx + Math.cos(a2) * rx, jy = cy + Math.sin(a2) * ry;
    if (i === 0) p.moveTo(ix, iy);
    if (sharp) { p.lineTo(tx, ty); p.lineTo(jx, jy); }
    else p.quadraticCurveTo(tx, ty, jx, jy);
  }
  p.closePath(); return p;
}
function SPK(g, cx, cy, rx, ry, n, dep, ph, col, o) { fs(g, spkP(cx, cy, rx, ry, n, dep, ph, o && o.sharp), col, [cx - rx - dep, cy - ry - dep, 2 * (rx + dep), 2 * (ry + dep)], o); }
function poly(pts) { var p = new Path2D(); p.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) p.lineTo(pts[i], pts[i + 1]); p.closePath(); return p; }

/* ---------------- facce ---------------- */
// occhi: cx,cy centro fra i due occhi (vista 3/4: l'occhio a destra è più stretto)
function eyes(g, cx, cy, e, o) {
  o = o || 0;
  var s = o.s || 1, sp = (o.sp || 6.2) * s, w = (o.w || 3.5) * s, h = (o.h || 4.7) * s, iris = o.iris || '#4a3020', bc = o.brow || OUT;
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (var i = -1; i <= 1; i += 2) {
    if (o.only && o.only !== i) continue;
    var ws = i > 0 ? 0.84 : 1, x = cx + i * sp, ww = w * ws, inn = x - i * ww, out = x + i * ww, top = cy - h;
    if (e === 'n' || e === 'a') {
      var p = new Path2D(); p.ellipse(x, cy, ww, h, 0, 0, TAU);
      g.fillStyle = o.white || '#fff'; g.fill(p);
      g.save(); g.clip(p);
      var lk = o.look == null ? 1 : o.look;
      if (o.pupil === 'bar') {
        g.fillStyle = iris; g.beginPath(); g.ellipse(x + lk * s * ws, cy + 0.5 * s, 2.8 * s * ws, 3.4 * s, 0, 0, TAU); g.fill();
        g.fillStyle = OUT; g.fillRect(x + lk * s * ws - 2.2 * s * ws, cy - 0.3 * s, 4.4 * s * ws, 1.6 * s);
      } else {
        g.fillStyle = iris; g.beginPath(); g.ellipse(x + lk * s * ws, cy + 0.5 * s, 2.7 * s * ws, 3.4 * s, 0, 0, TAU); g.fill();
        g.fillStyle = OUT; g.beginPath(); g.ellipse(x + lk * 1.2 * s * ws, cy + 0.7 * s, 1.55 * s * ws, 2.05 * s, 0, 0, TAU); g.fill();
      }
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x + (lk - 0.6) * s * ws, cy - 1.3 * s, 1.05 * s, 0, TAU); g.fill();
      if (o.lid && e === 'n') { g.fillStyle = o.lid; g.fillRect(x - ww - 1, top - 1, ww * 2 + 2, h * 0.75 + 1); g.lineWidth = 1.5 * s; g.strokeStyle = OUT; g.beginPath(); g.moveTo(x - ww, top + h * 0.75); g.lineTo(x + ww, top + h * 0.75); g.stroke(); }
      g.restore();
      g.lineWidth = 1.5 * s; g.strokeStyle = OUT; g.stroke(p);
      if (o.lash) { g.lineWidth = 1.4 * s; g.beginPath(); g.moveTo(out - i * 0.4 * s, cy - h * 0.55); g.lineTo(out + i * 1.9 * s, cy - h * 0.95); g.moveTo(out - i * 0.2 * s, cy - h * 0.05); g.lineTo(out + i * 2.0 * s, cy - h * 0.25); g.stroke(); }
      if (e === 'a') {
        g.fillStyle = bc; g.beginPath();
        g.moveTo(out + i * 1.0 * s, cy - h * 0.72); g.lineTo(inn - i * 1.0 * s, cy - h * 0.02);
        g.lineTo(inn - i * 1.2 * s, top - 2.2 * s); g.lineTo(out + i * 1.0 * s, top - 3.2 * s); g.closePath(); g.fill();
      } else if (!o.noBrow) {
        g.lineWidth = 2.3 * s; g.strokeStyle = bc; g.beginPath(); g.moveTo(out + i * 0.3 * s, top - 2.0 * s); g.quadraticCurveTo(x, top - 3.9 * s, inn, top - 2.4 * s); g.stroke();
      }
    } else {
      g.strokeStyle = OUT; g.lineWidth = 2.1 * s;
      g.beginPath();
      if (e === 'b') { g.moveTo(x - ww, cy + 0.4 * s); g.quadraticCurveTo(x, cy + 2.4 * s, x + ww, cy + 0.4 * s); }
      else if (e === 'h') { g.moveTo(out, cy - h * 0.7); g.lineTo(inn - i * 0.2 * s, cy); g.lineTo(out, cy + h * 0.7); }
      else if (e === 'k') { g.moveTo(x - ww * 0.95, cy - h * 0.7); g.lineTo(x + ww * 0.95, cy + h * 0.7); g.moveTo(x + ww * 0.95, cy - h * 0.7); g.lineTo(x - ww * 0.95, cy + h * 0.7); }
      else if (e === 'w') { g.lineWidth = 2.4 * s; g.moveTo(x - ww, cy + 1.3 * s); g.quadraticCurveTo(x, cy - h * 1.35, x + ww, cy + 1.3 * s); }
      g.stroke();
      if (!o.noBrow) {
        g.lineWidth = 2.3 * s; g.strokeStyle = bc; g.beginPath();
        if (e === 'h') { g.moveTo(out, top - 1.0 * s); g.lineTo(inn, top - 3.6 * s); }
        else if (e === 'k') { g.moveTo(out, top - 2.4 * s); g.lineTo(inn, top - 2.4 * s); }
        else { g.moveTo(out + i * 0.3 * s, top - 2.6 * s); g.quadraticCurveTo(x, top - 4.6 * s, inn, top - 3.0 * s); }
        g.stroke();
      }
    }
  }
}
var MOUTH = '#4a1430', TONGUE = '#ff5d7a';
function mouth(g, x, y, e, o) {
  o = o || 0; var s = o.s || 1, st = o.style || 'smile';
  g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = OUT;
  var p;
  if (e === 'n' || e === 'b') {
    if (st === 'grin') {
      p = new Path2D(); p.moveTo(x - 4.2 * s, y - 1 * s); p.lineTo(x + 4.4 * s, y - 1.8 * s); p.quadraticCurveTo(x + 3.8 * s, y + 3.4 * s, x, y + 3.2 * s); p.quadraticCurveTo(x - 3.8 * s, y + 2.8 * s, x - 4.2 * s, y - 1 * s); p.closePath();
      g.fillStyle = '#fff'; g.fill(p); g.lineWidth = 1.5 * s; g.stroke(p);
      g.lineWidth = 0.9 * s; g.beginPath(); g.moveTo(x - 3.8 * s, y + 0.9 * s); g.lineTo(x + 4 * s, y + 0.4 * s); g.stroke();
    } else if (st === 'flat') {
      g.lineWidth = 1.8 * s; g.beginPath(); g.moveTo(x - 3 * s, y + 0.5 * s); g.lineTo(x + 3.2 * s, y); g.stroke();
    } else {
      g.lineWidth = 1.8 * s; g.beginPath();
      if (st === 'smirk') { g.moveTo(x - 3.2 * s, y + 0.8 * s); g.quadraticCurveTo(x + 0.8 * s, y + 2.2 * s, x + 3.8 * s, y - 1.6 * s); }
      else { g.moveTo(x - 3.6 * s, y - 0.2 * s); g.quadraticCurveTo(x, y + 2.9 * s, x + 3.6 * s, y - 0.8 * s); }
      g.stroke();
      if (o.fang) { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x + 1.2 * s, y + 1.3 * s); g.lineTo(x + 3 * s, y + 0.8 * s); g.lineTo(x + 2.3 * s, y + 3.6 * s); g.closePath(); g.fill(); g.lineWidth = 0.9 * s; g.stroke(); }
    }
    return;
  }
  p = new Path2D();
  if (e === 'a') { p.moveTo(x - 4.3 * s, y - 1.6 * s); p.lineTo(x + 4.5 * s, y - 2.3 * s); p.quadraticCurveTo(x + 4 * s, y + 4.8 * s, x, y + 4.8 * s); p.quadraticCurveTo(x - 4.4 * s, y + 4.4 * s, x - 4.3 * s, y - 1.6 * s); }
  else if (e === 'w') { p.moveTo(x - 5 * s, y - 1.8 * s); p.lineTo(x + 5.2 * s, y - 2.4 * s); p.quadraticCurveTo(x + 4.4 * s, y + 6 * s, x, y + 6 * s); p.quadraticCurveTo(x - 4.8 * s, y + 5.6 * s, x - 5 * s, y - 1.8 * s); }
  else if (e === 'h') { p.ellipse(x, y + 0.8 * s, 2.6 * s, 1.9 * s, -0.1, 0, TAU); }
  else { p.ellipse(x, y + 1.4 * s, 2.6 * s, 3.3 * s, 0, 0, TAU); }
  p.closePath();
  g.fillStyle = MOUTH; g.fill(p);
  g.save(); g.clip(p);
  if (e === 'a' || e === 'w') { g.fillStyle = '#fff'; g.fillRect(x - 6 * s, y - 3 * s, 12 * s, 2.5 * s); if (o.fang) { g.beginPath(); g.moveTo(x - 3 * s, y - 1 * s); g.lineTo(x - 1.6 * s, y + 2 * s); g.lineTo(x - 0.4 * s, y - 1 * s); g.moveTo(x + 1.5 * s, y - 1 * s); g.lineTo(x + 2.7 * s, y + 2 * s); g.lineTo(x + 3.8 * s, y - 1 * s); g.fill(); } }
  g.fillStyle = TONGUE; g.beginPath(); g.ellipse(x + 0.6 * s, y + (e === 'k' ? 4 : e === 'h' ? 2.6 : 5.2) * s, 3 * s, 1.9 * s, 0, 0, TAU); g.fill();
  g.restore();
  g.lineWidth = 1.5 * s; g.stroke(p);
}
function ear(g, skin, x, y) { x = x == null ? -16 : x; y = y == null ? -17 : y; E(g, x, y, 4.3, 5.3, skin, { hl: false }); g.fillStyle = SHc(skin); g.beginPath(); g.ellipse(x + 0.3, y, 1.7, 2.9, 0, 0, TAU); g.fill(); }
function headBase(g, skin, o) { o = o || 0; if (!o.noEar) ear(g, skin); E(g, 2, -20, 20, 19.5, skin); }
function nose(g, skin) { L(g, 'M19.5 -17.5 Q22.6 -15 19.6 -13.2', 1.4, OUT); }
function blush(g, x, y) { g.fillStyle = 'rgba(255,92,120,0.32)'; g.beginPath(); g.ellipse(x, y, 3.4, 2, 0, 0, TAU); g.fill(); }

/* ---------------- pezzi standard ---------------- */
function legStd(g, pants, boot, o) {
  o = o || 0; var ex = o.ext || 0;
  C(g, 0, -2, 0, 11 + ex, o.w || 4.7, pants, { hl: false });
  g.save(); g.translate(0, ex);
  if (o.cuff) R(g, -5.4, 6.5, 10.8, 3.6, 1.5, o.cuff, { hl: false });
  S(g, 'M-5.6 9 L5 9 Q10.8 10.6 11.4 15.6 Q11.8 20.2 7.6 20.2 L-5.6 20.2 Q-7 20.2 -7 18.4 L-7 11 Q-7 9 -5.6 9', boot);
  if (o.sole) { g.fillStyle = o.sole; g.fillRect(-6.4, 18, 17.4, 1.6); }
  g.restore();
}
function armStd(g, sleeve, o) {
  o = o || 0;
  C(g, 0, -1, 0, 12.5, o.w || 4.4, sleeve, { hl: false });
  if (o.cuff) R(g, -(o.w || 4.4) - 0.6, 9.5, 2 * (o.w || 4.4) + 1.2, 4, 1.6, o.cuff, { hl: false });
}
function handStd(g, col) { E(g, 0, 0.3, 5, 5, col, { hl: false }); L(g, 'M1.8 -2.2 Q3.6 0.2 1.8 2.6', 1.1, OUT); }
function torsoStd(g, top, bottom, o) {
  o = o || 0;
  R(g, -13, -8, 26, 11, [3, 3, 7, 7], bottom, { hl: false });
  R(g, -14, -32, 28, 27, [11, 11, 6, 6], top);
  if (o.belt) R(g, -13.6, -7.5, 27.2, 4.2, 1.5, o.belt, { hl: false });
}
// fiche vista di 3/4: cy = bordo superiore, th spessore verso il basso
function chip(g, cx, cy, rx, th, col, o) {
  o = o || 0; var ry = rx * 0.42;
  var p = new Path2D(); p.moveTo(cx - rx, cy); p.lineTo(cx - rx, cy + th); p.ellipse(cx, cy + th, rx, ry, 0, PI, 0, true); p.lineTo(cx + rx, cy); p.ellipse(cx, cy, rx, ry, 0, 0, PI, false); p.closePath();
  fs(g, p, col, [cx - rx, cy, 2 * rx, th + ry], { hl: false, d: th * 0.3 });
  g.save(); g.clip(p); g.fillStyle = '#fff';
  var nk = rx > 10 ? 2 : 1; for (var k = -nk; k <= nk; k++) { var aa = k * (nk === 2 ? 0.7 : 0.95), xx = cx + Math.sin(aa) * rx * 0.9, ww = rx * 0.13 * Math.cos(aa); g.fillRect(xx - ww / 2, cy, ww, th + ry); }
  g.restore(); g.lineWidth = LW * 0.8; g.strokeStyle = OUT; g.stroke(p);
  if (!o.noTop) {
    var q = new Path2D(); q.ellipse(cx, cy, rx, ry, 0, 0, TAU);
    g.fillStyle = col; g.fill(q);
    g.save(); g.clip(q); g.strokeStyle = '#fff'; g.lineWidth = ry * 0.35; g.setLineDash([rx * 0.32, rx * 0.32]); g.beginPath(); g.ellipse(cx, cy, rx * 0.82, ry * 0.8, 0, 0, TAU); g.stroke(); g.setLineDash([]);
    g.fillStyle = LTc(col); g.beginPath(); g.ellipse(cx, cy, rx * 0.55, ry * 0.52, 0, 0, TAU); g.fill(); g.restore();
    g.lineWidth = LW * 0.8; g.strokeStyle = OUT; g.stroke(q);
  }
}
function chipFace(g, cx, cy, r, col) { // fiche vista di faccia (pugno del golem, fiche dell'antenna)
  E(g, cx, cy, r, r, col, { hl: false });
  g.save(); g.strokeStyle = '#fff'; g.lineWidth = r * 0.28; g.setLineDash([r * 0.42, r * 0.42]); g.beginPath(); g.arc(cx, cy, r * 0.78, 0, TAU); g.stroke(); g.setLineDash([]); g.restore();
  E(g, cx, cy, r * 0.5, r * 0.5, LTc(col), { hl: false, flat: 1, lw: 1.1 });
}

/* =====================================================================
   POSE: il "rig". Angoli braccio/gamba misurati dalla verticale in giù,
   positivi = verso dove guarda il personaggio. wA = angolo dell'arma nel
   corpo (0 = avanti orizzontale, negativo = in su).
   ===================================================================== */
var STY = {
  gun:    { aF: 0.80, wA: -0.12, aB: 0.35, swing: 0.15 },
  melee:  { aF: 0.35, wA: -1.20, aB: -0.15, swing: 0.5 },
  thrust: { aF: 0.45, wA: -1.42, aB: -0.15, swing: 0.45 },
  punch:  { aF: 0.95, wA: 0, aB: 1.05, swing: 0.35 },
  cast:   { aF: 0.85, wA: -1.35, aB: -0.10, swing: 0.4 },
  throw:  { aF: 0.50, wA: -0.60, aB: -0.15, swing: 0.5 }
};
// fotogrammi chiave dell'attacco (tempi in s): [t0,v0,t1,v1,...]
var ATK = {
  gun:    { aF: [0, .8, .07, 1.5, .1, 1.62, .16, 1.38, .34, .8], wA: [0, -.12, .07, 0, .1, 0, .16, -.38, .34, -.12], lean: [0, 0, .1, -.04, .16, -.1, .34, 0], bx: [.1, 0, .16, -2.2, .34, 0] },
  melee:  { aF: [0, .35, .09, 3.4, .14, .45, .2, .3, .34, .35], wA: [0, -1.2, .09, -2.6, .14, .75, .2, .6, .34, -1.2], lean: [0, 0, .09, -.14, .14, .18, .34, 0], sy: [0, 1, .09, .95, .14, 1.05, .34, 1], bx: [0, 0, .09, -1.5, .14, 3, .34, 0] },
  thrust: { aF: [0, .45, .09, 1.15, .14, 1.6, .22, 1.55, .34, .45], rF: [0, 1, .09, .72, .14, 1.38, .22, 1.3, .34, 1], wA: [0, -1.42, .09, -.06, .14, 0, .22, 0, .34, -1.42], lean: [0, 0, .09, -.12, .14, .16, .34, 0], bx: [0, 0, .09, -2, .14, 4, .34, 0] },
  punch:  { aF: [0, .95, .08, .55, .13, 1.6, .22, 1.55, .34, .95], rF: [0, 1, .08, .75, .13, 1.5, .22, 1.35, .34, 1], aB: [0, 1.05, .08, 1.35, .13, .35, .34, 1.05], lean: [0, 0, .08, -.1, .13, .22, .34, 0], bx: [0, 0, .08, -1.5, .13, 4, .34, 0] },
  cast:   { aF: [0, .85, .1, 2.5, .16, 1.65, .26, 1.6, .34, .85], wA: [0, -1.35, .1, -1.9, .16, -.3, .26, -.3, .34, -1.35], rF: [0, 1, .1, 1, .16, 1.25, .34, 1], lean: [0, 0, .1, -.1, .16, .12, .34, 0] },
  throw:  { aF: [0, .5, .1, -1.0, .16, 2.3, .22, 2.0, .34, .5], wA: [0, -.6, .1, 1.2, .16, -2.2, .34, -.6], lean: [0, 0, .1, -.15, .16, .18, .34, 0], aB: [0, -.15, .1, 1.0, .16, -.6, .34, -.15] }
};
// con la mira: scarti rispetto alla direzione di mira
var AIMD = {
  gun:    { aF: [0, 0, .1, 0, .16, -.24, .34, 0], wA: [0, 0, .1, 0, .16, -.32, .34, 0] },
  melee:  { aF: [0, 0, .09, 1.9, .14, -.95, .22, -1.0, .34, 0], wA: [0, 0, .09, 2.0, .14, -1.05, .22, -1.0, .34, 0] },
  thrust: { aF: [0, 0, .34, 0], wA: [0, 0, .34, 0] },
  punch:  { aF: [0, 0, .34, 0], wA: [0, 0, .34, 0] },
  cast:   { aF: [0, 0, .1, 1.0, .16, 0, .34, 0], wA: [0, 0, .1, 1.0, .16, 0, .34, 0] },
  throw:  { aF: [0, 0, .1, 2.0, .16, -.35, .34, 0], wA: [0, 0, .1, 2.3, .16, -.5, .34, 0] }
};
function sstep(u) { return u * u * (3 - 2 * u); }
function kf(t, K) {
  if (t <= K[0]) return K[1];
  for (var i = 2; i < K.length; i += 2) if (t <= K[i]) { var u = (t - K[i - 2]) / (K[i] - K[i - 2]); return K[i - 1] + (K[i + 1] - K[i - 1]) * sstep(u); }
  return K[K.length - 1];
}
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function normA(a) { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; }
var POSES = { idle: 1, run: 1, attack: 1, super: 1, hit: 1, ko: 1, win: 1, jump: 1, fall: 1, shield: 1, portrait: 1 };
var AIMP = { idle: 1, run: 1, attack: 1, super: 1, jump: 1, fall: 1, shield: 1 };
// tempo dell'attacco "dentro" la super
function superToAtk(t) { return t < 0.22 ? 0.09 * (t / 0.22) : t < 0.32 ? 0.09 + 0.05 * ((t - 0.22) / 0.1) : t < 0.55 ? 0.14 + 0.06 * ((t - 0.32) / 0.23) : Math.min(0.34, 0.2 + 0.14 * ((t - 0.55) / 0.2)); }

var RG = {};
function rig(c, pose, t, hasAim, aL) {
  var st = STY[c.style], A = ATK[c.style], r = RG;
  r.bx = 0; r.by = 0; r.sx = 1; r.sy = 1; r.rot = 0; r.lift = 0; r.lean = 0; r.headR = 0; r.headDY = 0;
  r.aF = st.aF; r.wA = st.wA; r.aB = st.aB; r.rF = 1; r.rB = 1;
  r.lF = 0.08; r.lB = -0.1; r.lFy = 0; r.lBy = 0; r.e = 'n'; r.cape = 0; r.eF = 0.22; r.eB = 0.2; r.kF = 0; r.kB = 0;
  r.sm = 0; r.sm0 = 0; r.sm1 = 0; r.flash = 0; r.imp = 0; r.glow = 0; r.aura = 0; r.shield = 0; r.stars = 0; r.hideW = false;
  var ta = -1, s, ph, e, u;
  switch (pose) {
    case 'run':
      ph = t * TAU / 0.44; s = Math.sin(ph);
      r.lF = 0.8 * s; r.lB = -0.8 * s; r.lFy = -Math.max(0, Math.cos(ph)) * 3.6; r.lBy = -Math.max(0, -Math.cos(ph)) * 3.6;
      r.by = -Math.abs(Math.cos(ph)) * 2.6 + 0.6; r.lean = 0.13; r.headR = 0.03 + 0.03 * Math.sin(ph * 2);
      r.aF = st.aF - st.swing * s; r.aB = st.aB + 0.75 * s - 0.35; r.cape = 0.32 + 0.07 * Math.sin(ph * 2);
      r.eB = 1.25; r.eF = c.style === 'gun' ? 0.35 : 0.9 + 0.25 * s; if (c.style === 'gun') r.aF -= 0; else r.aF -= 0.3;
      r.kF = -0.25 - 1.05 * Math.max(0, -Math.cos(ph)); r.kB = -0.25 - 1.05 * Math.max(0, Math.cos(ph)); r.lFy *= 0.5; r.lBy *= 0.5;
      if ((t % 2.7) > 2.58) r.e = 'b';
      break;
    case 'attack':
      ta = Math.min(t, 0.34); r.e = 'a';
      break;
    case 'super':
      ta = superToAtk(t); r.e = 'a';
      r.sy = kf(t, [0, 1, .22, .86, .32, 1.12, .5, 1.04, .7, 1]); r.sx = kf(t, [0, 1, .22, 1.1, .32, .93, .5, .98, .7, 1]);
      r.by = kf(t, [0, 0, .22, 1, .32, -7, .5, -4, .7, 0]); r.aura = t > 0.18 && t < 0.75 ? (t - 0.18) / 0.57 : 0;
      r.lF = kf(t, [0, .08, .22, .35, .32, -.1, .7, .08]); r.lB = kf(t, [0, -.1, .22, -.45, .32, .1, .7, -.1]);
      r.cape = kf(t, [0, 0, .22, -.1, .32, .5, .7, 0]); r.kF = kf(t, [0, 0, .22, -.7, .32, -.1, .7, 0]); r.kB = kf(t, [0, 0, .22, -.6, .32, -.2, .7, 0]);
      break;
    case 'hit':
      e = Math.max(0, 1 - t / 0.3); e *= e;
      r.sx = 1 + 0.2 * e; r.sy = 1 - 0.16 * e; r.lean = -0.38 * e; r.bx = -5 * e; r.headR = -0.3 * e;
      r.aF = st.aF - 0.45 * e; r.aB = st.aB + 1.4 * e; r.lF = 0.08 - 0.3 * e; r.cape = 0.4 * e; r.eF = 0.22 + 0.7 * e; r.eB = 0.2 + 0.9 * e; r.kF = -0.5 * e; r.kB = -0.3 * e;
      r.e = t < 0.34 ? 'h' : 'n';
      break;
    case 'ko':
      u = clamp(t / 0.42, 0, 1); var a = u * u;
      var bnc = t > 0.42 ? Math.sin(Math.min((t - 0.42) / 0.22, 1) * PI) * 0.09 : 0;
      r.rot = -(PI / 2) * a + bnc; r.lift = 13 * a + bnc * 30; r.bx = -7 * a;
      r.aF = st.aF + (2.5 - st.aF) * a; r.aB = st.aB + (2.1 - st.aB) * a; r.wA = st.wA - 0.6 * a;
      r.lF = 0.08 + 0.45 * a; r.lB = -0.1 + 0.25 * a; r.e = t < 0.1 ? 'h' : 'k'; r.cape = 0.5 * a;
      r.stars = t > 0.5 ? 1 : 0;
      break;
    case 'win':
      ph = (t % 0.9) / 0.9; var hop = Math.max(0, Math.sin(ph * TAU));
      r.by = -hop * 8;
      if (ph > 0.5) { var q = Math.sin((ph - 0.5) * TAU); r.sy = 1 - 0.09 * q; r.sx = 1 + 0.07 * q; } else { r.sy = 1 + 0.05 * hop; r.sx = 1 - 0.03 * hop; }
      r.aF = 1.95 + 0.1 * Math.sin(t * 9); r.wA = c.style === 'gun' ? -1.15 : -1.45; r.aB = 3.45 + 0.2 * Math.sin(t * 9 + 1.2); r.rB = 1.05;
      r.lF = 0.55 * hop; r.lB = -0.3 * hop; r.lFy = -1 * hop; r.kF = -1.0 * hop; r.kB = -0.6 * hop; r.eB = 0.5; r.eF = 0.35; r.e = 'w'; r.cape = 0.3 * hop; r.headR = 0.06 * Math.sin(t * 7);
      break;
    case 'jump':
      u = Math.min(1, t / 0.15);
      r.sy = 1 + 0.08 * u; r.sx = 1 - 0.05 * u; r.lF = 0.95 * u; r.lFy = -2 * u; r.kF = -1.55 * u; r.lB = -0.15 * u; r.kB = -0.9 * u; r.lean = -0.04; r.eB = 0.2 + 0.8 * u; r.eF = 0.22 + 0.3 * u;
      r.aB = st.aB + (2.3 - st.aB) * u; r.aF = st.aF + 0.45 * u; r.cape = -0.2 * u;
      break;
    case 'fall':
      r.lF = 0.3; r.lB = -0.35; r.lBy = 1; r.kF = -0.45; r.kB = -0.7; r.eF = 0.5; r.eB = 0.7; r.aB = 2.5 + 0.25 * Math.sin(t * 18); r.aF = st.aF + 0.85 + 0.12 * Math.sin(t * 18 + 1);
      r.cape = 0.6 + 0.12 * Math.sin(t * 14);
      break;
    case 'shield':
      r.sy = 0.93; r.sx = 1.04; r.by = 1; r.lean = -0.08; r.aF = 1.25; r.wA = -1.45; r.aB = 1.35; r.rB = 0.9;
      r.lF = 0.45; r.lB = -0.35; r.kF = -0.55; r.kB = -0.45; r.eF = 0.9; r.eB = 1.2; r.e = 'a'; r.shield = 1;
      break;
    case 'portrait':
      r.aF = c.style === 'punch' ? 1.9 : 2.15; r.wA = c.style === 'gun' ? -1.2 : -1.15; r.aB = 0.45; r.e = 'n';
      break;
    default: // idle
      var br = Math.sin(t * TAU / 1.5);
      r.sy = 1 + 0.022 * br; r.sx = 1 - 0.012 * br; r.headDY = -0.5 * br; r.aF += 0.05 * br; r.aB -= 0.07 * br; r.cape = 0.05 * br;
      if ((t % 3.1) > 2.96) r.e = 'b';
  }
  if (ta >= 0) {
    r.aF = kf(ta, A.aF); r.wA = A.wA ? kf(ta, A.wA) : st.wA; if (A.rF) r.rF = kf(ta, A.rF); if (A.aB) r.aB = kf(ta, A.aB);
    if (A.lean) r.lean += kf(ta, A.lean); if (A.bx) r.bx += kf(ta, A.bx); if (A.sy && pose === 'attack') r.sy = kf(ta, A.sy);
    if (pose === 'attack') { r.lF = 0.08 + 0.25 * Math.sin(Math.min(ta / 0.14, 1) * PI * 0.5); r.lB = -0.1 - 0.2 * Math.sin(Math.min(ta / 0.14, 1) * PI * 0.5); }
    var EL = c.style === 'gun' ? [0, .22, .07, .05, .16, .15, .34, .22] : c.style === 'melee' ? [0, .22, .09, .95, .14, 0, .24, .1, .34, .22] : [0, .22, .08, 1.25, .13, -0.02, .22, .05, .34, .22];
    r.eF = kf(ta, EL); r.eB = kf(ta, [0, .2, .09, 1.1, .14, .4, .34, .2]);
    if (pose === 'attack') { r.kF = kf(ta, [0, 0, .09, -.35, .14, -.1, .34, 0]); r.kB = kf(ta, [0, 0, .09, -.2, .14, -.55, .34, 0]); }
    if (pose === 'super') r.rF *= 1.12;
    var sty = c.style;
    if (sty === 'melee' || sty === 'thrust') { r.sm = ta > 0.09 && ta < 0.24 ? 1 - (ta - 0.09) / 0.15 : 0; r.sm0 = kf(0.09, A.aF); r.sm1 = kf(0.15, A.aF); }
    if (sty === 'gun') r.flash = ta > 0.095 && ta < 0.17 ? 1 - (ta - 0.095) / 0.075 : 0;
    if (sty === 'punch') r.imp = ta > 0.12 && ta < 0.22 ? 1 - (ta - 0.12) / 0.1 : 0;
    if (sty === 'cast') r.glow = ta > 0.14 && ta < 0.3 ? 1 - (ta - 0.14) / 0.16 : 0;
    if (sty === 'throw') { r.hideW = ta > 0.16 && ta < 0.3; r.sm = ta > 0.1 && ta < 0.24 ? 1 - (ta - 0.1) / 0.14 : 0; r.sm0 = kf(0.1, A.aF); r.sm1 = kf(0.17, A.aF); }
    if (pose === 'super') { r.sm *= 1.2; r.flash *= 1.2; r.imp *= 1.3; r.glow *= 1.3; }
  }
  if (hasAim && AIMP[pose]) {
    var base = PI / 2 - (aL - r.lean), D = AIMD[c.style];
    if (ta < 0) r.eF = c.style === 'punch' ? 0.5 : 0.08;
    base -= r.eF * 0.5;
    if (ta >= 0) { var da = kf(ta, D.aF), dw = kf(ta, D.wA); r.aF = base + da; r.wA = aL + dw; if (r.sm) { r.sm0 = base + kf(0.09, D.aF); r.sm1 = base + kf(0.15, D.aF); } }
    else { r.aF = base; r.wA = aL; }
    if (c.style === 'punch' && ta < 0) r.rF = 1.1;
  }
  if (c.up) r.wA = 0;
  if (c.two && pose !== 'ko' && pose !== 'hit') {
    var G = c.geo, l1 = G.elbow * r.rF, l2 = (G.arm - G.elbow) * r.rF, hx = G.shF + l1 * Math.sin(r.aF) + l2 * Math.sin(r.aF + r.eF), hy = G.shY + l1 * Math.cos(r.aF) + l2 * Math.cos(r.aF + r.eF), phi = r.wA - r.lean;
    var tx = hx + c.grip2 * Math.cos(phi), ty = hy + c.grip2 * Math.sin(phi), dx = tx - G.shB, dy = ty - G.shY;
    r.eB = 0.15; r.aB = Math.atan2(dx, dy) - 0.075; r.rB = clamp(Math.sqrt(dx * dx + dy * dy) / G.arm, 0.6, 1.55);
  }
  return r;
}

/* =====================================================================
   COTTURA: pezzi -> atlante per personaggio, contorno per dilatazione
   ===================================================================== */
var EXPR = ['n', 'b', 'a', 'h', 'k', 'w'];
var DEFBOX = { head: [-28, -52, 32, 6], torso: [-20, -38, 20, 8], arm: [-7, -7, 7, 18], hand: [-9, -9, 9, 12], leg: [-10, -9, 14, 23] };
var tmpA = null, tmpR = null;
function cv(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; }
// un arto si cuoce in due pezzi (sopra/sotto il gomito o il ginocchio): il pezzo di sopra
// finisce con un tappo tondo (ritaglio a cerchio sull'asse) che copre la giuntura.
function splitLimb(L, name, box, fn, cut, rad, dim) {
  L.push({ n: name, b: [box[0], box[1], box[2], cut + rad + 1.5], dim: dim, f: function (g) {
    var cp = new Path2D(); cp.rect(-80, -80, 160, 80 + cut); cp.arc(0, cut, rad, 0, TAU); g.save(); g.clip(cp); fn(g); g.restore(); } });
  L.push({ n: name + '2', b: [box[0], -rad - 1.5, box[2], box[3] - cut], dim: dim, f: function (g) {
    g.save(); g.translate(0, -cut); g.beginPath(); g.rect(-80, cut - rad - 1, 160, 120); g.clip(); fn(g); g.restore(); } });
}
function partList(c) {
  var L = [], bx = c.box || {}, G = c.geo;
  EXPR.forEach(function (e) { L.push({ n: 'h_' + e, b: bx.head || DEFBOX.head, f: function (g) { c.head(g, e); } }); });
  L.push({ n: 'torso', b: bx.torso || DEFBOX.torso, f: function (g) { c.torso(g); } });
  splitLimb(L, 'armF', bx.arm || DEFBOX.arm, function (g) { c.arm(g, true); }, G.elbow, G.armR, 0);
  splitLimb(L, 'armB', bx.arm || DEFBOX.arm, function (g) { c.arm(g, false); }, G.elbow, G.armR, 1);
  L.push({ n: 'handF', b: bx.hand || DEFBOX.hand, f: function (g) { c.hand(g, true); } });
  L.push({ n: 'handB', b: bx.hand || DEFBOX.hand, f: function (g) { c.hand(g, false); }, dim: 1 });
  splitLimb(L, 'legF', bx.leg || DEFBOX.leg, function (g) { c.leg(g, true); }, G.knee, G.legR, 0);
  splitLimb(L, 'legB', bx.legB || bx.leg || DEFBOX.leg, function (g) { c.leg(g, false); }, G.knee, G.legR, 1);
  if (c.weapon) L.push({ n: 'weapon', b: bx.weapon, f: function (g) { c.weapon(g); } });
  if (c.back) L.push({ n: 'back', b: bx.back, f: function (g) { c.back(g); }, dim: 0.5 });
  if (c.off) L.push({ n: 'off', b: bx.off, f: function (g) { c.off(g); } });
  return L;
}
function bakeChar(c, k) {
  var t0 = now();
  KPX = k;
  var parts = partList(c), m = OLW + 1.6, maxW = 0, maxH = 0;
  parts.forEach(function (p) { p.w = Math.ceil((p.b[2] - p.b[0] + 2 * m) * k); p.h = Math.ceil((p.b[3] - p.b[1] + 2 * m) * k); maxW = Math.max(maxW, p.w); maxH = Math.max(maxH, p.h); });
  // impacchettamento a scaffali
  var AW = Math.max(256, Math.min(2048, Math.ceil(Math.sqrt(parts.reduce(function (s, p) { return s + p.w * p.h; }, 0)) * 1.25)), maxW);
  var order = parts.slice().sort(function (a, b) { return b.h - a.h; }), x = 0, y = 0, rowH = 0;
  order.forEach(function (p) { if (x + p.w + 1 > AW) { x = 0; y += rowH + 1; rowH = 0; } p.ax = x; p.ay = y; x += p.w + 1; rowH = Math.max(rowH, p.h); });
  var AH = y + rowH;
  var atlas = cv(AW, AH), ag = atlas.getContext('2d');
  if (!tmpA || tmpA.width < AW || tmpA.height < AH) tmpA = cv(Math.max(AW, tmpA ? tmpA.width : 0), Math.max(AH, tmpA ? tmpA.height : 0));
  var ga = tmpA.getContext('2d');
  ga.setTransform(1, 0, 0, 1, 0, 0); ga.globalCompositeOperation = 'source-over'; ga.globalAlpha = 1; ga.clearRect(0, 0, tmpA.width, tmpA.height);
  var r = OLW * k, offs = [], n = r > 3.5 ? 12 : 8, i;
  for (i = 0; i < n; i++) offs.push([Math.cos(i / n * TAU) * r, Math.sin(i / n * TAU) * r]);
  if (r > 3) for (i = 0; i < 6; i++) offs.push([Math.cos((i + 0.5) / 6 * TAU) * r * 0.6, Math.sin((i + 0.5) / 6 * TAU) * r * 0.6]);
  var rec = { cv: atlas, k: k, bytes: AW * AH * 4 };
  // 1) tutti i pezzi nell'atlante di lavoro (ognuno nel suo rettangolo, col margine per il contorno)
  parts.forEach(function (p) {
    ga.setTransform(k, 0, 0, k, p.ax + (m - p.b[0]) * k, p.ay + (m - p.b[1]) * k);
    ga.lineCap = 'round'; ga.lineJoin = 'round';
    ga.save(); ga.beginPath(); ga.rect(p.b[0] - m, p.b[1] - m, p.w / k, p.h / k); ga.clip(); p.f(ga); ga.restore();
    if (p.dim) { ga.setTransform(1, 0, 0, 1, 0, 0); ga.globalCompositeOperation = 'source-atop'; ga.fillStyle = 'rgba(28,14,60,' + (0.2 * p.dim) + ')'; ga.fillRect(p.ax, p.ay, p.w, p.h); ga.globalCompositeOperation = 'source-over'; }
    rec[p.n] = [p.ax, p.ay, p.w, p.h, p.b[0] - m, p.b[1] - m, p.w / k, p.h / k];
  });
  ga.setTransform(1, 0, 0, 1, 0, 0);
  // 1b) luce di contorno colorata (riflesso dal colore del personaggio) sul bordo alto-dietro di ogni pezzo
  if (c.rim) {
    if (!tmpR || tmpR.width < AW || tmpR.height < AH) tmpR = cv(Math.max(AW, tmpR ? tmpR.width : 0), Math.max(AH, tmpR ? tmpR.height : 0));
    var gr = tmpR.getContext('2d'), dd = 1.7 * k;
    gr.setTransform(1, 0, 0, 1, 0, 0); gr.globalCompositeOperation = 'source-over'; gr.clearRect(0, 0, tmpR.width, tmpR.height);
    gr.drawImage(tmpA, 0, 0);
    gr.globalCompositeOperation = 'destination-out'; gr.drawImage(tmpA, dd * 0.75, dd);
    gr.globalCompositeOperation = 'source-in'; gr.fillStyle = c.rimCol || c.colore; gr.fillRect(0, 0, AW, AH);
    ga.globalCompositeOperation = 'source-atop'; ga.globalAlpha = c.rim; ga.drawImage(tmpR, 0, 0); ga.globalAlpha = 1; ga.globalCompositeOperation = 'source-over';
  }
  // 2) contorno esterno: una sola dilatazione di tutto l'atlante
  for (var j = 0; j < offs.length; j++) ag.drawImage(tmpA, 0, 0, AW, AH, offs[j][0], offs[j][1], AW, AH);
  ag.globalCompositeOperation = 'source-in'; ag.fillStyle = OUT; ag.fillRect(0, 0, AW, AH);
  ag.globalCompositeOperation = 'source-over'; ag.drawImage(tmpA, 0, 0, AW, AH, 0, 0, AW, AH);
  rec.ms = now() - t0;
  return rec;
}
// copia dell'atlante riempita di un colore (lampo del colpo): creata alla prima richiesta, max 2 colori
function flashOf(B, col) {
  B.fl = B.fl || {}; if (B.fl[col]) return B.fl[col];
  var ks = Object.keys(B.fl); if (ks.length >= 2) { B.bytes -= B.cv.width * B.cv.height * 4; delete B.fl[ks[0]]; }
  var c2 = cv(B.cv.width, B.cv.height), g = c2.getContext('2d');
  g.drawImage(B.cv, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c2.width, c2.height);
  var F2 = Object.create(B); F2.cv = c2; B.fl[col] = F2; B.bytes += c2.width * c2.height * 4; return F2;
}
function now() { return (W.performance && performance.now) ? performance.now() : Date.now(); }
function getBake(c, k) {
  var bk = c._bk || (c._bk = []), i, best = null, bd = 9;
  for (i = 0; i < bk.length; i++) { var q = k / bk[i].k; if (q > 0.885 && q < 1.13) { var d = Math.abs(Math.log(q)); if (d < bd) { bd = d; best = bk[i]; } } }
  if (best) return best;
  best = bakeChar(c, k); bk.push(best); if (bk.length > 4) bk.shift();
  return best;
}

/* =====================================================================
   COMPOSIZIONE a runtime
   ===================================================================== */
function dp(ctx, B, n) { var r = B[n]; if (r) ctx.drawImage(B.cv, r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]); }
var PROBE = null;
function place(ctx, x, y, f, Sc, r, shadow) {
  ctx.translate(x, y); ctx.scale(f * Sc, Sc);
  if (shadow) { ctx.fillStyle = 'rgba(10,6,25,0.28)'; ctx.beginPath(); ctx.ellipse(0, 0, 19 * (1 + (r.sx - 1)), 5.5, 0, 0, TAU); ctx.fill(); }
  ctx.translate(r.bx, r.by - r.lift); if (r.rot) ctx.rotate(r.rot); ctx.scale(r.sx, r.sy);
}
function star(ctx, x, y, R1, R2, n, rot) { ctx.beginPath(); for (var i = 0; i < n * 2; i++) { var a = rot + i * PI / n, rr = i % 2 ? R2 : R1; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); }
// pila di matrici in JS: un solo setTransform per pezzo, niente save/restore (più veloce sui telefoni)
var MS = new Float64Array(6 * 12), MD = 0, MC = null;
function mSet(m) { MD = 0; MS[0] = m.a; MS[1] = m.b; MS[2] = m.c; MS[3] = m.d; MS[4] = m.e; MS[5] = m.f; }
function mPush() { var o = MD * 6; for (var i = 0; i < 6; i++) MS[o + 6 + i] = MS[o + i]; MD++; }
function mPop() { MD--; }
function mT(x, y) { var o = MD * 6; MS[o + 4] += MS[o] * x + MS[o + 2] * y; MS[o + 5] += MS[o + 1] * x + MS[o + 3] * y; }
function mR(t) { if (!t) return; var o = MD * 6, cs = Math.cos(t), sn = Math.sin(t), a = MS[o], b = MS[o + 1], c = MS[o + 2], d = MS[o + 3]; MS[o] = a * cs + c * sn; MS[o + 1] = b * cs + d * sn; MS[o + 2] = c * cs - a * sn; MS[o + 3] = d * cs - b * sn; }
function mS(x, y) { var o = MD * 6; MS[o] *= x; MS[o + 1] *= x; MS[o + 2] *= y; MS[o + 3] *= y; }
function mA() { var o = MD * 6; MC.setTransform(MS[o], MS[o + 1], MS[o + 2], MS[o + 3], MS[o + 4], MS[o + 5]); }
function mP(x, y) { var o = MD * 6; return { x: MS[o] * x + MS[o + 2] * y + MS[o + 4], y: MS[o + 1] * x + MS[o + 3] * y + MS[o + 5] }; }
function dpA(B, n) { var q = B[n]; if (q) { mA(); MC.drawImage(B.cv, q[0], q[1], q[2], q[3], q[4], q[5], q[6], q[7]); } }
function render(ctx, c, B, r) {
  var G = c.geo, aw = G.arm, base = ctx.getTransform();
  MC = ctx; mSet(base);
  // pezzo dietro (mantello, coda, casse, zaino) e braccio lontano
  mPush(); mT(0, G.hip); mR(r.lean);
  if (B.back) { var bp = c.backPivot || [0, -28]; mPush(); mT(bp[0], bp[1]); mR(r.cape * (c.capeK == null ? 1 : c.capeK)); mT(-bp[0], -bp[1]); dpA(B, 'back'); mPop(); }
  var e1 = G.elbow, e2 = aw - G.elbow;
  mPush(); mT(G.shB, G.shY); mR(-r.aB);
  mPush(); mT(0, e1 * r.rB); mR(-r.eB); mPush(); mS(1, r.rB); dpA(B, 'armB2'); mPop(); mPop();
  mPush(); mS(1, r.rB); dpA(B, 'armB'); mPop();
  mT(0, e1 * r.rB); mR(-r.eB); mT(0, e2 * r.rB);
  if (B.off) { mPush(); mR(r.aB + r.eB - r.lean); dpA(B, 'off'); mPop(); }
  if (c.style !== 'punch') dpA(B, 'handB');
  mPop(); mPop();
  // gambe
  mPush(); mT(G.hipB, G.hip + r.lBy); mR(-r.lB); mPush(); mT(0, G.knee); mR(-r.kB); dpA(B, 'legB2'); mPop(); dpA(B, 'legB'); mPop();
  mPush(); mT(G.hipF, G.hip + r.lFy); mR(-r.lF); mPush(); mT(0, G.knee); mR(-r.kF); dpA(B, 'legF2'); mPop(); dpA(B, 'legF'); mPop();
  // busto, testa, braccio davanti
  mPush(); mT(0, G.hip); mR(r.lean);
  dpA(B, 'torso');
  if (c.style === 'punch') { mPush(); mT(G.shB, G.shY); mR(-r.aB); mT(0, e1 * r.rB); mR(-r.eB); mT(0, e2 * r.rB); dpA(B, 'handB'); mPop(); }
  mPush(); mT(0, G.neck); mR(r.headR); mT(0, r.headDY); dpA(B, 'h_' + r.e);
  if (r.stars) { var tt = now() / 1000; ctx.fillStyle = '#ffe14a'; ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; for (var si = 0; si < 3; si++) { var sa = tt * 4 + si * TAU / 3; star(ctx, 2 + Math.cos(sa) * 16, -44 + Math.sin(sa) * 5, 4, 1.8, 5, sa); ctx.fill(); ctx.stroke(); } }
  mPop();
  var ga0 = ctx.globalAlpha;
  if (r.sm > 0) { // scia del colpo
    var rad = aw * 1.15 + (c.wLen || 12) * 0.85, t0a = PI / 2 - r.sm0, t1a = PI / 2 - r.sm1;
    mPush(); mT(G.shF, G.shY); ctx.globalAlpha = ga0 * Math.min(1, r.sm) * 0.85; ctx.lineCap = 'round';
    if (c.style === 'thrust' || Math.abs(t1a - t0a) < 0.35) { // affondo: scia dritta lungo l'arma
      mR(PI / 2 - r.aF); mA();
      ctx.strokeStyle = c.colore; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(aw * 0.6, 0); ctx.lineTo(rad + 10, 0); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(aw, 0); ctx.lineTo(rad + 8, 0); ctx.stroke();
    } else {
      mA();
      ctx.strokeStyle = c.colore; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(0, 0, rad, Math.min(t0a, t1a), Math.max(t0a, t1a)); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(0, 0, rad + 1.5, Math.min(t0a, t1a) + 0.15, Math.max(t0a, t1a)); ctx.stroke();
    }
    ctx.globalAlpha = ga0; mPop();
  }
  mPush(); mT(G.shF, G.shY); mR(-r.aF);
  mPush(); mT(0, e1 * r.rF); mR(-r.eF); mPush(); mS(1, r.rF); dpA(B, 'armF2'); mPop(); mPop();
  mPush(); mS(1, r.rF); dpA(B, 'armF'); mPop();
  mT(0, e1 * r.rF); mR(-r.eF); mT(0, e2 * r.rF);
  if (PROBE) PROBE.hand = mP(0, 0);
  if (B.weapon && !r.hideW) {
    mPush(); mR(r.wA - r.lean + r.aF + r.eF); dpA(B, 'weapon');
    var tip = c.tip || [20, 0];
    if (PROBE) PROBE.tip = mP(tip[0], tip[1]);
    if (r.flash > 0) {
      ctx.globalAlpha = ga0 * Math.min(1, r.flash); ctx.fillStyle = '#fff6b0'; star(ctx, tip[0] + 5, tip[1], 11 * r.flash + 4, 4, 6, 0.3); ctx.fill();
      ctx.fillStyle = c.colore; star(ctx, tip[0] + 4, tip[1], 7 * r.flash + 3, 2.5, 6, 0); ctx.fill(); ctx.globalAlpha = ga0;
    }
    if (r.glow > 0) {
      ctx.globalAlpha = ga0 * Math.min(1, r.glow); ctx.strokeStyle = c.colore; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(tip[0], tip[1], 6 + (1 - r.glow) * 14, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(tip[0], tip[1], 4 * r.glow + 1, 0, TAU); ctx.fill(); ctx.globalAlpha = ga0;
    }
    mPop();
  }
  dpA(B, 'handF');
  if (r.imp > 0) {
    ctx.globalAlpha = ga0 * Math.min(1, r.imp); ctx.fillStyle = '#fff6b0'; star(ctx, 0, 8, 13 * r.imp + 4, 5, 7, 0.2); ctx.fill();
    ctx.strokeStyle = c.colore; ctx.lineWidth = 2.5; ctx.stroke(); ctx.globalAlpha = ga0;
  }
  mPop(); mPop();
  mA();
  if (r.aura > 0) { // super: raggi e anello nei due colori del personaggio
    var au = r.aura, fa = 1 - au; ctx.globalAlpha = ga0 * fa * 0.75; ctx.fillStyle = c.colore;
    ctx.beginPath();
    for (var ri = 0; ri < 10; ri++) { var ra = ri / 10 * TAU + au * 1.5, r1 = 26 + au * 18, r2 = 56 + au * 46; ctx.moveTo(Math.cos(ra - 0.07) * r1, -45 + Math.sin(ra - 0.07) * r1 * 1.3); ctx.lineTo(Math.cos(ra) * r2, -45 + Math.sin(ra) * r2 * 1.3); ctx.lineTo(Math.cos(ra + 0.07) * r1, -45 + Math.sin(ra + 0.07) * r1 * 1.3); }
    ctx.fill();
    ctx.globalAlpha = ga0 * fa; ctx.strokeStyle = c.colore2; ctx.lineWidth = 6 * fa + 1.5;
    ctx.beginPath(); ctx.ellipse(0, -45, 26 + au * 44, 34 + au * 56, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, -45, 24 + au * 40, 32 + au * 52, 0, 0, TAU); ctx.stroke();
    ctx.globalAlpha = ga0;
  }
  if (r.shield) { // scudo: tre celle esagonali col colore del personaggio
    ctx.lineJoin = 'round';
    for (var hi = 0; hi < 3; hi++) {
      var hy = -18 - hi * 26, hx = 18 - Math.abs(hi - 1) * 4; ctx.beginPath();
      for (var hk = 0; hk < 6; hk++) { var ha = hk / 6 * TAU + PI / 6; ctx.lineTo(hx + Math.cos(ha) * 8, hy + Math.sin(ha) * 14); }
      ctx.closePath(); ctx.globalAlpha = ga0 * 0.42; ctx.fillStyle = c.colore; ctx.fill();
      ctx.globalAlpha = ga0 * 0.95; ctx.strokeStyle = c.colore2 === '#ffffff' ? c.colore : c.colore2; ctx.lineWidth = 2.6; ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
    }
    ctx.globalAlpha = ga0;
  }
  ctx.setTransform(base);
}

/* =====================================================================
   API
   ===================================================================== */
var EMPTY = {}, MAP = {}, LIST = [], DEFS = [];
function def(o) {
  o.geo = Object.assign({ hip: -20, neck: -31, shY: -25, shF: 8, shB: -10, hipF: 4.5, hipB: -5, arm: 15, elbow: 7.5, armR: 5.6, knee: 6, legR: 5.9 }, o.geo || {});
  if (!o.hand) o.hand = function (g) { handStd(g, o.skin || '#f2c6a0'); };
  DEFS.push(o); MAP[o.id] = o;
}
var GBR = {
  versione: '1410.1',
  pose: ['idle', 'run', 'attack', 'super', 'hit', 'ko', 'win', 'jump', 'fall', 'shield'],
  durata: { attack: 0.34, super: 0.75, hit: 0.32, ko: 0.65 }, // dopo queste durate la posa resta ferma sull'ultimo fotogramma
  dpr: Math.min(2, (W.devicePixelRatio || 1)),
  list: LIST,
  get: function (id) { var c = MAP[id]; return c ? c.pub : null; },
  draw: function (ctx, id, x, y, o) {
    var c = MAP[id]; if (!c) return; o = o || EMPTY;
    var h = o.h || 96, Sc = h * c.taglia / 100, dpr = GBR.dpr, B = getBake(c, Sc * dpr);
    var f = o.facing === -1 ? -1 : 1, pose = POSES[o.pose] ? o.pose : 'idle', t = o.t || 0, aL = 0, hasAim = typeof o.aim === 'number' && isFinite(o.aim);
    if (hasAim) { var cx = Math.cos(o.aim); if (cx * f < -0.12) f = -f; aL = normA(f > 0 ? o.aim : PI - o.aim); }
    var r = rig(c, pose, t, hasAim, aL);
    if (o.tint) {
      var fl = flashOf(B, o.tint);
      ctx.save(); if (o.alpha != null) ctx.globalAlpha *= o.alpha;
      place(ctx, x, y, f, Sc, r, o.shadow); render(ctx, c, B, r);
      ctx.globalAlpha *= (o.tintA == null ? 0.7 : o.tintA); render(ctx, c, fl, r);
      ctx.restore();
      return;
    }
    ctx.save(); if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    place(ctx, x, y, f, Sc, r, o.shadow); render(ctx, c, B, r); ctx.restore();
  },
  // punta dell'arma (o mano, per chi combatte a mani nude) in coordinate del canvas del gioco
  muzzle: function (id, x, y, o) {
    var c = MAP[id]; if (!c) return null; o = o || EMPTY;
    if (!GBR._pc) GBR._pc = cv(1, 1).getContext('2d');
    var g = GBR._pc, h = o.h || 96, Sc = h * c.taglia / 100, B = getBake(c, Sc * GBR.dpr);
    var f = o.facing === -1 ? -1 : 1, pose = POSES[o.pose] ? o.pose : 'idle', aL = 0, hasAim = typeof o.aim === 'number' && isFinite(o.aim);
    if (hasAim) { if (Math.cos(o.aim) * f < -0.12) f = -f; aL = normA(f > 0 ? o.aim : PI - o.aim); }
    var r = rig(c, pose, o.t || 0, hasAim, aL);
    g.setTransform(1, 0, 0, 1, 0, 0); PROBE = {}; g.save(); place(g, x, y, f, Sc, r, false); render(g, c, B, r); g.restore();
    var p = PROBE.tip || PROBE.hand; PROBE = null;
    return p ? [p.x, p.y] : [x, y - h * 0.5];
  },
  portrait: function (ctx, id, x, y, size) {
    var c = MAP[id]; if (!c) return;
    var sc = size * 0.55 / 40, h = 100 * sc / c.taglia;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, size, size); ctx.clip();
    GBR.draw(ctx, id, x + size * 0.45, y + size * 0.1 + 93 * sc + (c.portraitDY || 0) * sc, { pose: 'portrait', h: h });
    ctx.restore();
  },
  prebake: function (h, dpr, ids) {
    var t0 = now(); h = h || 96; if (dpr) GBR.dpr = Math.min(3, dpr);
    (ids || DEFS.map(function (c) { return c.id; })).forEach(function (id) { var c = MAP[id]; if (c) getBake(c, h * c.taglia / 100 * GBR.dpr); });
    return { ms: Math.round(now() - t0), byte: GBR.memoria() };
  },
  memoria: function () { var b = 0; DEFS.forEach(function (c) { (c._bk || []).forEach(function (k) { b += k.bytes; }); }); return b; },
  svuota: function () { DEFS.forEach(function (c) { c._bk = []; }); },
  // diagnostica per la galleria: pezzi che toccano il bordo della loro scatola (= tagliati)
  _controlla: function (k) {
    var out = [];
    DEFS.forEach(function (c) {
      var B = bakeChar(c, k || 4), g = B.cv.getContext('2d');
      partList(c).forEach(function (p) {
        var r = B[p.n], px = Math.round(1.6 * B.k); // bordo di margine: dentro OLW+1.6 non dovrebbe esserci nulla oltre il contorno
        var d = g.getImageData(r[0], r[1], r[2], r[3]).data, w = r[2], h = r[3], hit = 0;
        for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++) { if (xx > 1 && xx < w - 2 && yy > 1 && yy < h - 2) { if (xx === 2) xx = w - 3; continue; } if (d[(yy * w + xx) * 4 + 3] > 40) { hit++; } }
        if (hit) out.push(c.id + '.' + p.n + ':' + hit);
      });
    });
    return out;
  },
  _defs: DEFS
};

/* =====================================================================
   IL CAST
   Coordinate della testa: collo in (0,0), testa centrata in (2,-20) r 20.
   Occhi attorno a (9,-21), bocca attorno a (11.5,-10). Il personaggio
   guarda a destra (+x) di 3/4.
   ===================================================================== */
function num(g, s, x, y, size, col, rot) { g.save(); g.translate(x, y); if (rot) g.rotate(rot); g.fillStyle = col; g.font = '900 ' + size + 'px "Arial Black", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, 0, size * 0.04); g.restore(); }
// facce luminose (schermo del bot, occhi del golem)
function screenFace(g, cx, cy, e, col, s, noMouth) {
  s = s || 1;
  g.save(); g.shadowColor = col; g.shadowBlur = 3 * KPX * s; g.fillStyle = col; g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = 2.2 * s;
  for (var j = 0; j < 2; j++) {
    var i = j ? 1 : -1, ws = j ? 0.86 : 1, x = cx + i * 5.6 * s, w2 = 2.5 * ws * s, out = x + i * w2, inn = x - i * w2;
    g.beginPath();
    if (e === 'n') g.fill(rrp(x - w2, cy - 5 * s, 2 * w2, 9.5 * s, 2.3 * s));
    else if (e === 'a') { g.moveTo(out, cy - 5 * s); g.lineTo(inn, cy - 1.5 * s); g.lineTo(inn, cy + 4.5 * s); g.lineTo(out, cy + 4.5 * s); g.closePath(); g.fill(); }
    else if (e === 'b') { g.moveTo(x - w2, cy + 1 * s); g.lineTo(x + w2, cy + 1 * s); g.stroke(); }
    else if (e === 'h') { g.moveTo(out, cy - 4 * s); g.lineTo(inn, cy); g.lineTo(out, cy + 4 * s); g.stroke(); }
    else if (e === 'k') { g.moveTo(x - w2, cy - 3.5 * s); g.lineTo(x + w2, cy + 3.5 * s); g.moveTo(x + w2, cy - 3.5 * s); g.lineTo(x - w2, cy + 3.5 * s); g.stroke(); }
    else if (e === 'w') { g.moveTo(x - w2 - 0.4 * s, cy + 2 * s); g.quadraticCurveTo(x, cy - 6 * s, x + w2 + 0.4 * s, cy + 2 * s); g.stroke(); }
  }
  if (!noMouth) {
    var my = cy + 8.6 * s, mx = cx + 0.5 * s; g.beginPath(); g.lineWidth = 1.8 * s;
    if (e === 'n' || e === 'b') { g.moveTo(mx - 3.5 * s, my - 0.6 * s); g.quadraticCurveTo(mx, my + 2.4 * s, mx + 3.5 * s, my - 0.6 * s); g.stroke(); }
    else if (e === 'a') { g.moveTo(mx - 4 * s, my); g.lineTo(mx - 2 * s, my - 1.6 * s); g.lineTo(mx, my); g.lineTo(mx + 2 * s, my - 1.6 * s); g.lineTo(mx + 4 * s, my); g.stroke(); }
    else if (e === 'w') { g.moveTo(mx - 4 * s, my - 1.5 * s); g.lineTo(mx + 4 * s, my - 1.5 * s); g.quadraticCurveTo(mx + 3.5 * s, my + 3.5 * s, mx, my + 3.5 * s); g.quadraticCurveTo(mx - 3.5 * s, my + 3.5 * s, mx - 4 * s, my - 1.5 * s); g.fill(); }
    else if (e === 'h') { g.moveTo(mx - 3.5 * s, my); g.quadraticCurveTo(mx - 1.7 * s, my - 1.8 * s, mx, my); g.quadraticCurveTo(mx + 1.7 * s, my + 1.8 * s, mx + 3.5 * s, my); g.stroke(); }
    else { g.ellipse(mx, my, 2 * s, 2.4 * s, 0, 0, TAU); g.stroke(); }
  }
  g.restore();
}
function shadeLine(g, d, lw) { L(g, d, lw || 1.2, 'rgba(29,21,48,0.55)'); }

/* 1 ---- GAMBLER BOT ---------------------------------------------------- */
(function () {
  var W1 = '#e8edf4', GR = '#5b6474', RD = '#ec3550', CY = '#4ff3ff', SC = '#13283a', GD = '#ffc93a';
  def({ id: 'bot', nome: 'GAMBLER BOT', motto_it: 'Punto tutto. Su di me.', motto_en: 'All in. On me.', universo: 'gambler', colore: '#ff3b5c', colore2: CY, taglia: 1, peso: 2, style: 'gun', arma: 'blaster a fiches',
    tip: [31, -4], wLen: 30, skin: W1,
    box: { head: [-26, -64, 30, 4], weapon: [-7, -21, 34, 11] },
    head: function (g, e) {
      R(g, -3.5, -11, 9, 12, 2, GR, { hl: false });
      C(g, 3, -38, 3, -50, 1.8, '#9aa6b8', { hl: false });
      chipFace(g, 3, -55, 6.4, RD);
      E(g, -19.5, -24, 3.4, 5.5, RD, { hl: false }); E(g, 23, -24, 2.4, 5, RD, { hl: false });
      R(g, -18, -42, 40, 33, 10, W1);
      R(g, -13, -37, 30, 23, 6, SC, { flat: 1 });
      g.fillStyle = 'rgba(255,255,255,0.10)'; g.beginPath(); g.moveTo(-9, -36.5); g.lineTo(-3, -36.5); g.lineTo(-10, -14.5); g.lineTo(-12.5, -14.5); g.closePath(); g.fill();
      screenFace(g, 4.5, -26.5, e, CY);
    },
    torso: function (g) {
      torsoStd(g, W1, GR);
      R(g, -8.5, -25, 18, 12, 4, '#2c3446', { flat: 1 });
      [RD, GD, CY].forEach(function (cc, i) { R(g, -6.6 + i * 5.2, -22.6, 4.2, 6.8, 1.4, cc, { flat: 1, lw: 1 }); });
      R(g, -13.6, -7.4, 27.2, 4, 1.5, '#3d4656', { hl: false });
      E(g, 9.5, -29, 1.8, 1.8, RD, { flat: 1, lw: 1 }); E(g, -8, -29, 1.4, 1.4, GD, { flat: 1, lw: 1 });
    },
    arm: function (g) { armStd(g, '#8f9bb0', { w: 3.7, cuff: RD }); },
    hand: function (g) { E(g, 0, 0.5, 5.3, 5.1, W1, { hl: false }); L(g, 'M2 -2 Q3.8 0.5 2 3', 1.1); },
    leg: function (g) { C(g, 0, -2, 0, 11, 3.8, GR, { hl: false }); S(g, 'M-6 8.5 L5 8.5 Q11 10.5 11.4 15.6 Q11.8 20.2 7.6 20.2 L-6 20.2 Q-7.4 20.2 -7.4 18.4 L-7.4 10.5 Q-7.4 8.5 -6 8.5', RD); },
    weapon: function (g) {
      R(g, -1.6, -1, 6, 10, 2, GR, { hl: false });
      R(g, -5, -10, 24, 11, 4.5, RD);
      R(g, 17, -8.5, 11, 7, 2, '#c9d2de', { hl: false });
      R(g, 26, -10, 5, 10, 2, GR, { hl: false });
      chip(g, 6, -14.5, 6.5, 4, GD);
    }
  });
})();

/* 2 ---- DON FICHES ----------------------------------------------------- */
(function () {
  var SK = '#f0b088', SU = '#3d4263', HT = '#2a2836', BD = '#d6303e', SH = '#f4efe6', WD = '#8a5a32', MU = '#2a2124';
  def({ rim: 0.75, id: 'don', nome: 'DON FICHES', motto_it: 'Un\'offerta che non puoi rilanciare.', motto_en: 'An offer you can\'t raise.', universo: 'gambler', colore: '#ffc93a', colore2: BD, taglia: 1.08, peso: 4, style: 'gun', two: true, grip2: 18, arma: 'mitra a tamburo',
    tip: [37, -3.5], wLen: 36, skin: SK,
    geo: { shF: 9, shB: -11 },
    box: { head: [-30, -56, 36, 6], torso: [-24, -38, 24, 8], weapon: [-17, -12, 40, 14] },
    head: function (g, e) {
      ear(g, SK);
      S(g, 'M-18 -20 Q-18 -40 2 -40 Q22 -40 22 -20 Q23 -4 10 -1 Q-2 1 -10 -3 Q-18 -8 -18 -20', SK);
      eyes(g, 8.5, -21.5, e, { lid: SK, brow: MU, iris: '#3a2a1a' });
      mouth(g, 14, -5, e, { s: 0.85, style: 'smirk' });
      S(g, 'M5 -10 Q10 -14.5 15 -11.5 Q20 -14.5 26 -10 Q28 -6 24 -6.5 Q20 -9 15 -8 Q10 -8.5 6 -6.5 Q2 -6 5 -10', MU);
      E(g, 19, -15.5, 4.6, 3.8, '#e8946c', { hl: false });
      if (e === 'n' || e === 'b') { S(g, 'M15 -5.5 L28 -8.6 L29 -5.2 L16 -2.6 Z', '#8a5a3a', { hl: false, lw: 1.5 }); E(g, 29.5, -6.9, 1.5, 2, '#ff5a2a', { flat: 1, lw: 1 }); L(g, 'M17 -4.5 L19 -5', 1, '#d9b06a'); }
      S(g, 'M-15 -31 Q-15 -51 3 -52 Q21 -51 20 -33 Q3 -38 -15 -31', HT);
      S(g, 'M-15 -32 Q3 -38.5 20 -34 L20 -38.5 Q3 -43 -15 -37 Z', BD, { hl: false });
      L(g, 'M-1 -51 Q3 -46.5 7 -51', 1.5);
      S(g, 'M-26 -31 Q2 -42 32 -34 Q34 -30 29 -29 Q2 -37 -23 -27 Q-28 -28 -26 -31', HT);
    },
    torso: function (g) {
      var d = 'M-15 3 Q-21 -13 -14 -31 Q0 -35 15 -31 Q23 -13 16 3 Z', p = P(d);
      fs(g, p, SU, bbOf(d), { lw: 0 });
      g.save(); g.clip(p); g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 0.7; for (var x = -20; x < 24; x += 3.6) { g.beginPath(); g.moveTo(x, -36); g.lineTo(x + 1, 6); g.stroke(); } g.restore();
      g.lineWidth = LW; g.strokeStyle = OUT; g.stroke(p);
      S(g, 'M-3 -32 L9 -32 L5.5 -16 L1.5 -16 Z', SH, { hl: false });
      S(g, 'M2.2 -30 L5.8 -30 L6.4 -19 L4 -15 L1.6 -19 Z', BD, { hl: false, lw: 1.4 });
      S(g, 'M-4 -32 L1.5 -16 L-4 -21 L-7 -30 Z', '#2a2e48', { hl: false, lw: 1.4 });
      S(g, 'M10 -32 L5.5 -16 L10.5 -21 L13 -30 Z', '#2a2e48', { hl: false, lw: 1.4 });
      S(g, 'M-12 -25 L-7 -25 L-9.5 -21.5 Z', BD, { hl: false, lw: 1 });
      E(g, 6, -10, 1.3, 1.3, '#ffc93a', { flat: 1, lw: 0.8 }); E(g, 6.5, -5, 1.3, 1.3, '#ffc93a', { flat: 1, lw: 0.8 });
    },
    arm: function (g) { armStd(g, SU, { w: 4.8, cuff: SH }); },
    hand: function (g) { handStd(g, SK); E(g, -1.5, 3.5, 1.6, 1.3, '#ffc93a', { flat: 1, lw: 0.8 }); },
    leg: function (g) { legStd(g, SU, '#f4efe6', { w: 4.9 }); S(g, 'M3 11.5 Q10.6 11 11.4 15.6 Q11.8 20.2 7.6 20.2 L1 20.2 Z', '#1b1b22', { hl: false }); },
    weapon: function (g) {
      S(g, 'M-15 -5 L-2 -6 L-2 2 L-13 6 Z', WD);
      R(g, -1, -1, 5, 9, 2, WD, { hl: false });
      R(g, -3, -8, 19, 9, 2.5, '#34343f');
      R(g, 15, -7, 21, 5.5, 2, '#4a4a58', { hl: false });
      for (var x = 19; x < 34; x += 3.2) L(g, 'M' + x + ' -7 L' + x + ' -1.5', 0.9);
      R(g, 20, -2, 4.5, 7.5, 2, WD, { hl: false });
      E(g, 8, 4, 7.5, 7.5, '#34343f'); E(g, 8, 4, 3.2, 3.2, '#ffc93a', { hl: false, lw: 1.2 });
    }
  });
})();

/* 3 ---- CROUPIER ------------------------------------------------------- */
(function () {
  var SK = '#f6cfae', HR = '#2b1d16', VS = '#a51d36', SH = '#f7f3ea', VI = '#2fc77a', BL = '#16131c';
  def({ id: 'croupier', nome: 'CROUPIER', motto_it: 'Rien ne va plus.', motto_en: 'No more bets.', universo: 'gambler', colore: '#2fc77a', colore2: VS, taglia: 0.98, peso: 2, style: 'thrust', arma: 'rastrello e carte',
    tip: [36, 0], wLen: 36, skin: SK,
    geo: { hip: -24, shF: 6.5, shB: -8.5, hipF: 3.8, hipB: -4, knee: 8, arm: 16, elbow: 8 },
    box: { head: [-26, -50, 38, 6], weapon: [-9, -10, 38, 10], off: [-15, -21, 15, 4], leg: [-10, -9, 14, 27] },
    head: function (g, e) {
      headBase(g, SK);
      S(g, 'M-18.5 -15 Q-21 -42 4 -41.5 Q23 -40 23 -26 Q16 -34.5 4 -33.5 Q-8 -33 -12.5 -24 Q-14.5 -18 -18.5 -15', HR);
      L(g, 'M-6 -38.5 Q2 -35.5 9 -36', 1, '#6b4a3a');
      eyes(g, 9, -20.5, e, { h: 4.3, brow: HR, iris: '#2e6b3e' });
      nose(g);
      mouth(g, 13, -8.5, e, { style: 'smirk', s: 0.9 });
      L(g, 'M9.5 -12 Q13 -13.6 16.8 -11.6', 1.8, HR);
      S(g, 'M-17.5 -27 Q2 -36.5 22.5 -29.5 L22.5 -25.5 Q2 -32 -17.5 -23 Z', '#1a8f56', { hl: false });
      S(g, 'M6 -29.5 Q21 -34.5 35 -26.5 Q25 -21.5 10 -25.5 Z', VI);
    },
    torso: function (g) {
      R(g, -10.5, -8, 21, 11, [3, 3, 6, 6], BL, { hl: false });
      R(g, -11.5, -32, 23, 27, [9, 9, 5, 5], SH);
      S(g, 'M-11.5 -26 Q-11.5 -32 -6 -32 L1 -14 L8 -32 Q11.5 -31 11.5 -26 L11.5 -6 L-11.5 -6 Z', VS);
      E(g, 1, -10.5, 1.3, 1.3, '#ffc93a', { flat: 1, lw: 0.8 }); E(g, 1, -7, 1.3, 1.3, '#ffc93a', { flat: 1, lw: 0.8 });
      S(g, 'M3 -31 L-4 -35 L-4 -27 Z', BL, { hl: false, lw: 1.2 }); S(g, 'M3 -31 L10 -35 L10 -27 Z', BL, { hl: false, lw: 1.2 }); E(g, 3, -31, 1.8, 2, '#3a2a4a', { flat: 1, lw: 1 });
    },
    arm: function (g) { C(g, 0, -1, 0, 13.5, 3.8, SH, { hl: false }); R(g, -4.4, 3, 8.8, 2.8, 1, VS, { flat: 1, lw: 1 }); },
    hand: function (g) { handStd(g, SK); },
    leg: function (g) { legStd(g, BL, '#2a2230', { sole: '#000', w: 4, ext: 4 }); },
    weapon: function (g) { C(g, -6, 0, 33, 0, 1.6, '#b07a45', { hl: false }); R(g, 31.5, -7.5, 4.2, 15, 1.5, '#e0b84e'); },
    off: function (g) {
      [-0.5, 0, 0.5].forEach(function (a, i) {
        g.save(); g.rotate(a); R(g, -3.8, -15, 7.6, 10.5, 1.6, '#ffffff', { hl: false, lw: 1.5 });
        var cc = i === 1 ? '#1b1b22' : '#e0274b'; g.fillStyle = cc; g.beginPath(); g.moveTo(0, -12.6); g.lineTo(2, -9.8); g.lineTo(0, -7); g.lineTo(-2, -9.8); g.closePath(); g.fill();
        g.restore();
      });
    }
  });
})();

/* 4 ---- AGAMENNONE ----------------------------------------------------- */
(function () {
  var SK = '#d9a27a', BZ = '#e3ad40', CR = '#d32f2f', BE = '#2a1b14', CP = '#b71c1c', SK2 = '#8e2020', WD = '#8a5a2a';
  def({ id: 'agamennone', nome: 'AGAMENNONE', motto_it: 'Re dei re, re del tavolo.', motto_en: 'King of kings, king of the table.', universo: 'gambler', colore: '#e3ad40', colore2: CR, taglia: 1.05, peso: 3, style: 'thrust', arma: 'lancia e scudo',
    tip: [53, 0], wLen: 50, skin: SK,
    box: { head: [-30, -68, 30, 12], weapon: [-18, -8, 56, 8], back: [-31, -37, 13, 15], off: [-16, -19, 16, 19] },
    backPivot: [-2, -30],
    head: function (g, e) {
      S(g, 'M-25 -30 Q-28 -63 6 -65 Q24 -65 28 -52 Q13 -56 5 -52 Q-9 -49 -15 -37 Z', CR);
      L(g, 'M-17 -40 Q-14 -54 2 -58', 1.2, SHc(CR)); L(g, 'M-10 -44 Q-6 -55 8 -59', 1.2, SHc(CR));
      headBase(g, SK, { noEar: 1 });
      S(g, 'M4 -15 Q12 -17 20 -15 L19 1 Q12 10 5 2 Z', BE, { hl: false });
      eyes(g, 10.5, -24.5, e, { s: 0.95, sp: 6, iris: '#5a3a1a', brow: BE });
      mouth(g, 12.5, -10, e, { s: 0.8 });
      var p = new Path2D('M-20 -14 Q-22 -44 2 -44 Q26 -44 25.5 -20 L25.5 -4 Q20 -1 16 -1.5 L16 -19.5 L8 -19.5 L8 -1.5 Q-2 -1 -8 -3 Q-18 -5 -20 -14 Z M3 -29.5 L24 -29.5 L24 -19.5 L3 -19.5 Z');
      fs(g, p, BZ, [-20, -44, 46, 43], { eo: 1 });
      R(g, 10.6, -30.5, 3, 11, 1.2, BZ, { hl: false, lw: 1.4 });
      L(g, 'M-9 -38 Q2 -41.5 15 -39', 1.1, SHc(BZ));
      E(g, -10, -13, 1.6, 1.6, SHc(BZ), { flat: 1, lw: 0 });
    },
    torso: function (g) {
      for (var i = 0; i < 5; i++) R(g, -14 + i * 5.7, -9, 5.6, 12.5, 2, SK2, { hl: false, lw: 1.5 });
      S(g, 'M-15 -29 Q0 -34 15 -29 L14.5 -5 Q0 -1 -14.5 -5 Z', BZ);
      L(g, 'M-7 -21 Q-2 -17 2.5 -21', 1.3); L(g, 'M4.5 -21 Q9 -17 13 -21', 1.3); L(g, 'M4 -15 L4 -6.5', 1.1);
    },
    back: function (g) { S(g, 'M-13 -31 Q-25 -10 -27 9 Q-15 13 -3 9 Q-2 -12 9 -31 Z', CP); },
    arm: function (g) { armStd(g, SK, { w: 4.2 }); R(g, -5, 5, 10, 6.5, 2, BZ, { hl: false }); },
    hand: function (g) { handStd(g, SK); },
    leg: function (g) { legStd(g, SK, '#7a4a24', { w: 4.3 }); R(g, -5.2, 1, 10.4, 9, 3, BZ, { hl: false }); },
    weapon: function (g) {
      C(g, -14, 0, 40, 0, 1.6, WD, { hl: false });
      S(g, 'M38 -5 L53 0 L38 5 L40.5 0 Z', '#dfe5ee');
      R(g, 35.5, -2.8, 4, 5.6, 1, BZ, { hl: false, lw: 1.2 });
    },
    off: function (g) {
      E(g, 0, 0, 13, 15.5, BZ);
      E(g, 0, 0, 9.5, 11.5, CR, { hl: false });
      L(g, 'M-4.5 5.5 L0 -6.5 L4.5 5.5', 2.8, '#ffe7a8');
      [0, 1, 2, 3, 4, 5].forEach(function (k) { var a = k / 6 * TAU; dot(g, Math.cos(a) * 11.3, Math.sin(a) * 13.5, 0.9, '#fff3c4'); });
    }
  });
})();

/* 5 ---- LA LEONESSA ---------------------------------------------------- */
(function () {
  var SK = '#c98a5c', MN = '#f2a531', MN2 = '#d9781c', LT = '#7a3b1e', ST = '#c9d3de', GD = '#ffcf40', HR = '#3a1f14';
  def({ id: 'gladiatrice', nome: 'LA LEONESSA', motto_it: 'L\'arena ruggisce per me.', motto_en: 'The arena roars for me.', universo: 'gambler', colore: '#f2a531', colore2: LT, taglia: 1, peso: 3, style: 'thrust', arma: 'tridente e rete',
    tip: [54, 0], wLen: 52, skin: SK,
    box: { head: [-33, -58, 35, 9], weapon: [-16, -12, 57, 12], off: [-18, -8, 13, 26] },
    head: function (g, e) {
      SPK(g, 0, -22, 22.5, 22.5, 11, 6.5, 0.15, MN, { sharp: 1 });
      headBase(g, SK, { noEar: 1 });
      E(g, -8, -41, 4.4, 4.4, MN2, { hl: false }); E(g, 14, -41.5, 4.4, 4.4, MN2, { hl: false });
      S(g, 'M-18 -24 Q-17 -43.5 3 -44 Q21 -44 23.5 -28 Q14 -34 3 -33 Q-8 -33 -18 -24', MN2);
      E(g, 11, -34, 6.5, 3.8, '#f5c46a', { hl: false });
      F(g, 'M8.6 -36.6 L13.4 -36.6 L11 -33.8 Z', OUT);
      L(g, 'M2.5 -37.6 L5.5 -36.6', 1.5); L(g, 'M16.5 -36.6 L19.5 -37.6', 1.5);
      L(g, 'M-1.5 -14 L3 -13.4', 1.7, '#e0274b'); L(g, 'M-1.5 -10.6 L3 -10', 1.7, '#e0274b');
      eyes(g, 9.5, -21.5, e, { iris: '#7a4a1a', lash: 1, brow: HR });
      nose(g);
      mouth(g, 12.5, -10, e, { style: 'smirk' });
    },
    torso: function (g) {
      R(g, -13, -8, 26, 11, [3, 3, 7, 7], LT, { hl: false });
      for (var i = 0; i < 4; i++) R(g, -12.5 + i * 6.5, -4, 6, 9, 2, LT, { hl: false, lw: 1.4 });
      R(g, -14, -32, 28, 25, [11, 11, 6, 6], SK);
      S(g, 'M-14 -27 Q0 -31 14 -27 L14 -16 Q0 -13 -14 -16 Z', LT);
      L(g, 'M-9.5 -31.5 L7 -16', 4.2, OUT); L(g, 'M-9.5 -31.5 L7 -16', 2.2, LT);
      R(g, -13.6, -9, 27.2, 4.2, 1.5, GD, { hl: false });
    },
    arm: function (g, f) {
      if (f) { armStd(g, ST, { w: 4.7 }); [1.5, 5, 8.5].forEach(function (y) { L(g, 'M-4.6 ' + y + ' Q0 ' + (y + 1.6) + ' 4.6 ' + y, 1.1); }); }
      else { armStd(g, SK, { w: 4.2 }); R(g, -4.9, 6, 9.8, 6, 2, LT, { hl: false }); }
    },
    hand: function (g) { handStd(g, SK); },
    leg: function (g) { legStd(g, SK, LT, { w: 4.3 }); R(g, -5.3, 1, 10.6, 8.5, 3, ST, { hl: false }); },
    weapon: function (g) {
      C(g, -12, 0, 36, 0, 1.6, '#8a5a2a', { hl: false });
      S(g, 'M35 -8.5 L46 -8.5 L50 -7 L46 -5.5 L36 -5.5 Z', GD, { hl: false });
      S(g, 'M36 -1.5 L50 -1.5 L54 0 L50 1.5 L36 1.5 Z', GD, { hl: false });
      S(g, 'M35 8.5 L46 8.5 L50 7 L46 5.5 L36 5.5 Z', GD, { hl: false });
      R(g, 32.5, -9, 4, 18, 1.5, GD, { hl: false });
    },
    off: function (g) {
      var d = 'M-5 -3 Q-15 5 -12 19 Q-2 23 9 17 Q7 5 3 -3 Z', p = P(d);
      g.fillStyle = 'rgba(232,215,168,0.55)'; g.fill(p);
      g.save(); g.clip(p); g.strokeStyle = '#e8d7a8'; g.lineWidth = 1.3;
      for (var k = -30; k < 30; k += 4) { g.beginPath(); g.moveTo(k, -6); g.lineTo(k + 26, 26); g.moveTo(k + 26, -6); g.lineTo(k, 26); g.stroke(); }
      g.restore(); g.lineWidth = 1.6; g.strokeStyle = OUT; g.stroke(p);
    }
  });
})();

/* 6 ---- KID KO --------------------------------------------------------- */
(function () {
  var SK = '#9a5a36', HR = '#1b1414', RB = '#1e63d6', TR = '#ffd23f', GL = '#e53935';
  def({ id: 'pugile', nome: 'KID KO', motto_it: 'Un pugno, un giro.', motto_en: 'One punch, one round.', universo: 'gambler', colore: '#ff3b3b', colore2: RB, taglia: 1, peso: 3, style: 'punch', arma: 'guantoni',
    skin: SK, wLen: 0,
    geo: { shF: 10, shB: -12, shY: -26 },
    box: { head: [-26, -54, 30, 6], torso: [-22, -38, 22, 8], hand: [-14, -14, 13, 13] },
    head: function (g, e) {
      headBase(g, SK);
      S(g, 'M-15 -29 Q-16 -48 3 -49 Q21 -48 20 -30 Q3 -35 -15 -29', HR);
      S(g, 'M-17.5 -27 Q2 -36.5 22 -29 L22 -24 Q2 -31 -17.5 -22 Z', TR, { hl: false });
      eyes(g, 9, -20, e, { iris: '#3a2210', brow: HR });
      nose(g);
      mouth(g, 12, -9.5, e, { style: 'grin' });
      g.save(); g.translate(16.5, -14.5); g.rotate(-0.55); R(g, -3.8, -1.5, 7.6, 3, 1, '#f5d6a8', { hl: false, lw: 1 }); g.restore();
    },
    torso: function (g) {
      R(g, -13, -8, 26, 11, [3, 3, 7, 7], GL, { hl: false });
      R(g, -13, -8, 26, 3, 1, '#ffffff', { hl: false, lw: 1.2 });
      S(g, 'M-17 -27 Q-17 -33 -9 -33 L10 -33 Q18 -33 18 -27 L12 -6 L-11 -6 Z', SK);
      L(g, 'M-3 -24 Q1 -21 5 -24', 1.1); L(g, 'M-1 -17 L-1 -12', 1);
      S(g, 'M-17 -27 Q-17 -33 -9 -33 L-1 -33 L-3 -13 L-5 -3 L-13 -3 Z', RB);
      S(g, 'M10 -33 Q18 -33 18 -27 L13 -3 L9 -3 L6 -14 Z', RB);
      L(g, 'M-1 -31 L-3 -13 L-5 -3.5', 1.8, TR); L(g, 'M10 -31 L6 -14 L9 -3.5', 1.8, TR);
    },
    arm: function (g) { armStd(g, RB, { w: 5, cuff: TR }); },
    hand: function (g) {
      E(g, -6.5, -0.5, 3.8, 4.8, GL, { hl: false });
      E(g, 1, 2, 9.2, 8.6, GL);
      L(g, 'M-2 -1 Q1 4 -1 8', 1.2, SHc(GL));
      R(g, -6.8, -11, 13.6, 5.2, 2, '#ffffff', { hl: false });
    },
    leg: function (g) { legStd(g, SK, GL, { w: 4.3 }); R(g, -5.4, 5.5, 10.8, 4, 1.5, '#fff', { hl: false, lw: 1.4 }); L(g, 'M-1 11 L3 11 M-1 13.5 L3 13.5', 1, '#fff'); }
  });
})();

/* 7 ---- PINNA ---------------------------------------------------------- */
(function () {
  var BL = '#3d8fe0', WH = '#eef6fb', BD = '#1f4f86';
  function teeth(g, d, x0, x1, y0, y1, yb0, yb1) {
    var p = P(d); g.fillStyle = MOUTH; g.fill(p);
    g.save(); g.clip(p); g.fillStyle = '#fff';
    var n = 6, k;
    for (k = 0; k < n; k++) { var a = x0 + (x1 - x0) * k / n, b = x0 + (x1 - x0) * (k + 1) / n, ya = y0 + (y1 - y0) * k / n, yb = y0 + (y1 - y0) * (k + 1) / n; g.beginPath(); g.moveTo(a, ya - 2); g.lineTo(b, yb - 2); g.lineTo((a + b) / 2, (ya + yb) / 2 + 3.2); g.closePath(); g.fill(); }
    if (yb0 != null) for (k = 0; k < n - 1; k++) { var c = x0 + 2 + (x1 - x0 - 4) * k / (n - 1), dd = x0 + 2 + (x1 - x0 - 4) * (k + 1) / (n - 1), yc = yb0 + (yb1 - yb0) * k / (n - 1); g.beginPath(); g.moveTo(c, yc + 3); g.lineTo(dd, yc + 3); g.lineTo((c + dd) / 2, yc - 1.6); g.closePath(); g.fill(); }
    g.restore(); g.lineWidth = 1.5; g.strokeStyle = OUT; g.stroke(p);
  }
  def({ id: 'pinna', nome: 'PINNA', motto_it: 'Annuso le puntate da un miglio.', motto_en: 'I smell a bet a mile away.', universo: 'gambler', colore: '#2fa8e0', colore2: WH, taglia: 1.12, peso: 4, style: 'punch', arma: 'morso e artigli',
    skin: BL, wLen: 0,
    box: { head: [-22, -66, 34, 6], back: [-37, -24, -4, 8], arm: [-13, -7, 8, 18] },
    backPivot: [-9, -4], capeK: 0.7,
    head: function (g, e) {
      S(g, 'M-7 -36 Q-6 -55 -16 -62 Q6 -58 13 -38 Z', BL);
      S(g, 'M-18 -14 Q-21 -40 3 -42 Q23 -42 29 -24 Q31 -12 25 -6 Q9 -2 -6 -4 Q-16 -6 -18 -14', BL);
      S(g, 'M-9 -8 Q8 -15 28.5 -17 Q30 -9 25 -6 Q9 -2 -6 -4 Q-10 -5 -9 -8', WH, { hl: false });
      L(g, 'M-11 -25 Q-13 -21 -11 -17', 1.4); L(g, 'M-6.5 -26 Q-8.5 -22 -6.5 -18', 1.4);
      if (e === 'a' || e === 'w') teeth(g, 'M0 -13 Q14 -17 28 -20 Q27 -5 14 -4.5 Q4 -6 0 -13', 1, 27, -13, -19.5, -7, -6);
      else if (e === 'k') { teeth(g, 'M4 -13 Q14 -16 25 -17.5 Q24 -6 14 -6 Q6 -7 4 -13', 4, 24, -13, -17, null); E(g, 16, -7.5, 3, 2, TONGUE, { flat: 1, lw: 1 }); }
      else if (e === 'h') teeth(g, 'M6 -12 Q14 -14 23 -15.5 Q21 -9.5 14 -9.5 Q8 -9.5 6 -12', 6, 22, -12, -15, null);
      else teeth(g, 'M2 -12 Q14 -15 27 -18 Q25 -10 15 -9 Q6 -9 2 -12', 2, 26, -12, -17.5, -10.5, -10);
      eyes(g, 12, -27.5, e, { s: 0.82, sp: 6.4, iris: '#1d2a4a', brow: BD });
    },
    torso: function (g) { R(g, -14, -32, 28, 36, [11, 11, 8, 8], BL); E(g, 4, -13, 9.5, 13.5, WH, { hl: false }); L(g, 'M-1 -17 Q4 -15 9 -17 M-1 -11 Q4 -9 9 -11', 1, '#c3d6e3'); },
    back: function (g) { S(g, 'M-9 -10 Q-22 -8 -29 -20 Q-27 -6 -34 5 Q-21 0 -8 2 Z', BL); },
    arm: function (g) { S(g, 'M-3 2 Q-11 6 -9.5 13 Q-6 8.5 -3 9.5 Z', BL, { hl: false }); armStd(g, BL, { w: 4.8 }); },
    hand: function (g) { E(g, 0, 0.5, 5.6, 5.3, BL, { hl: false }); S(g, 'M-1 4 L0.5 8.5 L1.5 4.4 Z', '#fff', { hl: false, lw: 1 }); S(g, 'M2.5 3.4 L4.5 7.5 L4.6 2.6 Z', '#fff', { hl: false, lw: 1 }); },
    leg: function (g) {
      C(g, 0, -2, 0, 11, 5, BL, { hl: false });
      S(g, 'M-6 9 L5 9 Q11.5 11 11.5 16 Q11.5 20.2 7 20.2 L-6 20.2 Q-7.5 20.2 -7.5 18 L-7.5 11 Q-7.5 9 -6 9', BL);
      S(g, 'M9 18.5 L13.5 20 L9.5 15.5 Z', '#fff', { hl: false, lw: 0.9 }); S(g, 'M5 19 L8.5 21 L6.5 16.5 Z', '#fff', { hl: false, lw: 0.9 });
    }
  });
})();

/* 8 ---- POLPONE -------------------------------------------------------- */
(function () {
  var PU = '#a64ad8', SP = '#d58cf0', SU = '#ffc2e8', PD = '#7a2fb0';
  def({ id: 'polpone', nome: 'POLPONE', motto_it: 'Otto braccia, otto puntate.', motto_en: 'Eight arms, eight bets.', universo: 'gambler', colore: '#c45cff', colore2: SU, taglia: 1.1, peso: 3, style: 'punch', arma: 'tentacoli',
    skin: PU, wLen: 0,
    box: { head: [-31, -66, 34, 6], back: [-32, -13, 27, 21], leg: [-10, -5, 17, 24] },
    backPivot: [0, -6], capeK: 0.3,
    head: function (g, e) {
      S(g, 'M-21 -6 Q-29 -30 -15 -49 Q2 -62 19 -49 Q31 -30 25 -6 Q2 1 -21 -6', PU);
      E(g, -10, -38, 3.4, 2.6, SP, { flat: 1, lw: 0 }); E(g, -2, -50, 2.6, 2, SP, { flat: 1, lw: 0 }); E(g, -15, -25, 2.4, 3, SP, { flat: 1, lw: 0 }); E(g, 14, -47, 2.2, 1.7, SP, { flat: 1, lw: 0 }); E(g, -6, -30, 1.6, 1.4, SP, { flat: 1, lw: 0 });
      eyes(g, 7, -18, e, { s: 1.2, sp: 6.6, iris: '#ffcf33', pupil: 'bar', brow: '#5a1f80' });
      if (e === 'n' || e === 'b') { E(g, 15, -6.5, 3, 2.4, SP, { hl: false, lw: 1.4 }); E(g, 15.6, -6.5, 1.3, 1.1, MOUTH, { flat: 1, lw: 0 }); }
      else mouth(g, 12, -7.5, e, { s: 0.8 });
    },
    torso: function (g) { R(g, -12, -30, 24, 32, [10, 10, 8, 8], PU); E(g, 3, -14, 7, 10, SP, { hl: false }); },
    back: function (g) {
      S(g, 'M-9 -8 Q-23 -6 -27 6 Q-28 16 -19 16 Q-15 14 -19 12 Q-23 8 -18 2 Q-14 -2 -7 -1 Z', PD);
      S(g, 'M6 -6 Q20 -2 22 10 Q22 18 14 17 Q11 15 15 13 Q17 8 13 3 Q10 0 5 1 Z', PD);
    },
    arm: function (g) { C(g, 0, -1, 0, 12.5, 4.2, PU, { hl: false }); [2, 6, 10].forEach(function (y) { E(g, -2.6, y, 1.2, 1.2, SU, { flat: 1, lw: 0.7 }); }); },
    hand: function (g) { S(g, 'M-4 -3 Q-6.5 6 0 8 Q6.5 8 5.5 1.5 Q3.5 5 1 3.8 Q-1.4 2 1.5 -3 Z', PU, { hl: false }); },
    leg: function (g) {
      S(g, 'M-5 -3 Q-6 12 -1 17 Q5 22.5 12.5 19 Q15.5 16 11 15.5 Q5 17.5 3 11 Q2 4 5 -3', PU);
      [[0.5, 14.5], [4, 17.4], [-2, 9.5], [8, 18.6]].forEach(function (q) { E(g, q[0], q[1], 1.2, 1.2, SU, { flat: 1, lw: 0.7 }); });
    }
  });
})();

/* 9 ---- LUPO MANNARO --------------------------------------------------- */
(function () {
  var FU = '#7a85a6', FD = '#535c7c', BE = '#d0d6e2', EY = '#ffd23f', SH = '#7b3fb0', PA = '#3b2f4a', IN = '#c99aae';
  def({ rim: 0.55, id: 'lupo', nome: 'LUPO MANNARO', motto_it: 'Stanotte la luna è mia.', motto_en: 'Tonight the moon is mine.', universo: 'gambler', colore: '#ffd23f', colore2: SH, taglia: 1.1, peso: 3, style: 'punch', arma: 'artigli',
    skin: FU, wLen: 0,
    box: { head: [-30, -60, 40, 6], back: [-31, -38, 0, -4] },
    backPivot: [-8, -10], capeK: 0.6,
    head: function (g, e) {
      S(g, 'M-15 -27 L-13 -50 L-2 -35 Z', FD);
      S(g, 'M-17 -10 L-27 -13 L-19 -18 L-27 -23 L-17 -25 Z', FU);
      S(g, 'M-18 -16 Q-20 -40 2 -40 Q16 -40 21 -30 L34 -23 Q38 -18 34 -13 L21 -8 Q9 0 -6 -2 Q-16 -4 -18 -16', FU);
      S(g, 'M14 -22 L34 -22 Q38 -18 34 -13 L19 -9 Q12 -13 14 -22', BE, { hl: false });
      if (e === 'a' || e === 'w') {
        S(g, 'M16 -12 Q26 -15 35 -14.5 Q32 -4 22 -4.5 Q16 -6 16 -12', MOUTH, { flat: 1, lw: 1.5 });
        F(g, 'M19 -12.6 L21 -9.5 L23 -13.1 L25 -10 L27 -13.5 L29 -10.5 L31 -13.8 L33 -11 L34 -14.3 Z', '#fff');
        F(g, 'M19 -5.5 L21.5 -8 L24 -5.3 L26.5 -7.6 L29 -5.5 L31 -7.6 L32 -6 Z', '#fff');
      } else if (e === 'k') { L(g, 'M19 -11 Q27 -13 33 -14', 1.6); E(g, 27, -8.5, 2.6, 4, TONGUE, { flat: 1, lw: 1.2 }); }
      else { L(g, 'M19 -11 Q27 -13 33 -14', 1.6); S(g, 'M24 -12.4 L26.6 -12.9 L25.4 -8.6 Z', '#fff', { hl: false, lw: 1 }); }
      E(g, 35, -19.5, 3.4, 2.7, OUT, { flat: 1, lw: 0 }); dot(g, 35.8, -20.5, 0.9, '#8a8fb0');
      eyes(g, 6.5, -26, e === 'n' ? 'a' : e, { s: 0.9, sp: 5.6, iris: EY, brow: FD });
      S(g, 'M1 -35 L9 -55 L16 -33 Z', FU);
      F(g, 'M4.5 -36 L9 -50 L12.5 -35 Z', IN);
    },
    torso: function (g) {
      R(g, -13, -8, 26, 11, [3, 3, 7, 7], PA, { hl: false });
      R(g, -14, -32, 28, 26, [11, 11, 6, 6], FU);
      S(g, 'M-14 -27 Q0 -33 14 -27 L14 -10 L11 -6 L8.5 -10 L5 -5 L2 -10 L-1.5 -5.5 L-5 -10 L-8.5 -5.5 L-11 -10 L-14 -7 Z', SH);
      S(g, 'M-3 -32 L9 -32 L6.5 -24 L4 -28 L1.5 -22 L-1 -28 Z', BE, { hl: false });
    },
    back: function (g) { S(g, 'M-8 -10 Q-20 -12 -27 -25 L-23.5 -22.5 Q-25 -30 -20 -34 Q-19 -28 -16 -27 Q-14 -32 -10 -32 Q-10 -24 -4 -16 Z', FU); },
    arm: function (g) { armStd(g, FU, { w: 4.8 }); S(g, 'M-5.6 -3 L5.6 -3 L5.6 4 L3 2.5 L1 5.5 L-1.5 2.5 L-3.5 5 L-5.6 3 Z', SH, { hl: false }); },
    hand: function (g) {
      E(g, 0, 0.3, 5.5, 5.3, FU, { hl: false });
      S(g, 'M-3 3.5 L-3.4 9.5 L-0.8 4.2 Z', '#fff', { hl: false, lw: 1 }); S(g, 'M0.4 4.2 L0.6 10.5 L2.6 4 Z', '#fff', { hl: false, lw: 1 }); S(g, 'M3.4 3 L5 8.6 L5.4 2 Z', '#fff', { hl: false, lw: 1 });
    },
    leg: function (g) {
      C(g, 0, -2, 0, 10, 4.8, PA, { hl: false });
      S(g, 'M-5.5 10 L5 10 Q11 11 11.5 16 Q11.8 20.2 7.6 20.2 L-5.5 20.2 Q-7 20.2 -7 18.4 L-7 12 Q-7 10 -5.5 10', FU);
      S(g, 'M-5 4 L5 4 L5 9 L3 7.5 L1 10.5 L-1.5 7.5 L-3.5 10 L-5 8.5 Z', PA, { hl: false });
      S(g, 'M8.5 19.5 L13 20.5 L10 16.5 Z', '#fff', { hl: false, lw: 0.9 }); S(g, 'M5 19.8 L8.6 21.2 L6.8 17 Z', '#fff', { hl: false, lw: 0.9 });
    }
  });
})();

/* 10 ---- LA VEGGENTE --------------------------------------------------- */
(function () {
  var SK = '#d8a07a', SC = '#e0338f', GD = '#ffcf40', RB = '#13807a', BA = '#7ef0ff', HR = '#2a1630';
  def({ id: 'veggente', nome: 'LA VEGGENTE', motto_it: 'Ho già visto come finisce.', motto_en: 'I\'ve seen how this ends.', universo: 'gambler', colore: '#c86bff', colore2: BA, taglia: 0.98, peso: 2, style: 'cast', up: true, arma: 'sfera di cristallo',
    tip: [0, -13], wLen: 14, skin: SK,
    geo: { hip: -18 },
    box: { head: [-37, -52, 30, 10], torso: [-29, -38, 29, 20], weapon: [-12, -25, 12, 2] },
    head: function (g, e) {
      S(g, 'M-19 -22 Q-27 -2 -18 7 Q-11 6 -9 -2 L-13 -24 Z', HR);
      headBase(g, SK, { noEar: 1 });
      S(g, 'M-17 -31 Q-30 -30 -33 -15 Q-26 -20 -19 -22 Z', SC);
      S(g, 'M-20 -17 Q-23 -45 2 -45 Q25 -45 24.5 -26 Q12 -32.5 0 -31.5 Q-12 -30.5 -20 -17', SC);
      [[-15, -24], [-9, -28.5], [-2, -30.6], [5, -31.4], [12, -31], [19, -29]].forEach(function (q) { E(g, q[0], q[1] + 2.4, 2.1, 2.1, GD, { hl: false, lw: 1 }); });
      E(g, 6, -38.5, 3.2, 3.8, BA, { hl: false });
      ring(g, -12.5, -7, 3.8, 3.6, OUT); ring(g, -12.5, -7, 3.8, 1.7, GD);
      g.fillStyle = 'rgba(160,60,200,0.35)'; g.beginPath(); g.ellipse(9, -24, 12, 3.5, -0.05, 0, TAU); g.fill();
      eyes(g, 9, -20.5, e, { iris: '#6a2a8a', lash: 1, brow: HR });
      nose(g);
      mouth(g, 12, -9.5, e, { style: 'smile' });
    },
    torso: function (g) {
      R(g, -14, -32, 28, 27, [11, 11, 6, 6], RB);
      S(g, 'M-14 -12 L14 -12 Q20 -2 25 12 Q0 18 -25 12 Q-20 -2 -14 -12 Z', RB); L(g, 'M-23 10.5 Q0 16 23 10.5', 1.6, '#ffcf40'); L(g, 'M-8 -10 Q-12 2 -14 13 M6 -10 Q9 2 11 14', 1.1, SHc(RB));
      S(g, 'M-15 -30 Q0 -25 15 -30 L14 -17 L11 -14 L8 -17 L5 -13 L2 -16.5 L-1 -13 L-4 -16.5 L-7 -13 L-10 -16 L-14 -16 Z', SC);
      [[-6, -22], [0, -20.5], [6, -22]].forEach(function (q) { E(g, q[0], q[1], 1.8, 1.8, GD, { hl: false, lw: 0.9 }); });
    },
    arm: function (g) { S(g, 'M-4.4 -2 L4.4 -2 L7 13 Q0 15.5 -7 13 Z', RB); },
    hand: function (g) { E(g, 0, -4.2, 4.8, 1.8, GD, { hl: false, lw: 1 }); handStd(g, SK); },
    leg: function (g) { legStd(g, RB, '#6a1f4a', { ext: -2 }); },
    weapon: function (g) {
      R(g, -5.5, -4.5, 11, 5, 2, GD, { hl: false });
      E(g, 0, -14, 9.5, 9.5, BA);
      E(g, 2, -12, 3.6, 3, '#ff9be0', { flat: 1, lw: 0 });
      L(g, 'M-4.5 -16 Q0 -21 4.5 -16.5', 1.3, '#ffffff');
    }
  });
})();

/* 11 ---- NITRO --------------------------------------------------------- */
(function () {
  var OR = '#ff7a1a', WH = '#ffffff', VI = '#20263a', GL = '#22232b', WR = '#c5ced9', SK = '#f2c6a0';
  def({ id: 'pilota', nome: 'NITRO', motto_it: 'Frenare è da perdenti.', motto_en: 'Brakes are for losers.', universo: 'gambler', colore: '#ff7a1a', colore2: WH, taglia: 0.98, peso: 2, style: 'melee', arma: 'chiave inglese',
    tip: [34, 0], wLen: 36, skin: SK,
    geo: { hip: -16, neck: -29, shY: -23, shF: 11, shB: -13, hipF: 6, hipB: -6, knee: 5, legR: 6.6, armR: 6.2 },
    box: { head: [-25, -48, 30, 4], torso: [-23, -36, 23, 8], weapon: [-7, -12, 40, 12], leg: [-11, -9, 15, 23] },
    head: function (g, e) {
      var hp = new Path2D(); hp.ellipse(2, -21, 22.5, 22, 0, 0, TAU);
      fs(g, hp, OR, [-20.5, -43, 45, 44], { lw: 0 });
      g.save(); g.clip(hp); F(g, 'M-4 -46 L3 -46 L-5 4 L-12 4 Z', WH); g.restore();
      g.lineWidth = LW; g.strokeStyle = OUT; g.stroke(hp);
      var wp = rrp(1, -31, 23.5, 19.5, 8);
      fs(g, wp, SK, [1, -31, 23.5, 19.5], { hl: false });
      g.save(); g.clip(wp);
      eyes(g, 12.5, -22.5, e, { s: 0.92, sp: 5.6, iris: '#2a4a8a', brow: '#4a2a14' });
      mouth(g, 14.5, -15.5, e, { s: 0.8, style: 'grin' });
      g.restore(); g.lineWidth = LW; g.strokeStyle = OUT; g.stroke(wp);
      S(g, 'M-1 -31 Q12 -37 26.5 -30 L26 -35 Q12 -42 -1 -36 Z', VI, { hl: false });
      L(g, 'M6 -36.5 L12 -37.8', 1.2, '#7b8bb8');
      E(g, -10.5, -20, 6, 6.5, WH, { hl: false });
      num(g, '1', -10.5, -19.6, 9, OUT);
    },
    torso: function (g) {
      R(g, -16, -8, 32, 11, [3, 3, 8, 8], OR, { hl: false });
      var p = rrp(-18, -30, 36, 25, [12, 12, 8, 8]); fs(g, p, OR, [-18, -30, 36, 25], { lw: 0 });
      g.save(); g.clip(p); g.fillStyle = WH; g.fillRect(-9, -33, 3.2, 30); g.fillRect(-4.5, -33, 1.5, 30); g.restore();
      g.lineWidth = LW; g.strokeStyle = OUT; g.stroke(p);
      [[3, -26], [6, -23]].forEach(function (q) { g.fillStyle = OUT; g.fillRect(q[0], q[1], 3, 3); }); g.fillStyle = WH; g.fillRect(6, -26, 3, 3); g.fillRect(3, -23, 3, 3);
      g.lineWidth = 1; g.strokeStyle = OUT; g.strokeRect(3, -26, 6, 6);
      R(g, -17.6, -8.5, 35.2, 4.5, 1.5, GL, { hl: false });
    },
    arm: function (g) { armStd(g, OR, { cuff: GL, w: 5.4 }); L(g, 'M-2.5 -2 L-2.5 9', 1.6, WH); },
    hand: function (g) { handStd(g, GL); },
    leg: function (g) { legStd(g, OR, GL, { sole: '#fff', w: 5.8, ext: -3 }); },
    weapon: function (g) {
      R(g, -3, -2.6, 28, 5.2, 2.2, WR, { hl: false });
      R(g, -3.5, -3.2, 11, 6.4, 2.5, '#e0274b', { hl: false });
      S(g, 'M23 -8 Q33.5 -10.5 36.5 -3.2 L30.5 -3.2 L30.5 3.2 L36.5 3.2 Q33.5 10.5 23 8 Z', WR);
    }
  });
})();

/* 12 ---- STECCA -------------------------------------------------------- */
(function () {
  var SK = '#f1c19b', HR = '#6b3b1f', CP = '#2459d6', YL = '#ffd23f', PA = '#2b3a6b', CU = '#d9a866';
  def({ id: 'stecca', nome: 'STECCA', motto_it: 'Otto in buca d\'angolo. Chiamata.', motto_en: 'Eight ball, corner pocket. Called.', universo: 'gambler', colore: '#ffd23f', colore2: CP, taglia: 0.98, peso: 2, style: 'thrust', arma: 'stecca e palle numerate',
    tip: [47, 0], wLen: 46, skin: SK,
    geo: { hip: -27, shF: 6, shB: -8, hipF: 3.5, hipB: -3.5, knee: 9.5, arm: 16.5, elbow: 8 },
    box: { head: [-35, -51, 30, 6], weapon: [-19, -6, 49, 6], off: [-8, -8, 8, 8], leg: [-10, -9, 14, 30] },
    head: function (g, e) {
      headBase(g, SK);
      S(g, 'M-17.5 -25 Q-16 -45 3 -45.5 Q20.5 -45 21.5 -30 Q3 -36 -17.5 -25', CP);
      S(g, 'M-13 -32.5 Q-26 -35 -33 -28 Q-25 -25.5 -15 -27.5 Z', '#1b3fa0');
      S(g, 'M8 -31 Q19 -34 23 -24.5 Q18 -27.5 13 -25.5 Q11 -29 8 -31', HR);
      E(g, 5, -38.5, 4.3, 3.8, '#16161c', { hl: false, lw: 1.2 }); E(g, 5.3, -38.5, 2.2, 2, '#fff', { flat: 1, lw: 0 }); num(g, '8', 5.3, -38.4, 3, OUT);
      eyes(g, 9.5, -20.5, e, { h: 4.3, iris: '#3a6a2a', brow: HR, lid: SK });
      nose(g);
      mouth(g, 12.5, -9.5, e, { style: 'smirk' });
      if (e === 'n' || e === 'b') L(g, 'M15.5 -9.8 L23.5 -12.8', 1.3, '#e7c27a');
    },
    torso: function (g) {
      R(g, -10, -8, 20, 11, [3, 3, 6, 6], PA, { hl: false });
      var p = rrp(-11, -32, 22, 26, [9, 9, 5, 5]); fs(g, p, '#ffffff', [-11, -32, 22, 26], { lw: 0 });
      g.save(); g.clip(p); g.fillStyle = YL; g.fillRect(-15, -26, 30, 11); g.fillStyle = SHc(YL); g.fillRect(-15, -17, 30, 2); g.restore();
      g.lineWidth = LW; g.strokeStyle = OUT; g.stroke(p);
      E(g, 3, -20.5, 4.2, 4.2, '#fff', { hl: false, lw: 1.2 }); num(g, '9', 3, -20.3, 5.8, OUT);
    },
    arm: function (g) { C(g, 0, -1, 0, 14, 3.6, SK, { hl: false }); R(g, -4.8, -4, 9.6, 8, 3, '#ffffff', { hl: false }); },
    hand: function (g) { handStd(g, SK); },
    leg: function (g) { legStd(g, PA, '#f4f4f4', { sole: '#e0274b', w: 3.9, ext: 7 }); },
    weapon: function (g) {
      S(g, 'M-16 -2.3 L44 -1.1 L44 1.1 L-16 2.3 Z', CU, { hl: false });
      R(g, -16.5, -2.6, 11, 5.2, 1.5, '#2b1d16', { hl: false, lw: 1.4 });
      R(g, 43, -1.4, 3.2, 2.8, 0.8, '#3b8bff', { flat: 1, lw: 1 });
    },
    off: function (g) { E(g, 0, 1, 5.6, 5.6, '#16161c'); E(g, 1.4, -0.4, 2.5, 2.3, '#fff', { flat: 1, lw: 0 }); num(g, '8', 1.4, -0.3, 3, OUT); }
  });
})();

/* 13 ---- NINJA NEON ---------------------------------------------------- */
(function () {
  var SU = '#323c72', NE = '#00f0ff', PK = '#ff2bd6', SK = '#f2c6a0', TR = '#3a3f66';
  def({ rim: 1, id: 'ninja', nome: 'NINJA NEON', motto_it: 'Mi hai visto? No.', motto_en: 'Did you see me? No.', universo: 'inedito', colore: '#00f0ff', colore2: PK, taglia: 0.85, peso: 1, style: 'melee', arma: 'katana al neon',
    tip: [42, 0], wLen: 40, skin: SK,
    box: { head: [-47, -50, 30, 4], weapon: [-10, -8, 46, 8] },
    head: function (g, e) {
      S(g, 'M-16 -30 Q-30 -36 -44 -27 Q-34 -27 -29 -22 Q-37 -15 -44 -6 Q-27 -13 -15 -23 Z', NE, { hl: false });
      E(g, 2, -20, 20, 19.5, SU);
      S(g, 'M-2 -29.5 Q12 -32.5 23.5 -28.5 Q25 -21 23 -14.5 Q12 -17.5 -2 -15.5 Q-3.5 -22 -2 -29.5', SK, { hl: false });
      eyes(g, 11, -22.5, e, { s: 1.08, sp: 6, iris: '#00b8d4', brow: SU });
      S(g, 'M-19 -31 Q2 -43 22.5 -34 L23 -28 Q2 -37 -19 -24.5 Z', NE, { hl: false });
      R(g, 4, -38.5, 10, 5.5, 1.5, '#c7d2e0', { hl: false, lw: 1.3 });
      L(g, 'M4 -9 Q12 -7 20 -10', 1.2, TR);
    },
    torso: function (g) {
      torsoStd(g, SU, SU);
      L(g, 'M-10 -30 L7 -14', 1.6, TR); L(g, 'M8 -30 L-4 -18', 1.6, TR);
      S(g, 'M-14 -13 Q0 -9 14 -13 L14 -7.5 Q0 -3.5 -14 -7.5 Z', PK, { hl: false });
      L(g, 'M-6 -31.5 Q3 -27 11 -31.5', 1.5, NE);
    },
    arm: function (g) { armStd(g, SU, { cuff: NE }); },
    hand: function (g) { handStd(g, TR); },
    leg: function (g) { legStd(g, SU, TR, { cuff: NE }); },
    weapon: function (g) {
      R(g, -7, -1.9, 11, 3.8, 1.5, '#2b2b3a', { hl: false });
      L(g, 'M-5 -1.6 L-3 1.6 M-2 -1.6 L0 1.6 M1 -1.6 L3 1.6', 0.9, PK);
      E(g, 4.5, 0, 1.8, 4.6, PK, { hl: false, lw: 1.3 });
      S(g, 'M6 -2.8 L39 -3.4 Q45 -1 41.5 2.4 L6 2.6 Z', NE, { hl: false });
      L(g, 'M8 -0.3 L37 -0.9', 1, '#ffffff');
    }
  });
})();

/* 14 ---- STREGA DEI DADI ----------------------------------------------- */
(function () {
  var HT = '#7b3fe0', BD = '#b6ff3b', HR = '#2ad1a6', DR = '#4a2a9a', SK = '#f6d7c3';
  function pips(g, n, s) { var P5 = { 1: [[0, 0]], 3: [[-1, -1], [0, 0], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]] }[n]; P5.forEach(function (q) { dot(g, q[0] * s, q[1] * s, s * 0.42, '#e0274b'); }); }
  def({ id: 'strega', nome: 'STREGA DEI DADI', motto_it: 'Il destino? Lo tiro io.', motto_en: 'Fate? I roll it.', universo: 'inedito', colore: '#b6ff3b', colore2: HT, taglia: 0.98, peso: 2, style: 'cast', arma: 'bastone col dado',
    tip: [35, 0], wLen: 38, skin: SK,
    box: { head: [-34, -78, 38, 12], torso: [-21, -38, 21, 10], weapon: [-14, -11, 45, 11], leg: [-10, -9, 18, 23] },
    head: function (g, e) {
      S(g, 'M-20 -24 Q-29 -4 -23 9 Q-16 3 -13 9 Q-7 3 -6 -6 L-10 -26 Z', HR);
      headBase(g, SK, { noEar: 1 });
      S(g, 'M-17 -22 Q-14 -34 4 -34 Q18 -34 22.5 -27 Q19 -22 15 -25 Q13 -20 9 -24.5 Q5 -20.5 1 -26 Q-6 -24 -9 -27 Q-13 -21 -17 -22', HR);
      eyes(g, 9, -19, e, { iris: '#3bb34a', lash: 1, brow: '#1c8a70' });
      L(g, 'M19.5 -17 L24.5 -13.2 L19.6 -12.4', 1.4);
      mouth(g, 12.5, -8, e, { style: 'smirk' });
      blush(g, 1, -12);
      S(g, 'M-12 -33 Q-5 -56 1 -62 Q-6 -66 -17 -70 Q-3 -74 7 -64 Q14 -54 18 -34 Z', HT);
      S(g, 'M-12.5 -34 Q3 -39.5 18.5 -35 L17.5 -40 Q3 -44.5 -11 -39.5 Z', BD, { hl: false });
      g.save(); g.translate(3, -45.5); g.rotate(-0.25); R(g, -4, -4, 8, 8, 1.8, '#ffffff', { hl: false, lw: 1.3 }); pips(g, 5, 1.9); g.restore();
      S(g, 'M-28 -29 Q2 -43 34 -32 Q31 -26.5 2 -32.5 Q-23 -25 -28 -29', HT);
    },
    torso: function (g) {
      torsoStd(g, DR, DR);
      S(g, 'M-14 -10 L14 -10 L17.5 5 L13 3 L9 6 L5 3 L1 6 L-3 3 L-7 6 L-11 3 L-17.5 5 Z', DR);
      S(g, 'M-10 -32 L14 -32 L10 -26 L7 -29 L4 -25 L1 -29 L-2 -25 L-5 -29 L-8 -26 Z', BD, { hl: false });
      [[3, -20], [3, -14]].forEach(function (q) { g.save(); g.translate(q[0], q[1]); star(g, 0, 0, 2.4, 1, 5, -PI / 2); g.fillStyle = BD; g.fill(); g.lineWidth = 0.8; g.strokeStyle = OUT; g.stroke(); g.restore(); });
    },
    arm: function (g) { S(g, 'M-4.4 -2 L4.4 -2 L6.5 12 Q0 14 -6.5 12 Z', DR); L(g, 'M-6 11.5 Q0 13.5 6 11.5', 1.8, BD); },
    hand: function (g) { handStd(g, SK); },
    leg: function (g) {
      var p = capP(0, -2, 0, 11, 4.2); fs(g, p, '#1d1530', [-4.2, -6.2, 8.4, 21.4], { lw: 0, hl: false });
      g.save(); g.clip(p); g.fillStyle = BD; for (var y = -4; y < 14; y += 4) g.fillRect(-6, y, 12, 1.8); g.restore(); g.lineWidth = LW; g.strokeStyle = OUT; g.stroke(p);
      S(g, 'M-5.6 9 L4 9 Q9 10 12 13 Q16 15 14.5 11 Q18 14 15 18.5 Q12 20.5 7 20.2 L-5.6 20.2 Q-7 20.2 -7 18.4 L-7 11 Q-7 9 -5.6 9', HT);
    },
    weapon: function (g) {
      C(g, -10, 0, 28, 0, 1.9, '#7b4a2a', { hl: false });
      L(g, 'M-6 -1.8 L-3 1.8 M2 -1.8 L5 1.8 M10 -1.8 L13 1.8 M18 -1.8 L21 1.8', 0.9);
      g.save(); g.translate(34, 0); g.rotate(0.3); R(g, -6.5, -6.5, 13, 13, 3, '#ffffff'); pips(g, 3, 3.1); g.restore();
    }
  });
})();

/* 15 ---- PIZZAIOLO ----------------------------------------------------- */
(function () {
  var SK = '#f2b896', WH = '#fbfbf7', RD = '#e53935', GR = '#2fa84f', MU = '#2a1a14', PE = '#c98d4e';
  def({ id: 'pizzaiolo', nome: 'PIZZAIOLO', motto_it: 'Una margherita… in faccia!', motto_en: 'One margherita… to the face!', universo: 'inedito', colore: '#ff5a36', colore2: '#ffd166', taglia: 1.02, peso: 3, style: 'melee', arma: 'pala e pizze rotanti',
    tip: [30, 0], wLen: 40, skin: SK,
    geo: { hip: -17, shF: 11, shB: -13, shY: -24 },
    box: { head: [-28, -68, 31, 6], torso: [-26, -38, 26, 10], weapon: [-15, -12, 44, 12] },
    head: function (g, e) {
      headBase(g, SK);
      blush(g, 17, -12.5);
      eyes(g, 8.5, -21, e, { iris: '#4a2a14', brow: MU });
      mouth(g, 13, -5.5, e, { s: 0.9 });
      S(g, 'M4 -10.5 Q8 -15.5 13 -12.5 Q19 -16.5 25 -11.5 Q28.5 -7.5 24.5 -6 Q21 -9.5 14 -8.5 Q8 -6 4 -8 Q-0.5 -6.5 -1 -9.5 Q1 -11.5 4 -10.5', MU);
      E(g, 18, -15.5, 4.5, 4, '#f0a07e', { hl: false });
      S(g, 'M-14 -35 Q-24 -42 -18 -53 Q-13 -63 -2 -59 Q4 -69 14 -61 Q26 -62 24 -48 Q30 -38 20 -35 Z', WH);
      L(g, 'M-6 -55 Q-4 -45 -6 -38', 1.1, '#c9cbd6'); L(g, 'M8 -58 Q10 -47 8 -38', 1.1, '#c9cbd6');
      R(g, -15.5, -39, 37, 8.5, 3, WH, { hl: false });
    },
    torso: function (g) {
      R(g, -13, -8, 26, 11, [3, 3, 7, 7], '#3b3b46', { hl: false });
      S(g, 'M-14 3 Q-24 -12 -15 -30 Q0 -35 15 -30 Q25 -12 15 3 Q0 6 -14 3', WH);
      L(g, 'M2 -30 L2 -8', 1.1, '#c9cbd6');
      [[-2.5, -22], [-2.5, -14], [6.5, -22], [6.5, -14]].forEach(function (q) { E(g, q[0], q[1], 1.4, 1.4, RD, { flat: 1, lw: 0.8 }); });
      S(g, 'M-6 -32 L13 -32 L4 -23 Z', RD, { hl: false });
      S(g, 'M-6 -32 L-1 -32 L1.5 -27 Z', GR, { hl: false, lw: 1 });
      S(g, 'M8 -32 L13 -32 L7 -26 Z', GR, { hl: false, lw: 1 });
    },
    arm: function (g) { armStd(g, SK, { w: 4.3 }); R(g, -5.5, -4, 11, 9, 3, WH, { hl: false }); },
    hand: function (g) { handStd(g, SK); },
    leg: function (g) { legStd(g, '#3b3b46', '#1b1b22', { w: 5.2, ext: -2 }); },
    weapon: function (g) {
      C(g, -12, 0, 19, 0, 1.8, PE, { hl: false });
      R(g, 18, -10, 23, 20, 7, PE);
      E(g, 29.5, 0, 9.5, 9, '#e9a84a', { hl: false });
      E(g, 29.5, 0, 7.6, 7.2, '#ffcf5a', { hl: false, lw: 1 });
      [[27, -3], [32.5, -2.5], [28, 3.5], [33, 3]].forEach(function (q) { E(g, q[0], q[1], 1.9, 1.9, '#d6303e', { flat: 1, lw: 0.8 }); });
      E(g, 30, 0.4, 1.4, 0.8, GR, { flat: 1, lw: 0, rot: 0.5 }); E(g, 25.2, 0.6, 1.3, 0.8, GR, { flat: 1, lw: 0, rot: -0.5 });
    }
  });
})();

/* 16 ---- ASTRONAUTA ---------------------------------------------------- */
(function () {
  var WH = '#f1f4f8', OR = '#ff8c1a', SK = '#f0c09a', HR = '#f4c430', GL = '#bfe9ff';
  def({ id: 'astro', nome: 'ASTRONAUTA', motto_it: 'Houston, ho un full.', motto_en: 'Houston, I have a full house.', universo: 'inedito', colore: '#ff9f1c', colore2: '#4cc9f0', taglia: 1, peso: 3, style: 'gun', arma: 'pistola a raggi',
    tip: [31, -4.5], wLen: 30, skin: WH,
    geo: { shF: 9, shB: -11 },
    box: { head: [-27, -56, 29, 6], torso: [-20, -38, 20, 8], back: [-29, -40, -8, -6], weapon: [-5, -12, 34, 10], hand: [-9, -9, 9, 9], leg: [-10, -10, 15, 23] },
    capeK: 0.15,
    head: function (g, e) {
      E(g, 2, -22, 23, 22, GL, { hl: false });
      E(g, 4, -19, 15.5, 15, SK, { hl: false });
      S(g, 'M-10 -25 Q-6 -36 6 -35 Q16 -35 19 -26.5 Q14 -29 10 -27 Q6 -31 1 -27 Q-4 -30 -10 -25', HR, { hl: false });
      eyes(g, 8.5, -20, e, { s: 0.88, iris: '#2a6ad8', brow: '#b07a1a' });
      mouth(g, 10.5, -10.5, e, { s: 0.8 });
      blush(g, 16, -13);
      F(g, 'M10 -40.5 Q22.5 -38 24.5 -26 Q20 -34.5 10 -37.5 Z', 'rgba(255,255,255,0.8)');
      F(g, 'M-17 -26 Q-15 -36 -8 -40 Q-14 -34 -15 -26 Z', 'rgba(255,255,255,0.5)');
      g.lineWidth = LW; g.strokeStyle = OUT; g.beginPath(); g.ellipse(2, -22, 23, 22, 0, 0, TAU); g.stroke();
      R(g, -16, -5, 36, 9, 4, OR);
      C(g, -12, -38, -16, -49, 1.2, '#9aa6b8', { hl: false }); E(g, -16.5, -51, 2.8, 2.8, OR, { hl: false, lw: 1.2 });
    },
    torso: function (g) {
      R(g, -13, -8, 26, 11, [3, 3, 7, 7], WH, { hl: false });
      R(g, -16, -33, 32, 30, [12, 12, 7, 7], WH);
      R(g, -6, -25, 14, 10, 3, '#3a4256', { flat: 1 });
      dot(g, -2.5, -20, 1.4, '#e0274b'); dot(g, 1, -20, 1.4, '#2fc77a'); dot(g, 4.5, -20, 1.4, '#ffd23f');
      R(g, -15.5, -8.5, 31, 4.5, 2, OR, { hl: false });
    },
    back: function (g) { R(g, -26, -37, 15, 28, 5, WH); R(g, -23.5, -32, 4.5, 18, 2, OR, { hl: false }); },
    arm: function (g) { C(g, 0, -1, 0, 12, 5.2, WH, { hl: false }); R(g, -5.6, 3.5, 11.2, 2.4, 1, OR, { flat: 1, lw: 1 }); },
    hand: function (g) { E(g, 0, 0.5, 6, 5.8, WH, { hl: false }); R(g, -5.2, -6.5, 10.4, 3, 1, OR, { flat: 1, lw: 1 }); },
    leg: function (g) {
      C(g, 0, -2, 0, 10, 5.4, WH, { hl: false });
      S(g, 'M-6.5 8.5 L5 8.5 Q11.5 10.5 12 15.6 Q12.3 20.2 8 20.2 L-6.5 20.2 Q-8 20.2 -8 18.4 L-8 10.5 Q-8 8.5 -6.5 8.5', '#e6ebf2');
      g.fillStyle = OR; g.fillRect(-7.3, 17.6, 18.6, 2.2);
    },
    weapon: function (g) {
      R(g, -2, -1, 5.5, 9, 2, '#3a4256', { hl: false });
      E(g, 9, -4.5, 10, 5.8, OR);
      R(g, 12.5, -10, 2.6, 11, 1, '#ffd23f', { hl: false, lw: 1 }); R(g, 6.5, -10.5, 2.6, 12, 1, '#ffd23f', { hl: false, lw: 1 });
      R(g, 18, -6.5, 9, 4, 1.5, '#c9d2de', { hl: false });
      E(g, 29, -4.5, 3.3, 3.3, '#7df9ff', { hl: false });
    }
  });
})();

/* 17 ---- DJ BASSO ------------------------------------------------------ */
(function () {
  var SK = '#7a4a2e', PK = '#ff2e93', BK2 = '#24212d', HR = '#1b1414', SP = '#5b6080';
  def({ rim: 0.8, id: 'dj', nome: 'DJ BASSO', motto_it: 'Alza il volume, abbassa la puntata.', motto_en: 'Pump the volume, drop the bet.', universo: 'inedito', colore: '#ff2e93', colore2: '#2b2d42', taglia: 1, peso: 2, style: 'throw', arma: 'dischi in vinile',
    tip: [4, -6], wLen: 12, skin: SK,
    box: { head: [-25, -52, 30, 6], back: [-34, -58, 34, -24], weapon: [-7, -18, 16, 5] },
    capeK: 0.12,
    head: function (g, e) {
      headBase(g, SK, { noEar: 1 });
      S(g, 'M-16 -27 Q-14 -44 3 -44 Q19 -44 21 -29 Q3 -34 -16 -27', HR);
      S(g, 'M-18 -20 Q-18 -48.5 3 -48.5 Q23.5 -48.5 23.5 -24 L19.5 -24 Q19.5 -43.5 3 -43.5 Q-13 -43.5 -13.5 -20 Z', BK2, { hl: false });
      E(g, -15.5, -18.5, 6.5, 8.5, PK); E(g, -15.5, -18.5, 3, 5, BK2, { flat: 1, lw: 1 });
      E(g, 22.5, -21, 3.2, 7, PK, { hl: false });
      mouth(g, 12, -9.5, e, { style: 'smirk' });
      if (e === 'n' || e === 'b') { E(g, 15.5, -8.2, 1.2, 0.9, '#ffcf40', { flat: 1, lw: 0 }); }
      var tilt = e === 'h' ? 0.16 : e === 'k' ? -0.12 : 0;
      g.save(); g.translate(11.5, -24); g.rotate(tilt); g.translate(-11.5, 24);
      S(g, 'M-1 -27.5 L25 -28.5 L24 -21.5 Q20 -17 14.5 -20 L12.5 -23 L10.5 -20 Q5 -17 0 -21 Z', '#16131c', { hl: false });
      F(g, 'M2 -26.5 L5 -26.6 L2.6 -21.5 L1.4 -22.5 Z', 'rgba(255,255,255,0.55)'); F(g, 'M16 -27 L19 -27.1 L16.4 -21.6 L15.2 -22.2 Z', 'rgba(255,255,255,0.55)');
      if (e === 'k') { L(g, 'M3 -26 L8 -21 M8 -26 L3 -21 M16 -26.5 L21 -21.5 M21 -26.5 L16 -21.5', 1.4, '#fff'); }
      g.restore();
      if (e === 'a') { L(g, 'M0 -33.5 L9.5 -30', 2.4, HR); L(g, 'M14.5 -30 L23 -33.5', 2.4, HR); }
      else if (e === 'h') { L(g, 'M1 -30 L9 -33', 2.2, HR); L(g, 'M15 -33 L23 -30', 2.2, HR); E(g, 25, -30, 1.6, 2.3, '#9ee6ff', { flat: 1, lw: 0.9 }); }
      else { L(g, 'M1 -30.5 Q5 -33 9.5 -31', 2.2, HR); L(g, 'M14.5 -31 Q19 -33 23 -30.5', 2.2, HR); }
    },
    torso: function (g) {
      R(g, -13, -8, 26, 11, [3, 3, 7, 7], BK2, { hl: false });
      R(g, -14, -32, 28, 28, [11, 11, 6, 6], PK);
      R(g, -8, -15, 17, 8, 3, PK, { hl: false, lw: 1.4 });
      L(g, 'M-1 -31 L-2 -24 M5 -31 L6 -24', 1.3, '#fff');
      L(g, 'M-9 -31 Q2 -20 13 -31', 1.6, '#ffcf40');
      E(g, 2, -22, 3, 3, '#16131c', { hl: false, lw: 1 }); dot(g, 2, -22, 0.9, PK);
    },
    back: function (g) {
      R(g, -31, -54, 17, 23, 3, SP); E(g, -22.5, -46.5, 4.6, 4.6, '#8a8fa8', { hl: false, lw: 1.3 }); E(g, -22.5, -36.5, 3, 3, '#8a8fa8', { hl: false, lw: 1.2 });
      R(g, 13, -56, 18, 23, 3, SP); E(g, 22, -48.5, 4.6, 4.6, '#8a8fa8', { hl: false, lw: 1.3 }); E(g, 22, -38.5, 3, 3, '#8a8fa8', { hl: false, lw: 1.2 });
      dot(g, -22.5, -46.5, 1.6, PK); dot(g, 22, -48.5, 1.6, PK);
    },
    arm: function (g) { armStd(g, PK, { cuff: BK2 }); },
    hand: function (g) { handStd(g, SK); },
    leg: function (g) { legStd(g, BK2, '#f4f4f4', { sole: PK }); },
    weapon: function (g) {
      E(g, 4, -6, 9.5, 9.5, '#16131c', { hl: false });
      ring(g, 4, -6, 6.3, 0.7, '#4a4a5c'); ring(g, 4, -6, 8, 0.7, '#4a4a5c');
      E(g, 4, -6, 3.5, 3.5, PK, { hl: false, lw: 1 }); dot(g, 4, -6, 0.8, OUT);
      g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 1.2; g.beginPath(); g.arc(4, -6, 7, -1.2, -0.3); g.stroke();
    }
  });
})();

/* 18 ---- SAMURAI JACKPOT (ex SAMURAI SLOT, 20/10) ---------------------------------------------- */
(function () {
  var RD = '#d7263d', GD = '#ffcf33', DK = '#2a1f2d', SK = '#f0c49c', MK = '#3a1f28';
  def({ rim: 0.45, id: 'samurai', nome: 'SAMURAI JACKPOT', motto_it: 'Tre sette. Un colpo.', motto_en: 'Triple seven. One strike.', universo: 'inedito', colore: '#ffcf33', colore2: RD, taglia: 1.03, peso: 3, style: 'melee', arma: 'katana',
    tip: [44, -5], wLen: 42, skin: SK,
    box: { head: [-31, -70, 33, 6], weapon: [-10, -11, 48, 6], arm: [-9, -7, 9, 18] },
    head: function (g, e) {
      S(g, 'M-21 -24 L-28 -9 Q-20 -5 -13 -7 L-10 -21 Z', RD);
      L(g, 'M-24 -17 L-12 -14.5', 1.2); L(g, 'M-26 -12 L-12 -10', 1.2);
      headBase(g, SK, { noEar: 1 });
      eyes(g, 10.5, -19.5, e, { s: 0.92, iris: '#3a2210', brow: OUT });
      S(g, 'M3 -14.5 Q14 -17 25.5 -14.5 L23.5 -4.5 Q14 -0.5 5 -4.5 Z', MK);
      if (e === 'a' || e === 'w' || e === 'k') { R(g, 9, -10.5, 11, 3.6, 1, '#fff', { hl: false, lw: 1 }); L(g, 'M12 -10.5 L12 -7 M15 -10.5 L15 -7 M18 -10.5 L18 -7', 0.7); }
      else { L(g, 'M8 -11.5 Q12 -13 15 -10.5', 1.6, '#fff'); L(g, 'M15 -10.5 Q19 -13 23 -11.5', 1.6, '#fff'); }
      S(g, 'M-20.5 -21 Q-21 -45 2 -45 Q25 -45 25 -23 Q12 -27.5 2 -27 Q-10 -27 -20.5 -21', RD);
      S(g, 'M-21 -22 Q2 -30.5 26.5 -23 L26.5 -20 Q2 -27 -21 -18.5 Z', GD, { hl: false });
      S(g, 'M3 -41 Q-11 -50 -14 -66 Q-5 -54 7 -47 Q19 -54 29 -65 Q25 -49 10 -41 Z', GD);
      E(g, 7, -41.5, 4.6, 4.6, RD, { hl: false }); num(g, '7', 7, -41.2, 6.5, GD);
    },
    torso: function (g) {
      for (var i = 0; i < 3; i++) R(g, -14 + i * 9.5, -9, 9, 12.5, 2, RD, { hl: false, lw: 1.5 });
      R(g, -14, -32, 28, 25, [10, 10, 6, 6], RD);
      R(g, -10.5, -27.5, 23, 11.5, 2.5, '#fff8e6', { hl: false, lw: 1.6 });
      ['7', '7', '7'].forEach(function (s, i) { num(g, s, -6.6 + i * 7.6, -21.6, 8.5, '#e0274b'); });
      L(g, 'M-3 -27 L-3 -16.5 M4.6 -27 L4.6 -16.5', 1);
      L(g, 'M-13 -12.5 L13 -12.5', 1.2, GD); L(g, 'M-13 -9.5 L13 -9.5', 1.2, GD);
    },
    arm: function (g) { armStd(g, DK); R(g, -7, -5, 14, 10, 2.5, RD); L(g, 'M-6 -1 L6 -1 M-6 2 L6 2', 1, GD); },
    hand: function (g) { handStd(g, '#3a2a3a'); },
    leg: function (g) { S(g, 'M-5 -4 L5 -4 L8 12 L-8 12 Z', DK, { hl: false }); S(g, 'M-6 11 L5 11 Q10.5 12.5 11 16 Q11.2 20.2 7.6 20.2 L-6 20.2 Q-7.4 20.2 -7.4 18.4 L-7.4 12.5 Q-7.4 11 -6 11', '#e3c27a'); L(g, 'M-2 11 L-2 14 L4 14', 1.1); },
    weapon: function (g) {
      R(g, -7, -1.9, 12.5, 3.8, 1.5, DK, { hl: false });
      L(g, 'M-5 -1.6 L-3 1.6 M-2 -1.6 L0 1.6 M1 -1.6 L3 1.6', 0.9, GD);
      E(g, 5.8, 0, 2, 5, GD, { hl: false, lw: 1.3 });
      S(g, 'M7 -2 Q26 -3.5 45 -7.5 Q43.5 -2.5 41 -1.5 Q25 0.5 7 2 Z', '#e4ebf2', { hl: false });
      L(g, 'M9 0.4 Q25 -1.2 41 -3.6', 0.9, '#9fb0c4');
    }
  });
})();

/* 19 ---- CONTESSA ------------------------------------------------------ */
(function () {
  var SK = '#ece4f6', HR = '#2a2140', RD = '#c2183a', BK = '#352c48', GD = '#ffcf40';
  def({ rim: 0.9, id: 'vampira', nome: 'CONTESSA', motto_it: 'Il banco vince. Sempre.', motto_en: 'The house always wins.', universo: 'inedito', colore: '#ff2e4d', colore2: BK, taglia: 1, peso: 2, style: 'cast', arma: 'scettro del pipistrello',
    tip: [23, 0], wLen: 26, skin: SK,
    box: { head: [-35, -56, 33, 6], back: [-35, -36, 14, 16], weapon: [-10, -16, 29, 16] },
    backPivot: [-1, -30],
    head: function (g, e) {
      S(g, 'M-22 -2 L-31 -34 L-15 -22 L-10 -2 Z', BK); F(g, 'M-20 -5 L-27 -28 L-16 -20 L-12.5 -5 Z', '#8e1438');
      S(g, 'M14 -2 L31 -35 L25 -2 Z', BK); F(g, 'M17 -4 L28.5 -28 L23.5 -4 Z', '#8e1438');
      E(g, -6, -43, 9, 8, HR);
      headBase(g, SK, { noEar: 1 });
      S(g, 'M-19.5 -16 Q-22 -42 2 -42.5 Q24.5 -42 23.5 -24 Q17 -33 12.5 -31 L9.5 -25.5 L6.5 -31 Q-6 -32.5 -12 -24 Q-15 -17 -19.5 -16', HR);
      eyes(g, 9.5, -19.5, e, { iris: '#e0274b', lash: 1, brow: HR });
      if (e === 'n' || e === 'b') { S(g, 'M8.5 -9.8 Q12 -11.4 15.6 -10 Q12 -6.6 8.5 -9.8', RD, { hl: false, lw: 1.1 }); F(g, 'M13 -8.6 L14.6 -8.8 L13.9 -6.2 Z', '#fff'); }
      else mouth(g, 12, -9, e, { s: 0.9, fang: 1 });
      dot(g, 18, -12.5, 0.8, OUT);
      nose(g);
    },
    torso: function (g) {
      torsoStd(g, BK, BK);
      S(g, 'M-6 -28 L10 -28 L8 -6 L-4 -6 Z', RD, { hl: false });
      L(g, 'M-3 -24 L7 -22 M-3 -19 L7 -17 M-3 -14 L7 -12', 1, '#1d1530');
      E(g, 2, -30.5, 2.6, 2.6, GD, { hl: false, lw: 1 }); dot(g, 2, -30.5, 1.2, RD);
    },
    back: function (g) {
      S(g, 'M-14 -30 Q-29 -6 -31 10 Q-12 14 7 10 Q4 -12 12 -30 Z', BK);
      S(g, 'M-14 -30 Q-27 -6 -29 8 Q-24 9.5 -20 9 Q-18 -10 -9 -30 Z', RD, { hl: false });
    },
    arm: function (g) { armStd(g, BK, { cuff: RD }); },
    hand: function (g) { handStd(g, SK); },
    leg: function (g) { legStd(g, BK, BK); S(g, 'M5 9.5 Q9 11 14 19.6 L7 20.2 Z', BK, { hl: false }); },
    weapon: function (g) {
      C(g, -7, 0, 18, 0, 1.5, GD, { hl: false });
      S(g, 'M19.5 -3 Q17 -12 10 -14 Q12.5 -10 11 -7.5 Q14.5 -8 15 -4.5 Z', BK);
      S(g, 'M19.5 3 Q17 12 10 14 Q12.5 10 11 7.5 Q14.5 8 15 4.5 Z', BK);
      E(g, 22, 0, 4, 5, RD);
    }
  });
})();

/* 20 ---- ZUCCONE ------------------------------------------------------- */
(function () {
  var PK = '#ff8a1f', GL = '#ffe14a', ST = '#e8c35a', GR = '#4c8a2a', CO = '#3f5a3a', BR = '#6b4a2a';
  var HOLE = '#5a1e06';
  function hole(g, d) {
    var p = P(d); g.fillStyle = HOLE; g.fill(p);
    g.save(); g.clip(p); g.translate(-0.9, 1.1); g.fillStyle = GL; g.fill(p); g.restore();
    g.lineWidth = 1.2; g.strokeStyle = OUT; g.stroke(p);
  }
  var EY = {
    n: ['M1 -20.5 L5.5 -29 L9.5 -20.5 Z', 'M13 -20.5 L16.5 -28.5 L20 -20.5 Z'],
    b: ['M1 -23.5 L9.5 -23.5 L8.5 -21 L2 -21 Z', 'M13 -23.5 L20 -23.5 L19 -21 L14 -21 Z'],
    a: ['M0.5 -27.5 L9.5 -22 L1 -19.5 Z', 'M20.5 -27.5 L12.5 -22 L20 -19.5 Z'],
    h: ['M1 -27.5 L9.5 -23.5 L1 -19.5 L3.5 -23.5 Z', 'M20.5 -27.5 L12.5 -23.5 L20.5 -19.5 L18 -23.5 Z'],
    w: ['M0.5 -20.5 Q5 -30 9.5 -20.5 L7.4 -20.5 Q5 -25.5 2.6 -20.5 Z', 'M12.5 -20.5 Q16.5 -29.5 20.5 -20.5 L18.6 -20.5 Q16.5 -25 14.4 -20.5 Z']
  };
  var MO = {
    n: 'M-1 -13 L3 -11 L5 -14 L8 -11 L11 -14 L14 -11 L17 -14 L20 -11 L23 -14 Q20 -4 11 -4 Q2 -5 -1 -13 Z',
    a: 'M-2 -15.5 L23.5 -16.5 Q21.5 -3 10.5 -3 Q0 -4 -2 -15.5 Z',
    w: 'M-2.5 -14 Q11 -10 24 -15.5 Q22 -1.5 11 -1.5 Q-0.5 -2.5 -2.5 -14 Z',
    h: 'M4 -11 L8 -13 L12 -11 L16 -13 L19.5 -11 Q16 -6 11.5 -6 Q6.5 -6 4 -11 Z',
    k: 'M6 -13 Q11.5 -16 17 -13 Q18 -5 11.5 -5 Q5 -5 6 -13 Z'
  };
  def({ id: 'zucca', nome: 'ZUCCONE', motto_it: 'Dolcetto o puntata?', motto_en: 'Trick or bet?', universo: 'inedito', colore: '#ff8a1f', colore2: GL, taglia: 1.02, peso: 3, style: 'cast', up: true, arma: 'lanterna',
    tip: [0, 10], wLen: 16, skin: PK,
    box: { head: [-24, -55, 29, 8], weapon: [-9, -5, 9, 19] },
    head: function (g, e) {
      S(g, 'M-12 -3 L-16 4 L-9 1 L-6 6 L-3 0 L1 6 L3 0 L7 5 L9 -1 L14 3 L13 -4 Z', ST, { hl: false });
      S(g, 'M-1 -36 Q-3 -45 3 -50 Q7.5 -48 5.5 -44 Q3.5 -42 4.5 -36 Z', GR);
      L(g, 'M5 -45 Q12 -51 16 -45 Q17 -42 14 -42', 1.4, GR);
      E(g, -8, -19.5, 13, 17, PK); E(g, 12, -19.5, 13, 17, PK); E(g, 2, -20, 12.5, 19, PK);
      if (e === 'k') { L(g, 'M2 -27 L9 -20 M9 -27 L2 -20 M13.5 -27 L20 -20.5 M20 -27 L13.5 -20.5', 3.4, HOLE); L(g, 'M2 -27 L9 -20 M9 -27 L2 -20 M13.5 -27 L20 -20.5 M20 -27 L13.5 -20.5', 1.6, GL); }
      else { hole(g, EY[e][0]); hole(g, EY[e][1]); }
      hole(g, 'M9.5 -18 L11.5 -15 L7.5 -15 Z');
      hole(g, MO[e] || MO.n);
    },
    torso: function (g) {
      torsoStd(g, CO, BR);
      R(g, 3.5, -23, 7.5, 6.5, 1, '#a0522d', { hl: false, lw: 1.2 });
      L(g, 'M4.5 -22 L6 -21 M8 -18 L9.5 -17', 0.8, '#ffe1a8');
      R(g, -13.6, -9, 27.2, 3.4, 1.5, '#d9b56a', { hl: false });
      E(g, -1, -24, 1.2, 1.2, '#d9b56a', { flat: 1, lw: 0.8 }); E(g, -1, -17, 1.2, 1.2, '#d9b56a', { flat: 1, lw: 0.8 });
    },
    arm: function (g) { armStd(g, CO); S(g, 'M-5 11 L-6 15 L-3 13 L-1 16.5 L1 13 L3.5 16 L4.5 12.5 L6.5 14 L5 11 Z', ST, { hl: false, lw: 1 }); },
    hand: function (g) { handStd(g, '#8a5a32'); },
    leg: function (g) { legStd(g, BR, '#3a2a1a'); R(g, -3, 1, 5, 4, 0.5, '#a0522d', { hl: false, lw: 0.9 }); },
    weapon: function (g) {
      ring(g, 0, -1.2, 2.6, 2.6, OUT); ring(g, 0, -1.2, 2.6, 1.1, '#9aa0aa');
      S(g, 'M-7.5 3.5 L0 0 L7.5 3.5 Z', '#2b2b33', { hl: false, lw: 1.3 });
      R(g, -6.5, 3, 13, 15, 3, '#2b2b33', { hl: false });
      R(g, -4.2, 5.3, 8.4, 10.4, 2, GL, { hl: false, lw: 1 });
      E(g, 0, 11, 2, 3.3, '#ff8a1f', { flat: 1, lw: 0 });
      L(g, 'M0 5 L0 15.7', 1, '#2b2b33');
    }
  });
})();

/* 21 ---- CALAVERA ------------------------------------------------------ */
(function () {
  var BO = '#f4efe3', BK = '#2e2840', GD = '#ffcf40', RD = '#e0274b', PKc = '#ff6fa5', TL = '#29d3c2', GT = '#e6913a';
  function socketEyes(g, e) {
    E(g, 5, -21, 5.2, 5.6, BK, { hl: false, lw: 1.4 }); E(g, 16, -21, 4.4, 5.2, BK, { hl: false, lw: 1.4 });
    g.save(); g.shadowColor = GD; g.shadowBlur = 2.5 * KPX; g.strokeStyle = GD; g.fillStyle = GD; g.lineCap = 'round'; g.lineWidth = 1.6;
    [[5.5, -20.5, 1], [16.3, -20.5, 0.86]].forEach(function (q, j) {
      var x = q[0], y = q[1], i = j ? 1 : -1; g.beginPath();
      if (e === 'n' || e === 'a') { g.arc(x, y, 1.9, 0, TAU); g.fill(); }
      else if (e === 'b') { g.moveTo(x - 2.4, y); g.lineTo(x + 2.4, y); g.stroke(); }
      else if (e === 'h') { g.moveTo(x + i * 2.2, y - 2.2); g.lineTo(x - i * 2, y); g.lineTo(x + i * 2.2, y + 2.2); g.stroke(); }
      else if (e === 'k') { g.moveTo(x - 2, y - 2); g.lineTo(x + 2, y + 2); g.moveTo(x + 2, y - 2); g.lineTo(x - 2, y + 2); g.stroke(); }
      else { g.moveTo(x - 2.4, y + 1); g.quadraticCurveTo(x, y - 3.5, x + 2.4, y + 1); g.stroke(); }
    });
    g.restore();
    if (e === 'a') { F(g, 'M-1 -28 L10.5 -25 L10.5 -28.5 Z', BO); F(g, 'M21.5 -28 L11 -25 L11 -28.5 Z', BO); L(g, 'M-0.5 -27.5 L10 -24.5 M21 -27.5 L11.5 -24.5', 1.6); }
  }
  def({ rim: 0.85, id: 'mariachi', nome: 'CALAVERA', motto_it: 'Suono anche al tuo funerale.', motto_en: 'I\'ll play at your funeral too.', universo: 'inedito', colore: '#ff4f7b', colore2: GD, taglia: 1, peso: 2, style: 'melee', two: true, grip2: 6, arma: 'chitarra',
    tip: [50, 0], wLen: 54, skin: BO,
    box: { head: [-42, -62, 46, 6], weapon: [-13, -16, 57, 16] },
    head: function (g, e) {
      S(g, 'M-17 -18 Q-19 -40 2 -40 Q22 -40 22.5 -22 Q22.5 -14 17.5 -11 L16.5 -2 L5 -1.5 L4 -8 Q-14 -6 -17 -18', BO);
      [[5, -21, 7.4], [16, -21, 6.6]].forEach(function (q, j) { for (var k = 0; k < 8; k++) { var a = k / 8 * TAU; E(g, q[0] + Math.cos(a) * q[2] * (j ? 0.86 : 1), q[1] + Math.sin(a) * q[2], 1.9, 1.2, k % 2 ? PKc : TL, { flat: 1, lw: 0, rot: a }); } });
      socketEyes(g, e);
      F(g, 'M10.5 -15 L8.8 -11.6 L12.2 -11.6 Z', BK);
      if (e === 'a' || e === 'w' || e === 'k') { R(g, 5, -9.5, 12, 3, 1, '#fff', { hl: false, lw: 1.1 }); F(g, 'M5.5 -6.3 L16.5 -6.3 L15.5 -2.5 L6 -2.5 Z', BK); R(g, 5.5, -4, 11, 2.5, 1, '#fff', { hl: false, lw: 1 }); }
      else { R(g, 5, -9.5, 12, 5.5, 1.2, '#fff', { hl: false, lw: 1.2 }); L(g, 'M5.5 -6.8 L16.5 -6.8 M8 -9.5 L8 -4 M11 -9.5 L11 -4 M14 -9.5 L14 -4', 0.8); }
      E(g, -8, -14, 2.4, 2.4, PKc, { flat: 1, lw: 0.9 }); dot(g, -8, -14, 0.9, GD);
      S(g, 'M-11 -33 Q-11 -56 4 -58 Q19 -56 17.5 -35 Q3 -39 -11 -33', BK);
      S(g, 'M-11 -34 Q3 -40 17.5 -36 L17 -40.5 Q3 -44.5 -10.5 -38.5 Z', GD, { hl: false });
      S(g, 'M-37 -30 Q2 -47 41 -33 Q45 -27 37 -26.5 Q2 -38 -33 -24 Q-41 -24 -37 -30', BK);
      L(g, 'M-33 -26.5 Q2 -40.5 38 -28.5', 1.3, GD);
      dot(g, -20, -33.5, 1.2, GD); dot(g, 26, -35, 1.2, GD);
    },
    torso: function (g) {
      torsoStd(g, '#ffffff', BK);
      S(g, 'M-14 -26 Q-14 -32 -6 -32 L-1 -32 L-2 -12 L-14 -12 Z', BK);
      S(g, 'M7 -32 L10 -32 Q14 -31 14 -26 L14 -12 L6 -12 Z', BK);
      L(g, 'M-1.5 -31 L-2 -13 M7 -31 L6.5 -13', 1.3, GD);
      L(g, 'M-11 -14 Q-7 -17 -4 -14 M9 -14 Q11 -17 13 -14', 1, GD);
      S(g, 'M3 -30 L-5 -35 L-4 -25 Z', RD, { hl: false, lw: 1.3 }); S(g, 'M3 -30 L11 -35 L10 -25 Z', RD, { hl: false, lw: 1.3 }); E(g, 3, -30, 2, 2.2, RD, { flat: 1, lw: 1 });
      R(g, -13.6, -9, 27.2, 4, 1.5, GD, { hl: false });
    },
    arm: function (g) { armStd(g, BK, { cuff: GD }); },
    hand: function (g) { E(g, 0, 0.5, 4.8, 4.8, BO, { hl: false }); L(g, 'M-1.5 -2 L-1.5 3 M1.5 -2 L1.5 3.5', 0.8); },
    leg: function (g) { legStd(g, BK, BK, { sole: '#3a3446' }); [-1, 3, 7].forEach(function (y) { dot(g, 4.2, y, 0.9, '#d9dde8'); }); },
    weapon: function (g) {
      g.scale(1.25, 1.25);
      R(g, -8.5, -2.8, 5.5, 5.6, 1.2, '#7a4a24', { hl: false, lw: 1.4 });
      R(g, -4, -1.8, 22, 3.6, 1, '#7a4a24', { hl: false, lw: 1.4 });
      S(g, 'M17 -8 Q22 -11 27 -8 Q31 -11.5 37 -9.5 Q43.5 -5.5 43.5 0 Q43.5 5.5 37 9.5 Q31 11.5 27 8 Q22 11 17 8 Q14 4 14 0 Q14 -4 17 -8', GT);
      E(g, 25.5, 0, 3.2, 3.2, '#3a1f0a', { flat: 1, lw: 1 });
      R(g, 33, -3.5, 2.5, 7, 0.8, '#3a1f0a', { flat: 1, lw: 0 });
      L(g, 'M-3 -0.8 L34 -0.8 M-3 0.8 L34 0.8', 0.5, '#f4efe3');
      g.fillStyle = PKc; g.beginPath(); g.ellipse(39, 5, 1.8, 1.2, 0.5, 0, TAU); g.fill(); g.fillStyle = TL; g.beginPath(); g.ellipse(39, -5, 1.8, 1.2, -0.5, 0, TAU); g.fill();
    }
  });
})();

/* 22 ---- GOLEM DI FICHES ----------------------------------------------- */
(function () {
  var RD = '#e63946', BL = '#1d7cf2', GR = '#22b35b', BK = '#2f2b3a', EY = '#7df9ff';
  def({ id: 'golem', nome: 'GOLEM DI FICHES', motto_it: 'Sono io il piatto.', motto_en: 'I am the pot.', universo: 'inedito', colore: '#e63946', colore2: BL, taglia: 1.3, peso: 5, style: 'punch', arma: 'pugni di fiches',
    skin: RD, wLen: 0,
    geo: { neck: -36, shY: -27, shF: 17, shB: -18, hipF: 6.5, hipB: -7, arm: 14 },
    box: { head: [-14, -40, 18, 6], torso: [-26, -46, 26, 12], arm: [-8, -5, 8, 17], hand: [-10, -10, 10, 11], leg: [-10, -9, 11, 22] },
    head: function (g, e) {
      chip(g, 2, -11, 13, 7, BK, { noTop: 1 });
      chip(g, 2, -21, 13, 10, BK, { noTop: 1 });
      chip(g, 2, -27, 13, 6, '#ffc93a');
      R(g, -4, -20, 17, 9, 3, '#120f1c', { flat: 1, lw: 1.2 });
      screenFace(g, 5, -16.2, e, EY, 0.72, true);
      if (e === 'a' || e === 'w' || e === 'k') R(g, 1.5, -5.5, 10, 3.2, 1, '#16131c', { flat: 1, lw: 1 });
      else L(g, 'M2 -4.5 L11 -5', 1.6, '#16131c');
    },
    torso: function (g) {
      var cols = [BK, RD, GR, BL, RD];
      var rr = [16, 19, 21.5, 22, 20]; for (var i = 0; i < 5; i++) chip(g, 0, 2 - 7 * (i + 1), rr[i], 7, cols[i], { noTop: i < 4 });
      g.save(); g.shadowColor = EY; g.shadowBlur = 3 * KPX; dot(g, 3, -28, 2.4, EY); g.restore();
    },
    arm: function (g) { for (var i = 2; i >= 0; i--) chip(g, 0, -1.5 + i * 4.8, 6.4, 4.8, i === 1 ? BK : RD, { noTop: i !== 0 }); },
    hand: function (g) { chipFace(g, 0, 1.5, 8.4, BL); },
    leg: function (g) { chip(g, 1, 12, 8.5, 5.5, BK, { noTop: 1 }); chip(g, 0, 6.5, 7.5, 5.5, RD, { noTop: 1 }); chip(g, 0, 1, 7.5, 5.5, BL, { noTop: 1 }); chip(g, 0, -4.5, 7.5, 5.5, GR); }
  });
})();

/* 23 ---- CAPITAN SALSA ------------------------------------------------- */
(function () {
  var SK = '#e8a77c', RD = '#d62f2f', GD = '#ffcf40', HT = '#24202c', BD = '#e2531f', PT = '#16131c', CN = '#2f3340';
  def({ rim: 0.5, id: 'pirata', nome: 'CAPITAN SALSA', motto_it: 'Arrrr… raddoppio!', motto_en: 'Arrrr… double down!', universo: 'inedito', colore: '#ff4d2e', colore2: GD, taglia: 1.05, peso: 3, style: 'gun', two: true, grip2: 14, arma: 'cannone a spalla',
    tip: [34, -4.5], wLen: 34, skin: SK,
    box: { head: [-31, -58, 37, 12], torso: [-21, -38, 21, 11], weapon: [-14, -18, 36, 9] },
    head: function (g, e) {
      S(g, 'M-3 -18 Q-7 0 5 7 Q14 11 21 2 Q27 -6 25 -17 Q12 -12 -3 -18', BD);
      headBase(g, SK);
      ring(g, -15, -10.5, 2.4, 3.4, OUT); ring(g, -15, -10.5, 2.4, 1.6, GD);
      L(g, 'M-17 -31 Q2 -30 23 -19', 1.9, PT);
      eyes(g, 9, -21, e, { only: -1, iris: '#3a6ad8', brow: '#a8361a' });
      S(g, 'M11 -25 Q17 -27.5 21 -23 Q21 -17 15.5 -16.5 Q11 -18 11 -25', PT, { hl: false });
      if (e === 'a') L(g, 'M11 -28 L21 -26', 2.4, '#a8361a');
      E(g, 19.5, -15, 3.5, 3, '#e08a64', { hl: false });
      mouth(g, 13, -6.5, e, { s: 0.9, style: 'grin' });
      S(g, 'M6 -10 Q12 -14 18 -11 Q24 -13 27 -8 Q22 -8 18 -8.5 Q12 -7 6 -7.5 Q3 -8 6 -10', BD);
      S(g, 'M-27 -30 Q-21 -45 -6 -42.5 Q2 -55 14 -44.5 Q28 -47 33 -32 Q20 -38 4 -36 Q-12 -38 -27 -30', HT);
      L(g, 'M-25 -31 Q-12 -37.5 4 -35.5 Q20 -37.5 31 -33', 1.6, GD);
      E(g, 4.5, -43.5, 4, 3.5, '#ffffff', { hl: false, lw: 1 }); dot(g, 3.2, -43.8, 0.9, PT); dot(g, 5.8, -43.8, 0.9, PT);
      L(g, 'M0 -38.5 L9 -41.5 M0 -41.5 L9 -38.5', 1.1, '#ffffff');
    },
    torso: function (g) {
      S(g, 'M-14 -26 Q-14 -32 -6 -32 L12 -32 Q15 -31 15 -26 L16.5 7 L-16.5 7 Z', RD);
      L(g, 'M1 -12 L1 6.5', 1.2);
      S(g, 'M-2 -32 L8 -32 L5 -15 L1 -15 Z', '#f4efe6', { hl: false });
      L(g, 'M0 -28 Q3 -26 6 -28 M0.5 -23 Q3 -21 5.5 -23', 0.9);
      L(g, 'M-2.5 -31.5 L0.5 -13 M8.5 -31.5 L5.5 -13', 1.4, GD);
      R(g, -14.8, -12, 30, 4.6, 1.5, PT, { hl: false });
      R(g, 0.5, -13.2, 6.2, 7, 1, GD, { hl: false, lw: 1.1 });
      E(g, -6, -20, 1.2, 1.2, GD, { flat: 1, lw: 0.8 }); E(g, 11, -20, 1.2, 1.2, GD, { flat: 1, lw: 0.8 });
    },
    arm: function (g) { armStd(g, RD, { w: 4.8, cuff: GD }); },
    hand: function (g) { handStd(g, SK); },
    leg: function (g, f) {
      if (f) legStd(g, '#3a2a20', PT, { cuff: '#5a3a24' });
      else { C(g, 0, -2, 0, 9, 4.6, '#3a2a20', { hl: false }); C(g, 0, 8, 0, 19, 2.4, '#b07a45', { hl: false }); E(g, 0, 19.6, 2.8, 1.3, '#7a4a24', { flat: 1, lw: 1 }); }
    },
    weapon: function (g) {
      R(g, -1.5, -1, 5, 8, 2, '#7a4a24', { hl: false });
      E(g, -8.5, -4.8, 4.2, 5, CN, { hl: false });
      S(g, 'M-7 -11.5 L29 -13 L29 3.5 L-7 2 Z', CN);
      R(g, 4, -12.5, 3, 15.5, 1, GD, { hl: false, lw: 1 }); R(g, 18, -13.5, 3, 17.5, 1, GD, { hl: false, lw: 1 });
      R(g, 27, -15.5, 6.5, 21.5, 2.5, CN);
    }
  });
})();

/* 24 ---- YETI ---------------------------------------------------------- */
(function () {
  var FU = '#eaf6ff', FC = '#5aa0d8', HN = '#c9b48a', IC = '#bfefff';
  def({ id: 'yeti', nome: 'YETI', motto_it: 'Sangue freddo, mani grandi.', motto_en: 'Cold blood, big hands.', universo: 'inedito', colore: '#7fd8ff', colore2: '#ffffff', taglia: 1.25, peso: 5, style: 'melee', arma: 'clava di ghiaccio',
    tip: [38, 0], wLen: 42, skin: FC,
    geo: { neck: -32, shY: -26, shF: 12, shB: -14, hipF: 6, hipB: -6, arm: 16 },
    box: { head: [-30, -62, 32, 8], torso: [-25, -42, 25, 10], arm: [-9, -9, 9, 20], hand: [-10, -9, 10, 11], leg: [-11, -9, 16, 23], weapon: [-10, -16, 45, 12] },
    head: function (g, e) {
      S(g, 'M-12 -34 Q-22 -40 -20 -52 Q-15 -44 -7 -40 Z', HN); S(g, 'M12 -36 Q22 -44 22 -55 Q27 -44 18 -33 Z', HN);
      SPK(g, 2, -20, 20.5, 19, 13, 4, -0.3, FU);
      S(g, 'M-1 -30 Q12 -34.5 23 -28 Q27 -18 22.5 -9.5 Q12 -3.5 2 -9 Q-3 -19 -1 -30', FC);
      eyes(g, 11, -23, e, { s: 0.85, sp: 5.6, iris: '#1d2a4a', noBrow: 1 });
      S(g, 'M-2 -31.5 Q11 -37.5 25 -29.5 Q18 -28.5 11 -30 Q4 -28.5 -2 -31.5', FU, { hl: false });
      if (e === 'n' || e === 'b') L(g, 'M3 -11.5 Q12 -8.5 22 -12.5', 1.8);
      else mouth(g, 12.5, -12, e, { s: 1.1 });
      S(g, 'M5 -11.5 L6.5 -16.5 L8.2 -10.8 Z', '#fff8e6', { hl: false, lw: 1 }); S(g, 'M16.5 -11.6 L18.3 -16.8 L20 -12 Z', '#fff8e6', { hl: false, lw: 1 });
    },
    torso: function (g) {
      SPK(g, 0, -15, 17, 18, 14, 3.5, 0.1, FU);
      E(g, 3, -12, 9, 11, '#cfe3f5', { hl: false });
    },
    arm: function (g) { C(g, 0, -1, 0, 13, 6.2, FU, { hl: false }); S(g, 'M-6 4 L-9 6 L-6 8 L-8.5 10.5 L-5.5 11 Z', FU, { hl: false, lw: 1.2 }); },
    hand: function (g) { E(g, 0, 1, 7, 6.5, FC, { hl: false }); L(g, 'M-2 3 L-2 7 M1.5 3.5 L1.5 7.4 M4.5 2.5 L4.5 6', 1); },
    leg: function (g) {
      C(g, 0, -2, 0, 10, 6, FU, { hl: false });
      S(g, 'M-7 9 L6 9 Q13 11 13.5 16 Q13.8 20.2 9 20.2 L-7 20.2 Q-8.5 20.2 -8.5 18 L-8.5 11 Q-8.5 9 -7 9', FC);
      L(g, 'M8 16 L8 20 M11 15.5 L11 19.5', 1);
    },
    weapon: function (g) {
      C(g, -6, 0, 16, 0, 2.6, '#8a5a32', { hl: false });
      S(g, 'M14 -6 L22 -12.5 L30 -9 L38 -13.5 L42.5 -4 L40.5 5 L32 9 L22 8 L15 5 Z', IC);
      L(g, 'M22 -12.5 L25 0 L32 9 M38 -13.5 L33 -2 L25 0 M33 -2 L42.5 -4', 1, '#ffffff');
    }
  });
})();

// pubblico
DEFS.forEach(function (c) {
  c.pub = { id: c.id, nome: c.nome, motto_it: c.motto_it, motto_en: c.motto_en, universo: c.universo, colore: c.colore, colore2: c.colore2, taglia: c.taglia, peso: c.peso, stile: c.style, arma: c.arma || '' };
  LIST.push(c.pub);
});
W.GBR = GBR;
})(window);
