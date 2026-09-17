/* Marketing V3 — campagna del singolo.

   V2 ha separato correttamente l'attesa del pezzo (`releaseHype`) dall'hype
   dell'artista (`G.hype`). V3 aggiunge la sequenza, senza inventare un secondo
   sistema di pubblicazione: Teaser -> Annuncio -> Snippet -> Drop ->
   Post-release. Drop continua a essere l'uscita vera dello Studio; snippet e
   post-release riusano le azioni gia' esistenti. */
"use strict";

(() => {
  if(window.ADF_MARKETING_V3_READY) return;
  window.ADF_MARKETING_V3_READY = true;

  const FASI = Object.freeze(["teaser", "annuncio", "snippet", "drop", "post-release", "completa"]);
  const TEASER_ATTESA = 4;
  const ANNUNCIO_ATTESA = 8;

  function marketingCampagna(s){
    if(!s || typeof s !== "object") return null;

    let c = s.marketingCampagna;
    if(!c || typeof c !== "object" || FASI.indexOf(c.fase) < 0){
      const attesa = typeof marketingReleaseHype === "function"
        ? marketingReleaseHype(s)
        : Math.max(0, Number(s.releaseHype || 0));
      const haSnippetLegacy = Math.max(0, Number(s.anteprime || 0)) > 0 || attesa > 0;

      if(s.released){
        /* Un salvataggio vecchio con un pezzo gia' fuori non deve chiedere al
           giocatore di rifare una campagna nel passato: entra direttamente
           nel passaggio post-release. */
        c = {
          fase:"post-release",
          teaser:true,
          annuncio:true,
          snippet:true,
          drop:true,
          postRelease:false
        };
      }else if(haSnippetLegacy){
        /* Prima di V3 esisteva solo la preview. Se l'avevi gia' fatta, Teaser
           e Annuncio vengono considerati assorbiti: il pezzo e' pronto al
           drop, senza rompere i salvataggi V2. */
        c = {
          fase:"drop",
          teaser:true,
          annuncio:true,
          snippet:true,
          drop:false,
          postRelease:false
        };
      }else{
        c = {
          fase:"teaser",
          teaser:false,
          annuncio:false,
          snippet:false,
          drop:false,
          postRelease:false
        };
      }
      s.marketingCampagna = c;
    }

    c.teaser = !!c.teaser;
    c.annuncio = !!c.annuncio;
    c.snippet = !!c.snippet;
    c.drop = !!c.drop;
    c.postRelease = !!c.postRelease;
    return c;
  }

  function marketingFase(s){
    const c = marketingCampagna(s);
    return c ? c.fase : null;
  }

  function marketingAvanza(s, fase){
    const c = marketingCampagna(s);
    if(!c || c.fase !== fase) return false;

    if(fase === "teaser"){
      c.teaser = true;
      c.fase = "annuncio";
      return true;
    }
    if(fase === "annuncio"){
      c.annuncio = true;
      c.fase = "snippet";
      return true;
    }
    if(fase === "snippet"){
      c.snippet = true;
      c.fase = "drop";
      return true;
    }
    if(fase === "drop"){
      if(!s.released) return false;
      c.drop = true;
      c.fase = "post-release";
      return true;
    }
    if(fase === "post-release"){
      if(!s.released) return false;
      c.postRelease = true;
      c.fase = "completa";
      return true;
    }
    return false;
  }

  function marketingSelezionatoPre(){
    return typeof studioDaAnticipare === "function" ? studioDaAnticipare() : null;
  }

  function faseNeed(nome){
    const s = marketingSelezionatoPre();
    if(!s) return "un pezzo non ancora fuori scelto su LaFamegram";
    return marketingFase(s) === nome ? null : "prima completa il passaggio precedente";
  }

  const teaserAction = {
    id:"mkt_teaser",
    n:"Pubblica teaser",
    e:4,
    d:"Fai capire che sta arrivando qualcosa, senza ancora far sentire il pezzo.",
    avail:() => {
      const s = marketingSelezionatoPre();
      return !!s && marketingFase(s) === "teaser";
    },
    need:() => faseNeed("teaser"),
    give:() => "+" + TEASER_ATTESA + " attesa pezzo",
    run(){
      const s = marketingSelezionatoPre();
      if(!s || marketingFase(s) !== "teaser") return "";
      const attesa = marketingAggiungiReleaseHype(s, TEASER_ATTESA);
      marketingAvanza(s, "teaser");
      return "Teaser di «" + s.t + "» pubblicato: attesa " + Math.round(attesa) + "/100.";
    }
  };

  const annuncioAction = {
    id:"mkt_annuncio",
    n:"Annuncia il pezzo",
    e:6,
    d:"Titolo, copertina e promessa: ora la gente sa cosa deve aspettare.",
    avail:() => {
      const s = marketingSelezionatoPre();
      return !!s && marketingFase(s) === "annuncio";
    },
    need:() => faseNeed("annuncio"),
    give:() => "+" + ANNUNCIO_ATTESA + " attesa pezzo",
    run(){
      const s = marketingSelezionatoPre();
      if(!s || marketingFase(s) !== "annuncio") return "";
      const attesa = marketingAggiungiReleaseHype(s, ANNUNCIO_ATTESA);
      marketingAvanza(s, "annuncio");
      return "Hai annunciato «" + s.t + "»: attesa " + Math.round(attesa) + "/100.";
    }
  };

  /* Le due nuove mosse entrano nello stesso motore ACTIONS: energia, carcere,
     pending e salvataggio continuano quindi a passare dalle guardie normali. */
  if(typeof ACTIONS !== "undefined"){
    if(!ACTIONS.some(a => a.id === teaserAction.id)) ACTIONS.push(teaserAction);
    if(!ACTIONS.some(a => a.id === annuncioAction.id)) ACTIONS.push(annuncioAction);

    const anteprima = ACTIONS.find(a => a.id === "anteprima");
    if(anteprima && !anteprima._marketingV3){
      anteprima._marketingV3 = true;
      const needV2 = anteprima.need;
      const runV2 = anteprima.run;

      anteprima.need = function(){
        const s = marketingSelezionatoPre();
        if(s){
          const f = marketingFase(s);
          if(f === "teaser") return "prima pubblica il teaser";
          if(f === "annuncio") return "prima annuncia il pezzo";
        }
        return typeof needV2 === "function" ? needV2.apply(this, arguments) : null;
      };

      anteprima.run = function(){
        const s = marketingSelezionatoPre();
        const prima = s ? marketingFase(s) : null;
        const nPrima = s ? Number(s.anteprime || 0) : 0;
        const out = runV2.apply(this, arguments);
        if(s && prima === "snippet" && Number(s.anteprime || 0) > nPrima)
          marketingAvanza(s, "snippet");
        return out;
      };
    }

    const promo = ACTIONS.find(a => a.id === "promo");
    if(promo && !promo._marketingV3){
      promo._marketingV3 = true;
      const runV2 = promo.run;
      promo.run = function(){
        const s = typeof studioDaSpingere === "function" ? studioDaSpingere() : null;
        const prima = s ? marketingFase(s) : null;
        const out = runV2.apply(this, arguments);
        if(s && prima === "post-release") marketingAvanza(s, "post-release");
        return out;
      };
    }
  }

  /* Il drop non diventa un bottone social: resta la pubblicazione vera dello
     Studio. Agganciamo solo il cambio di fase quando quel passaggio avviene. */
  if(typeof anteprimeAllUscita === "function"){
    const uscitaV2 = anteprimeAllUscita;
    anteprimeAllUscita = function(s){
      const out = uscitaV2.apply(this, arguments);
      if(s && s.released && marketingFase(s) === "drop") marketingAvanza(s, "drop");
      return out;
    };
    window.anteprimeAllUscita = anteprimeAllUscita;
  }

  function marketingTelefonoConfig(ant, ultimo){
    if(ant){
      const fase = marketingFase(ant);
      const attesa = marketingReleaseHype(ant);
      const fatte = Math.max(0, Number(ant.anteprime || 0));
      const maxPreview = typeof ADF_ANTEPRIME_MAX === "number" ? ADF_ANTEPRIME_MAX : 3;

      if(fase === "teaser") return {
        azione:"mkt_teaser",
        bottone:"Pubblica teaser",
        intro:"Prima cosa: <b>teaser</b>. Fai capire che sta arrivando qualcosa, senza ancora far sentire il pezzo.",
        stato:"Campagna 1/5 · Teaser · attesa <b>" + Math.round(attesa) + "/100</b> → <b>" +
          Math.round(Math.min(100, attesa + TEASER_ATTESA)) + "/100</b>"
      };
      if(fase === "annuncio") return {
        azione:"mkt_annuncio",
        bottone:"Annuncia il pezzo",
        intro:"Il teaser ha aperto la porta. Ora <b>annuncia il pezzo</b>: titolo, copertina e promessa.",
        stato:"Campagna 2/5 · Annuncio · attesa <b>" + Math.round(attesa) + "/100</b> → <b>" +
          Math.round(Math.min(100, attesa + ANNUNCIO_ATTESA)) + "/100</b>"
      };
      if(fase === "snippet") return {
        azione:"anteprima",
        bottone:"Fai uscire una preview",
        intro:"Adesso fai sentire <b>quindici secondi</b>. Lo snippet muove anche l'hype dell'artista, oltre all'attesa del singolo.",
        stato:"Campagna 3/5 · Snippet · attesa pezzo <b>" + Math.round(attesa) + "/100</b>"
      };
      if(fase === "drop") return {
        azione:"anteprima",
        bottone:fatte < maxPreview ? "Altro snippet" : "Pronto al drop",
        intro:"<b>Pronto al drop.</b> Il prossimo passaggio vero è pubblicarlo dallo Studio. Se vuoi, prima puoi ancora far sentire un altro snippet.",
        stato:"Campagna 4/5 · Drop · attesa <b>" + Math.round(attesa) + "/100</b> · partenza <b>" +
          Math.round(100 + attesa) + "%</b>"
      };
    }

    if(ultimo){
      const fase = marketingFase(ultimo);
      if(fase === "post-release") return {
        azione:"promo",
        bottone:"Post-release",
        intro:"Il pezzo è fuori. Ora serve il <b>post-release</b>: una clip che rimetta il brano davanti a chi l'ha visto passare.",
        stato:"Campagna 5/5 · Post-release"
      };
      if(fase === "completa") return {
        azione:"promo",
        bottone:"Posta",
        intro:"<b>Campagna completata.</b> Da qui in poi ogni post è promo normale: continua a spingere il pezzo, ma la sequenza di lancio è chiusa.",
        stato:"Campagna completata · promo libera"
      };
    }
    return null;
  }

  window.marketingCampagna = marketingCampagna;
  window.marketingFase = marketingFase;
  window.marketingAvanza = marketingAvanza;
  window.marketingTelefonoConfig = marketingTelefonoConfig;
})();
