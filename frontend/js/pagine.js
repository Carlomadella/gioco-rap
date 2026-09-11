/* Le pagine del gioco, e come si va dall'una all'altra (punto 27).

   Sono tre e stanno in `pagine/`: la landing, l'accesso, la partita. Prima
   erano tre `<section>` dello stesso documento e «andare» voleva dire togliere
   una classe; adesso sono tre file, e andare vuol dire caricare una pagina.

   I nomi stanno scritti qui e in nessun altro posto. Non è pignoleria: il
   build della demo in un file solo (`npm run demo`) li riscrive, perché lì le
   pagine finiscono tutte nella stessa cartella con altri nomi. Se i percorsi
   fossero sparsi in cinque file, riscriverli vorrebbe dire cercarli a mano.

   `document.baseURI` è la cartella del gioco — le pagine hanno `<base href="../">`
   in testa — quindi qui i percorsi si scrivono come li scriverebbe index.html. */
"use strict";

const PAGINE = {
  landing: "pagine/landing.html",
  accesso: "pagine/accesso.html",
  gioco:   "pagine/gioco.html"
};

/* L'indirizzo di una pagina, con la domanda attaccata se serve
   (`vaiA("gioco", "vai=profilo")`). */
function indirizzoPagina(quale, domanda){
  const f = PAGINE[quale] || PAGINE.landing;
  return new URL(f + (domanda ? "?" + domanda : ""), document.baseURI).href;
}
function vaiA(quale, domanda){ location.href = indirizzoPagina(quale, domanda); }

window.PAGINE = PAGINE;
window.vaiA = vaiA;
