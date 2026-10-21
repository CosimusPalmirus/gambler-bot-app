/* GAMBLER SMASH — CUCÙ, ulti CUCÙ! (21/10): disegno dei proiettili del motore (ulti_nuovi.js cucu). L'orologio, la raggiera e il
   primo tratto dell'onda sono nella clip (ulti_pose.js); qui:
   - 'rintocco_cucu': prima il cerchio d'oro a terra col quadrante (si scansa), poi il fascio di luce che cade dal cielo;
   - 'onda_cucu': l'onda d'urto che continua oltre l'inquadratura della clip (archi bianco-azzurri + scie), fino al muro;
   - 'lampo_cucu': la spinta dietro al Cucù, il lampo e' gia' nella clip (non si disegna niente).
   SOLO DISEGNO (avvolge GSE.proj). */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2;
  function rintocco(c, S, P) {
    const F = S.L[P.own], H = F ? root.GS.D(F).H : 60, gy = P.y + P.h, t = P.t;
    c.save();
    if (t < P.del) {   // avviso: il cerchio a terra si stringe, il quadrante con 12 tacche, un filo di luce che scende
      const q = t / P.del, r = H * (1.1 - .45 * q), lamp = (t >> 2) % 2 ? 1 : .6;
      c.translate(P.x, gy); c.scale(1, .3);
      c.globalAlpha = .22 + .25 * q; c.fillStyle = '#ffd76a'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
      c.globalAlpha = .9 * lamp; c.strokeStyle = '#ffcf40'; c.lineWidth = H * .08; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
      c.strokeStyle = '#fff6d8'; c.lineWidth = H * .035;
      for (let k = 0; k < 12; k++) { const a = k * TAU / 12; c.beginPath(); c.moveTo(Math.cos(a) * r * .72, Math.sin(a) * r * .72); c.lineTo(Math.cos(a) * r * .88, Math.sin(a) * r * .88); c.stroke(); }
      c.restore(); c.save();
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = .25 * q;
      const g = c.createLinearGradient(0, gy - H * 9, 0, gy); g.addColorStop(0, 'rgba(255,230,150,0)'); g.addColorStop(1, 'rgba(255,230,150,1)');
      c.fillStyle = g; c.fillRect(P.x - H * .05, gy - H * 9, H * .1, H * 9);
    } else {           // il fascio: largo, caldo, dal cielo al suolo, poi si spegne
      const al = Math.max(0, 1 - (t - P.del) / 10), w = H * (.55 + .25 * al);
      c.globalCompositeOperation = 'lighter';
      const g = c.createLinearGradient(P.x - w, 0, P.x + w, 0);
      g.addColorStop(0, 'rgba(255,200,90,0)'); g.addColorStop(.35, 'rgba(255,214,120,.55)'); g.addColorStop(.5, 'rgba(255,250,225,1)'); g.addColorStop(.65, 'rgba(255,214,120,.55)'); g.addColorStop(1, 'rgba(255,200,90,0)');
      c.globalAlpha = al; c.fillStyle = g; c.fillRect(P.x - w, gy - H * 10, w * 2, H * 10);
      c.translate(P.x, gy); c.scale(1, .32);
      c.globalAlpha = al; c.strokeStyle = '#ffe9a8'; c.lineWidth = H * .12 * al; c.beginPath(); c.arc(0, 0, H * (.6 + 1.2 * (1 - al)), 0, TAU); c.stroke();
      c.fillStyle = '#fff6d8'; c.globalAlpha = .7 * al; c.beginPath(); c.arc(0, 0, H * .5, 0, TAU); c.fill();
      c.setTransform(c.getTransform().scale(1, 1 / .32));
      c.globalAlpha = al; c.fillStyle = '#fff3c4';
      for (let k = 0; k < 10; k++) { const a = -Math.PI * (k + .5) / 10, rr = H * (.4 + 1.5 * (1 - al)) * (1 + (k % 3) * .2); c.beginPath(); c.arc(Math.cos(a) * rr, Math.sin(a) * rr * .8, H * .045, 0, TAU); c.fill(); }
    }
    c.restore();
    return true;
  }
  function onda(c, S, P) {
    const F = S.L[P.own], H = F ? root.GS.D(F).H : 60, d = P.a1 || 1, fatto = P.t * Math.abs(P.vx);   // quanta strada ha fatto
    const dentro = Math.min(1, Math.max(0, (fatto - H * 1.2) / (H * 1.6)));   // il primo tratto e' nella clip
    const fine = Math.min(1, P.life / 6), al = dentro * fine; if (al <= 0) return true;
    const h = P.h * 1.15;
    c.save(); c.translate(P.x, P.y); c.scale(d, 1); c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) {   // tre archi (come nella clip): il fronte bianco, due echi azzurri dietro
      const dx = -k * H * .55, rx = H * (.55 - k * .1);
      const g = c.createRadialGradient(dx - rx * .4, 0, 0, dx - rx * .4, 0, h);
      g.addColorStop(0, 'rgba(180,215,255,0)'); g.addColorStop(.7, k ? 'rgba(150,200,255,.18)' : 'rgba(220,240,255,.28)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.globalAlpha = al * (1 - k * .28); c.fillStyle = g; c.beginPath(); c.ellipse(dx, 0, rx, h, 0, -Math.PI / 2, Math.PI / 2); c.lineTo(dx - rx * .3, -h); c.fill();
      c.strokeStyle = k ? 'rgba(170,215,255,.8)' : 'rgba(255,255,255,.95)'; c.lineWidth = H * (k ? .05 : .1);
      c.beginPath(); c.ellipse(dx, 0, rx, h, 0, -Math.PI / 2, Math.PI / 2); c.stroke();
    }
    c.globalAlpha = al * .7; c.strokeStyle = 'rgba(210,235,255,.9)'; c.lineCap = 'round';   // scie del vento dietro al fronte
    for (let k = 0; k < 9; k++) {
      const y = (k / 8 - .5) * h * 1.6, ph = ((P.t * 1.7 + k * 3.1) % 6) / 6, x1 = -H * (.3 + ph * .5), len = H * (1.2 + (k % 3) * .5);
      c.lineWidth = H * (.025 + (k % 2) * .02); c.beginPath(); c.moveTo(x1, y); c.lineTo(x1 - len, y); c.stroke();
    }
    c.restore();
    return true;
  }
  (function aggancia() {
    if (!root.GSE || !root.GSE.proj || !root.GS) return setTimeout(aggancia, 100);
    const p0 = root.GSE.proj;
    root.GSE.proj = function (c, S, P) {
      if (P.fo === 'rintocco_cucu') { try { return rintocco(c, S, P); } catch (e) { return true; } }
      if (P.fo === 'onda_cucu') { try { return onda(c, S, P); } catch (e) { return true; } }
      if (P.fo === 'lampo_cucu') return true;
      return p0.apply(this, arguments);
    };
  })();
})(window);
