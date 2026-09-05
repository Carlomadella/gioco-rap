/* Didascalie della schermata «Attività criminali».

   **Perché sono scritte in casa.** Qui dentro c'erano 118 citazioni testuali
   di pezzi rap veri, con autore e titolo: liriche protette, dentro a un gioco
   che va sugli store a pagamento. Una frase di una canzone non diventa libera
   perché è corta e perché citi chi l'ha scritta — quella era la strada più
   corta per una segnalazione il giorno dell'uscita e per doverle togliere di
   corsa. Quindi sono uscite tutte.

   Al loro posto ci sono modi di dire del mondo del gioco: nostri, scritti per
   la provincia di Anni di Fame, senza nessun autore vero da citare. La firma
   sotto non è più un artista con un disco, è il posto da cui la frase arriva
   — il muro del sottopasso, il vecchio del bar, uno appena uscito. Non è un
   ripiego: una frase che il quartiere si passa da solo sta nella schermata
   della strada meglio di una barra americana famosa.

   Se ne servono altre si aggiungono qui: `q` la frase, `da` da dove arriva,
   `tags` per farla uscire al momento giusto. I tag li accende `ctx()` qui
   sotto guardando come sta andando il giro, più quelli dello sfondo che c'è
   in quel momento (`window.__CRIME_BG_TAGS`). Sono 64: il filtro tiene fuori
   le ultime 28 uscite, quindi restano sempre 36 candidate. */
"use strict";
(function(){
  const CAPTIONS = [
    {id:"c001", q:"La fame non è una scusa, è una sveglia.", da:"scritto nel sottopasso", tags:["base", "money"]},
    {id:"c002", q:"I soldi puliti si contano, quelli sporchi si pesano.", da:"un vecchio del bar", tags:["money", "dirty", "launder"]},
    {id:"c003", q:"Chi paga in contanti non chiede lo scontrino, e non lo dà.", da:"la voce del giro", tags:["money", "business", "dirty"]},
    {id:"c004", q:"Il primo che si vanta della cifra è il primo che la perde.", da:"un vecchio del bar", tags:["money", "danger", "rep"]},
    {id:"c005", q:"Non è ricco chi incassa: è ricco chi riesce a spendere.", da:"quello del banco dei pegni", tags:["money", "launder", "business"]},
    {id:"c006", q:"Un mese buono non è un lavoro. È un mese buono.", da:"tuo cugino", tags:["money", "base"]},
    {id:"c007", q:"I contanti in casa fanno rumore anche quando dormi.", da:"uno appena uscito", tags:["money", "dirty", "heat"]},
    {id:"c008", q:"Se il quartiere sa il tuo nome, lo sanno anche in questura.", da:"la voce del giro", tags:["heat", "police", "rep"]},
    {id:"c009", q:"Le volanti passano sempre due volte. La seconda non è per caso.", da:"in cortile", tags:["police", "heat", "danger"]},
    {id:"c010", q:"Il silenzio dopo una sirena dura il doppio della sirena.", da:"scritto nel sottopasso", tags:["police", "heat", "danger"]},
    {id:"c011", q:"Non è la retata che ti frega: è la settimana prima.", da:"uno appena uscito", tags:["raid", "police", "heat"]},
    {id:"c012", q:"Chi ti guarda dal balcone non ti sta salutando.", da:"in cortile", tags:["heat", "street", "danger"]},
    {id:"c013", q:"Uno che fa domande gentili se le è scritte prima.", da:"un vecchio del bar", tags:["police", "law", "danger"]},
    {id:"c014", q:"Una squadra è forte quanto il più stanco che ci sta dentro.", da:"detto in sala prove", tags:["crew", "danger"]},
    {id:"c015", q:"Chi entra per i soldi esce per i soldi.", da:"la voce del giro", tags:["crew", "money", "danger"]},
    {id:"c016", q:"Non contare gli uomini: conta quelli che rispondono alle tre di notte.", da:"tuo cugino", tags:["crew", "protection", "night"]},
    {id:"c017", q:"Il socio giusto lo riconosci dal giorno storto, non da quello buono.", da:"un vecchio del bar", tags:["crew", "rep"]},
    {id:"c018", q:"Chi parla di rispetto tutto il giorno è quello che non ne ha.", da:"in cortile", tags:["crew", "rep", "power"]},
    {id:"c019", q:"Il ferro non risolve niente: sposta il problema più avanti.", da:"uno appena uscito", tags:["gun", "danger"]},
    {id:"c020", q:"Chi tira fuori il ferro ha già finito le parole.", da:"la voce del giro", tags:["gun", "danger", "heat"]},
    {id:"c021", q:"La pistola pesa poco finché non ti fermano.", da:"uno appena uscito", tags:["gun", "heat", "law"]},
    {id:"c022", q:"Le cose brutte succedono di martedì, quando non guarda nessuno.", da:"scritto nel sottopasso", tags:["danger", "night"]},
    {id:"c023", q:"L'avvocato costa. Costa meno di un silenzio sbagliato.", da:"quello del banco dei pegni", tags:["law", "lawyer", "arrest"]},
    {id:"c024", q:"Il primo precedente è una riga. Il secondo è una storia.", da:"un vecchio del bar", tags:["precedents", "law"]},
    {id:"c025", q:"Dentro il tempo non passa: si accumula.", da:"uno appena uscito", tags:["arrest", "prison", "base"]},
    {id:"c026", q:"In cella impari due cose: aspettare e ascoltare.", da:"uno appena uscito", tags:["arrest", "prison", "base"]},
    {id:"c027", q:"Chi è uscito cambiato lo dice. Chi è cambiato si vede.", da:"in cortile", tags:["arrest", "rep"]},
    {id:"c028", q:"La firma su un verbale pesa più di una strofa.", da:"la voce del giro", tags:["law", "court", "precedents"]},
    {id:"c029", q:"Non ti condannano per quello che hai fatto, ma per quello che riescono a scrivere.", da:"un vecchio del bar", tags:["law", "court", "precedents"]},
    {id:"c030", q:"La fama in paese è un prestito: la restituisci con gli interessi.", da:"scritto nel sottopasso", tags:["rep", "city"]},
    {id:"c031", q:"Il rispetto è un affitto: si paga ogni mese.", da:"la voce del giro", tags:["rep", "power"]},
    {id:"c032", q:"Chi comanda davvero non alza mai la voce.", da:"un vecchio del bar", tags:["power", "organization", "boss"]},
    {id:"c033", q:"In alto si sta stretti: c'è posto per uno e ci provano in dieci.", da:"detto in sala prove", tags:["power", "empire", "rep"]},
    {id:"c034", q:"Ti chiamano capo il giorno che non puoi più sbagliare.", da:"la voce del giro", tags:["boss", "organization", "empire"]},
    {id:"c035", q:"Il tuo nome corre più veloce di te: arriva prima e racconta male.", da:"in cortile", tags:["rep", "city"]},
    {id:"c036", q:"Provincia: due bar, una statale, e tutti che sanno.", da:"scritto nel sottopasso", tags:["city", "base"]},
    {id:"c037", q:"Le città grandi non ti aspettano. Ti superano.", da:"detto in sala prove", tags:["city", "street"]},
    {id:"c038", q:"Sotto il cavalcavia si prova meglio che in sala: non bussa nessuno.", da:"scritto nel sottopasso", tags:["street", "base", "night"]},
    {id:"c039", q:"Il quartiere non ti perdona il successo. Ti perdona il ritorno.", da:"in cortile", tags:["city", "rep", "base"]},
    {id:"c040", q:"Un'attività vera serve a spiegare i soldi, non a farli.", da:"quello del banco dei pegni", tags:["business", "launder"]},
    {id:"c041", q:"Le carte a posto valgono più di un socio in gamba.", da:"quello del banco dei pegni", tags:["business", "law", "launder"]},
    {id:"c042", q:"Chi apre un negozio per lavare i soldi finisce per doverci lavorare.", da:"un vecchio del bar", tags:["business", "launder", "money"]},
    {id:"c043", q:"L'ordine è la cosa più illegale che puoi tenere in casa.", da:"la voce del giro", tags:["organization", "business", "launder"]},
    {id:"c044", q:"La macchina bella è una targa che ti segue ovunque.", da:"in cortile", tags:["car", "luxury", "heat"]},
    {id:"c045", q:"L'orologio si vede da lontano. Anche da chi non volevi.", da:"quello del banco dei pegni", tags:["luxury", "cash", "heat"]},
    {id:"c046", q:"Comprare per farsi vedere è pagare due volte.", da:"un vecchio del bar", tags:["luxury", "money", "base"]},
    {id:"c047", q:"Le tre di notte sono un'ora onesta: non finge nessuno.", da:"scritto nel sottopasso", tags:["night", "base"]},
    {id:"c048", q:"Di notte i conti tornano tutti. La mattina no.", da:"tuo cugino", tags:["night", "cash", "danger"]},
    {id:"c049", q:"Chi lavora di notte dorme quando lo decidono gli altri.", da:"in cortile", tags:["night", "base", "danger"]},
    {id:"c050", q:"Il colpo perfetto è quello che non racconti mai.", da:"la voce del giro", tags:["heist", "danger", "dirty"]},
    {id:"c051", q:"Le cose che vanno male vanno male in fretta.", da:"uno appena uscito", tags:["heist", "danger", "heat"]},
    {id:"c052", q:"Chi improvvisa una volta sola ha ragione una volta sola.", da:"un vecchio del bar", tags:["heist", "danger", "organization"]},
    {id:"c053", q:"Nel piano il problema non è come entri: è come esci.", da:"la voce del giro", tags:["heist", "meeting", "danger"]},
    {id:"c054", q:"La protezione non si compra: si rinnova.", da:"quello del banco dei pegni", tags:["protection", "power", "money"]},
    {id:"c055", q:"Chi ti copre le spalle vuole sapere dove le tieni.", da:"in cortile", tags:["protection", "crew", "danger"]},
    {id:"c056", q:"Chi ha fretta paga sempre il prezzo pieno.", da:"un vecchio del bar", tags:["base", "deal", "money"]},
    {id:"c057", q:"Non esistono scorciatoie: esistono strade che costano di più.", da:"scritto nel sottopasso", tags:["base", "danger"]},
    {id:"c058", q:"Un pezzo scritto bene vale un mese di parole in giro.", da:"detto in sala prove", tags:["base", "rep"]},
    {id:"c059", q:"La strada insegna in fretta, e ripete solo a chi paga.", da:"la voce del giro", tags:["base", "street", "danger"]},
    {id:"c060", q:"Chi non sa aspettare firma qualunque cosa.", da:"detto in sala prove", tags:["base", "law", "business"]},
    {id:"c061", q:"Il talento riempie il locale una volta. Il lavoro lo riempie di nuovo.", da:"detto in sala prove", tags:["base", "rep", "power"]},
    {id:"c062", q:"Puoi mentire al microfono, non al quartiere.", da:"in cortile", tags:["base", "city", "rep"]},
    {id:"c063", q:"Se hai un piano B, è quello che farai.", da:"tuo cugino", tags:["base", "power", "rep"]},
    {id:"c064", q:"Le settimane storte sono quelle che ti scrivono i pezzi migliori.", da:"detto in sala prove", tags:["base", "heat", "rep"]}
  ];
  let recent = [];
  let seenCounts = {};
  try{
    recent = JSON.parse(sessionStorage.getItem("crimeRapRecent") || "[]");
    seenCounts = JSON.parse(sessionStorage.getItem("crimeRapSeen") || "{}");
  }catch(e){ recent=[]; seenCounts={}; }

  function ctx(){
    let s = {};
    try{
      if(typeof crimeVisualState === "function") s = crimeVisualState();
      else if(typeof state !== "undefined") s = state;
    }catch(e){}
    const tags = new Set(["base"]);
    try{ for(const t of (window.__CRIME_BG_TAGS||[])) tags.add(t); }catch(e){}
    const heat = Number(s.heat||0), rep = Number(s.rep||0);
    const dirty = Number(s.dirty ?? s.sporchi ?? 0);
    const men = Number(s.men ?? s.uomini ?? 0);
    const prot = Number(s.protection ?? s.prot ?? 0);
    const city = String(s.city||"provincia").toLowerCase();
    const owned = s.owned || s.attivita || {};

    if(heat>=45) tags.add("heat");
    if(heat>=70){tags.add("police");tags.add("raid");tags.add("danger")}
    if(rep>=35) tags.add("rep");
    if(rep>=65){tags.add("power");tags.add("organization")}
    if(dirty>=1200){tags.add("money");tags.add("dirty")}
    if(dirty>=4000) tags.add("launder");
    if(men>=2) tags.add("crew");
    if(prot>=2) tags.add("protection");
    if(s.gun || s.ferro) tags.add("gun");
    if(s.lawyer || s.avvocato) tags.add("law");
    if(Number(s.precedents ?? s.precedenti ?? 0)>0){tags.add("law");tags.add("precedents")}
    if(s.arrest || s.arresto){tags.add("arrest");tags.add("law")}
    if(Object.values(owned).some(Boolean)){tags.add("business");tags.add("launder")}
    if(city!=="provincia") tags.add("city");
    if(city.includes("milano")) tags.add("organization");
    if(city.includes("los") || s.goat){tags.add("empire");tags.add("luxury");tags.add("power")}
    return tags;
  }

  function pick(){
    const active = ctx();

    // Cooldown molto più lungo: una barra appena vista non può ricomparire.
    const hardCooldown = new Set(recent.slice(-28));

    let candidates = CAPTIONS.filter(c => !hardCooldown.has(c.id));
    // Se per qualche motivo il pool filtrato diventasse troppo piccolo,
    // riduciamo gradualmente il cooldown invece di ripetere subito.
    if(candidates.length < 18){
      const softCooldown = new Set(recent.slice(-12));
      candidates = CAPTIONS.filter(c => !softCooldown.has(c.id));
    }

    const pool = candidates.map(c=>{
      let w = 1;
      let matches = 0;
      for(const t of c.tags) if(active.has(t)) matches++;
      w += matches * 1.25;

      // Le condizioni del gameplay pesano, ma non abbastanza da schiacciare
      // la varietà e far uscire sempre le stesse barre.
      if(active.has("arrest") && c.tags.includes("arrest")) w *= 1.8;
      if(active.has("heat") && c.tags.includes("heat")) w *= 1.35;
      if(active.has("power") && c.tags.includes("power")) w *= 1.25;

      // Ogni volta che una barra è già uscita nella sessione viene
      // progressivamente penalizzata.
      const seen = Number(seenCounts[c.id] || 0);
      w *= 1 / (1 + seen * 0.72);
      return [c, Math.max(.025,w)];
    });

    let total = pool.reduce((a,x)=>a+x[1],0);
    let r = Math.random()*total;
    let chosen = pool[0]?.[0] || CAPTIONS[Math.floor(Math.random()*CAPTIONS.length)];

    for(const [c,w] of pool){
      r -= w;
      if(r<=0){ chosen=c; break; }
    }

    recent.push(chosen.id);
    if(recent.length > 36) recent = recent.slice(-36);
    seenCounts[chosen.id] = Number(seenCounts[chosen.id] || 0) + 1;

    try{
      sessionStorage.setItem("crimeRapRecent", JSON.stringify(recent));
      sessionStorage.setItem("crimeRapSeen", JSON.stringify(seenCounts));
    }catch(e){}

    return chosen;
  }

  function refresh(immediate){
    const p=document.getElementById("crimeCaption");
    const a=document.getElementById("crimeCaptionSource");
    if(!p||!a) return;
    const c=pick();
    const apply=()=>{
      p.textContent=c.q;
      a.textContent=c.da ? "— "+c.da : "";
      p.classList.remove("caption-out");
      a.classList.remove("caption-out");
    };
    if(immediate){apply();return;}
    p.classList.add("caption-out");
    a.classList.add("caption-out");
    setTimeout(apply,180);
  }

  window.refreshCrimeCaption=refresh;
  refresh(true);

  const btn=document.getElementById("labCaption");
  if(btn) btn.addEventListener("click",()=>refresh(false));
})();
