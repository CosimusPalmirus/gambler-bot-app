var UT={tab:'',tabFor:'',hubH:'',hubK:'',lobK:'',chatSeen:{},chatN:0,chiusa:false,kb:false};
try{UT.chiusa=(localStorage.getItem('ut_chat_chiusa')==='1');}catch(e){}
function utL(it,en){return (window.GB_LANG==='en')?en:it;}
function utE(s){return trnEsc(s);}
function utId(s){return String(s||'').replace(/[^A-Za-z0-9_-]/g,'');}
function utHue(n){n=String(n||'?');var h=0,i;for(i=0;i<n.length;i++)h=(h*31+n.charCodeAt(i))&0xffff;return h%360;}
function utAv(name,cls,photo){
  var n=String(name||'?');
  return '<span class="ut-av'+(cls?' '+cls:'')+'" style="background:hsl('+utHue(n)+',45%,32%);">'+utE(n.charAt(0).toUpperCase()||'?')
    +(photo?'<img src="'+utE(photo)+'" alt="">':'')+'</span>';
}
function utEurC(c){c=Number(c)||0;var v=(c/100);return (Math.round(v)===v?String(v):v.toFixed(2).replace('.',','))+' €';}
var UT_TINTE={glad:['#6b3a0c','#1a0e04'],pool8:['#0b5d3b','#04160f'],pool15:['#0b5d3b','#04160f'],scopa:['#7a1f1f','#1c0808'],pong:['#0e4f7a','#05131f'],
  golf:['#2f6b12','#0b1a05'],snake:['#1f6b3a','#06160c'],sumo:['#7a4a12','#1f1205'],dama:['#5b3a1a','#170e06'],damaru:['#5b3a1a','#170e06'],backg:['#5b3a1a','#170e06'],basket:['#8a3f0a','#1f0e03'],
  bj1v1:['#7f1d1d','#1c0606'],bjl:['#7f1d1d','#1c0606'],pkd:['#5b21b6','#14062e'],rr:['#3f3f46','#0f0f12'],ch:['#374151','#0b0f16'],rps:['#1e3a8a','#070e24'],
  bs:['#0c4a6e','#04121c'],turf:['#4c1d95','#12062a'],tank:['#3f6212','#0f1805'],race:['#9a3412','#1f0a03'],calcio:['#166534','#041a0c'],scalata:['#334155','#0a0f18'],
  uno:['#9f1239','#23040d'],unoc:['#b45309','#221003'],boxe:['#991b1b','#200505'],lupus:['#1e1b4b','#07061a'],lastcall:['#6d28d9','#170833'],kaiju:['#c2410c','#1c0a05'],settemezzo:['#a16207','#1f1503'],briscola:['#9d174d','#22030f'],tappo:['#166534','#04170b'],smash:['#86198f','#1d0520'],archery:['#3f6212','#0f1805'],
  draw:['#78350f','#1c0c03'],alley:['#44403c','#11100e'],shove:['#155e75','#041a20'],cucu:['#a16207','#241503'],uomonero:['#27272a','#09090b'],burraco:['#1e40af','#060f2c'],
  hop:['#15803d','#03140a'],sbanca:['#b91c1c','#1f0505'],abisso:['#7f1d1d','#140404'],geo:['#0e7490','#03161c'],deadmoney:['#3f3f46','#0c0c0e'],pk1v1:['#5b21b6','#14062e'],
  gembrawl:['#7e22ce','#13051f']};
var UT_ART_CLS={turf:'tw-mega',race:'tw-mega rc-mega',glad:'tw-mega gl-mega',calcio:'tw-mega blg-mega',scalata:'tw-mega scl-mega',
  uno:'tw-mega uno-mega',unoc:'tw-mega uno-mega',cucu:'tw-mega cuc-mega',uomonero:'tw-mega unr-mega',lupus:'tw-mega lup-mega',
  burraco:'tw-mega bur-mega',lastcall:'tw-mega lc-mega',kaiju:'tw-mega kj-mega',settemezzo:'tw-mega sm-mega',briscola:'pvp-tile pt-briscola',tappo:'tw-mega tap-mega',smash:'tw-mega gsm-mega',poker5:'tw-mega pk5-mega',pk5:'tw-mega pk5-mega',
  tank:'pvp-tile pt-tank',pool8:'pvp-tile pt-pool8',pool15:'pvp-tile pt-pool8',pong:'pvp-tile pt-pong',sumo:'pvp-tile pt-sumo',
  shove:'pvp-tile pt-shove',alley:'pvp-tile pt-alley',dama:'pvp-tile pt-dama',damaru:'pvp-tile pt-dama',backg:'pvp-tile pt-backg',scopa:'pvp-tile pt-scopa',
  snake:'pvp-tile pt-snake',basket:'pvp-tile pt-basket',archery:'pvp-tile pt-archery',draw:'pvp-tile pt-draw',golf:'pvp-tile pt-golf',
  boxe:'pvp-tile pt-boxe',dice:'pvp-tile dice',pkd:'pvp-tile cards',cards:'pvp-tile cards',bjl:'pvp-tile bj',bj1v1:'pvp-tile bj',bj:'pvp-tile bj',
  rps:'pvp-tile rps',rr:'pvp-tile rr',bs:'pvp-tile bs',ch:'pvp-tile chess',chess:'pvp-tile chess',
  hop:'tw-mega hop-mega',sbanca:'tw-mega sbk-mega',abisso:'tw-mega abs-mega',geo:'tw-mega geo-mega',deadmoney:'tw-mega dm-mega',pk1v1:'pvp-tile cards',
  gembrawl:'tw-mega gem-mega'};
UT.art={};
function utArt(g){
  g=String(g||'');
  if(UT.art[g]!==undefined)return UT.art[g];
  var cls=UT_ART_CLS[g],host=document.getElementById('duel'),v='';
  if(cls&&host){
    try{
      var e=document.createElement('div');e.className=cls;e.style.cssText='position:absolute;left:-9999px;top:0;width:1px;height:1px;visibility:hidden;pointer-events:none;';
      host.appendChild(e);v=String(getComputedStyle(e).getPropertyValue('--gb-art')||'').trim();host.removeChild(e);
    }catch(x){v='';}
  }
  if(!v||v==='none'||v.indexOf('url(')<0){UT.art[g]='';return '';}
  var st=document.getElementById('ut-art-css');
  if(!st){st=document.createElement('style');st.id='ut-art-css';document.head.appendChild(st);}
  var k=utId(g);
  st.appendChild(document.createTextNode('.ut-art-'+k+':after{background-image:'+v+';}'));
  UT.art[g]=' art ut-art-'+k;
  return UT.art[g];
}
function utArtDiv(g,extra){
  return '<div class="ut-tc-art'+utArt(g)+(extra||'')+'" style="'+utTinta(g)+'">';
}
function utTinta(g){var t=UT_TINTE[String(g||'')]||['#3b2a05','#120d02'];return '--c1:'+t[0]+';--c2:'+t[1]+';';}
function utGameIc(g){try{return trnGameIcon(g);}catch(e){return '🎮';}}
function utGameName(g,label){
  if(label)return String(label);
  try{var q=lobG(g);if(q)return q[2];}catch(e){}
  return String(g||'').toUpperCase();
}
function utCdTxt(s){
  s=Math.max(0,Math.floor(s||0));
  var d=Math.floor(s/86400),h=Math.floor(s/3600)%24,m=Math.floor(s/60)%60,x=s%60;
  if(d>0)return d+utL('g ','d ')+h+'h';
  if(h>0)return h+'h '+(m<10?'0':'')+m+'m';
  return m+':'+(x<10?'0':'')+x;
}
function utQuota(t){return Math.max(0,Number(t&&t.quota_cent)||0);}
function utPremiVoci(t){return (t&&t.premi_cent&&t.premi_cent.length)?t.premi_cent:null;}
function utPremioTop(t){
  var p=utPremiVoci(t);
  if(p&&p[0]>0)return utEurC(p[0]);
  return (t&&t.prize_text)?String(t.prize_text):'';
}
function utPremiHTML(t,cur){
  var src=cur||t||{},p=utPremiVoci(src)||utPremiVoci(t),es=src.premi_esito,q=utQuota(src)||utQuota(t),h='';
  var testo=src.prize_text||(t&&t.prize_text)||'';
  if(!p&&!testo&&!q)return '';
  h+='<div class="ut-sec">🏆 <b>'+utL('Premi','Prizes')+'</b><i>'+(q>0?utL('iscrizione ','entry ')+utEurC(q):utL('iscrizione gratis','free entry'))+'</i></div>';
  h+='<div class="ut-card">';
  if(p){
    var M=['🥇','🥈','🥉'],ord=[1,0,2],i;
    if(p.length>=2){
      h+='<div class="ut-pod">';
      for(i=0;i<3;i++){var k=ord[i];if(k>=p.length)continue;
        h+='<div class="p'+(k+1)+'"><div class="m">'+M[k]+'</div><div class="e">'+utEurC(p[k])+'</div><div class="s">'+(k+1)+utL('° posto','° place')+'</div></div>';}
      h+='</div>';
      for(i=3;i<p.length;i++)h+='<div class="ut-pr-row"><span>'+(i+1)+utL('° posto','° place')+'</span><b>'+utEurC(p[i])+'</b></div>';
    }else h+='<div class="ut-prize" style="margin:0"><span class="t">🥇</span><div><div class="k">'+utL('Al campione','To the champion')+'</div><div class="v">'+utEurC(p[0])+'</div></div></div>';
    h+='<div class="ut-note" style="text-align:left;margin:10px 0 0;">💶 '+utL('Accreditati sul saldo a fine torneo','Credited to your balance at the end')
      +(src.premi_fonte==='iscrizioni'?utL(' · dal montepremi delle iscrizioni',' · from the entry pool'):'')+'.</div>';
  }else if(testo){
    h+='<div class="ut-prize" style="margin:0;"><span class="t">🏆</span><div><div class="k">'+utL('Al campione','To the champion')+'</div><div class="v">'+utE(testo)+'</div></div></div>';
  }
  if(q>0)h+='<div class="ut-pr-row" style="margin-top:8px;border-top:1px solid var(--ut-line)"><span>🎟️ '+utL('Iscrizione','Entry fee')+'</span><b>'+utEurC(q)+'</b></div>'
    +'<div class="ut-note" style="text-align:left;margin:4px 0 0">'+utL('Ti viene restituita se il torneo è annullato o se ti ritiri prima del via.','Refunded if the tournament is cancelled or you withdraw before the start.')+'</div>';
  if(es&&es.voci&&es.voci.length){
    var tit=es.stato==='pagato'?'✅ '+utL('Premi accreditati','Prizes credited'):(es.stato==='annullato'?utL('Premi non assegnati','Prizes not assigned'):'⏳ '+utL('Premi in verifica','Prizes being checked'));
    h+='<div class="ut-sec" style="margin:14px 0 4px">'+tit+'</div>';
    es.voci.forEach(function(v){
      h+='<div class="ut-pr-row"><span>'+utE(v.etichetta||'')+' '+utE(v.nome||'')+'</span>'
        +(v.stato==='pagato'?'<em>✓</em>':'<em style="color:var(--ut-t3)">⏸</em>')+'<b>'+utEurC(v.cent)+'</b></div>';
    });
  }
  return h+'</div>';
}
function trnChatHTML(soloLettura){
  var ph=(window.GB_LANG==='en')?'Write a comment…':'Scrivi un commento…';
  return '<div class="ut-chat'+(UT.chiusa&&!soloLettura?' chiusa':'')+'">'
   +'<div class="ut-chat-hd" onclick="utChatApri(this)"><span class="ut-dot"></span><b>'+utL('Chat live','Live chat')+'</b>'
   +'<span class="ut-chat-pv"></span><span class="ut-chat-n"></span>'+(soloLettura?'':'<i class="ut-chat-car">▾</i>')+'</div>'
   +'<div class="trn-chat">'
   +'<div class="trn-ch-log" id="trn-chat-log" onscroll="utChatScroll(this)"><div class="trn-ch-empty">'+utL('Connessione alla chat…','Connecting to chat…')+'</div></div>'
   +'<div class="ut-chat-giu"><button onclick="utChatGiu(this)">↓ '+utL('nuovi messaggi','new messages')+'</button></div>'
   +(soloLettura?'':
     '<div class="trn-ch-bar">'
     +'<input id="trn-chat-in" class="trn-ch-in" maxlength="140" enterkeyhint="send" autocomplete="off" placeholder="'+ph+'" onkeydown="trnChatKey(event)">'
     +'<button class="trn-ch-btn" onclick="trnChatSend()" aria-label="Invia">➤</button>'
     +'</div>')
   +'<div class="trn-ch-note">'
   +(soloLettura?utL('Sei in partita: leggi il tifo, scrivono gli spettatori','You are playing: read the cheering, spectators write')
               :utL('La leggono tutti, anche chi gioca · ✈️ = dai gruppi Telegram','Everyone reads it, players too · ✈️ = from Telegram groups'))
   +'</div></div></div>';
}
function utChatApri(hd){
  var c=hd&&hd.parentNode;if(!c||c.closest('.trn-ch-duel'))return;
  var ch=!c.classList.contains('chiusa');
  document.querySelectorAll('.ut-chat').forEach(function(x){if(!x.closest('.trn-ch-duel'))x.classList.toggle('chiusa',ch);});
  UT.chiusa=ch;try{localStorage.setItem('ut_chat_chiusa',ch?'1':'0');}catch(e){}
  if(!ch){UT.letti=(TRN.chat||[]).length;utChatBadge();trnChatPaint(true);}
  if(typeof utSpecRifai==='function')utSpecRifai();
}
function utChatScroll(b){
  var giu=(b.scrollHeight-b.scrollTop-b.clientHeight)<24;
  b._utSu=!giu;
  var g=b.parentNode&&b.parentNode.querySelector('.ut-chat-giu');
  if(g&&giu)g.classList.remove('on');
}
function utChatGiu(btn){
  var c=btn.closest('.trn-chat'),b=c&&c.querySelector('.trn-ch-log');
  if(b){b._utSu=false;b.scrollTop=b.scrollHeight;}
  btn.parentNode.classList.remove('on');
}
function utOra(ts){
  if(!ts)return '';
  try{var d=new Date(ts*1000);return ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);}catch(e){return '';}
}
function trnChatRowHTML(c,nuovo){
  var n=String(c.n||'?');
  return '<div class="ut-cr trn-ch-row'+(c.p?' ply':'')+(c.g?' tg':'')+(nuovo?' nw':'')+'">'+utAv(n,'s')
    +'<div class="ut-cr-b">'+(c.ts?'<span class="ut-cr-t">'+utOra(c.ts)+'</span>':'')
    +'<span class="ut-cr-n">'+utE(n)+'</span>'
    +(c.p?'<span class="ut-cr-bd">'+utL('IN GARA','PLAYING')+'</span>':'')+(c.g?'<span class="ut-cr-bd">✈️ TG</span>':'')
    +utE(String(c.x||''))+'</div></div>';
}
function utChatBadge(){
  var tot=(TRN.chat||[]).length;
  if(UT.letti==null||UT.letti>tot)UT.letti=tot;
  var nl=Math.max(0,tot-UT.letti);
  var ult=tot?TRN.chat[tot-1]:null;
  document.querySelectorAll('.ut-chat').forEach(function(c){
    var chiusa=c.classList.contains('chiusa');
    var pv=c.querySelector('.ut-chat-pv'),nn=c.querySelector('.ut-chat-n');
    if(pv)pv.innerHTML=ult?('<b>'+utE(String(ult.n||'?'))+'</b>'+utE(String(ult.x||''))):utE(utL('nessun messaggio','no messages'));
    if(nn){var v=chiusa?nl:0;nn.textContent=v>9?'9+':String(v);nn.classList.toggle('on',v>0);}
  });
  var t=document.getElementById('ut-tab-ch-n');
  if(t){var v2=(UT.tab==='ch')?0:Math.max(0,tot-(UT.lettiTab==null?tot:UT.lettiTab));t.textContent=v2>9?'9+':String(v2);t.className=v2>0?'':'z';}
}
function trnChatPaint(forza){
  var box=document.querySelectorAll('.trn-ch-log');
  var L=TRN.chat||[],tot=L.length;
  if(!box.length){utChatBadge();return;}
  var chiave=String(TRN.chatCh||'')+'|';
  var prima=UT.chatSeen[chiave];if(prima==null||prima>tot)prima=tot;
  var righe='';
  for(var i=0;i<tot;i++)righe+=trnChatRowHTML(L[i],i>=prima&&!forza);
  UT.chatSeen[chiave]=tot;
  [].forEach.call(box,function(b){
    var su=!!b._utSu&&!forza;
    b.innerHTML=righe||('<div class="trn-ch-empty">'
      +(b.closest&&b.closest('.trn-ch-duel')?utL('Ancora nessun commento dagli spettatori','No comments from spectators yet')
        :utL('Nessun messaggio ancora — scrivi tu il primo 🎙','No messages yet — be the first 🎙'))+'</div>');
    if(!su)b.scrollTop=b.scrollHeight;
    else if(tot>prima){var g=b.parentNode&&b.parentNode.querySelector('.ut-chat-giu');if(g)g.classList.add('on');}
  });
  var aperta=false;document.querySelectorAll('.ut-chat').forEach(function(c){if(!c.classList.contains('chiusa'))aperta=true;});
  if(aperta&&!UT.chiusa)UT.letti=tot;
  if(UT.tab==='ch')UT.lettiTab=tot;
  utChatBadge();
}
function trnOnWatchList(rooms){
  TRN.viewers={};
  (rooms||[]).forEach(function(r){TRN.viewers[r.rid]=r.viewers||0;});
  if(CUR!=='torneo')return;
  (rooms||[]).forEach(function(r){
    var b=document.getElementById('trn-watch-'+utId(r.rid));
    if(!b)return;
    var s=b.querySelector('.v');
    if(s)s.textContent=String(r.viewers||0);else b.textContent='👁 '+utL('Guarda','Watch')+' ('+(r.viewers||0)+')';
  });
}
function utRoundNome(ms,ri,br,d){
  var dueAtesta=true;ms.forEach(function(m){if((m.players||[]).length>2)dueAtesta=false;});
  var n=ms.length,ultimo=(ri===br.length-1);
  if(n===1&&(ultimo||br.length>1)&&(ri>0||ultimo&&d.status!=='reg'))return utL('Finale','Final');
  if(dueAtesta&&n===2)return utL('Semifinali','Semi-finals');
  if(dueAtesta&&n>=3&&n<=4)return utL('Quarti','Quarter-finals');
  if(dueAtesta&&n>4&&n<=8)return utL('Ottavi','Round of 16');
  return utL('Round ','Round ')+(br[ri].n!=null?br[ri].n:(ri+1));
}
function utMatchCard(m,d,wsup,duelN,uid,idx){
  var pls=m.players||[],st=m.status,wIdx=-1,mine=false,i;
  if(st==='done'&&m.winner_name){
    if(m.winner_uid!=null)pls.forEach(function(p,j){if(wIdx<0&&p&&p.uid!=null&&String(p.uid)===String(m.winner_uid))wIdx=j;});
    if(wIdx<0)pls.forEach(function(p,j){if(wIdx<0&&(((p&&p.name)||'')===m.winner_name))wIdx=j;});
  }
  pls.forEach(function(p){if(p&&p.uid!=null&&String(p.uid)===uid)mine=true;});
  var srid=utId(m.rid),smid=utId(m.mid);
  var click=(st==='live'&&duelN&&smid)?' onclick="trnSpecDuel(\''+smid+'\')"'
    :((st==='live'&&srid&&wsup)?' onclick="trnWatch(\''+srid+'\')"':'');
  var etich=(st==='live')?'<span class="l">LIVE</span>':(st==='done'?utL('Finito','Done'):utL('In attesa','Waiting'));
  var h='<div class="ut-m '+(st==='live'?'live':(st==='done'?'done':'pend'))+(mine?' mine':'')+'"'+click+'>'
    +'<div class="ut-m-hd"><span>Match '+(idx+1)+'</span>'+etich+'</div>';
  var mx=pls.length>4?3:pls.length;
  for(i=0;i<mx;i++){
    var p=pls[i],nm=(p&&p.name)||utL('Giocatore','Player');
    var me=!!(p&&p.uid!=null&&String(p.uid)===uid);
    var cls=(i===wIdx?' w':((st==='done'&&wIdx>=0)?' l':''))+(me?' me':'');
    h+='<div class="ut-m-p'+cls+'">'+utAv(nm,'s')+'<span class="n">'+utE(nm)+'</span></div>';
  }
  if(!pls.length)h+='<div class="ut-m-p vuoto"><span class="n">'+utL('da decidere','to be decided')+'</span></div><div class="ut-m-p vuoto"><span class="n">'+utL('da decidere','to be decided')+'</span></div>';
  if(pls.length>mx)h+='<div class="ut-m-more">+ '+(pls.length-mx)+' '+utL('altri','more')+'</div>';
  if(st==='done'&&!m.winner_name)h+='<div class="ut-m-more">🏜 '+utL('nessuno si è presentato','nobody showed up')+'</div>';
  if(click)h+='<span class="ut-m-go">👁 '+utL('GUARDA','WATCH')+'</span>';
  return h+'</div>';
}
function trnBracketHTML(d){
  var br=(d&&d.bracket)||[];
  if(!br.length)return '';
  var wsup=trnWatchOk(d.game),duelN=!!((trnGC(d.game)||{}).duel),uid=String(S.userId||'');
  var cur=-1,ri;
  for(ri=0;ri<br.length;ri++){(br[ri].matches||[]).forEach(function(m){if(m.status!=='done'&&cur<0)cur=ri;});}
  if(cur<0)cur=br.length-1;
  var last=br[br.length-1],lastMs=(last.matches||[]);
  var finito=(d.status==='done');
  var futuri=[];
  if(!finito&&lastMs.length>1){
    var dueAtesta=true;lastMs.forEach(function(m){if((m.players||[]).length>2)dueAtesta=false;});
    var k=lastMs.length;
    if(dueAtesta){while(k>1){k=Math.ceil(k/2);futuri.push(k);}}
    else futuri.push(1);
  }
  var h='<div class="ut-br"><div class="ut-br-scr" id="ut-br-scr"><div class="ut-br-cols">';
  br.forEach(function(rd,i){
    var ms=rd.matches||[];
    h+='<div class="ut-br-col'+(i===br.length-1&&!futuri.length&&!finito?'':'')+'" data-r="'+i+'"><div class="ut-br-rt'+(i===cur&&!finito?' cur':'')+'">'+utRoundNome(ms,i,br,d)+'</div><div class="ut-br-list">';
    ms.forEach(function(m,j){h+=utMatchCard(m,d,wsup,duelN,uid,j);});
    h+='</div></div>';
  });
  futuri.forEach(function(n,i){
    var nome=(n===1)?utL('Finale','Final'):(n===2?utL('Semifinali','Semi-finals'):(n<=4?utL('Quarti','Quarter-finals'):utL('Round ','Round ')+(br.length+i+1)));
    h+='<div class="ut-br-col"><div class="ut-br-rt">'+nome+'</div><div class="ut-br-list">';
    for(var j=0;j<n;j++)h+=utMatchCard({players:[],status:'pend'},d,false,false,uid,j);
    h+='</div></div>';
  });
  var wn=finito&&d.winner_name;
  h+='<div class="ut-br-col fine"><div class="ut-br-rt">'+utL('Campione','Champion')+'</div><div class="ut-br-list"><div class="ut-champ">'
    +'<div class="cup"'+(wn?'':' style="opacity:.4;filter:grayscale(1);"')+'>🏆</div>'
    +(wn?'<div class="n">'+utE(d.winner_name)+'</div>':'<div class="q">'+utL('ancora da decidere','still to be decided')+'</div>')+'</div></div></div>';
  h+='</div></div>'
    +'<div class="ut-br-leg"><span><i style="border-color:rgba(56,189,248,.7)"></i>'+utL('il tuo percorso','your path')+'</span><span><i style="border-color:#ef4444"></i>'+utL('in diretta · tocca per guardare','live · tap to watch')+'</span><span>👑 '+utL('passa il turno','goes through')+'</span></div></div>';
  UT.brCur=cur;
  return h;
}
function trnNetHTML(d){return trnBracketHTML(d);}
function utBrCentra(){
  var s=document.getElementById('ut-br-scr');if(!s)return;
  var c=s.querySelector('.ut-br-col[data-r="'+(UT.brCur||0)+'"]');
  if(!c||!UT.brCur)return;
  s.scrollLeft=Math.max(0,c.offsetLeft-44);
}
function utLiveHTML(cur,titolo){
  var lm=(cur&&cur.live_matches)||[];
  if(!lm.length)return '';
  var wsup=trnWatchOk(cur.game),h=titolo?('<div class="ut-sec"><span class="ut-dot"></span><b>'+utL('In diretta ora','Live now')+'</b><i>'+lm.length+' match</i></div>'):'';
  var nomi={};
  (cur.bracket||[]).forEach(function(rd){(rd.matches||[]).forEach(function(m){nomi[String(m.mid||'')]=(m.players||[]).map(function(p){return (p&&p.name)||'?';});});});
  lm.forEach(function(r){
    var srid=utId(r.rid),smid=utId(r.mid),pl=nomi[String(r.mid||'')]||[];
    var chi=pl.length?(pl.length>2?utE(pl.slice(0,2).join(', '))+' +'+(pl.length-2):utE(pl[0]||'?')+'<span>vs</span>'+utE(pl[1]||'?')):'Match '+utE(String(r.mid||''));
    var v=(TRN.viewers&&TRN.viewers[r.rid]!=null)?TRN.viewers[r.rid]:(r.viewers||0);
    var bott=r.duel
      ?'<button class="ut-btn" onclick="trnSpecDuel(\''+smid+'\')">👁 '+utL('Guarda','Watch')+'</button>'
      :(wsup?'<button class="ut-btn" id="trn-watch-'+srid+'" onclick="trnWatch(\''+srid+'\')">👁 <span class="v">'+v+'</span></button>'
            :'<span class="ut-chip live">'+utL('In corso','Live')+'</span>');
    h+='<div class="ut-lv"><div class="ut-lv-b"><div class="ut-lv-k"><span class="ut-dot"></span>'+utGameIc(cur.game)+' Round '+(r.round!=null?r.round:'?')+'</div>'
      +'<div class="ut-lv-n">'+chi+'</div></div>'+bott+'</div>';
  });
  return h;
}
function trnDetLiveHTML(cur){return utLiveHTML(cur,true);}
function utUpCard(t){
  var tid=utId(t.id),full=(t.max_players!=null&&(t.players_count||0)>=t.max_players);
  var secs=trnDetSecs(t),q=utQuota(t),pr=utPremioTop(t),mx=t.max_players||0,n=t.players_count||0;
  var h='<div class="ut-tc" onclick="trnDetOpen(\''+tid+'\')">'
   +utArtDiv(t.game)+'<div class="ut-tc-ic">'+utGameIc(t.game)+'</div>'
   +'<div class="ut-tc-top"><span class="ut-chip g">'+utE(utGameName(t.game,t.game_label))+'</span>'
   +(t.registered?'<span class="ut-chip ok">✓ '+utL('Iscritto','Registered')+'</span>':'')+'</div></div>'
   +'<div class="ut-tc-b"><div class="ut-tc-n">'+utE(t.name||utL('Torneo','Tournament'))+'</div>'
   +'<div class="ut-tc-w"><span>📅 '+utE(t.starts_at_text||utL('data da annunciare','date to be announced'))+'</span>'
   +(secs>0?'<span class="ut-chip mut">⏳ <span class="cd">'+utCdTxt(secs)+'</span></span>':'')+'</div>'
   +(pr?'<div class="ut-prize"><span class="t">🏆</span><div><div class="k">'+utL('Premio','Prize')+'</div><div class="v">'+utE(pr)+'</div></div></div>':'<div style="height:12px"></div>')
   +'<div class="ut-seats"><span>👥 <b>'+n+'</b>'+(mx?' / '+mx:'')+' '+utL('iscritti','players')+'</span>'
   +(mx?'<div class="ut-bar"><i style="width:'+Math.min(100,Math.round(100*n/mx))+'%"></i></div>':'')+'</div>';
  if(t.registered)h+='<button class="ut-btn ok" onclick="event.stopPropagation();trnUnregister(\''+tid+'\')">✓ '+utL('Sei iscritto','You are in')+' <small>· '+utL('tocca per annullare','tap to cancel')+'</small></button>';
  else if(full)h+='<button class="ut-btn sec" onclick="event.stopPropagation();" style="opacity:.6">🚫 '+utL('Completo','Full')+'</button>';
  else h+='<button class="ut-btn hot" onclick="event.stopPropagation();trnRegister(\''+tid+'\')">⚔️ '+(q>0?utL('Iscriviti · ','Join · ')+utEurC(q):utL('Iscriviti gratis','Join for free'))+'</button>';
  return h+'<div class="ut-more">'+utL('Regole, iscritti e chat','Rules, players and chat')+' ›</div></div></div>';
}
function trnUpcomingHTML(d){
  var up=trnUpSort((d&&d.upcoming)||[]);
  if(!up.length)return '';
  var h='<div class="ut-sec">📅 <b>'+utL('In arrivo','Coming up')+'</b><i>'+up.length+'</i></div>';
  up.forEach(function(t){h+=utUpCard(t);});
  return h;
}
function trnAlbRow(t,primo){
  var nomi=t.winner_name||((t.winners_names||[]).join(', '))||'';
  var ann=(t.status==='cancelled'),id=utId(t.id);
  var s=[];if(t.name)s.push(utE(t.name));s.push(utE(utGameName(t.game,t.game_label)));var dd=trnFmtD(t.ts);if(dd)s.push(utE(dd));
  return '<div class="ut-alb'+(ann?' cx':'')+(primo&&!ann?' top':'')+'"'+(ann?'':' onclick="trnAlbTap(\''+id+'\')"')+'>'
    +(ann?'<span class="ut-av l" style="background:#262a33;">✖</span>':utAv(nomi||'?',primo?'l':'l',t.winner_photo))
    +'<div class="ut-alb-b"><div class="ut-alb-w">'+(primo&&!ann?'👑 ':'')+(ann?'<span style="color:var(--ut-t2)">'+utL('Annullato','Cancelled')+'</span>':utE(nomi||utL('nessun campione','no champion')))
    +((t.winner_titles>=2&&!ann)?' <em class="ut-tit">'+t.winner_titles+' '+utL('titoli','titles')+'</em>':'')+'</div>'
    +'<div class="ut-alb-s">'+s.join(' · ')+(t.players_count?' · '+t.players_count+' '+utL('iscritti','players'):'')+'</div></div>'
    +(ann?'':'<span class="ut-alb-ar">›</span>')+'</div>';
}
function trnAlbHTML(skipId){
  var it=TRN.hist;if(!it||!it.length)return '';
  var lista=it.filter(function(t){return String(t.id||'')!==String(skipId||'');});
  if(!lista.length)return '';
  var mostra=TRN.albAll?lista:lista.slice(0,4);
  var h='<div class="ut-sec">🏛 <b>'+utL('Albo d’oro','Hall of fame')+'</b><i>'+lista.length+' '+utL('tornei','tournaments')+'</i></div>';
  mostra.forEach(function(t,k){h+=trnAlbRow(t,k===0&&!skipId);});
  if(!TRN.albAll&&lista.length>mostra.length)h+='<button class="ut-btn ghost" style="margin-top:8px" onclick="trnAlbAll()">'+utL('Vedi tutti','See all')+' ('+lista.length+')</button>';
  if(TRN.histCap>0)h+='<div class="ut-note">'+utL('Si conservano gli ultimi ','The last ')+TRN.histCap+utL(' tornei.',' tournaments are kept.')+'</div>';
  return h;
}
function utStatoPill(cur){
  if(!cur)return '<span class="ut-chip g">'+utL('Iscrizioni aperte','Registration open')+'</span>';
  var s=cur.status;
  if(s==='live')return '<span class="ut-chip live">LIVE</span>';
  if(s==='checkin')return '<span class="ut-chip ok">'+utL('Presenze','Check-in')+'</span>';
  if(s==='done')return '<span class="ut-chip g">🏁 '+utL('Concluso','Finished')+'</span>';
  if(s==='cancelled')return '<span class="ut-chip mut">'+utL('Annullato','Cancelled')+'</span>';
  return '<span class="ut-chip g">'+utL('Iscrizioni aperte','Registration open')+'</span>';
}
function utRoundAttuale(cur){
  var br=(cur&&cur.bracket)||[];if(!br.length)return 0;
  for(var i=0;i<br.length;i++){var ms=br[i].matches||[],j;for(j=0;j<ms.length;j++)if(ms[j].status!=='done')return i+1;}
  return br.length;
}
function utHubCur(d){
  var tid=utId(d.id),rn=utRoundAttuale(d),me=trnDetMe(d,d);
  var h='<div class="ut-hero" onclick="trnDetOpen(\''+tid+'\')" style="cursor:pointer;margin-top:10px;">'
   +utArtDiv(d.game)+'<div class="ut-tc-ic">'+utGameIc(d.game)+'</div>'
   +'<div class="ut-tc-top"><span class="ut-chip g">'+utE(utGameName(d.game,d.game_label))+'</span>'+utStatoPill(d)+'</div></div>'
   +'<div class="ut-hero-b"><div class="ut-hero-n">'+utE(d.name||utL('Torneo','Tournament'))+'</div>'
   +'<div class="ut-stats">'
   +'<div class="ut-stat"><div class="k">'+utL('Giocatori','Players')+'</div><div class="v">'+(d.players_count||0)+'</div></div>'
   +'<div class="ut-stat"><div class="k">'+(d.status==='live'?'Round':utL('Si gioca','Starts'))+'</div><div class="v">'+(d.status==='live'?(rn||1)+(d.bracket?' / '+Math.max(d.bracket.length,rn):''):utE(d.starts_at_text||'—'))+'</div></div>'
   +'<div class="ut-stat"><div class="k">'+utL('Premio','Prize')+'</div><div class="v g">'+utE(utPremioTop(d)||'—')+'</div></div>'
   +'</div>';
  if(d.status==='live'&&me.next)h+='<div style="margin-top:12px"><button class="ut-btn hot" onclick="event.stopPropagation();trnEnterMatch()">⚔️ '+utL('Entra nel tuo match','Enter your match')+'</button></div>';
  else if(d.status==='reg'&&!d.registered)h+='<div style="margin-top:12px"><button class="ut-btn hot" onclick="event.stopPropagation();trnRegister()">⚔️ '+(utQuota(d)>0?utL('Iscriviti · ','Join · ')+utEurC(utQuota(d)):utL('Iscriviti gratis','Join for free'))+'</button></div>';
  h+='<div class="ut-more">'+utL('Apri la pagina del torneo','Open the tournament page')+' ›</div></div></div>';
  return h;
}
function trnRender(){
  var d=TRN.state,el=document.getElementById('trn-body');
  if(!el)return;
  el.classList.add('ut-pg');
  if(TRN.det){trnDetRender();return;}
  var hd=document.getElementById('trn-hdr-st');
  var up=trnUpcomingHTML(d);
  var _chiuso=(d&&d.active&&d.status==='done'&&TRN.hist&&TRN.hist.length);
  if(hd)hd.textContent=(!d||!d.active||_chiuso)?(up?'⏳ '+utL('ISCRIZIONI','SIGN-UP'):'🏛 '+utL('ALBO','HALL')):(d.status==='reg'?'⏳ '+utL('ISCRIZIONI','SIGN-UP'):(d.status==='checkin'?'✅ '+utL('PRESENZE','CHECK-IN'):(d.status==='live'?'🔴 LIVE':(d.status==='done'?'🏁 '+utL('CONCLUSO','FINISHED'):''))));
  var h='',kind='';
  if(!d||!d.active||_chiuso){
    kind='elenco';
    h='<div class="ut-hub-hd"><div class="e">🏆 '+utL('Tornei','Tournaments')+'</div><h1>'+(up?utL('Scegli il tuo torneo','Pick your tournament'):utL('Nessun torneo in programma','No tournaments scheduled'))+'</h1>'
      +'<p>'+(up?utL('Eliminazione diretta: vinci il tuo match e passi al turno dopo, fino alla finale.','Knockout: win your match and go through, up to the final.')
               :utL('Il prossimo lo annuncia il bot nel gruppo. Intanto guarda chi ha vinto.','The bot will announce the next one in the group. Meanwhile, see who won.'))+'</p></div>';
    if(up)h+=up;
    else if(TRN.hist&&!TRN.hist.length)h+='<div class="ut-card ut-empty" style="margin-top:14px"><div class="ic">🏆</div><b>'+utL('Nessun torneo si è ancora giocato','No tournament played yet')+'</b>'+utL('I tornei si annunciano nel gruppo: ti iscrivi da qui e giochi qui.','Tournaments are announced in the group: you join and play here.')+'</div>';
    h+=trnAlbHTML('');
    if(TRN.hist&&!TRN.hist.length&&!up)h+=utRegoleHTML();
  }else{
    kind='cur|'+d.id+'|'+d.status;
    h+=utHubCur(d);
    if(d.status==='checkin')h+=trnCheckinHTML(d);
    if(d.status==='live'){
      var mm=d.my_match,canEnter=(mm&&mm.ticket&&(mm.status==='pending'||mm.status==='live'));
      if(trnImSecs(d)>0)h+=trnIntermHTML(d);
      if(!canEnter)h+=trnRipescaHTML(d);
      h+=utLiveHTML(d,true);
      if(d.bracket&&d.bracket.length)h+='<div class="ut-sec">🗺 <b>'+utL('Tabellone','Bracket')+'</b><i>'+utL('scorri →','swipe →')+'</i></div>'+trnBracketHTML(d);
    }
    if(d.status==='done'){
      h+='<div class="ut-card" style="margin-top:12px;text-align:center;background:linear-gradient(160deg,rgba(255,215,0,.14),var(--ut-s1) 70%);border-color:rgba(255,215,0,.3)">'
        +'<div style="font-size:40px">🏆</div>'+(d.winner_name?utAv(d.winner_name,'xl'):'')
        +'<div class="ut-hero-n" style="margin-top:10px;color:var(--ut-goldt)">'+utE(d.winner_name||utL('Campione','Champion'))+'</div>'
        +'<div class="ut-note">'+utL('Campione del torneo','Tournament champion')+'</div>'
        +'<div style="margin-top:12px"><button class="ut-btn" onclick="trnNextOpen()">⚔️ '+utL('Iscriviti al prossimo','Join the next one')+'</button></div></div>';
      if(d.bracket&&d.bracket.length)h+='<div class="ut-sec">🗺 <b>'+utL('Tabellone','Bracket')+'</b></div>'+trnBracketHTML(d);
    }
    if(d.status==='cancelled')h+='<div class="ut-card ut-empty" style="margin-top:12px"><div class="ic">🚫</div><b>'+utL('Torneo annullato','Tournament cancelled')+'</b>'+utL('Il prossimo sarà annunciato dal bot.','The next one will be announced by the bot.')+'</div>';
    h+=up;
    if(d.status==='reg'||d.status==='cancelled')h+=trnAlbHTML(d.status==='cancelled'?d.id:'');
  }
  var conChat=(d&&d.active&&!_chiuso&&(d.status==='checkin'||d.status==='live'||d.status==='done'));
  if(conChat)h+='<div class="ut-sec">💬 <b>'+utL('Chat del torneo','Tournament chat')+'</b></div><div id="ut-hub-chat"></div>';
  if(UT.hubH===h&&el.querySelector('.ut-hub-root')){utHubDopo(d,conChat);return;}
  var nuovo=(UT.hubK!==kind);UT.hubK=kind;UT.hubH=h;
  var st=el.scrollTop;
  el.innerHTML='<div class="ut-wrap ut-hub-root'+(nuovo?' ut-in':'')+'" style="display:flex;flex-direction:column;">'+h+'</div>';
  if(conChat){var hc=document.getElementById('ut-hub-chat');if(hc)hc.outerHTML=trnChatHTML();}
  if(!nuovo)el.scrollTop=st;
  utBrCentra();
  utHubDopo(d,conChat);
}
function utHubDopo(d,conChat){
  if(conChat){trnAskViewers();trnChatSub();trnChatPaint();}
  if(d&&d.active&&d.status==='live'){trnAskViewers();trnImArm(d);trnRipescaAuto(d);}
  if(d&&d.active&&d.status==='checkin'){
    trnCiArm(d);
    if(d.registered&&!d.checked_in&&TRN.ciFor!==d.id){TRN.ciFor=d.id;trnCheckin();}
  }
  utCdArm();
}
function utCdArm(){
  if(UT.cdT)return;
  UT.cdT=setInterval(function(){
    if(CUR!=='torneo'){clearInterval(UT.cdT);UT.cdT=null;return;}
    var up=(TRN.state&&TRN.state.upcoming)||[],els=document.querySelectorAll('.ut-tc .cd');
    if(!els.length||TRN.det)return;
    var ord=trnUpSort(up);
    [].forEach.call(els,function(e,i){var t=ord[i];if(t)e.textContent=utCdTxt(trnDetSecs(t));});
  },1000);
}
function trnDetYouHTML(cur,me){
  var cls='',v='',s='',stt=cur?cur.status:'reg';
  if(!me.reg){
    v=utL('Non sei iscritto','You are not registered');
    s=(!cur||stt==='reg')?utL('Un tocco e sei nel tabellone.','One tap and you are in the bracket.')
                         :utL('Iscrizioni chiuse: puoi seguire tutto da spettatore.','Registration closed: you can follow as a spectator.');
  }else if(!cur||stt==='reg'){cls='ok';v=utL('Sei iscritto','You are registered');s=utL('Torna qui poco prima del via: ti chiederemo di confermare la presenza.','Come back shortly before the start to check in.');}
  else if(stt==='checkin'){
    if(me.ci){cls='ok';v=utL('Presenza confermata','Checked in');s=utL('Resta qui: allo scadere del timer arriva il tuo match.','Stay here: your match arrives when the timer ends.');}
    else{cls='hot';v=utL('Conferma la presenza','Confirm you are here');s=utL('Senza conferma resti fuori dal tabellone.','Without check-in you are out of the bracket.');}
  }else if(stt==='live'){
    if(me.next){cls='hot';v=utL('Il tuo match ti aspetta','Your match is waiting');s=utL('Hai 3 minuti dal via del round per presentarti.','You have 3 minutes from the round start.');}
    else if(cur.ripescaggio&&cur.ripescaggio.stato==='in_lista'){cls='hot';v=utL('Sei in lista ripescaggio','You are on the reserve list');s=utL('Entri al round ','You enter at round ')+cur.ripescaggio.round+utL(' se c’è posto. Resta su questa pagina.',' if there is room. Stay on this page.');}
    else if(cur.ripescaggio&&cur.ripescaggio.stato==='puoi'){cls='hot';v=utL('Hai mancato il check-in','You missed check-in');s=utL('Mettiti in lista ripescaggio: puoi rientrare dal round ','Join the reserve list: you can come back at round ')+cur.ripescaggio.round+'.';}
    else if(cur.ripescaggio&&cur.ripescaggio.stato==='chiuso'){v=utL('Check-in mancato','Check-in missed');s=utL('Il ripescaggio è chiuso: guarda i match da spettatore.','Reserve list closed: watch as a spectator.');}
    else if(me.out){v=utL('Sei stato eliminato','You were knocked out');s=utL('La tua corsa finisce qui. Resta a guardare i match ancora in corso.','Your run ends here. Stay and watch the live matches.');}
    else{cls='ok';v=utL('Sei ancora in gara','You are still in');s=utL('Aspetti il prossimo round: il match compare qui appena è pronto.','Waiting for the next round: your match appears here.');}
  }else if(stt==='done'){
    var fz=utFinale(cur);
    if(fz===1){cls='gold';v='🏆 '+utL('Sei il campione!','You are the champion!');s=utL('Hai vinto il torneo. Il premio arriva come indicato qui sotto.','You won the tournament. The prize arrives as shown below.');}
    else if(fz===2){cls='ok';v='🥈 '+utL('Finalista','Finalist');s=utL('Sei arrivato fino alla finale. Il prossimo torneo è già in arrivo.','You reached the final. The next tournament is coming.');}
    else{v=utL('Torneo concluso','Tournament finished');s=utL('Il prossimo torneo è già in arrivo.','The next tournament is coming.');}
  }
  else{v=utL('Torneo annullato','Tournament cancelled');s=utL('Il prossimo sarà annunciato dal bot.','The bot will announce the next one.');}
  return '<div class="ut-you '+cls+'"><div class="ut-you-k">'+utL('Il tuo stato','Your status')+'</div><div class="ut-you-v">'+v+'</div><div class="ut-you-s">'+s+'</div>'+utPassiHTML(cur,me)+'</div>';
}
function utFinale(cur){
  var br=(cur&&cur.bracket)||[],uid=String(S.userId||'');if(!br.length)return 0;
  var ms=br[br.length-1].matches||[];if(ms.length!==1||ms[0].status!=='done')return 0;
  var m=ms[0],mio=null;(m.players||[]).forEach(function(p){if(p&&p.uid!=null&&String(p.uid)===uid)mio=p;});
  if(!mio)return 0;
  return (m.winner_name&&mio.name===m.winner_name)?1:2;
}
function utPassiHTML(cur,me){
  if(!me.reg)return '';
  var P=[{t:utL('Iscritto','Joined'),s:'f'}];
  var stt=cur?cur.status:'reg';
  P.push({t:utL('Presenza','Check-in'),s:(!cur||stt==='reg')?'':(stt==='checkin'?(me.ci?'f':'c'):'f')});
  var br=(cur&&cur.bracket)||[],uid=String(S.userId||''),i,mio=-1,vinto={},perso=-1;
  br.forEach(function(rd,ri){(rd.matches||[]).forEach(function(m){
    var dentro=false;(m.players||[]).forEach(function(p){if(p&&p.uid!=null&&String(p.uid)===uid)dentro=true;});
    if(dentro){mio=ri;if(m.status==='done'){ if(!me.out||ri<br.length-1)vinto[ri]=1; }}
  });});
  if(me.out)perso=mio;
  var fz=utFinale(cur);if(stt==='done'&&fz===2)perso=br.length-1;
  var nR=Math.max(br.length,1);
  if(stt==='live'||stt==='done'){
    for(i=0;i<Math.min(nR,4);i++){
      var s='';
      if(i===perso)s='x';else if(i<mio||(i===mio&&vinto[i]&&!(i===perso)))s='f';else if(i===mio)s='c';
      P.push({t:(i===nR-1&&br[i]&&(br[i].matches||[]).length===1)?utL('Finale','Final'):'R'+(i+1),s:s});
    }
  }else P.push({t:'Round',s:''});
  var campione=(stt==='done'&&fz===1);
  P.push({t:'🏆',s:campione?'f':''});
  if(P.length>5){P[0].t='✓';P[1].t=utL('Pres.','Chk');}
  return '<div class="ut-steps'+(P.length>5?' m':'')+'">'+P.map(function(p){return '<div class="ut-step '+p.s+'"><i></i><span>'+p.t+'</span></div>';}).join('')+'</div>';
}
function trnDetRosterHTML(t,cur){
  var names=[],meIdx=-1,i,j,uid=String(S.userId||''),fuori={};
  if(cur&&cur.bracket&&cur.bracket.length){
    var ms=(cur.bracket[0]||{}).matches||[];
    for(i=0;i<ms.length;i++){var pp=ms[i].players||[];for(j=0;j<pp.length;j++){
      if(meIdx<0&&pp[j]&&pp[j].uid!=null&&String(pp[j].uid)===uid)meIdx=names.length;
      names.push((pp[j]&&pp[j].name)||utL('Giocatore','Player'));}}
    cur.bracket.forEach(function(rd){(rd.matches||[]).forEach(function(m){
      if(m.status==='done'&&m.winner_name)(m.players||[]).forEach(function(p){if(p&&p.name&&p.name!==m.winner_name)fuori[p.name]=1;});});});
  }
  if(!names.length&&t&&t.players_names&&t.players_names.length){
    names=t.players_names.slice(0,100);
    if(t.registered){var my=String(S.username||S.name||'').slice(0,24);if(my)for(i=0;i<names.length;i++){if(meIdx<0&&String(names[i])===my)meIdx=i;}}
  }
  var n=((cur?cur.players_count:t.players_count)||0),mx=(t&&t.max_players)||0;
  var h='<div class="ut-sec">👥 <b>'+utL('Iscritti','Players')+'</b><i>'+n+(mx?' / '+mx:'')+'</i></div>';
  if(mx)h+='<div class="ut-bar" style="margin:2px 0 4px"><i style="width:'+Math.min(100,Math.round(100*n/mx))+'%"></i></div>';
  if(!names.length)return h+'<div class="ut-card ut-empty">'+utL('L’elenco dei nomi compare appena il server lo espone.','The list of names appears as soon as the server shares it.')+'</div>';
  h+='<div class="ut-ros">';
  for(i=0;i<names.length;i++)h+='<div class="ut-ros-p'+(i===meIdx?' me':'')+(fuori[names[i]]?' out':'')+'">'+utAv(names[i],'s')+'<span class="nm">'+utE(names[i])+(i===meIdx?' · '+utL('tu','you'):'')+'</span></div>';
  return h+'</div>';
}
function utRegoleHTML(){
  function r(ic,t,s){return '<details class="ut-acc"><summary><span>'+ic+'</span>'+t+'</summary><p>'+s+'</p></details>';}
  return '<div class="ut-sec">📖 <b>'+utL('Come funziona','How it works')+'</b></div>'
   +r('🗺',utL('Il tabellone','The bracket'),utL('Eliminazione diretta: chi vince il suo match passa al round dopo, chi perde è fuori, fino al campione.','Knockout: the winner of each match goes through, the loser is out, up to the champion.'))
   +r('⏱',utL('La conferma presenza','Check-in'),utL('Poco prima del via si aprono 3 minuti di conferma: tocchi il tasto e sei dentro. I match si formano solo con chi ha confermato.','Shortly before the start there are 3 minutes to check in. Matches are made only with those who checked in.'))
   +r('⏸',utL('La pausa tra i round','Break between rounds'),utL('Fra un round e l’altro c’è una pausa per aspettare che finiscano tutti i match. Resta su questa pagina.','Between rounds there is a break while all matches finish. Stay on this page.'))
   +r('🚪',utL('Se non ti presenti','If you do not show up'),utL('Chi non entra nel proprio match entro 3 minuti dal via del round è eliminato.','Whoever does not enter their match within 3 minutes of the round start is out.'))
   +r('👁',utL('Guardare gli altri','Watching the others'),utL('Tocca un match in diretta per guardarlo: non disturbi nessuno, commenti in chat ed esci quando vuoi.','Tap a live match to watch it: you do not disturb anyone, you can chat and leave anytime.'))
   +r('🏆',utL('Il premio','The prize'),utL('Il premio va al campione come indicato nel torneo.','The prize goes to the champion as stated in the tournament.'));
}
function trnDetHelpHTML(){return utRegoleHTML();}
function trnDetChampHTML(){return '';}
function utTab(k){
  UT.tab=k;
  var r=document.querySelector('.ut-det');if(!r)return;
  [].forEach.call(r.querySelectorAll('.ut-tab'),function(b){b.classList.toggle('on',b.getAttribute('data-k')===k);});
  [].forEach.call(r.querySelectorAll('.ut-pane'),function(p){p.classList.toggle('on',p.getAttribute('data-k')===k);});
  if(k==='ch'){
    UT.lettiTab=(TRN.chat||[]).length;utChatBadge();
    var el=document.getElementById('trn-body'),tb=r.querySelector('.ut-tabs');
    if(el&&tb){
      var top=tb.offsetTop-10;el.scrollTop=top;
      var lg=r.querySelector('.ut-pane[data-k="ch"] .trn-ch-log');
      if(lg){var hh=el.clientHeight-tb.offsetHeight-40-58-44-24;lg.style.height=Math.max(160,hh)+'px';lg.scrollTop=lg.scrollHeight;}
    }
  }
  if(k==='br')utBrCentra();
}
function trnDetArchHTML(t){
  var ann=(t.status==='cancelled');
  var nomi=t.winner_name||((t.winners_names||[]).join(', '))||'';
  var fin=(t.finalists||[]).filter(function(x){return x&&x.name;});
  var h='<button class="ut-back" onclick="trnDetClose()">'+utL('Tutti i tornei','All tournaments')+'</button>'
   +'<div class="ut-hero">'+utArtDiv(t.game)+'<div class="ut-tc-ic">'+utGameIc(t.game)+'</div>'
   +'<div class="ut-tc-top"><span class="ut-chip g">'+utE(utGameName(t.game,t.game_label))+'</span>'+(ann?'<span class="ut-chip mut">'+utL('Annullato','Cancelled')+'</span>':'<span class="ut-chip g">🏁 '+utL('Concluso','Finished')+'</span>')+'</div></div>'
   +'<div class="ut-hero-b"><div class="ut-hero-n">'+utE(t.name||utL('Torneo','Tournament'))+'</div>'
   +'<div class="ut-stats">'
   +'<div class="ut-stat"><div class="k">'+utL('Iscritti','Players')+'</div><div class="v">'+(t.players_count||0)+'</div></div>'
   +'<div class="ut-stat"><div class="k">'+utL('Al via','Started')+'</div><div class="v">'+(t.present_count!=null?t.present_count:'—')+'</div></div>'
   +'<div class="ut-stat"><div class="k">Round</div><div class="v">'+(t.rounds_count||'—')+'</div></div></div>'
   +(trnFmtD(t.ts,1)?'<div class="ut-note" style="text-align:left;margin-top:10px">📅 '+utE(trnFmtD(t.ts,1))+'</div>':'')+'</div></div>';
  if(ann)return h+'<div class="ut-card ut-empty" style="margin-top:12px">'+utL('Questo torneo è stato annullato: nessun campione, nessun premio assegnato.','This tournament was cancelled: no champion, no prize.')+'</div>';
  if(nomi){
    h+='<div class="ut-sec">👑 <b>'+utL('Podio','Podium')+'</b></div><div class="ut-card" style="text-align:center">'
     +utAv(nomi,'xl',t.winner_photo)+'<div class="ut-hero-n" style="margin-top:10px;color:var(--ut-goldt)">'+utE(nomi)+'</div>'
     +((t.winner_titles>=2)?'<div style="margin-top:6px"><em class="ut-tit">🏅 '+t.winner_titles+' '+utL('titoli','titles')+'</em></div>':'')
     +(fin.length>1?'<div class="ut-pr-row" style="margin-top:12px;border-top:1px solid var(--ut-line)"><span>🥈 '+utE(fin[1].name)+'</span><b style="font-family:inherit;font-size:11px;color:var(--ut-t2)">'+utL('finalista','finalist')+'</b></div>':'')
     +'</div>';
  }else h+='<div class="ut-card ut-empty" style="margin-top:12px">'+utL('Nessun campione registrato per questo torneo.','No champion recorded for this tournament.')+'</div>';
  return h+utPremiHTML(t,null);
}
function trnDetRender(){
  var el=document.getElementById('trn-body');if(!el)return;
  el.classList.add('ut-pg');
  var f=trnDetFind();
  if(!f){TRN.det=null;TRN.detSig='';trnRender();return;}
  if(f.arch){
    var hdA=document.getElementById('trn-hdr-st');
    if(hdA)hdA.textContent=(f.t.status==='cancelled')?'✖ '+utL('ANNULLATO','CANCELLED'):'🏁 '+utL('CONCLUSO','FINISHED');
    var sigA='arch|'+String(f.t.id||'');
    if(TRN.detSig!==sigA){TRN.detSig=sigA;el.innerHTML='<div class="ut-wrap ut-in" style="display:flex;flex-direction:column">'+trnDetArchHTML(f.t)+'</div>';}
    return;
  }
  var t=f.t,cur=f.cur,me=trnDetMe(t,cur);
  var hd=document.getElementById('trn-hdr-st');
  if(hd)hd.textContent=!cur?'⏳ '+utL('ISCRIZIONI','SIGN-UP'):(cur.status==='reg'?'⏳ '+utL('ISCRIZIONI','SIGN-UP'):(cur.status==='checkin'?'✅ '+utL('PRESENZE','CHECK-IN'):(cur.status==='live'?'🔴 LIVE':(cur.status==='done'?'🏁 '+utL('CONCLUSO','FINISHED'):''))));
  var sig=trnDetSig(t,cur)+'|'+(cur?JSON.stringify(cur.premi_esito||''):'')+'|'+(t.premi_cent||'')+'|'+(t.quota_cent||'');
  if(document.getElementById('trn-det-root')&&sig===TRN.detSig){trnDetArm(t);utDetCd(t);return;}
  var primaVolta=(TRN.detSig===''||UT.tabFor!==TRN.det);
  TRN.detSig=sig;
  var g=(cur?cur.game:t.game),gl=(cur?cur.game_label:t.game_label);
  var tid=utId(t.id),regArg=cur?'':('\''+tid+'\''),secs=trnDetSecs(t),q=utQuota(cur||t);
  var n=((cur?cur.players_count:t.players_count)||0),mx=t.max_players||0,rn=utRoundAttuale(cur);
  var h='<div id="trn-det-root"></div><div class="ut-wrap ut-det'+(primaVolta?' ut-in':'')+'" style="display:flex;flex-direction:column">'
   +'<button class="ut-back" onclick="trnDetClose()">'+utL('Tutti i tornei','All tournaments')+'</button>'
   +'<div class="ut-hero">'+utArtDiv(g)+'<div class="ut-tc-ic">'+utGameIc(g)+'</div>'
   +'<div class="ut-tc-top"><span class="ut-chip g">'+utE(utGameName(g,gl))+'</span>'+utStatoPill(cur)+'</div></div>'
   +'<div class="ut-hero-b"><div class="ut-hero-n">'+utE(t.name||utL('Torneo','Tournament'))+'</div>'
   +'<div class="ut-tc-w"><span>📅 '+utE(t.starts_at_text||utL('data da annunciare','date to be announced'))+'</span></div>'
   +(secs>0?'<div class="ut-cd"><span class="k">'+utL('Inizia fra','Starts in')+'</span><span class="v" id="ut-det-cd">'+utCdTxt(secs)+'</span><span id="trn-det-cd" style="display:none"></span></div>':'')
   +'<div class="ut-stats">'
   +'<div class="ut-stat"><div class="k">'+utL('Iscritti','Players')+'</div><div class="v">'+n+(mx?'<span style="color:var(--ut-t3);font-size:11px"> /'+mx+'</span>':'')+'</div></div>'
   +'<div class="ut-stat"><div class="k">'+(cur&&cur.status==='live'?'Round':utL('Ingresso','Entry'))+'</div><div class="v'+(cur&&cur.status==='live'?'':' g')+'">'+(cur&&cur.status==='live'?(rn||1)+' / '+Math.max((cur.bracket||[]).length,rn||1):(q>0?utEurC(q):utL('Gratis','Free')))+'</div></div>'
   +'<div class="ut-stat"><div class="k">'+utL('Premio','Prize')+'</div><div class="v g">'+utE(utPremioTop(cur||t)||utPremioTop(t)||'—')+'</div></div>'
   +'</div></div></div>'
   +trnDetYouHTML(cur,me);
  var az='';
  if(cur&&cur.status==='checkin')az+=trnCheckinHTML(cur);
  if(cur&&cur.status==='live'){
    if(me.next)az+='<div style="margin-top:12px"><button class="ut-btn hot" style="min-height:56px;font-size:16px" onclick="trnEnterMatch()">⚔️ '+utL('Entra nel tuo match','Enter your match')+'</button></div>';
    else az+=trnRipescaHTML(cur);
    if(trnImSecs(cur)>0)az+=trnIntermHTML(cur);
  }
  if(!cur||cur.status==='reg'){
    if(t.registered)az+='<div class="ut-btns"><button class="ut-btn sec" onclick="trnDetShare()">📣 '+utL('Invita amici','Invite friends')+'</button><button class="ut-btn red" onclick="trnUnregister('+regArg+')">✖ '+utL('Annulla iscrizione','Cancel')+'</button></div>';
    else if(t.max_players!=null&&(t.players_count||0)>=t.max_players)az+='<div style="margin-top:12px"><button class="ut-btn sec" style="opacity:.6" onclick="void(0)">🚫 '+utL('Completo','Full')+'</button></div>';
    else az+='<div style="margin-top:12px"><button class="ut-btn hot" style="min-height:56px;font-size:16px" onclick="trnRegister('+regArg+')">⚔️ '+(q>0?utL('Iscriviti · ','Join · ')+utEurC(q):utL('Iscriviti gratis','Join for free'))+'</button></div>';
  }
  if(trnTrainOk(g)&&!(cur&&cur.status==='checkin')&&!(cur&&cur.status==='live'&&me.next))
    az+='<div style="margin-top:8px"><button class="ut-btn sec" onclick="trnTrain(\''+String(g||'').replace(/[^A-Za-z0-9]/g,'')+'\')">🤖 '+utL('Allenati contro i bot','Practice against bots')+' <small>· '+utL('gratis, non conta','free, does not count')+'</small></button></div>';
  var premiSu=(!cur||cur.status==='reg');
  if(premiSu)az+=utPremiHTML(t,cur);
  h+=az;
  var haBr=!!(cur&&cur.bracket&&cur.bracket.length);
  var def=haBr?'br':((cur&&(cur.status==='checkin'))?'ch':'is');
  if(UT.tabFor!==TRN.det||!UT.tab){UT.tab=def;UT.tabFor=TRN.det;}
  var tabs=[['br',utL('Tabellone','Bracket')],['is',utL('Iscritti','Players')],['ch','Chat'],['in','Info']];
  h+='<div class="ut-tabs">'+tabs.map(function(x){return '<button class="ut-tab'+(UT.tab===x[0]?' on':'')+'" data-k="'+x[0]+'" onclick="utTab(\''+x[0]+'\')">'+x[1]+(x[0]==='ch'?'<em id="ut-tab-ch-n" class="z">0</em>':'')+'</button>';}).join('')+'</div>';
  h+='<div class="ut-pane'+(UT.tab==='br'?' on':'')+'" data-k="br">'
    +trnDetLiveHTML(cur)
    +(haBr?'<div class="ut-sec">🗺 <b>'+utL('Tabellone','Bracket')+'</b><i>'+utL('scorri →','swipe →')+'</i></div>'+trnBracketHTML(cur)
          :'<div class="ut-card ut-empty" style="margin-top:12px"><div class="ic">🗺</div><b>'+utL('Il tabellone si forma al via','The bracket is drawn at the start')+'</b>'+utL('Dopo la conferma delle presenze i giocatori vengono accoppiati a sorte.','After check-in players are paired at random.')+'</div>')
    +'</div>';
  h+='<div class="ut-pane'+(UT.tab==='is'?' on':'')+'" data-k="is">'+trnDetRosterHTML(t,cur)+'</div>';
  h+='<div class="ut-pane'+(UT.tab==='ch'?' on':'')+'" data-k="ch">'+trnChatHTML()+'</div>';
  h+='<div class="ut-pane'+(UT.tab==='in'?' on':'')+'" data-k="in">'+(premiSu?'':utPremiHTML(t,cur))+utRegoleHTML()
    +'<div style="margin-top:14px"><button class="ut-btn" onclick="trnDetShare()">📣 '+utL('Invita i tuoi amici','Invite your friends')+'</button></div>'
    +'<div class="ut-note">'+utL('Più siete al via, più il tabellone è pieno.','The more players, the bigger the bracket.')+'</div></div>';
  h+='</div>';
  var st=el.scrollTop;
  el.innerHTML=h;
  if(!primaVolta)el.scrollTop=st;
  var cp=el.querySelector('.ut-pane[data-k="ch"] .ut-chat');if(cp){cp.classList.remove('chiusa');var cr=cp.querySelector('.ut-chat-car');if(cr)cr.style.display='none';cp.querySelector('.ut-chat-hd').onclick=null;}
  trnAskViewers();trnChatSub();trnChatPaint();
  trnDetArm(t);utDetCd(t);
  if(UT.tab==='ch')utTab('ch');else utBrCentra();
  if(cur&&cur.status==='live'){trnImArm(cur);trnRipescaAuto(cur);}
  if(cur&&cur.status==='checkin'){trnCiArm(cur);if(cur.registered&&!cur.checked_in&&TRN.ciFor!==cur.id){TRN.ciFor=cur.id;trnCheckin();}}
}
function utDetCd(t){
  if(UT.detCdT)return;
  UT.detCdT=setInterval(function(){
    var e=document.getElementById('ut-det-cd');
    if(!e||CUR!=='torneo'||!TRN.det){clearInterval(UT.detCdT);UT.detCdT=null;return;}
    var f=trnDetFind();if(f)e.textContent=utCdTxt(trnDetSecs(f.t));
  },1000);
}
function utLobRow(c){
  var g=lobG(c.game)||['','🎮',String(c.game||''),'A',2,2,1],po=Number(c.posti)||2,se=Number(c.seduti)||0,i,d='';
  if(c.track==='A'&&se<1)se=1;
  if(po<=10)for(i=0;i<po;i++)d+='<i'+(i<se?' class="on"':'')+'></i>';
  return '<button class="ut-lr" onclick="lobOpen(\''+lobEsc(c.lid)+'\',false)">'
    +'<span class="ut-lr-ic" style="'+utTinta(g[0])+'">'+g[1]+'</span>'
    +'<span class="ut-lr-b"><span class="ut-lr-n">'+lobEsc(g[2])+'</span>'
    +'<span class="ut-lr-s">'+utAv(c.creator_name||'?','s')+'<span>'+lobEsc(c.creator_name||utL('un giocatore','a player'))+'</span></span></span>'
    +'<span class="ut-lr-r"><span class="ut-chip '+(c.gratis?'ok':'g')+'">'+(c.gratis?utL('Gratis','Free'):lobEur(c.stake_eur))+'</span>'
    +'<span class="ut-seatd">'+(d||(se+'/'+po))+'</span>'+(c.scade_fra!=null?'<span class="cd">⏱ '+lobMMSS(c.scade_fra)+'</span>':'')+'</span></button>';
}
function lobListaHTML(){
  if(!LOB.lista||!LOB.lista.length)return '';
  var h='<div class="ut-sec"><span class="ut-dot"></span><b>'+utL('Lobby aperte adesso','Open lobbies now')+'</b><i>'+LOB.lista.length+'</i></div>';
  for(var i=0;i<LOB.lista.length&&i<12;i++)h+=utLobRow(LOB.lista[i]);
  return h;
}
function lobRenderCrea(){
  var el=document.getElementById('lob-body');if(!el)return;
  el.classList.add('ut-pg');
  var g=lobG(LOB.game)||LOB_GAMES[0],i;
  var st=el.scrollTop,nuovo=(UT.lobK!=='crea');UT.lobK='crea';
  var h='<div class="ut-lob-hd"><div class="e">📣 '+utL('Lobby','Lobbies')+'</div><h1>'+utL('Gioca con chi vuoi','Play with anyone')+'</h1>'
    +'<p>'+utL('Entra in una lobby aperta o aprine una tua: chi tocca il tasto nel gruppo si siede al tavolo.','Join an open lobby or open yours: whoever taps the button in the group takes a seat.')+'</p></div>';
  h+='<div class="lob-lista" id="lob-lista" style="display:flex;flex-direction:column">'+lobListaHTML()+'</div>';
  h+='<div class="ut-sec" style="margin-top:22px">➕ <b>'+utL('Crea la tua lobby','Create your lobby')+'</b></div>';
  h+='<div class="ut-step-k"><b>1</b><span>'+utL('Gioco','Game')+'</span><i>'+lobEsc(g[2])+'</i></div><div class="ut-gg">';
  var gruppi=[['A',utL('1 contro 1','1 vs 1')],['B',utL('Al tavolo, in tanti','At the table, many players')]];
  gruppi.forEach(function(gr){
    h+='<div class="ut-gsub">'+gr[1]+'</div>';
    for(i=0;i<LOB_GAMES.length;i++){var q2=LOB_GAMES[i];var b=(q2[3]==='B'&&q2[5]>2);if((gr[0]==='B')!==b)continue;
      h+='<button class="ut-g'+(q2[0]===LOB.game?' sel':'')+'" onclick="lobSetGame(\''+q2[0]+'\')"><b>'+q2[1]+'</b><span>'+lobEsc(q2[2])+'</span></button>';}
  });
  h+='</div>';
  var n=2;
  if(g[3]==='B'){
    n++;h+='<div class="ut-step-k"><b>2</b><span>'+utL('Posti','Seats')+'</span><i>'+LOB.posti+'</i></div><div class="ut-seg" id="lob-posti">';
    var opt=lobPostiOpt(g);
    for(i=0;i<opt.length;i++)h+='<button class="'+(opt[i]===LOB.posti?'sel':'')+'" onclick="lobSetPosti('+opt[i]+')">'+opt[i]+'</button>';
    h+='</div>';
    if(g[0]==='calcio')h+='<div class="ut-note" style="text-align:left">'+utL('La Bolgia si gioca a squadre: i posti sono pari.','The Derby is played in teams: seats are even.')+'</div>';
  }
  h+='<div class="ut-step-k"><b>'+n+'</b><span>'+utL('Posta','Stake')+'</span><i>'+(LOB.gratis?utL('gratis','free'):lobEur(LOB.eur))+'</i></div><div class="ut-seg" id="lob-poste">';
  if(g[6])h+='<button class="free'+(LOB.gratis?' sel':'')+'" onclick="lobSetEur(0)">'+utL('Gratis','Free')+'</button>';
  for(i=0;i<TWR_TIERS.length;i++)h+='<button class="'+((!LOB.gratis&&Number(TWR_TIERS[i][0])===LOB.eur)?'sel':'')+'" onclick="lobSetEur('+TWR_TIERS[i][0]+')">'+TWR_TIERS[i][1]+'</button>';
  h+='</div>';
  if(!g[6])h+='<div class="ut-note" style="text-align:left">'+utL('Questo gioco non ha ancora le lobby gratis: si gioca a posta.','This game has no free lobbies yet.')+'</div>';
  h+='<div class="ut-step-k"><b>'+(n+1)+'</b><span>'+utL('Dove annunciarla','Where to announce it')+'</span></div>';
  h+='<div class="lob-grp" id="lob-grp">'+lobGroupsHTML()+'</div>';
  h+='<div class="ut-sum"><div class="ut-sum-r"><span class="ic">'+g[1]+'</span><span class="t">'+lobEsc(g[2])+'<small>'+(g[3]==='B'?LOB.posti+' '+utL('posti','seats'):'1 vs 1')+' · '
    +(LOB.gratis?utL('nessuna posta, nessun premio','no stake, no prize'):utL('ognuno mette ','each puts ')+lobEur(LOB.eur)+utL(' · rimborso se non parte',' · refunded if it does not start'))+'</small></span>'
    +'<span class="p'+(LOB.gratis?' free':'')+'">'+(LOB.gratis?utL('GRATIS','FREE'):lobEur(LOB.eur))+'</span></div>'
    +'<button class="ut-btn hot" onclick="lobCrea()">📣 '+utL('Apri la lobby','Open the lobby')+'</button></div>';
  el.innerHTML='<div class="ut-wrap '+(nuovo?'ut-in':'')+'" style="display:flex;flex-direction:column">'+h+'</div>';
  if(!nuovo)el.scrollTop=st;
}
function lobRenderCard(){
  var el=document.getElementById('lob-body');if(!el)return;
  el.classList.add('ut-pg');
  var c=LOB.card;
  if(!c){UT.lobK='';el.innerHTML='<div class="ut-card ut-empty" style="margin-top:14px"><div class="ic">📣</div><b>'+utL('Apro la lobby…','Opening the lobby…')+'</b><span class="ut-wait"><i></i><i></i><i></i></span></div>';return;}
  var g=lobG(c.game)||['','🎮',String(c.game||''),'A',2,2,1];
  var stato=String(c.stato||'aperta'),posti=Number(c.posti)||2,seduti=Number(c.seduti)||0,i;
  if(c.track==='A'&&stato==='aperta'&&seduti<1)seduti=1;
  var nuovo=(UT.lobK!=='card|'+c.lid);UT.lobK='card|'+c.lid;
  var h='<div class="ut-lc">'+utArtDiv(g[0])+'<div class="ut-tc-ic">'+g[1]+'</div>'
    +'<div class="ut-tc-top"><span class="ut-chip '+(c.gratis?'ok':'g')+'">'+(c.gratis?'🎁 '+utL('Gratis','Free'):'💰 '+lobEur(c.stake_eur))+'</span>'
    +(stato==='aperta'?'<span class="ut-chip cy">'+utL('Aperta','Open')+'</span>':(stato==='in_gioco'?'<span class="ut-chip live">'+utL('In gioco','Playing')+'</span>':'<span class="ut-chip mut">'+lobEsc(stato)+'</span>'))+'</div></div>'
    +'<div class="ut-lc-b"><div class="ut-lc-n">'+lobEsc(g[2])+'</div>'
    +'<div class="ut-lc-by">'+utAv(LOB.mine?(S.username||S.name||'Tu'):(c.creator_name||'?'),'s')+(LOB.mine?'<b>'+utL('La tua lobby','Your lobby')+'</b>':utL('Lobby di ','Lobby by ')+'<b>'+lobEsc(c.creator_name||utL('un giocatore','a player'))+'</b>')+'</div>'
    +'<div class="ut-seats2" id="lob-seats-v">';
  for(i=0;i<Math.min(posti,10);i++)h+='<span class="ut-seat'+(i<seduti?' on':'')+(i===0&&LOB.mine&&c.track==='A'?' me':'')+'">'+(i<seduti?'👤':'+')+'</span>';
  h+='</div><div class="ut-stats" style="grid-template-columns:repeat(3,1fr)">'
    +'<div class="ut-stat"><div class="k">'+utL('Posti','Seats')+'</div><div class="v" id="lob-seats">'+seduti+'/'+posti+'</div></div>'
    +'<div class="ut-stat"><div class="k">'+utL('Posta','Stake')+'</div><div class="v g">'+(c.gratis?utL('Gratis','Free'):lobEur(c.stake_eur))+'</div></div>'
    +'<div class="ut-stat"><div class="k">'+utL('Scade fra','Expires in')+'</div><div class="v" id="lob-cd">'+lobMMSS(c.scade_fra)+'</div></div></div>';
  var az='';
  if(stato==='in_gioco'&&c.dentro){
    az='<div class="ut-lc-st ok"><div><div class="k">'+utL('Stato','Status')+'</div><div class="v">'+utL('La partita è in corso','The game is on')+'</div></div></div>'
      +'<div style="margin-top:12px"><button class="ut-btn hot" onclick="lobTorna()">▶ '+utL('Torna alla partita','Back to the game')+'</button></div>'
      +'<div class="ut-note">'+utL('Il tuo posto è ancora tuo: rientri dove eri rimasto.','Your seat is still yours.')+'</div>';
  }else if(stato==='in_gioco'){
    az='<div class="ut-lc-st ko"><div><div class="k">'+utL('Stato','Status')+'</div><div class="v">'+utL('Già partita: il posto non c’è più','Already started: no seat left')+'</div></div></div>';
  }else if(stato==='scaduta'){
    az='<div class="ut-lc-st ko"><div><div class="k">'+utL('Stato','Status')+'</div><div class="v">'+utL('Lobby scaduta','Lobby expired')+'</div></div></div><div class="ut-note">'+utL('Nessuno si è seduto in tempo. Le poste sono tornate a chi le aveva messe.','Nobody sat in time. Stakes were returned.')+'</div>';
  }else if(stato==='annullata'){
    az='<div class="ut-lc-st ko"><div><div class="k">'+utL('Stato','Status')+'</div><div class="v">'+utL('Lobby annullata','Lobby cancelled')+'</div></div></div>';
  }else if(seduti>=posti&&!LOB.mine){
    az='<div class="ut-lc-st ko"><div><div class="k">'+utL('Stato','Status')+'</div><div class="v">'+utL('Piena','Full')+'</div></div></div><div class="ut-note">'+utL('Tutti i posti sono presi. Aprine una tua: ci vogliono dieci secondi.','All seats taken. Open your own: it takes ten seconds.')+'</div>';
  }else if(LOB.mine&&c.track==='A'){
    az='<div class="ut-lc-st ok"><div><div class="k">'+utL('Stato','Status')+'</div><div class="v">'+utL('Aspetto un avversario','Waiting for an opponent')+' <span class="ut-wait"><i></i><i></i><i></i></span></div></div></div>'
      +'<div class="ut-note">'+utL('La tua posta è già sul tavolo. Appena qualcuno tocca il tasto nel gruppo, si parte.','Your stake is on the table. As soon as someone taps the button, it starts.')+'</div>';
  }else{
    var lbl=LOB.mine?utL('Entra e aspetta','Join and wait'):utL('Entra','Join');
    az='<div style="margin-top:14px"><button class="ut-btn hot" style="min-height:56px;font-size:16px" onclick="lobEnter()">▶ '+lbl+' · '+(c.gratis?utL('gratis','free'):lobEur(c.stake_eur))+'</button></div>';
    if(LOB.mine&&c.track==='B')az+='<div class="ut-note">'+utL('Puoi giocarci o lasciarla agli altri: parte quando i posti sono pieni.','Play or leave it to others: it starts when seats are full.')+'</div>';
    else az+='<div class="ut-note">'+(c.gratis?utL('Nessuna posta: si gioca e basta.','No stake: just play.'):utL('Paghi la posta quando prendi il posto. Se la lobby non parte, ti torna indietro.','You pay when you take the seat. If it does not start, you get it back.'))+'</div>';
  }
  h+=az+'</div></div>';
  h+='<div class="ut-btns"><button class="ut-btn sec" onclick="lobShare()">🔗 '+utL('Invita · copia link','Invite · copy link')+'</button>'
    +(LOB.mine&&stato==='aperta'?'<button class="ut-btn red" onclick="lobCancel()">✖ '+utL('Annulla','Cancel')+'</button>':'')+'</div>';
  if(stato!=='aperta'||(seduti>=posti&&!LOB.mine))h+='<div style="margin-top:8px"><button class="ut-btn sec" onclick="lobNuova()">📣 '+utL('Crea una lobby','Create a lobby')+'</button></div>';
  el.innerHTML='<div class="ut-wrap '+(nuovo?'ut-in':'')+'" style="display:flex;flex-direction:column;padding-top:4px">'+h+'</div>';
}
var UT_SPEC_CUSC=120;
function utSpecRx(m,O){
  if(!m||m.time==null||!O)return;
  if(O===RTD&&RTD.game==='pong')return;
  var arr=m.rx,base=Number(m.time)*1000;
  if(!(base>0)||!(arr>0))return;
  var s=O.snaps||[],d=arr-base,st=O._utRx;
  if(!st||!s.length){st=O._utRx={off:d,n:0};}
  if(Math.abs(d-st.off)>600)st.off=d;
  else if(d<st.off)st.off=d;
  else st.off+=(d-st.off)*0.01;
  st.n++;
  var rx=base+st.off+UT_SPEC_CUSC;
  var pr=s.length?s[s.length-1]:null;
  if(pr&&pr.rx!=null&&rx<=pr.rx)rx=pr.rx+1;
  m.rx0=arr;m.rx=rx;
}
function utSpecMark(on){
  var a=document.getElementById('arc'),b=document.getElementById('arc-body');
  if(b)b.classList.toggle('ut-spec',!!on);
  if(a)a.classList.toggle('ut-spec-on',!!on);
  if(!on){utKb(false);var x=document.getElementById('ut-sp-hd');if(x&&x.parentNode)x.parentNode.removeChild(x);}
}
function utSpecHd(){
  var a=document.getElementById('arc');if(!a)return;
  var hd=a.querySelector('.game-hdr');if(!hd)return;
  var x=document.getElementById('ut-sp-hd');
  if(!x){x=document.createElement('div');x.id='ut-sp-hd';x.className='ut-sp-hd';hd.appendChild(x);}
  x.innerHTML='<span class="ut-chip live">LIVE</span><span class="ut-chip" id="ut-sp-v">👁 '+(RTD.viewers||1)+'</span><button class="ut-sp-x" onclick="rtdSpecExit()">✕ '+utL('Esci','Leave')+'</button>';
}
(function(){
  if(typeof rtdShowSpecMatch!=='function')return;
  var orig=rtdShowSpecMatch;
  window.rtdShowSpecMatch=function(){
    var b=document.getElementById('arc-body');
    if(b)b.classList.add('ut-spec');
    var a=document.getElementById('arc');if(a)a.classList.add('ut-spec-on');
    utSpecHd();
    var r=orig.apply(this,arguments);
    try{
      var sn=document.getElementById('arc-spec-n');if(sn&&sn.parentNode)sn.parentNode.style.display='none';
      var w=document.getElementById('arc-wrap');
      if(w)[].forEach.call(w.querySelectorAll('.action-btn.red'),function(x){x.style.display='none';});
      UT.spW=window.innerWidth;UT.spH=window.innerHeight;
      trnChatPaint();
    }catch(e){}
    return r;
  };
  ['rtdShowMatch','rtdShowLobby','rtdShowSearch','rtdShowSpecWait','rtdShowOver','rtdShowBuyin'].forEach(function(nm){
    var f=window[nm];if(typeof f!=='function')return;
    window[nm]=function(){utSpecMark(false);return f.apply(this,arguments);};
  });
  var fx=window.rtdSpecExit;
  if(typeof fx==='function')window.rtdSpecExit=function(){utSpecMark(false);utFChat(false);return fx.apply(this,arguments);};
  var fh=window.rtdHud;
  if(typeof fh==='function')window.rtdHud=function(m){
    var r=fh.apply(this,arguments);
    try{
      if(!RTD.spec){var b0=document.getElementById('arc-body');if(b0&&b0.classList.contains('ut-spec'))utSpecMark(false);return r;}
      var v=document.getElementById('ut-sp-v');if(v)v.textContent='👁 '+(RTD.viewers||1);
      var hud=document.getElementById('arc-hud');
      if(hud&&m&&m.sc&&String(RTD._hudH||'').indexOf('>TU ')>=0){
        var ids=Object.keys(m.sc).sort(),t=m.turn;
        if(ids.length===2){
          var nm=function(id){try{return String(rtdName(id));}catch(e){return String(id);}};
          var h2='<div class="ut-sp-sc">'
            +'<div class="s'+(t!=null&&String(t)===ids[0]?' t':'')+'"><span class="n">'+(t!=null&&String(t)===ids[0]?'👆 ':'')+utE(nm(ids[0]))+'</span><span class="p">'+(m.sc[ids[0]]||0)+'</span></div>'
            +'<div class="c">'+(m.turn_t!=null?Math.ceil(m.turn_t)+'s':(m.cap!=null?Math.ceil(m.cap)+'s':'VS'))+'</div>'
            +'<div class="s r'+(t!=null&&String(t)===ids[1]?' t':'')+'"><span class="n">'+(t!=null&&String(t)===ids[1]?'👆 ':'')+utE(nm(ids[1]))+'</span><span class="p">'+(m.sc[ids[1]]||0)+'</span></div></div>';
          if(UT.spHud!==h2||hud.innerHTML.indexOf('ut-sp-sc')<0){hud.innerHTML=h2;UT.spHud=h2;}
        }
      }
    }catch(e){}
    return r;
  };
  var fw=window.rtdWatchOk;
  if(typeof fw==='function')window.rtdWatchOk=function(m){
    var r=fw.apply(this,arguments);
    try{if(RTD.spec&&((typeof BJRT!=='undefined'&&BJRT.aperto)||(typeof DPRT!=='undefined'&&DPRT.aperto)))utFChat(true);}catch(e){}
    return r;
  };
})();
function utFChat(on){
  var x=document.getElementById('ut-fchat');
  if(!on){if(x&&x.parentNode)x.parentNode.removeChild(x);return;}
  if(!x){x=document.createElement('div');x.id='ut-fchat';x.className='ut-fchat gld-spec-chat';document.body.appendChild(x);}
  x.innerHTML=trnChatHTML();
  var c=x.querySelector('.ut-chat');if(c)c.classList.add('chiusa');
  try{TRN.chatSubbed=0;trnChatSub();trnChatPaint();}catch(e){}
}
function utKb(on){
  if(on===UT.kb)return;
  var ch=UT.kbChat;
  if(on){
    var inp=document.activeElement,box=inp&&inp.closest&&inp.closest('.gld-spec-chat');
    if(!box)return;
    var gc=box.closest('.game-content');
    UT.kb=true;UT.kbChat=box;UT.kbGc=gc;
    if(gc){UT.kbGcH=gc.style.height;UT.kbGcF=gc.style.flex;gc.style.height=Math.round(gc.getBoundingClientRect().height)+'px';gc.style.flex='none';
      var sc=gc.closest('.screen');if(sc){UT.kbSc=sc;UT.kbScO=sc.style.overflow;sc.style.overflow='hidden';}}
    if(!box.classList.contains('ut-fchat')){
      var sp=document.createElement('div');sp.className='ut-kb-spazio';sp.style.height=box.offsetHeight+'px';
      box.parentNode.insertBefore(sp,box);UT.kbSp=sp;
    }
    box.classList.add('ut-kb-chat');
    utKbPos();
  }else{
    UT.kb=false;
    if(ch)ch.classList.remove('ut-kb-chat');
    if(UT.kbSp&&UT.kbSp.parentNode)UT.kbSp.parentNode.removeChild(UT.kbSp);UT.kbSp=null;
    if(UT.kbGc){UT.kbGc.style.height=UT.kbGcH||'';UT.kbGc.style.flex=UT.kbGcF||'';UT.kbGc.scrollTop=0;}
    if(UT.kbSc){UT.kbSc.style.overflow=UT.kbScO||'';UT.kbSc.scrollTop=0;UT.kbSc=null;}
    UT.kbGc=null;UT.kbChat=null;
    document.documentElement.style.setProperty('--ut-kbb','0px');
    try{window.scrollTo(0,0);}catch(e){}
  }
}
function utKbPos(){
  var vv=window.visualViewport,b=0;
  if(vv){b=Math.max(0,Math.round(window.innerHeight-vv.height-vv.offsetTop));}
  document.documentElement.style.setProperty('--ut-kbb',b+'px');
}
document.addEventListener('focusin',function(e){
  var t=e.target;
  if(t&&t.classList&&t.classList.contains('trn-ch-in')&&t.closest('.gld-spec-chat'))utKb(true);
},true);
document.addEventListener('focusout',function(e){
  var t=e.target;
  if(t&&t.classList&&t.classList.contains('trn-ch-in')&&UT.kb)setTimeout(function(){
    var a=document.activeElement;if(!(a&&a.classList&&a.classList.contains('trn-ch-in')))utKb(false);},120);
},true);
if(window.visualViewport){window.visualViewport.addEventListener('resize',function(){if(UT.kb)utKbPos();});window.visualViewport.addEventListener('scroll',function(){if(UT.kb)utKbPos();});}
function utSpecRifai(){
  if(typeof RTD==='undefined'||!RTD.spec||RTD.ui!=='match'||CUR!=='arc'||UT.kb)return;
  if(RTD.game==='race'||RTD.game==='calcio'||!RTD.map)return;
  var b=document.getElementById('arc-body');if(!b||!b.classList.contains('ut-spec'))return;
  try{rtdCanvasInit();}catch(e){}
}
window.addEventListener('resize',function(){
  if(UT.kb)return;
  var w=window.innerWidth,h=window.innerHeight;
  if(UT.spW&&(Math.abs(w-UT.spW)>40||Math.abs(h-UT.spH)>120)){UT.spW=w;UT.spH=h;clearTimeout(UT.rsT);UT.rsT=setTimeout(utSpecRifai,250);}
});
