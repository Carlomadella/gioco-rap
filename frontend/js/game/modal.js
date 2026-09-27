/* Finestra modale per gli eventi. */
"use strict";

/* ==================== MODALE ==================== */
/* Alcune finestre si possono lasciare a metà, altre no. Un'azione che hai
   aperto tu (scrivi barre, registra, cerca un beat) deve avere una via d'uscita.
   Un evento della settimana o una prova di passaggio no: lì una scelta va fatta,
   se no bastava premere ESC per far sparire tutto quello che non conviene. */
let MODALE_ANNULLA = null;

/* Una finestra senza via d'uscita (un evento ALTO, una prova) non si copre.
   Prima la finestra dopo la riscriveva: l'ALTO spariva dallo schermo ma
   restava pendente col suo lucchetto, e il «+1» restava bloccato fino a
   ricaricare (giro del 27/09, 21 giorni di fila nell'anno simulato). Adesso
   quella dopo aspetta in coda e si apre appena si è scelto. */
/* il primo bottone della finestra obbligata: se chi scrive la modale a mano
   (il titolo del pezzo, la scheda di un rivale) ci è passato sopra, il bottone
   non è più nella pagina e la finestra non è più quella da proteggere */
let MODALE_OBBLIGATA = null;
const MODALE_CODA = [];
const modaleObbligata = () => !!(MODALE_OBBLIGATA && MODALE_OBBLIGATA.isConnected &&
  $("modal").classList.contains("on"));
function modaleProssima(){
  if($("modal").classList.contains("on")) return;
  if(MODALE_CODA.length){ showEvent(MODALE_CODA.shift()); return; }
  /* niente in coda: se c'è un ALTO dell'orologio rimasto sotto (qualcuno ci
     aveva scritto sopra a mano), torna adesso e non al prossimo render */
  try{
    if(window.GAME_EVENTS && GAME_EVENTS.pending()) GAME_EVENTS.showPending();
  }catch(e){}
}

/* La conferma dello spostamento ha la sua faccia (partenza, arrivo, durata)
   e nasconde il testo normale. Chi scrive la modale a mano (il titolo del
   pezzo, la scheda del rivale, la scelta del salto) deve rimetterla normale:
   se no, dopo un viaggio, il titolo del pezzo si apriva senza testo e senza
   il campo per scriverlo (27/09). */
function modaleViaggio(travel){
  $("modal").classList.toggle("travel-confirm", !!travel);
  $("m-travel").hidden = !travel;
  $("m-d").hidden = !!travel;
  $("modal").setAttribute("aria-describedby", travel ? "m-travel" : "m-d");
  if(travel){
    $("travel-departure").textContent = travel.departure;
    $("travel-arrival").textContent = travel.arrival;
    $("travel-duration").textContent = travel.duration;
  }
}
function modaleSenzaViaggio(){ modaleViaggio(null); }

function showEvent(e){
  if(modaleObbligata()){
    MODALE_CODA.push(e);
    return;
  }
  const obbligata = typeof e.annulla !== "function";
  $("m-k").textContent = e.k;
  $("m-t").textContent = e.t;
  $("m-d").innerHTML = e.d;
  const travel = e.travel || null;
  modaleViaggio(travel);
  MODALE_ANNULLA = typeof e.annulla === "function" ? e.annulla : null;
  $("m-x").hidden = !MODALE_ANNULLA;
  const w = $("m-opts"); w.innerHTML = "";
  e.opts.forEach((o, index) => {
    const b = document.createElement("button");
    b.className = "opt2" + (travel ? (index === 0 ? " travel-cancel" : " travel-go") : "");
    b.type = "button";
    b.innerHTML = '<span class="n">' + o.n + '</span><span class="d">' + o.d + '</span>';
    b.onclick = () => {
      MODALE_ANNULLA = null;
      MODALE_OBBLIGATA = null;
      /* la finestra si chiude prima di eseguire: certe scelte ne riaprono
         un'altra qui dentro (il titolo del pezzo, «Come la fai»), e chiudere
         dopo se la sarebbe portata via appena nata */
      $("modal").classList.remove("on");
      /* se la scelta scoppia, quella in coda deve uscire lo stesso: se no
         resta lì e salta fuori al primo clic su un'altra finestra */
      try{
        const r = o.run() || {t:"", c:""};
        if(r.t) pushLog(r.t, r.c);
        save(); renderGioco();
        if(typeof renderStudio === "function") renderStudio();
      }finally{
        modaleProssima();
      }
    };
    w.appendChild(b);
  });
  MODALE_OBBLIGATA = obbligata ? w.firstChild : null;
  $("modal").classList.add("on");
  if(travel) w.querySelector(".travel-cancel").focus();
}

/* Torna true se la finestra si è davvero chiusa: chi chiama (ESC, clic fuori)
   deve sapere se il tasto è stato consumato o se non c'era via d'uscita. */
function chiudiModale(){
  if(!MODALE_ANNULLA) return false;
  const annulla = MODALE_ANNULLA;
  MODALE_ANNULLA = null;
  MODALE_OBBLIGATA = null;
  $("modal").classList.remove("on");
  annulla();
  renderGioco();
  if(typeof renderStudio === "function") renderStudio();
  modaleProssima();
  return true;
}
$("m-x").onclick = () => chiudiModale();
