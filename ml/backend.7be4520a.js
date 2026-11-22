(function(){
  "use strict";
  function base(){ try{ return typeof BACKEND !== "undefined" ? BACKEND : ""; }catch(e){ return ""; } }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; }); }
  function primo(t){
    var cc = (t && t.canali) || [], i;
    for(i = 0; i < cc.length; i++) if(cc[i] && cc[i].id && cc[i].foto) return cc[i];
    return null;
  }
  function badge(t){
    var c = primo(t);
    if(!c) return "";
    return '<div class="tico"><img src="' + esc(base() + "/tournament/canale_foto/" + encodeURIComponent(c.id) + ".jpg?v=" + c.foto)
      + '" alt="" onerror="this.parentNode.style.display=\'none\'"></div>';
  }
  function innesta(h, t){
    try{
      var b = badge(t);
      if(!b || h.indexOf('class="tico"') >= 0) return h;
      var k = h.indexOf('<div class="ut-tc-ic">');
      if(k < 0) return h;
      var e = h.indexOf("</div>", k);
      if(e < 0) return h;
      e += 6;
      return h.slice(0, e) + b + h.slice(e);
    }catch(x){ return h; }
  }
  function avvolgi(nome){
    var f = window[nome];
    if(typeof f !== "function" || f.__tico) return;
    var w = function(t){ return innesta(f.apply(this, arguments), t); };
    w.__tico = true;
    for(var k in f) if(Object.prototype.hasOwnProperty.call(f, k)) w[k] = f[k];
    window[nome] = w;
  }
  avvolgi("utUpCard");
  avvolgi("utHubCur");
  if(typeof window.trnDetRender === "function" && !window.trnDetRender.__tico){
    var _det = window.trnDetRender;
    window.trnDetRender = function(){
      var r = _det.apply(this, arguments);
      try{
        var f = (typeof trnDetFind === "function") ? trnDetFind() : null;
        var el = document.getElementById("trn-body");
        if(f && f.t && el){
          var art = el.querySelector(".ut-hero .ut-tc-art");
          if(art && !art.querySelector(".tico")){
            var b = badge(f.t);
            if(b) art.insertAdjacentHTML("beforeend", b);
          }
        }
      }catch(e){}
      return r;
    };
    window.trnDetRender.__tico = true;
  }
})();
