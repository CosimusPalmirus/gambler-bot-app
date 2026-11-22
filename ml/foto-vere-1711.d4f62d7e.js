(function(){
  'use strict';
  var W=window;
  function discord(){try{return !!(W.Telegram&&Telegram.WebApp&&Telegram.WebApp.__discord);}catch(e){return false;}}
  function fvUrl(u){
    u=String(u||'');
    if(!u||!discord())return u;
    var m=/^https:\/\/cdn\.discordapp\.com\/(.+)$/.exec(u);if(m)return '/.proxy/avatar/'+m[1];
    m=/^https:\/\/62-238-17-24\.sslip\.io\/(.+)$/.exec(u);if(m)return '/.proxy/api/'+m[1];
    return u;
  }
  function fvNome(s){
    return String(s==null?'':s).replace(/&(amp|lt|gt|quot|#x27|#39);/g,function(a,k){return {amp:'&',lt:'<',gt:'>',quot:'"','#x27':"'",'#39':"'"}[k];});
  }
  function mia(){try{var u=Telegram.WebApp.initDataUnsafe.user;return (u&&u.photo_url)?String(u.photo_url):'';}catch(e){return '';}}
  function fvFoto(uid,prof,io){
    var s=String(uid==null?'':uid);
    if(/^bot/.test(s))return '';
    var u='';
    if(io)u=mia();
    if(!u){var p=String((prof&&prof.photo_url)||'');if(/^(https?:|data:image\/|blob:|\/)/.test(p))u=p;}
    if(!u&&/^\d{3,15}$/.test(s)){try{if(typeof BACKEND!=='undefined'&&BACKEND)u=BACKEND+'/foto/'+s+'.jpg';}catch(e){}}
    return fvUrl(u);
  }
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  W.fvUrl=fvUrl;W.fvNome=fvNome;W.fvFoto=fvFoto;
  W.fvAv=function(uid,io){
    try{
      if(typeof RTD==='undefined')return '';
      var f=fvFoto(uid,(RTD.profiles||{})[uid],io);
      if(!f)return '';
      return '<img class="fv-av" alt="" decoding="sync" draggable="false" src="'+esc(f)+'" onerror="this.remove()">';
    }catch(e){return '';}
  };
  try{
    var st=document.createElement('style');st.id='fv-css';
    st.textContent='.fv-av{width:18px;height:18px;border-radius:50%;object-fit:cover;vertical-align:-4px;margin:-3px 5px -3px -4px;'
      +'box-shadow:0 0 0 1.5px rgba(255,255,255,.55);background:#1f2937;display:inline-block}'
      +'#fv-bx{position:absolute;left:50%;top:calc(72px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:2;pointer-events:none;'
      +'display:flex;align-items:center;gap:7px;max-width:76%;padding:4px 10px 4px 4px;border-radius:999px;background:rgba(8,10,16,.66);'
      +'border:1px solid rgba(255,255,255,.14);font:800 12px/1.1 system-ui,sans-serif;color:#e7ecf3;white-space:nowrap;letter-spacing:.02em}'
      +'#fv-bx .fv-g{display:flex;align-items:center;gap:5px;min-width:0}#fv-bx .fv-g span{overflow:hidden;text-overflow:ellipsis;max-width:110px}'
      +'#fv-bx .fv-vs{opacity:.55;font-size:10px}#fv-bx .fv-g.b{flex-direction:row-reverse}'
      +'#fv-bx i{width:24px;height:24px;border-radius:50%;flex:0 0 24px;display:grid;place-items:center;font-style:normal;font-size:10px;overflow:hidden;position:relative}'
      +'#fv-bx i img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}'
      +'#fv-bx .a i{background:#a16207;box-shadow:0 0 0 2px #ffd76b}#fv-bx .b i{background:#1e3a8a;box-shadow:0 0 0 2px #8fc2ff}'
      +'#bxrt-spec-vs img.fv-av{width:16px;height:16px;margin:-3px 4px -3px 0}';
    (document.head||document.documentElement).appendChild(st);
  }catch(e){}
  W.gsrtFoto=function(){
    try{
      if(typeof GSRT==='undefined'||!GSRT.fr||!GSRT.pronto||!GSRT.start)return;
      var m=GSRT.start,sg=(m.map&&m.map.seggi)||[],pr=m.profiles||{},cw=GSRT.fr.contentWindow;
      sg.forEach(function(s){
        if(!s)return;
        var uid=String(s.uid==null?'':s.uid),g=s.sg|0;
        if(/^bot/.test(uid)||s.bot)return;
        var io=!m.spec&&m.you!=null&&uid===String(m.you);
        var p=pr[uid]||{},nome=fvNome(p.name)||String(s.nome||'');
        cw.postMessage({t:'gs_foto',g:g,url:fvFoto(uid,p,io)||'',nome:nome},GSRT_ORIGIN);
      });
    }catch(e){}
  };
  function chip(lato,nome,foto){
    return '<span class="fv-g '+lato+'"><i>'+esc((nome||'?').charAt(0).toUpperCase())
      +(foto?'<img alt="" src="'+esc(foto)+'" onerror="this.remove()">':'')+'</i><span>'+esc(nome)+'</span></span>';
  }
  W.fvBoxe=function(chi){
    try{
      if(typeof BXRT==='undefined'||!BXRT.wrap||typeof RTD==='undefined')return;
      var el=document.getElementById('fv-bx');
      if(BXRT.spec){if(el&&el.parentNode)el.parentNode.removeChild(el);return;}
      var io=String(RTD.myId||''),op=null;
      Object.keys(RTD.names||{}).forEach(function(id){if(String(id)!==io)op=String(id);});
      if(!op)return;
      var pr=RTD.profiles||{};
      var nIo=(typeof GB_LANG!=='undefined'&&GB_LANG==='en')?'YOU':'TU';
      var nOp=/^bot/.test(op)?String((RTD.names||{})[op]||'BOT'):(fvNome((pr[op]||{}).name)||String((RTD.names||{})[op]||''));
      if(!el){el=document.createElement('div');el.id='fv-bx';BXRT.wrap.appendChild(el);}
      el.innerHTML=chip('a',nIo,fvFoto(io,pr[io],true))+'<span class="fv-vs">VS</span>'+chip('b',nOp,fvFoto(op,pr[op],false));
      el.setAttribute('data-chi',chi||'');
    }catch(e){}
  };
  W.fvBoxeAperta=function(j){
    try{
      if(!j||j.t!=='aperta'||(j.chi!=='a'&&j.chi!=='b')||j.nomi)return;
      var io=String(RTD.myId||''),op=null,pr=RTD.profiles||{};
      Object.keys(RTD.names||{}).forEach(function(id){if(String(id)!==io)op=String(id);});
      if(!op)return;
      var a={n:fvNome((pr[io]||{}).name)||String((RTD.names||{})[io]||''),f:fvFoto(io,pr[io],true)};
      var b={n:/^bot/.test(op)?String((RTD.names||{})[op]||'BOT'):(fvNome((pr[op]||{}).name)||String((RTD.names||{})[op]||'')),f:fvFoto(op,pr[op],false)};
      var o=j.chi==='a'?[a,b]:[b,a];
      j.nomi=[o[0].n,o[1].n];j.foto=[o[0].f,o[1].f];
      W.fvBoxe(j.chi);
    }catch(e){}
  };
  W.fvBoxeSpett=function(n){
    try{
      var el=document.getElementById('bxrt-spec-vs');if(!el||!n||n.length<2)return;
      var pr=RTD.profiles||{},per={};
      Object.keys(pr).forEach(function(k){var nm=fvNome((pr[k]||{}).name);if(nm&&!per[nm])per[nm]=k;});
      var sp=el.querySelectorAll('span');
      [0,2].forEach(function(ix,i){
        var s=sp[ix],k=per[String(n[i])];if(!s||!k)return;
        var f=fvFoto(k,pr[k],false);if(!f||s.querySelector('img'))return;
        var im=document.createElement('img');im.className='fv-av';im.alt='';im.src=f;im.onerror=function(){im.remove();};
        s.insertBefore(im,s.firstChild);
      });
    }catch(e){}
  };
})();
