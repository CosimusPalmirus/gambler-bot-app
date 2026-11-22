(function () {
  var server = null, card = null;
  function en() { return window.GB_LANG === 'en'; }
  function L(it, eng) { return en() ? eng : it; }
  function cifra(v) { return '€' + Number(v).toFixed(2).replace('.', en() ? '.' : ','); }
  function numero(v) { if (v === null || v === undefined || v === '') return null; var n=Number(v); return isFinite(n)&&n>=0?n:null; }
  function dati() {
    if (RTD.tour) return { modo:'torneo' };
    if (RTD.practice) return { modo:'pratica' };
    var c=server||card, posta=c?numero(c.stake_eur):null;
    if (c&&c.gratis===true)posta=0;
    if (!c&&RTD._postaCoda2310!==undefined)posta=numero(RTD._postaCoda2310);
    return {modo:posta===0?'gratis':posta===null?'attesa':'soldi',posta:posta,
      n:server?Math.max(1,Number(server.players)||1):null};
  }
  function dipingi() {
    if (RTD.ui!=='search')return;
    var el=document.getElementById('arc-body');if(!el)return;
    var d=dati(),p=el.querySelector('#arc-prize,.twr-prize'),html='';
    if (d.modo==='torneo')html=L('MATCH DEL TORNEO','TOURNAMENT MATCH');
    else if(d.modo==='pratica')html=L('ALLENAMENTO GRATUITO','FREE PRACTICE');
    else if(d.modo==='gratis')html=L('GRATIS','FREE');
    else if(d.modo==='soldi')html=L('POSTA','STAKE')+': <b>'+cifra(d.posta)+'</b><span>'+(d.n===null?L('In attesa del tavolo','Waiting for the table'):L('Montepremi attuale','Current prize pool')+': '+cifra(d.posta*d.n))+'</span>';
    else html=L('Verifica della posta…','Checking stake…');
    if(p&&p.innerHTML!==html)p.innerHTML=html;
    var b=el.querySelector('button[onclick="rtdLeave()"]');
    if(b){var text=d.modo==='soldi'?L('ANNULLA (rimborso)','CANCEL (refund)'):L('ESCI','LEAVE');if(b.textContent!==text)b.textContent=text;}
    var badge=el.querySelector('.gbf-modo'),theme=d.modo==='soldi'?'oro':d.modo==='torneo'?'gelo':'neutro';
    if(badge){var label=d.modo==='soldi'?L('A SOLDI','FOR MONEY'):d.modo==='torneo'?L('TORNEO','TOURNAMENT'):d.modo==='pratica'?L('ALLENAMENTO','PRACTICE'):d.modo==='gratis'?L('GRATIS','FREE'):L('IN ATTESA','WAITING');
      badge.textContent=label;badge.className='gbf-modo m-'+d.modo;}
    if(el.classList.contains('gbc-on')){
      ['oro','gelo','neutro'].forEach(function(t){el.classList.toggle('gbc-'+t,t===theme);});
      var w=el.querySelector('.gbc');if(w)['oro','gelo','neutro'].forEach(function(t){w.classList.toggle('gbf-t-'+t,t===theme);w.classList.toggle('gbc-'+t,t===theme);});
    }
  }
  var join=rtdJoin;
  rtdJoin=function(){server=null;card=null;RTD.searchN=1;RTD.searchCap=RTD.sq?4:2;RTD._postaCoda2310=RTD.tier;return join.apply(this,arguments);};
  var entra=lobEnter;
  lobEnter=function(){server=null;card=typeof LOB!=='undefined'&&LOB.card?Object.assign({},LOB.card):null;delete RTD._postaCoda2310;return entra.apply(this,arguments);};
  var msg=rtdOnMsg;
  rtdOnMsg=function(m){
    if(m&&m.t==='lobby'&&m.game===RTD.game&&(!m.tour||RTD.tour)){
      server=Object.assign({},m);
      if(m.tour)server.tour=m.tour;
    }
    var r=msg.apply(this,arguments);dipingi();return r;
  };
  var show=rtdShowSearch;
  rtdShowSearch=function(){var r=show.apply(this,arguments);dipingi();return r;};
  var body=document.getElementById('arc-body');
  if(body)new MutationObserver(function(){if(body.querySelector('.gbc'))dipingi();}).observe(body,{childList:true});
  window.GBPostaCoda2310={dati:dati,dipingi:dipingi};
})();
