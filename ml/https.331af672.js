var BX2_URL = 'https://62-238-17-24.sslip.io/boxe/';
var BX2_BLOCCATI = null;
function bx2Blocca(){
  BX2_BLOCCATI = [];
  var tutti = document.querySelectorAll('body, div, main, section');
  for (var i = 0; i < tutti.length; i++){
    var e = tutti[i];
    if (e.id === 'bx2wrap' || e.closest('#bx2wrap')) continue;
    if (e.scrollHeight <= e.clientHeight + 4) continue;
    var ov = getComputedStyle(e).overflowY;
    if (ov !== 'auto' && ov !== 'scroll') continue;
    BX2_BLOCCATI.push({ e: e, ov: e.style.overflowY });
    e.style.overflowY = 'hidden';
  }
}
function bx2Sblocca(){
  if (!BX2_BLOCCATI) return;
  for (var i = 0; i < BX2_BLOCCATI.length; i++)
    BX2_BLOCCATI[i].e.style.overflowY = BX2_BLOCCATI[i].ov;
  BX2_BLOCCATI = null;
}
function apriBoxe2(modo){
  var w = document.getElementById('bx2wrap'), f = document.getElementById('bx2frame');
  if(modo === 'tut') f.setAttribute('src', BX2_URL + '?tut=1&t=' + Date.now());
  else if(!f.getAttribute('src')) f.setAttribute('src', BX2_URL);
  w.style.display = 'block';
  bx2Blocca();
  try{ if(window.Telegram && Telegram.WebApp && Telegram.WebApp.expand) Telegram.WebApp.expand(); }catch(e){}
}
function chiudiBoxe2(){
  document.getElementById('bx2wrap').style.display = 'none';
  bx2Sblocca();
}
