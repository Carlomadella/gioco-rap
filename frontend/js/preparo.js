/* PREPARO IL TUO ARTISTA — la schermata dell'avvio rapido mentre MakeHuman lavora.

   «L'avvio rapido ci mette quasi due minuti, e nessuno lo dice al giocatore»
   (problemi-riscontrati, 13/09/2026). Dal 12/09 l'avvio rapido non mette più un
   avatar finto: apre il creator nascosto, questo apre il camerino MakeHuman,
   che scarica un modello del corpo da 145 MB (`targets.bin`), costruisce il
   personaggio, sceglie un preset e scatta la foto. Su Chrome vero, con la
   scheda video, sono 9 secondi dal clic alla cinematic (19/09/2026); nel
   browser senza GPU delle prove automatiche — che disegna il 3D a software —
   sono 60–115, ed è da lì che veniva il «quasi due minuti». In tutti e due i
   casi, prima di questa schermata, non si muoveva niente: il caricamento della
   pagina se n'era andato, il creator era nascosto apposta, restava un
   rettangolo nero.

   Questa è la schermata che sta al posto del rettangolo. Dice cosa sta
   succedendo con le parole vere della catena — le fasi le mandano il camerino
   (`setStatus`, runtime.js) e il motore dei modifier (`log`,
   modifier-engine.html), il creator le rilancia al gioco
   (`adf-rpg-v24-quick-makehuman-progress`) e js/gioco-ingresso.js le passa
   qui — e conta il tempo che passa. La barra è a tacche, una per fase, non
   una percentuale: la percentuale vera (quanti dei 145 MB sono arrivati) il
   motore non la sa, e una inventata è quella bugia piccola che si vede la
   prima volta che si pianta a metà (vedi #avvio in css/servizio.css).

   Se qualcosa va storto, non si resta davanti al nero: si dice cos'è successo
   e si offre di riprovare, di fare il personaggio a mano o di tornare al menu.
   Sta sopra al creator (999999) perché il creator è proprio la cosa che si
   nasconde. File suo, come chiede la regola dei punti che non sono fix; il
   gioco lo usa da `window.ADF_PREPARO`. */
"use strict";

(() => {
  /* Le fasi della catena, nell'ordine in cui arrivano, con il pezzo di testo
     che le riconosce nel messaggio grezzo (i messaggi restano quelli del
     camerino, in italiano, ma con «modifier stack nativo» dentro non si
     mettono sotto a un titolo). L'indice è la tacca della barra. */
  const FASI = [
    {m:/apro il camerino/i,                 t:"Apro il camerino"},
    {m:/^[1-5]\/6/,                          t:"Carico il camerino"},
    {m:/6\/6|targets\.bin/i,                 t:"Scarico il modello del corpo", s:"145 MB: la prima volta è la parte lunga, poi resta in cache"},
    {m:/PRONTO|Costruisco personaggio/i,     t:"Costruisco il personaggio"},
    {m:/scelgo il look/i,                    t:"Scelgo il look e scatto la foto"},
    {m:/cinematic|pronto per entrare/i,      t:"Pronto: si entra"}
  ];
  const q = id => document.getElementById(id);

  let partita = 0;        /* quando è stata aperta, per il contatore */
  let timer = null;
  let tacca = 0;          /* la fase più avanti che si è vista finora */
  let azioni = null;      /* i tasti dello stato d'errore */

  function secondi(){
    const s = Math.max(0, Math.round((Date.now() - partita) / 1000));
    return s < 60 ? s + " s" : Math.floor(s / 60) + " min " + (s % 60) + " s";
  }

  function disegnaTacche(){
    const b = q("preparo-barra");
    if(!b) return;
    b.innerHTML = FASI.map((_, i) =>
      '<i class="' + (i < tacca ? "fatta" : i === tacca ? "in-corso" : "") + '"></i>').join("");
  }

  function apri(){
    const el = q("preparo");
    if(!el) return;
    partita = Date.now();
    tacca = 0;
    azioni = null;
    el.classList.remove("via", "rotto");
    el.hidden = false;
    q("preparo-fase").textContent = FASI[0].t;
    q("preparo-sotto").textContent = "";
    q("preparo-tempo").textContent = "0 s";
    q("preparo-tasti").innerHTML = "";
    disegnaTacche();
    clearInterval(timer);
    timer = setInterval(() => {
      const t = q("preparo-tempo");
      if(t) t.textContent = secondi();
    }, 1000);
  }

  /* Un messaggio grezzo dalla catena: si cerca la fase che lo riconosce. Le
     fasi vanno solo avanti — il camerino ripete «Costruisco personaggio» anche
     mentre applica il preset, e la barra non deve tornare indietro. */
  function fase(messaggio){
    const el = q("preparo");
    if(!el || el.hidden || el.classList.contains("rotto")) return;
    const m = String(messaggio || "");
    let i = FASI.findIndex(f => f.m.test(m));
    if(i < 0) return;
    if(i < tacca) return;
    tacca = i;
    q("preparo-fase").textContent = FASI[i].t + (i === 1 ? " " + (m.match(/^([1-5])\/6/) || [,""])[1] + " di 6" : "");
    q("preparo-sotto").textContent = FASI[i].s || "";
    disegnaTacche();
  }

  function chiudi(){
    const el = q("preparo");
    if(!el || el.hidden) return;
    clearInterval(timer); timer = null;
    el.classList.add("via");
    setTimeout(() => { el.hidden = true; }, 500);
  }

  /* Qualcosa non è andato: si dice, e si lasciano tre strade. `tasti` è
     {riprova, aMano, menu}: ognuna una funzione, quelle che mancano non si
     mostrano. */
  function errore(messaggio, tasti){
    const el = q("preparo");
    if(!el) return;
    clearInterval(timer); timer = null;
    el.hidden = false;
    el.classList.remove("via");
    el.classList.add("rotto");
    azioni = tasti || {};
    q("preparo-fase").textContent = "Non ce l'ha fatta";
    q("preparo-sotto").textContent = String(messaggio || "Il personaggio non è arrivato.") +
      " Sono passati " + secondi() + ". Puoi riprovare, farlo a mano nel creator, o tornare al menu.";
    const t = q("preparo-tasti");
    t.innerHTML =
      (azioni.riprova ? '<button type="button" class="primo" data-t="riprova">Riprova</button>' : "") +
      (azioni.aMano ? '<button type="button" data-t="aMano">Fallo a mano</button>' : "") +
      (azioni.menu ? '<button type="button" data-t="menu">Torna al menu</button>' : "");
  }

  if(q("preparo-tasti")){
    q("preparo-tasti").addEventListener("click", ev => {
      const b = ev.target.closest("button[data-t]");
      if(!b || !azioni) return;
      const f = azioni[b.dataset.t];
      if(typeof f === "function") f();
    });
  }

  window.ADF_PREPARO = {apri, fase, chiudi, errore, aperta:() => { const el = q("preparo"); return !!el && !el.hidden; }};
})();
