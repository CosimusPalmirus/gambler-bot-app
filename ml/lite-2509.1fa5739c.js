(function(){
  var L=null;try{L=window.localStorage;L.getItem('x');}catch(e){L=null;}
  var G=window.GBLITE={v:2,perche:'',nascT:0,tornT:0,bluT:0,tic:0,gapT:0,colpi:0,fin:[],migrato:false,tolto:'',fpsVis:0};
  try{
    if(L&&L.getItem('gb_lite_v')!=='2'){
      if(L.getItem('gb_lite')==='1'){L.removeItem('gb_lite');G.migrato=true;}
      L.setItem('gb_lite_v','2');
    }
    if(L&&L.getItem('gb_lite')==='1'){
      var p=L.getItem('gb_lite_perche')||'',t=+(L.getItem('gb_lite_t')||0);
      var tieni=(p==='rafdead'&&Date.now()-t<7*864e5)||p==='ua';
      if(tieni)G.perche=p+' (salvato)';
      else{L.removeItem('gb_lite');L.removeItem('gb_lite_perche');L.removeItem('gb_lite_t');G.tolto=p||'vecchio';}
    }
  }catch(e){}
  function ora(){return performance.now();}
  try{
    document.addEventListener('visibilitychange',function(){if(document.hidden)G.nascT=ora();else G.tornT=ora();});
    window.addEventListener('pagehide',function(){G.nascT=ora();});
    window.addEventListener('pageshow',function(){G.tornT=ora();});
    window.addEventListener('blur',function(){G.bluT=ora();});
    window.addEventListener('focus',function(){G.tornT=ora();});
  }catch(e){}
  G.scusa=function(){
    var n=ora();
    if(document.hidden||document.visibilityState==='hidden')return 'pagina nascosta';
    if(G.tornT&&n-G.tornT<6000)return 'appena tornata in primo piano';
    if(G.gapT&&n-G.gapT<6000)return 'JS fermo (app in secondo piano)';
    if(G.bluT&&G.bluT>G.tornT)return 'finestra non attiva';
    try{if(document.hasFocus&&!document.hasFocus())return 'finestra non attiva';}catch(e){}
    return '';
  };
  G.misura=function(n,rit){
    try{
      if(typeof RTD==='undefined'||!RTD||RTD.lite)return;
      if(typeof CUR==='undefined'||CUR!=='arc'||RTD.ui!=='match'||!RTD._rafT){G.fin=[];return;}
      if(G.scusa()){G.fin=[];return;}
      G.fin.push([n,RTD._rafN||0,rit||0]);
      while(G.fin.length&&n-G.fin[0][0]>10000)G.fin.shift();
      if(G.fin.length>=19){
        var a=G.fin[0],b=G.fin[G.fin.length-1],fps=(b[1]-a[1])*1000/Math.max(1,b[0]-a[0]),rm=0;
        for(var i=0;i<G.fin.length;i++)rm+=G.fin[i][2];rm/=G.fin.length;
        G.fpsVis=fps;G.ritVis=rm;
        if(fps<18&&rm>12){G.fin=[];if(typeof rtdLiteOn==='function')rtdLiteOn('lento: '+fps.toFixed(0)+' fps per 10 s, filo principale in ritardo di '+rm.toFixed(0)+' ms');}
      }
    }catch(e){}
  };
  G.tic=ora();
  setInterval(function(){var n=ora(),rit=Math.max(0,n-G.tic-500);if(n-G.tic>1500)G.gapT=n;G.tic=n;G.misura(n,rit);},500);
  G.stato=function(){
    var on=false,p='';
    try{on=!!((typeof RTD!=='undefined'&&RTD&&RTD.lite)||(L&&L.getItem('gb_lite')==='1'));p=G.perche||(L&&L.getItem('gb_lite_perche'))||'';}catch(e){}
    return 'lite: '+(on?'SI, perche\' '+(p||'?'):'no')+(G.colpi?' · pause vere '+G.colpi:'')+(G.tolto?' · tolto all\'apertura ('+G.tolto+')':'')+
      (G.migrato?' · gb_lite vecchio azzerato':'')+(G.fpsVis?' · fps partita '+G.fpsVis.toFixed(0)+', ritardo timer '+(G.ritVis||0).toFixed(0)+' ms':'');
  };
  try{console.info('[LITE] '+G.stato());}catch(e){}
  var dbg=false;try{dbg=/dbg/.test(location.search+location.hash)||(L&&L.getItem('gb_dbg')==='1');}catch(e){}
  if(dbg)setInterval(function(){
    var d=document.getElementById('gblite-dbg');
    if(!d&&document.body){d=document.createElement('div');d.id='gblite-dbg';
      d.style.cssText='position:fixed;left:4px;bottom:4px;z-index:2147483647;font:700 10px/1.3 ui-monospace,monospace;color:#9fe8ff;background:rgba(0,0,0,.75);padding:3px 6px;border-radius:6px;pointer-events:none;max-width:96vw;';
      document.body.appendChild(d);}
    if(d)d.textContent='⚙ '+G.stato();
  },700);
})();
