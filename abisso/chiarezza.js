// NON SVEGLIARE IL DRAGO - chiarezza (16/11 notte): «Come si gioca» illustrato in pixel, una regola per riga.
"use strict";
function icona(src, sx, sw, sh, sc) {   // un ritaglio di sprite ingrandito senza sfumature
  return '<span class="ic-px" style="width:' + sw * sc + 'px;height:' + sh * sc + 'px;background:url(pix/' + src + ') -' + sx * sc + 'px 0/auto ' + sh * sc + 'px no-repeat"></span>';
}
apriRegole = function () {
  const it = LINGUA === "it", s = $("scheda");
  const segno = icona("segni.png", 2 * 16, 16, 16, 2), segno2 = segno + segno;
  const righe = it ? [
    [icona("bot_lavanda.png", 40, 20, 30, 1.4), "<b>Scendete insieme</b> lungo il sentiero verso il drago che dorme. A ogni passo si scopre una carta."],
    [icona("mucchio_m.png", 0, 18, 11, 2), "<b>Oro</b>: si divide in parti uguali fra chi è sul sentiero. Quello che avanza <b>resta sulla tessera</b>."],
    [segno, "<b>Segno del drago</b>: uno da solo non fa niente, il drago si agita."],
    [segno2, "<b>Due segni uguali</b>: il drago si sveglia. Chi è sul sentiero perde l'oro che porta."],
    ['<span class="tasti-px">AVANTI<br>TORNA SU</span>', "Prima di ogni carta tutti scelgono <b>in segreto</b>. Le scelte si girano insieme."],
    [icona("forziere.png", 18, 18, 16, 2), "<b>Torna su</b>: l'oro che porti va nel <b>forziere</b> (al sicuro per sempre), più gli avanzi delle tessere divisi con chi torna con te."],
    [icona("calice.png", 0, 12, 16, 2), "<b>Reliquia</b>: la prende solo chi torna su <b>da solo</b>."],
    ['<span class="tasti-px">5</span>', "Dopo <b>5 spedizioni</b> vince chi ha più oro nel forziere."],
  ] : [
    [icona("bot_lavanda.png", 40, 20, 30, 1.4), "<b>Go down together</b> along the path toward the sleeping dragon. Each step reveals a card."],
    [icona("mucchio_m.png", 0, 18, 11, 2), "<b>Gold</b> is split equally among thieves on the path. The remainder <b>stays on the tile</b>."],
    [segno, "<b>Dragon sign</b>: one alone does nothing, the dragon stirs."],
    [segno2, "<b>Two identical signs</b>: the dragon wakes. Everyone on the path loses the gold they carry."],
    ['<span class="tasti-px">GO ON<br>GO BACK</span>', "Before each card everyone chooses <b>in secret</b>. Choices are revealed together."],
    [icona("forziere.png", 18, 18, 16, 2), "<b>Go back</b>: your gold goes into the <b>chest</b> (safe forever), plus the tile leftovers split with whoever goes back with you."],
    [icona("calice.png", 0, 12, 16, 2), "<b>Relic</b>: only a thief going back <b>alone</b> takes it."],
    ['<span class="tasti-px">5</span>', "After <b>5 expeditions</b> the most gold in the chest wins."],
  ];
  s.innerHTML = "<h2>" + (it ? "Come si gioca" : "How to play") + '</h2><div class="regole-px">' + righe.map(([i, t]) => '<div class="r-px"><div class="r-ic">' + i + '</div><div class="r-tx">' + t + "</div></div>").join("") +
    '</div><p class="tasti-pc">' + (it ? "Tasti: ↓ S avanti · ↑ W torna su · H regole · Esc chiude" : "Keys: ↓ S go on · ↑ W go back · H rules · Esc closes") + '</p><button class="btn risali" id="b-chiudi">' + (it ? "Ho capito" : "Got it") + "</button>";
  $("velo").hidden = false; $("velo").dataset.chiudibile = 1; $("b-chiudi").onclick = chiudiVelo;
};
$("b-regole").onclick = apriRegole;
