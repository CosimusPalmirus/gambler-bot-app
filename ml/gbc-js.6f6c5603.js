(function(){
  'use strict';
  var CODE={'arc-body':function(){try{return (typeof rtdMeta==='function'&&rtdMeta().title)||'';}catch(e){return '';}},
            'tw-body':function(){return 'GAMBLER CITY ROYALE';},'tk-body':function(){return 'TANK DUEL';},'gld-body':function(){return 'COLOSSEO';}};
  var EMO=/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}\u{FE0F}\u{200D}\u{20E3}]/gu,
      EMO1=/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}\u{FE0F}\u{200D}\u{20E3}]/u;
  function pulisci(nodo){
    try{
      var w=document.createTreeWalker(nodo,NodeFilter.SHOW_TEXT,null),t,v;
      while((t=w.nextNode())){v=t.nodeValue;if(EMO1.test(v))t.nodeValue=v.replace(EMO,'').replace(/^ +/,'');}
    }catch(e){}
  }
  function L(it,en){return (window.GB_LANG==='en')?en:it;}
  var NICO=0;
  function ICO(){
    var g='gbcG'+(++NICO);
    return '<svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="'+g+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4c2"/><stop offset=".5" stop-color="#e2a52c"/><stop offset="1" stop-color="#9a6814"/></linearGradient></defs>'
      +'<circle cx="24" cy="24" r="19" fill="none" stroke="url(#'+g+')" stroke-width="2.4" opacity=".55"/><circle cx="24" cy="24" r="12" fill="none" stroke="url(#'+g+')" stroke-width="2.4" opacity=".8"/>'
      +'<circle cx="24" cy="24" r="4.2" fill="url(#'+g+')"/><path d="M24 24 L38 12" stroke="url(#'+g+')" stroke-width="3" stroke-linecap="round"/></svg>';
  }
  function posti(box,n){
    var m=/(\d+)\s*\/\s*(\d+)/.exec(n.textContent||'');
    n.classList.toggle('gbc-lungo',!m||/[a-z]{4}/i.test((n.textContent||'').replace(/\d+\s*\/\s*\d+/,'')));
    if(!m||+m[2]>12||+m[2]<2){box.innerHTML='';return;}
    var a=+m[1],b=+m[2],h='';for(var i=0;i<b;i++)h+='<i'+(i<a?' class="on"':'')+'></i>';
    if(box.innerHTML!==h)box.innerHTML=h;
  }
  function rifai(el){
    if(!document.getElementById('gbf-css'))return;
    var radar=el.querySelector(':scope > .tw-radar');
    if(!radar){el.classList.remove('gbc-on','gbc-oro','gbc-gelo','gbc-neutro');return;}
    var tt=el.querySelector(':scope > .tw-search-t'),n=el.querySelector(':scope > .tw-search-n'),pr=el.querySelector(':scope > .twr-prize'),
        cd=el.querySelector(':scope > .tw-search-cd'),btn=[].slice.call(el.querySelectorAll(':scope > button'));
    var sotto=((tt&&tt.textContent)||'').replace(EMO,'').trim(),tit,modo,tema;
    var testo=(el.textContent||'').toUpperCase();
    if(/TORNEO|RADUNO/.test(testo)){tit=L('RADUNO','CHECK-IN');modo=['m-torneo',L('TORNEO','TOURNAMENT')];tema='gelo';}
    else if(/ALLENAMENTO|PRATICA|PRACTICE|TRAINING/.test(testo)){tit=L('ALLENAMENTO','TRAINING');modo=['m-pratica',L('ALLENAMENTO','PRACTICE')];tema='neutro';}
    else{
      var gr=pr&&/(?:€\s*0[.,]00|\bGRATIS\b|\bFREE\b)/i.test(pr.textContent||'');
      tit=L('IN CODA','IN QUEUE');modo=gr?['m-gratis',L('GRATIS','FREE')]:['m-soldi',L('A SOLDI','FOR MONEY')];tema=gr?'neutro':'oro';
    }
    var gioco=(CODE[el.id]||function(){return '';})();
    var w=document.createElement('div');w.className='gbf gbc gbf-t-'+tema+' gbc-'+tema;
    w.innerHTML='<div class="gbf-col"><div class="gbf-eroe">'
      +'<div class="gbf-top">'+(gioco?'<span class="gbf-gioco"></span>':'')+'<span class="gbf-modo '+modo[0]+'">'+modo[1]+'</span></div>'
      +'<div class="gbf-med"><div class="gbf-raggi"></div><div class="gbf-anello"></div><div class="gbc-sweep"></div><div class="gbc-ico">'+ICO()+'</div></div>'
      +'<div class="gbf-tit" style="--fz:'+(tit.length>8?34:46)+'px"></div><div class="gbf-fla"></div></div>'
      +'<div class="gbf-info"><div class="gbc-posti"></div><div class="gbc-resto"></div></div></div><div class="gbf-btns"></div>';
    if(gioco)w.querySelector('.gbf-gioco').textContent=String(gioco).replace(EMO,'').trim();
    var t=w.querySelector('.gbf-tit');t.textContent=tit;t.setAttribute('data-t',tit);
    w.querySelector('.gbf-fla').textContent=sotto;
    var info=w.querySelector('.gbf-info'),box=w.querySelector('.gbc-posti'),resto=w.querySelector('.gbc-resto'),bb=w.querySelector('.gbf-btns');
    if(n)info.insertBefore(n,box);
    if(pr)info.appendChild(pr);
    if(cd)info.appendChild(cd);
    btn.forEach(function(b){bb.appendChild(b);});
    [].slice.call(el.children).forEach(function(c){if(c!==radar&&c!==tt)resto.appendChild(c);});
    info.appendChild(resto);
    radar.remove();if(tt)tt.remove();
    el.appendChild(w);
    el.classList.remove('gbc-oro','gbc-gelo','gbc-neutro');el.classList.add('gbc-on','gbc-'+tema);
    pulisci(w);
    if(n){posti(box,n);try{new MutationObserver(function(){pulisci(n);posti(box,n);}).observe(n,{childList:true,characterData:true,subtree:true});}catch(e){}}
    [pr,cd,resto].forEach(function(x){if(x)try{new MutationObserver(function(){pulisci(x);}).observe(x,{childList:true,characterData:true,subtree:true});}catch(e){}});
  }
  function guarda(id){
    var el=document.getElementById(id);if(!el||el.__gbc)return;el.__gbc=1;
    try{new MutationObserver(function(){ if(el.querySelector(':scope > .tw-radar'))rifai(el); else if(!el.querySelector(':scope > .gbc'))el.classList.remove('gbc-on','gbc-oro','gbc-gelo','gbc-neutro'); }).observe(el,{childList:true});}catch(e){}
    if(el.querySelector(':scope > .tw-radar'))rifai(el);
  }
  function tutti(){for(var id in CODE)guarda(id);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tutti);else tutti();
  setInterval(tutti,3000);
  window.GBC={rifai:rifai,pulisci:pulisci};
})();
