// COSMETICI_2011B (20/11/2026) · ab 1-2: LANTERNA D'ORO / LANTERNA DEL DRAGO nella mano del ladro.
// Chi ha cosa: il ponte di abisso.html mette in info.lanterna[seggio] il look `tvl.ab` dei profili dello start (a tutti,
// spettatori compresi); i bot niente. Il gioco non aveva lanterne: la si disegna SOLO a chi l'ha sbloccata (scelta sobria:
// chi non l'ha resta com'e' oggi). Si avvolge botPix (tutte le scene che disegnano un ladro: sentiero, risalita, caduta,
// intro, finale): lo sprite 20x30 di sempre con la lanterna in pixel nel colore del set; la fiamma tremola su 3 fasi.
"use strict";
(function () {
  if (typeof botPix !== "function" || window.ABLAN_OFF) return;
  const BASE = botPix, CACHE = new WeakMap();
  const SET = {
    1: { t: "rgb(212,175,55)", tb: "rgb(122,86,0)", l: ["rgb(255,210,122)", "rgb(255,236,170)", "rgb(255,190,90)"], a: "rgba(255,210,122,.32)" },
    2: { t: "rgb(34,110,62)", tb: "rgb(12,52,28)", l: ["rgb(74,222,128)", "rgb(170,255,200)", "rgb(40,200,110)"], a: "rgba(74,222,128,.32)" }
  };
  function chi(sg) { try { const a = (typeof INFO !== "undefined" && INFO) ? INFO.lanterna : null, v = a ? (a[sg] | 0) : 0; return SET[v] ? v : 0; } catch (e) { return 0; } }
  window.ABLAN = { chi: chi };
  function disegna(x, s, fase) {
    const px = (c, X, Y, w, h) => { x.fillStyle = c; x.fillRect(X, Y, w || 1, h || 1); };
    // alone (dentro lo sprite), manico, cappello, vetro con la fiamma, base
    px(s.a, 14, 15, 1, 6); px(s.a, 19, 15, 1, 6); px(s.a, 15, 22, 4, 1);
    px(s.tb, 16, 12); px(s.tb, 15, 13); px(s.tb, 18, 13); px(s.t, 17, 12);
    px(s.t, 15, 14, 4, 1);
    px(s.tb, 15, 15, 1, 5); px(s.tb, 18, 15, 1, 5);
    px(s.l[fase], 16, 15, 2, 5); px(s.l[(fase + 1) % 3], 16, 16 + (fase === 2 ? 1 : 0), 1, 2);
    px(s.t, 15, 20, 4, 1); px(s.tb, 16, 21, 2, 1);
  }
  botPix = function (sg, frame) {
    const sp = BASE(sg, frame), v = chi(sg);
    if (!v || !sp || !sp.getContext) return sp;
    const fase = Math.floor(performance.now() / 150) % 3, k = v + "|" + fase;
    let m = CACHE.get(sp); if (!m) { m = {}; CACHE.set(sp, m); }
    if (!m[k]) {
      const c = document.createElement("canvas"); c.width = sp.width; c.height = sp.height;
      const x = c.getContext("2d"); x.imageSmoothingEnabled = false; x.drawImage(sp, 0, 0);
      try { disegna(x, SET[v], fase); } catch (e) { }
      m[k] = c;
    }
    return m[k];
  };
})();
