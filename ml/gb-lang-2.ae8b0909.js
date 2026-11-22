(function(){
  function L(it,en){return (window.GB_LANG==='en')?en:it;}
  window.LOB_SQ=0;
  var _entra=window.lobEnter;
  if(typeof _entra==='function'){
    window.lobEnter=function(){ if(!window.__gs2Sq)window.LOB_SQ=0; window.__gs2Sq=0; return _entra.apply(this,arguments); };
  }
  window.lobEnterSq=function(q){ window.__gs2Sq=1; window.LOB_SQ=(q===2)?2:1; window.lobEnter(); };
  var _card=window.lobRenderCard;
  if(typeof _card==='function'){
    window.lobRenderCard=function(){
      var r=_card.apply(this,arguments);
      try{
        var c=LOB.card,el=document.getElementById('lob-body');
        if(!c||!el||c.game!=='smash'||!c.squadre)return r;
        var nome=el.querySelector('.ut-lc-n');
        if(nome&&!nome.querySelector('.gs2-k'))nome.insertAdjacentHTML('beforeend',' <span class="gs2-k" style="font-size:.62em;padding:3px 8px;border-radius:999px;background:#ff7a1a;color:#1a0a00;vertical-align:middle">'+L('2 CONTRO 2','2 VS 2')+'</span>');
        var b=el.querySelector('button[onclick="lobEnter()"]');
        if(b){
          var p=c.gratis?L('gratis','free'):lobEur(c.stake_eur);
          var st='flex:1;min-height:56px;font-size:16px;border:0;border-radius:14px;font-weight:900;color:#fff;cursor:pointer;';
          b.outerHTML='<div style="display:flex;gap:10px">'
            +'<button style="'+st+'background:linear-gradient(180deg,#ff5468,#c4122b)" onclick="lobEnterSq(1)">'+L('ROSSI','RED')+' · '+p+'</button>'
            +'<button style="'+st+'background:linear-gradient(180deg,#4f9bff,#1650c4)" onclick="lobEnterSq(2)">'+L('BLU','BLUE')+' · '+p+'</button></div>'
            +'<div class="ut-note">'+L('Scegli la tua squadra: due per parte. Se vince la tua squadra, il premio si divide a metà.','Pick your team: two per side. If your team wins, the prize is split in half.')+'</div>';
        }
      }catch(e){}
      return r;
    };
  }
  window.gs2SetSq=function(v){ LOB.squadre=!!v; if(v)LOB.posti=4; if(typeof lobRenderCrea==='function')lobRenderCrea(); };
  var _crea=window.lobRenderCrea;
  if(typeof _crea==='function'){
    window.lobRenderCrea=function(){
      if(LOB.game!=='smash'||LOB.posti!==4)LOB.squadre=false;
      var r=_crea.apply(this,arguments);
      try{
        if(LOB.game!=='smash')return r;
        var seg=document.getElementById('lob-posti');
        if(seg&&!document.getElementById('gs2-modo')){
          seg.insertAdjacentHTML('afterend','<div class="ut-seg" id="gs2-modo" style="margin-top:8px">'
            +'<button class="'+(LOB.squadre?'':'sel')+'" onclick="gs2SetSq(0)">'+L('Tutti contro tutti','Free-for-all')+'</button>'
            +'<button class="'+(LOB.squadre?'sel':'')+'" onclick="gs2SetSq(1)">'+L('2 contro 2','2 vs 2')+'</button></div>');
        }
      }catch(e){}
      return r;
    };
  }
  var _setG=window.lobSetGame;
  if(typeof _setG==='function')window.lobSetGame=function(){ LOB.squadre=false; return _setG.apply(this,arguments); };
  var _setP=window.lobSetPosti;
  if(typeof _setP==='function')window.lobSetPosti=function(n){ if(Number(n)!==4)LOB.squadre=false; return _setP.apply(this,arguments); };
  var _apri=window.lobOpenCreate;
  if(typeof _apri==='function')window.lobOpenCreate=function(){ LOB.squadre=false; return _apri.apply(this,arguments); };
})();
