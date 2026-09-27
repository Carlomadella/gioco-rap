/* La mappa che si scorre (giro del 27/09/2026, voce 64).

   Sotto i 900 px la foto della città tiene i suoi 900 e ci si sposta col dito
   (css/stretto.css, `.pmappa`). Funziona, ma niente lo diceva: «LIVE CLUB»
   restava tagliato dal bordo destro e sembrava la fine della città.

   Qui c'è solo la freccia che lo dice: sta sul bordo destro finché c'è altra
   città da vedere, si spegne quando ci arrivi o quando la mappa non scorre
   (sul monitor largo), e toccata porta avanti di un tratto. */
"use strict";

(function(){
  const mappa = document.querySelector(".pmappa");
  if(!mappa) return;

  const freccia = document.createElement("button");
  freccia.type = "button";
  freccia.className = "pmappa-freccia";
  freccia.setAttribute("aria-label", "La città continua: scorri a destra");
  freccia.textContent = "›";
  mappa.appendChild(freccia);

  function aggiorna(){
    const resto = mappa.scrollWidth - mappa.clientWidth - mappa.scrollLeft;
    mappa.classList.toggle("si-scorre", resto > 8);
  }
  freccia.addEventListener("click", ev => {
    ev.stopPropagation();
    mappa.scrollBy({left: Math.round(mappa.clientWidth * 0.7), behavior: "smooth"});
  });
  mappa.addEventListener("scroll", aggiorna, {passive: true});
  window.addEventListener("resize", aggiorna);
  /* la foto si carica e la plancia si ridisegna: si rimisura quando cambia */
  if(typeof ResizeObserver === "function") new ResizeObserver(aggiorna).observe(mappa);
  aggiorna();
})();
