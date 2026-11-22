(function(){
  var en=(window.GB_LANG==="en");
  try{
    if(typeof RTD_G!=="undefined"&&RTD_G&&!RTD_G.deadmoney){
      RTD_G.deadmoney={title:"💀 DEAD MONEY",color:"#e2364a",input:"deadmoney",maxP:8,minP:3,
        hero:"DEAD MONEY",sub:en?"The quiz to the last chip: miss one and you go to the Debt Room":"Il quiz all'ultima fiche: sbagli e scendi nella Sala del Debito",
        rules:en?[["❓","Nine questions","four answers, 20 seconds: right = +1000 chips"],
                  ["💀","The Debt Room","28 rooms of minigames: whoever loses dies and plays on as a soul"],
                  ["🚪","The Escape","whoever gets out of the door takes the pot (5% to the house; with 6+ players 20% to the Gravedigger)"]]
                :[["❓","Nove domande","quattro risposte, 20 secondi: giusta = +1000 fiche"],
                  ["💀","La Sala del Debito","28 sale di minigiochi: chi perde muore e continua da anima"],
                  ["🚪","La Fuga","chi esce dalla porta prende il piatto (5% alla casa; da 6 giocatori il 20% al Becchino)"]]};
    }
  }catch(e){}
  try{
    if(typeof LOB_GAMES!=="undefined"&&typeof lobG==="function"&&!lobG("deadmoney")){
      var k=LOB_GAMES.length;
      for(var i=0;i<LOB_GAMES.length;i++){if(LOB_GAMES[i][0]==="geo"){k=i+1;break;}}
      LOB_GAMES.splice(k,0,["deadmoney","💀","DEAD MONEY","B",3,8,1]);
    }
  }catch(e){}
  try{if(typeof GB_DEEP_RTD!=="undefined")GB_DEEP_RTD.deadmoney=1;}catch(e){}
  try{if(typeof UT_TINTE!=="undefined")UT_TINTE.deadmoney=["#7d0f1f","#0b0806"];}catch(e){}
  try{if(typeof UT_ART_CLS!=="undefined")UT_ART_CLS.deadmoney="tw-mega dm-mega";}catch(e){}
  try{
    if(typeof trnGC==="function"&&!trnGC.deadmoney){
      var v0=trnGC;
      trnGC=function(g){if(g==="deadmoney")return {icon:"💀",watch:false,rtd:true};return v0.apply(this,arguments);};
      trnGC.deadmoney=1;
    }
  }catch(e){}
  try{
    if(typeof lobPostiDefault==="function"&&!lobPostiDefault.deadmoney){
      var v1=lobPostiDefault;
      lobPostiDefault=function(g){if(g&&g[0]==="deadmoney")return 6;return v1.apply(this,arguments);};
      lobPostiDefault.deadmoney=1;
    }
  }catch(e){}
  try{
    if(en){
      var c=document.querySelector("#duel .tw-mega.dm-mega .tw-mega-sub");
      if(c)c.textContent="The quiz where wrong answers kill: whoever escapes takes the pot";
      var b=document.querySelector("#duel .tw-mega.dm-mega .tw-mega-badge");
      if(b)b.textContent="💀 3 TO 8 · ONLY THE SURVIVOR CASHES IN";
      var d=document.querySelector("#duel .tw-mega.dm-mega .tw-dat span");
      if(d)d.textContent="SEATS";
    }
  }catch(e){}
})();
