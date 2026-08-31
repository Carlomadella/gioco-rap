/* Finestra modale per gli eventi. */
"use strict";

/* ==================== MODALE ==================== */
/* Alcune finestre si possono lasciare a metà, altre no. Un'azione che hai
   aperto tu (scrivi barre, registra, cerca un beat) deve avere una via d'uscita.
   Un evento della settimana o una prova di passaggio no: lì una scelta va fatta,
   se no bastava premere ESC per far sparire tutto quello che non conviene. */
let MODALE_ANNULLA = null;

function showEvent(e){
  $("m-k").textContent = e.k;
  $("m-t").textContent = e.t;
  $("m-d").innerHTML = e.d;
  MODALE_ANNULLA = typeof e.annulla === "function" ? e.annulla : null;
  $("m-x").hidden = !MODALE_ANNULLA;
  const w = $("m-opts"); w.innerHTML = "";
  e.opts.forEach(o => {
    const b = document.createElement("button");
    b.className = "opt2";
    b.innerHTML = '<span class="n">' + o.n + '</span><span class="d">' + o.d + '</span>';
    b.onclick = () => {
      MODALE_ANNULLA = null;
      /* la finestra si chiude prima di eseguire: certe scelte ne riaprono
         un'altra qui dentro (il titolo del pezzo, «Come la fai»), e chiudere
         dopo se la sarebbe portata via appena nata */
      $("modal").classList.remove("on");
      const r = o.run() || {t:"", c:""};
      if(r.t) pushLog(r.t, r.c);
      save(); renderGioco();
    };
    w.appendChild(b);
  });
  $("modal").classList.add("on");
}

/* Torna true se la finestra si è davvero chiusa: chi chiama (ESC, clic fuori)
   deve sapere se il tasto è stato consumato o se non c'era via d'uscita. */
function chiudiModale(){
  if(!MODALE_ANNULLA) return false;
  const annulla = MODALE_ANNULLA;
  MODALE_ANNULLA = null;
  $("modal").classList.remove("on");
  annulla();
  renderGioco();
  return true;
}
$("m-x").onclick = () => chiudiModale();
