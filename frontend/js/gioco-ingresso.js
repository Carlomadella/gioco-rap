/* L'ingresso in partita — Anni di Fame.

   Punto 27: la landing è una pagina a parte, e questa è la porta di quella del
   gioco. Prima non serviva a niente di tutto questo, perché «entrare» voleva
   dire togliere una classe a una <section> e tutto lo stato era già lì, in
   memoria, dall'altra schermata. Adesso fra le due c'è un caricamento vero.

     (niente)             riprendi la carriera dello slot attivo → la città
     ?vai=profilo         apri il tuo artista
     ?vai=classifiche     entra e apri le classifiche
     ?nuova=rapido        preset MakeHuman uomo casuale + RPG automatico + cinematic
     ?nuova=creatore      apri il creator normale

   Il creator approvato resta proprietario di RPG, profilo e cinematic.
*/
"use strict";

(() => {
  const q = new URLSearchParams(location.search);
  const vai = q.get("vai") || "";
  const nuova = q.get("nuova") || "";

  /* ADF_SLOT_NO_OVERWRITE_V1 */
  function annullaNuovoSlot(){
    if(!nuova || (A && A.name && A.name.trim())) return false;
    try{
      localStorage.removeItem(CHIAVE_ARTISTA());
      localStorage.removeItem(CHIAVE_PARTITA());
      return true;
    }catch(e){
      console.error("[ADF] Pulizia slot provvisorio fallita",e);
      return false;
    }
  }

  window.ADF_ANNULLA_NUOVO_SLOT = annullaNuovoSlot;

  function audioPregame(){
    if(!window.ADF_AUDIO) return;
    ADF_AUDIO.setMode("pregame");
    if(ADF_AUDIO.music) ADF_AUDIO.music.ensureMenu();
  }

  function pulisci(){
    try{
      history.replaceState(null, "", location.pathname);
    }catch(e){}
  }

  function entraInCitta(){
    if(window.GAME) window.GAME.enter();

    if(
      G.strada &&
      G.strada.arresto &&
      typeof window.apriCarcere === "function"
    ){
      setTimeout(
        () => window.apriCarcere({
          direct:true,
          reason:"resume"
        }),
        0
      );
    }
  }

  /* -------------------------------------------------------
     Accesso sicuro al creator iframe.
     Non modifichiamo bridge o creator.html.
     ------------------------------------------------------- */

  function frameCreator(){
    return document.getElementById("adf-rpg-v24-frame");
  }

  function eseguiNelCreator(frame, codice){
    const doc = frame && frame.contentDocument;
    if(!doc) return false;

    const script = doc.createElement("script");
    script.textContent = codice;

    (doc.body || doc.documentElement).appendChild(script);
    script.remove();

    return true;
  }

  function quandoCreatorPronto(frameAtteso, callback, tentativo){
    tentativo = tentativo || 0;

    /* Il bridge distrugge l'iframe a ogni chiusura. Un retry nato per una
       sessione non deve mai agganciarsi al frame creato da quella seguente. */
    if(!frameAtteso || frameCreator() !== frameAtteso) return;

    try{
      if(
        frameAtteso.contentDocument &&
        frameAtteso.contentWindow &&
        typeof frameAtteso.contentWindow.playCareerIntro === "function"
      ){
        callback(frameAtteso);
        return;
      }
    }catch(e){}

    if(tentativo >= 120){
      console.error("[ADF] Creator RPG: caricamento non completato.");
      return;
    }

    setTimeout(
      () => quandoCreatorPronto(frameAtteso, callback, tentativo + 1),
      50
    );
  }

  /* -------------------------------------------------------
     AVVIO RAPIDO + MAKEHUMAN

     Il creator resta nascosto mentre MakeHuman applica un preset
     maschile reale e genera la propic. Nome, città, genere, storia
     e cinematic restano quelli dell'avvio rapido già approvato.
     ------------------------------------------------------- */

  function completaProfiloRapido(frame, rapido){
    const payload = JSON.stringify(rapido);

    const codice = `
      (() => {
        const rapido = ${payload};

        state.name = rapido.name;
        state.city = rapido.city;

        /* STESSI generi del creator normale. */
        state.genre =
          GENRES[
            Math.floor(Math.random() * GENRES.length)
          ].id;

        /* STESSE 3 domande e risposte canoniche. */
        state.answers =
          STORY.map(scene =>
            scene.choices[
              Math.floor(
                Math.random() * scene.choices.length
              )
            ]
          );

        $('name').value = state.name;
        $('city').value = state.city;

        renderAvatarSource();
        renderGenres();
        validateIdentity();

        /* Stesso trigger audio della nuova partita normale. */
        try{
          if(window.parent !== window){
            window.parent.postMessage({
              type:'adf-rpg-v24-career-intro-start'
            }, '*');
          }
        }catch(e){}

        /* STESSA cinematic già approvata. */
        window.playCareerIntro();
      })();
    `;

    return eseguiNelCreator(frame, codice);
  }

  function richiediMakeHumanRapido(frame, rapido){
    let concluso = false;

    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(timeout);
    };

    const fallisci = message => {
      if(concluso) return;
      concluso = true;
      cleanup();

      if(frameCreator() === frame){
        frame.style.visibility = "";
      }

      console.error(
        "[ADF] Avvio rapido MakeHuman:",
        message || "generazione personaggio fallita."
      );
    };

    const onMessage = e => {
      if(!frame?.contentWindow || e.source !== frame.contentWindow) return;
      const msg = e.data || {};

      if(msg.type === "adf-rpg-v24-quick-makehuman-error"){
        fallisci(msg.message || "errore MakeHuman.");
        return;
      }

      if(msg.type !== "adf-rpg-v24-quick-makehuman-ready") return;

      if(concluso) return;
      concluso = true;
      cleanup();

      /* Se la sessione è cambiata, non completiamo il creator nuovo. */
      if(frameCreator() !== frame) return;

      if(!completaProfiloRapido(frame, rapido)){
        frame.style.visibility = "";
        console.error(
          "[ADF] Avvio rapido: impossibile completare identità/RPG nel creator."
        );
        return;
      }

      /* La cinematic è già partita prima che il frame torni visibile. */
      frame.style.visibility = "";
    };

    window.addEventListener("message", onMessage);

    const timeout = setTimeout(
      () => fallisci("timeout generazione preset MakeHuman."),
      120000
    );

    try{
      frame.contentWindow.postMessage({
        type:"adf-rpg-v24-quick-makehuman"
      },"*");
    }catch(e){
      fallisci(e?.message || "postMessage MakeHuman fallito.");
    }
  }

  /* -------------------------------------------------------
     Creator normale
     ------------------------------------------------------- */

  function creatorePoiCitta(){
    audioPregame();

    window.__ADF_DOPO_CREAZIONE = entraInCitta;

    const indietro = $("to-menu");

    if(indietro){
      indietro.addEventListener(
        "click",
        () => {
          if(A.name.trim()) return;
          annullaNuovoSlot();
        },
        true
      );
    }

    if(
      window.ADF_RPG_V24 &&
      typeof window.ADF_RPG_V24.open === "function"
    ){
      window.ADF_RPG_V24.open();

      const frame = frameCreator();

      /* Evita di mostrare per un istante la scritta
         "Editor locale" prima della sostituzione. */
      if(frame) frame.style.visibility = "hidden";

      quandoCreatorPronto(frame, f => {
        /* Nel flusso normale non installiamo più il placeholder:
           il creator apre davvero Avaturn oppure MakeHuman. */
        f.style.visibility = "";
      });

      return;
    }

    console.error("[ADF] Nuova partita: creator RPG non disponibile.");
    return;
  }

  /* -------------------------------------------------------
     AVVIO RAPIDO
     ------------------------------------------------------- */

  function scegli(lista){
    return lista[
      Math.floor(Math.random() * lista.length)
    ];
  }

  function normalizzaNomeArtista(value){
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  }

  function combinazioneNomeValida(nome, secondoNome){
    const a = normalizzaNomeArtista(nome);
    const b = normalizzaNomeArtista(secondoNome);

    if(!a || !b || a === b) return false;

    if(
      a.length >= 4 &&
      b.length >= 4 &&
      a.slice(0,3) === b.slice(0,3)
    ){
      return false;
    }

    return true;
  }

  function generaNomeArtista(nomi, secondiNomi){
    for(let tentativo = 0; tentativo < 24; tentativo++){
      const nome = scegli(nomi);
      const secondoNome = scegli(secondiNomi);

      if(combinazioneNomeValida(nome, secondoNome)){
        return nome + " " + secondoNome;
      }
    }

    return scegli(nomi) + " " + scegli(secondiNomi);
  }

  function datiRapidi(){
    const nomi = [
      "Nico","Sami","Rami","Miro","Kiro","Lio","Neri","Santi",
      "Alek","Teo","Dario","Milo","Tano","Reno","Riky","Elia",
      "Vito","Samu","Dani","Manu","Edo","Gio","Loris","Matti",
      "Tomi","Ivo","Riko","Nilo","Lele","Fede","Lenny","Yari",
      "Ema","Mavi","Nox","Koda","Zeno","Ruen","Simo","Vale"
    ];

    const secondiNomi = [
      "Montana","Santana","Carter","Banks","Kane","Stone","Miles","Saint",
      "Vega","Cruz","Mendez","Leone","Riva","Costa","Ferri","Valente",
      "Serra","Mason","Hayes","Reyes","Torres","Salazar","Navarro","Moreno",
      "Cortez","Silva","Ventura","Mercer","Knox","Monroe","Savoy","Melo",
      "Rocco","Vitale","Moretti","Fontana","Romano","Marino","Greco","Russo",
      "De Luca","Valli","Cole","West","Lennox","Gallo","De Santis","Santos",
      "Mora","Velas"
    ];

    /* ADF_QUICKSTART_LOCALITA_V2
       200 comuni piccoli, 10 per regione nella selezione editoriale.
       La regione non viene salvata. La provincia resta accoppiata al comune
       nel pool e viene mostrata usando il contratto city già esistente. */
    const citta = [
      {city:"Orta San Giulio",province:"NO"},
      {city:"Barolo",province:"CN"},
      {city:"La Morra",province:"CN"},
      {city:"Neive",province:"CN"},
      {city:"Serralunga d'Alba",province:"CN"},
      {city:"Cocconato",province:"AT"},
      {city:"Usseaux",province:"TO"},
      {city:"Fenestrelle",province:"TO"},
      {city:"Macugnaga",province:"VB"},
      {city:"Vogogna",province:"VB"},
      {city:"Courmayeur",province:"AO"},
      {city:"Saint-Vincent",province:"AO"},
      {city:"Cogne",province:"AO"},
      {city:"La Thuile",province:"AO"},
      {city:"Gressoney-Saint-Jean",province:"AO"},
      {city:"Ayas",province:"AO"},
      {city:"Valtournenche",province:"AO"},
      {city:"Pré-Saint-Didier",province:"AO"},
      {city:"Morgex",province:"AO"},
      {city:"Fénis",province:"AO"},
      {city:"Varenna",province:"LC"},
      {city:"Bellagio",province:"CO"},
      {city:"Tremezzina",province:"CO"},
      {city:"Lovere",province:"BG"},
      {city:"Sirmione",province:"BS"},
      {city:"Bormio",province:"SO"},
      {city:"Livigno",province:"SO"},
      {city:"Bienno",province:"BS"},
      {city:"Monte Isola",province:"BS"},
      {city:"Morimondo",province:"MI"},
      {city:"Canazei",province:"TN"},
      {city:"Moena",province:"TN"},
      {city:"Ortisei",province:"BZ"},
      {city:"Selva di Val Gardena",province:"BZ"},
      {city:"San Candido",province:"BZ"},
      {city:"Dobbiaco",province:"BZ"},
      {city:"Corvara in Badia",province:"BZ"},
      {city:"Molveno",province:"TN"},
      {city:"Pinzolo",province:"TN"},
      {city:"Mezzano",province:"TN"},
      {city:"Arquà Petrarca",province:"PD"},
      {city:"Asolo",province:"TV"},
      {city:"Malcesine",province:"VR"},
      {city:"Lazise",province:"VR"},
      {city:"Bardolino",province:"VR"},
      {city:"Soave",province:"VR"},
      {city:"Cison di Valmarino",province:"TV"},
      {city:"Follina",province:"TV"},
      {city:"Recoaro Terme",province:"VI"},
      {city:"Alleghe",province:"BL"},
      {city:"Sappada",province:"UD"},
      {city:"Venzone",province:"UD"},
      {city:"Tarvisio",province:"UD"},
      {city:"Grado",province:"GO"},
      {city:"Duino Aurisina",province:"TS"},
      {city:"San Daniele del Friuli",province:"UD"},
      {city:"Palmanova",province:"UD"},
      {city:"Aquileia",province:"UD"},
      {city:"Forni di Sopra",province:"UD"},
      {city:"Sutrio",province:"UD"},
      {city:"Portofino",province:"GE"},
      {city:"Camogli",province:"GE"},
      {city:"Noli",province:"SV"},
      {city:"Dolceacqua",province:"IM"},
      {city:"Apricale",province:"IM"},
      {city:"Pigna",province:"IM"},
      {city:"Vernazza",province:"SP"},
      {city:"Riomaggiore",province:"SP"},
      {city:"Monterosso al Mare",province:"SP"},
      {city:"Cervo",province:"IM"},
      {city:"Bobbio",province:"PC"},
      {city:"Brisighella",province:"RA"},
      {city:"Castell'Arquato",province:"PC"},
      {city:"Dozza",province:"BO"},
      {city:"Compiano",province:"PR"},
      {city:"Berceto",province:"PR"},
      {city:"Montegridolfo",province:"RN"},
      {city:"San Leo",province:"RN"},
      {city:"Pennabilli",province:"RN"},
      {city:"Sestola",province:"MO"},
      {city:"Pienza",province:"SI"},
      {city:"Pitigliano",province:"GR"},
      {city:"San Quirico d'Orcia",province:"SI"},
      {city:"Montalcino",province:"SI"},
      {city:"Castiglione d'Orcia",province:"SI"},
      {city:"Capalbio",province:"GR"},
      {city:"Suvereto",province:"LI"},
      {city:"Montescudaio",province:"PI"},
      {city:"Radicofani",province:"SI"},
      {city:"Anghiari",province:"AR"},
      {city:"Bevagna",province:"PG"},
      {city:"Spello",province:"PG"},
      {city:"Montefalco",province:"PG"},
      {city:"Norcia",province:"PG"},
      {city:"Scheggino",province:"PG"},
      {city:"Vallo di Nera",province:"PG"},
      {city:"Arrone",province:"TR"},
      {city:"Ferentillo",province:"TR"},
      {city:"Panicale",province:"PG"},
      {city:"Paciano",province:"PG"},
      {city:"Gradara",province:"PU"},
      {city:"Offagna",province:"AN"},
      {city:"Corinaldo",province:"AN"},
      {city:"Mondavio",province:"PU"},
      {city:"Frontino",province:"PU"},
      {city:"Sarnano",province:"MC"},
      {city:"Visso",province:"MC"},
      {city:"Montecassiano",province:"MC"},
      {city:"Montefiore dell'Aso",province:"AP"},
      {city:"Moresco",province:"FM"},
      {city:"Sperlonga",province:"LT"},
      {city:"Subiaco",province:"RM"},
      {city:"Castel Gandolfo",province:"RM"},
      {city:"Nemi",province:"RM"},
      {city:"Caprarola",province:"VT"},
      {city:"Bagnoregio",province:"VT"},
      {city:"Bolsena",province:"VT"},
      {city:"Calcata",province:"VT"},
      {city:"Arpino",province:"FR"},
      {city:"Greccio",province:"RI"},
      {city:"Scanno",province:"AQ"},
      {city:"Pescocostanzo",province:"AQ"},
      {city:"Santo Stefano di Sessanio",province:"AQ"},
      {city:"Pacentro",province:"AQ"},
      {city:"Caramanico Terme",province:"PE"},
      {city:"Civitella del Tronto",province:"TE"},
      {city:"Guardiagrele",province:"CH"},
      {city:"Opi",province:"AQ"},
      {city:"Rocca San Giovanni",province:"CH"},
      {city:"Castel del Monte",province:"AQ"},
      {city:"Agnone",province:"IS"},
      {city:"Frosolone",province:"IS"},
      {city:"Bagnoli del Trigno",province:"IS"},
      {city:"Sepino",province:"CB"},
      {city:"Oratino",province:"CB"},
      {city:"Fornelli",province:"IS"},
      {city:"Scapoli",province:"IS"},
      {city:"Castelpetroso",province:"IS"},
      {city:"Riccia",province:"CB"},
      {city:"Larino",province:"CB"},
      {city:"Positano",province:"SA"},
      {city:"Ravello",province:"SA"},
      {city:"Atrani",province:"SA"},
      {city:"Amalfi",province:"SA"},
      {city:"Cetara",province:"SA"},
      {city:"Castellabate",province:"SA"},
      {city:"Nusco",province:"AV"},
      {city:"Zungoli",province:"AV"},
      {city:"Conza della Campania",province:"AV"},
      {city:"Monteverde",province:"AV"},
      {city:"Otranto",province:"LE"},
      {city:"Peschici",province:"FG"},
      {city:"Vico del Gargano",province:"FG"},
      {city:"Bovino",province:"FG"},
      {city:"Pietramontecorvino",province:"FG"},
      {city:"Specchia",province:"LE"},
      {city:"Presicce-Acquarica",province:"LE"},
      {city:"Cursi",province:"LE"},
      {city:"Melpignano",province:"LE"},
      {city:"Roseto Valfortore",province:"FG"},
      {city:"Castelmezzano",province:"PZ"},
      {city:"Pietrapertosa",province:"PZ"},
      {city:"Tursi",province:"MT"},
      {city:"Rotonda",province:"PZ"},
      {city:"Viggianello",province:"PZ"},
      {city:"Guardia Perticara",province:"PZ"},
      {city:"Aliano",province:"MT"},
      {city:"Craco",province:"MT"},
      {city:"Acerenza",province:"PZ"},
      {city:"Irsina",province:"MT"},
      {city:"Scilla",province:"RC"},
      {city:"Gerace",province:"RC"},
      {city:"Tropea",province:"VV"},
      {city:"Pizzo",province:"VV"},
      {city:"Morano Calabro",province:"CS"},
      {city:"Civita",province:"CS"},
      {city:"Bova",province:"RC"},
      {city:"Stilo",province:"RC"},
      {city:"Altomonte",province:"CS"},
      {city:"Badolato",province:"CZ"},
      {city:"Savoca",province:"ME"},
      {city:"Castelmola",province:"ME"},
      {city:"Montalbano Elicona",province:"ME"},
      {city:"Novara di Sicilia",province:"ME"},
      {city:"Petralia Soprana",province:"PA"},
      {city:"Petralia Sottana",province:"PA"},
      {city:"Gangi",province:"PA"},
      {city:"Sambuca di Sicilia",province:"AG"},
      {city:"Sutera",province:"CL"},
      {city:"Ferla",province:"SR"},
      {city:"Bosa",province:"OR"},
      {city:"Carloforte",province:"SU"},
      {city:"Castelsardo",province:"SS"},
      {city:"Orgosolo",province:"NU"},
      {city:"Mamoiada",province:"NU"},
      {city:"Gavoi",province:"NU"},
      {city:"Fonni",province:"NU"},
      {city:"Posada",province:"NU"},
      {city:"Atzara",province:"NU"},
      {city:"San Sperate",province:"SU"}
    ];

    const provenienza = scegli(citta);

    return {
      name: generaNomeArtista(nomi, secondiNomi),
      city: provenienza.city + " (" + provenienza.province + ")"
    };
  }

  /* ADF_CREATOR_RANDOM_IDENTITY_V1
     Il creator normale pesca dagli stessi generatori dell'Avvio rapido.
     Nessun secondo pool: nome e città restano una sola fonte di verità. */
  window.ADF_CREATOR_RANDOM_FIELD = function(field){
    const rapido = datiRapidi();
    if(field === "name") return rapido.name;
    if(field === "city") return rapido.city;
    return "";
  };

  function avvioRapido(){
    audioPregame();

    window.__ADF_DOPO_CREAZIONE = entraInCitta;

    if(
      !window.ADF_RPG_V24 ||
      typeof window.ADF_RPG_V24.open !== "function"
    ){
      console.error(
        "[ADF] Avvio rapido: creator RPG non disponibile."
      );
      return;
    }

    const rapido = datiRapidi();

    window.ADF_RPG_V24.open();

    const frame = frameCreator();

    /* Nessun flash di avatar / identità / RPG. */
    if(frame) frame.style.visibility = "hidden";

    quandoCreatorPronto(frame, f => {
      /* Niente placeholder: chiediamo al creator un MakeHuman reale.
         Nome/città/RPG/cinematic vengono completati solo dopo che il
         preset e la propic sono pronti. */
      richiediMakeHumanRapido(f, rapido);
    });
  }

  /* ------------------------------------------------------- */

  pulisci();

  if(nuova === "rapido"){
    avvioRapido();
    return;
  }

  if(nuova === "creatore"){
    creatorePoiCitta();
    return;
  }

  if(vai === "profilo"){
    /* Il tuo artista modifica l'aspetto sopra la partita reale.
       Entriamo una sola volta nel gameplay PRIMA di aprire l'editor:
       quando l'editor si chiude, sotto c'è già la città e non serve un
       secondo GAME.enter(). */
    entraInCitta();

    if(
      window.ADF_RPG_V24 &&
      typeof window.ADF_RPG_V24.openAppearance === "function"
    ){
      window.ADF_RPG_V24.openAppearance();
    }else{
      console.error("[ADF] Il tuo artista: editor aspetto non disponibile.");
    }
    return;
  }

  if(vai === "classifiche"){
    entraInCitta();

    if(typeof telVaiApp === "function"){
      setTimeout(
        () => telVaiApp("classifiche"),
        60
      );
    }

    return;
  }

  entraInCitta();
})();
