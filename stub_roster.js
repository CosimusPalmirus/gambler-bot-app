/* Roster di RIPIEGO: stessa API di roster_1410/roster.js (window.GBR), sagome semplici.
   Si carica solo se il roster vero manca. */
(function () {
  'use strict';
  if (window.GBR) return;
  const D = [
    ['bot', 'Bot', '#39d5ff', '#1a3550', .9, 2], ['don', 'Il Don', '#3a3a46', '#d4af37', 1.15, 4], ['croupier', 'Croupier', '#c8102e', '#f4f1e8', 1, 2.5],
    ['agamennone', 'Agamennone', '#b8862b', '#7a1f1f', 1.15, 4], ['gladiatrice', 'Gladiatrice', '#c0703a', '#e8d9a8', 1.05, 3], ['pugile', 'Pugile', '#e23b3b', '#ffffff', 1, 3],
    ['pinna', 'Pinna', '#4a7fa8', '#dfe8ee', 1.25, 4.5], ['polpone', 'Polpone', '#a8448f', '#f2a6d8', 1.2, 4], ['lupo', 'Lupo', '#6e6a78', '#c9c1b0', 1.05, 3],
    ['veggente', 'Veggente', '#7b3fbf', '#f0c94a', .95, 1.5], ['pilota', 'Pilota', '#ff7a1a', '#222222', .95, 2.5], ['stecca', 'Stecca', '#1f7a4a', '#f5f5f5', 1, 2.5],
    ['ninja', 'Ninja', '#20232e', '#33ffb4', .9, 1.5], ['strega', 'Strega', '#2e8b57', '#6b2fa3', .95, 2], ['pizzaiolo', 'Pizzaiolo', '#f4f1e8', '#d6312b', 1.1, 3.5],
    ['astro', 'Astro', '#e9eef5', '#ff8c1a', 1, 1.5], ['dj', 'DJ', '#ff2bd6', '#1ad7ff', 1.05, 3], ['samurai', 'Samurai', '#b1202a', '#f2c230', 1.1, 3.5],
    ['vampira', 'Vampira', '#5b0f2e', '#e8e0f0', 1, 2], ['zucca', 'Zucca', '#ff8a1c', '#3a7a2a', 1, 2.5], ['mariachi', 'Mariachi', '#1d1d1d', '#f2efe6', 1, 2],
    ['golem', 'Golem', '#2f6fd6', '#e8c547', 1.3, 5], ['pirata', 'Pirata', '#3b2a1f', '#c9a227', 1.1, 3.5], ['yeti', 'Yeti', '#eaf4fb', '#7fb6e0', 1.25, 4.5],
  ];
  const list = D.map(r => ({ id: r[0], nome: r[1], motto_it: '', motto_en: '', universo: 'Gambler', colore: r[2], colore2: r[3], taglia: r[4], peso: r[5] }));
  const by = {}; list.forEach(c => by[c.id] = c);

  function draw(ctx, id, x, y, o) {
    const c = by[id] || list[0];
    o = o || {};
    // stesse convenzioni del roster vero: altezza disegnata = h * taglia; aim = angolo del mondo (radianti, y in giù)
    let f = o.facing === -1 ? -1 : 1;
    const h = (o.h || 96) * c.taglia, t = o.t || 0, pose = o.pose || 'idle';
    const hasAim = typeof o.aim === 'number' && isFinite(o.aim);
    if (hasAim && Math.cos(o.aim) * f < -.12) f = -f;
    const aim = hasAim ? (f > 0 ? o.aim : Math.PI - o.aim) : 0;
    ctx.save();
    ctx.translate(x, y);
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    ctx.scale(f, 1);
    const s = h / 64;
    ctx.scale(s, s);
    let lean = 0, bob = Math.sin(t * 6) * 1.2, legA = 0, armA = -0.3, arm2 = 0.4;
    if (pose === 'run') { legA = Math.sin(t * 16) * .7; bob = Math.abs(Math.sin(t * 16)) * -3; lean = .15; armA = -Math.sin(t * 16) * .8; }
    if (pose === 'attack' || pose === 'super') { armA = -(aim || 0) + 1.57 * 0 - 0; lean = .1; }
    if (pose === 'hit') { lean = -.35; armA = -2.2; arm2 = -2; }
    if (pose === 'ko') { ctx.rotate(t * 14); }
    if (pose === 'jump') { legA = .6; armA = -2.4; }
    if (pose === 'fall') { legA = -.3; armA = -2.8; arm2 = -2.6; }
    if (pose === 'win') { armA = -2.9; arm2 = -2.9; bob = Math.sin(t * 8) * 3; }
    ctx.translate(0, bob);
    ctx.rotate(lean);
    ctx.lineCap = 'round';
    // gambe
    ctx.strokeStyle = c.colore2; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(-6, -22); ctx.lineTo(-6 + Math.sin(legA) * 16, -22 + Math.cos(legA) * 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, -22); ctx.lineTo(6 - Math.sin(legA) * 16, -22 + Math.cos(legA) * 20); ctx.stroke();
    // corpo
    ctx.fillStyle = o.tint || c.colore;
    ctx.strokeStyle = '#0b0b14'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, -36, 16, 18, 0, 0, 6.283); ctx.fill(); ctx.stroke();
    ctx.fillStyle = c.colore2; ctx.fillRect(-15, -30, 30, 5);
    // braccio dietro
    ctx.strokeStyle = o.tint || c.colore; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(-8, -44); ctx.lineTo(-8 + Math.cos(arm2 + 1.57) * 16, -44 + Math.sin(arm2 + 1.57) * 16); ctx.stroke();
    // testa
    ctx.fillStyle = o.tint || c.colore; ctx.strokeStyle = '#0b0b14'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(2, -60, 12, 0, 6.283); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(7, -62, 4, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(8.5, -62, 2, 0, 6.283); ctx.fill();
    // braccio davanti (segue la mira negli attacchi)
    ctx.strokeStyle = c.colore2; ctx.lineWidth = 9;
    const aa = (pose === 'attack' || pose === 'super') ? aim : armA + 1.57;
    ctx.beginPath(); ctx.moveTo(8, -44); ctx.lineTo(8 + Math.cos(aa) * 22, -44 + Math.sin(aa) * 22); ctx.stroke();
    ctx.fillStyle = '#0b0b14'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(c.nome[0] === 'I' ? c.nome[3] : c.nome[0], 0, -31);
    ctx.restore();
  }
  function portrait(ctx, id, x, y, size) {
    const c = by[id] || list[0];
    ctx.save();
    ctx.fillStyle = c.colore2; ctx.fillRect(x, y, size, size);
    ctx.beginPath(); ctx.rect(x, y, size, size); ctx.clip();
    draw(ctx, id, x + size / 2, y + size * 1.55, { h: size * 1.6 / c.taglia, pose: 'idle' });
    ctx.restore();
  }
  window.GBR = { list, get: id => by[id], draw, portrait, prebake() { }, stub: true };
})();
