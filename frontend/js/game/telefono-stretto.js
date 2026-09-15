/* Il telefono quando lo schermo e' un telefono.

   Sotto i 1180 punti la colonna del telefono non c'e' (hub.css la toglie perche' la
   citta' ha bisogno di tutta la larghezza), e con lei sparivano LaFamegram, «Che
   post fai?», l'anteprima del pezzo e Sputa — proprio sugli schermi degli store del
   telefono. Questo file lo rimette: un tasto nella barra in alto, accanto al Menu,
   apre lo stesso telefono (`.ptel`, `#hb-tel`, la stessa home e le stesse app di
   telefono.js) a schermo pieno; si chiude col tasto sotto, con un tocco fuori o con
   ESC, come tutte le finestre del registro di uscita.js.

   Sta in un file suo per la regola «tieni tutto cio' che riguarda la parte
   smartphone separata dal resto del progetto»: telefono.js sa solo che, se questo
   file c'e', aprire un'app puo' voler dire prima alzare il telefono
   (`telStrettoApri`), e che dopo ogni ridisegno c'e' una pallina da aggiornare
   (`telStrettoAggiorna`). Senza questo file torna la plancia di prima. Il vestito
   e' in css/telefono-stretto.css. */
"use strict";

HIC.telefono = '<path d="M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 2v16h8V4h-3v1h-2V4H8zm2.5 13.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0z"/>';
HIC.giu = '<path d="M12 4a1 1 0 0 1 1 1v10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-5 5a1 1 0 0 1-1.4 0l-5-5a1 1 0 1 1 1.4-1.4l3.3 3.3V5a1 1 0 0 1 1-1z"/>';

/* la colonna e' a video (dai 1180 in su, telefono.js) o il telefono e' alzato qui */
const telStretto = () => typeof telPC === "function" && !telPC();
function telStrettoAperto(){
  const el = document.querySelector(".ptel");
  return !!(el && el.classList.contains("on"));
}
function telVisibile(){ return !telStretto() || telStrettoAperto(); }

/* ---- alzare e mettere giu' ---- */
function telStrettoApri(){
  if(!telStretto()) return false;
  const el = document.querySelector(".ptel");
  if(!el || el.classList.contains("on")) return false;
  el.classList.add("on");
  document.body.classList.add("tel-aperto");
  telStrettoAggiorna();
  /* da tastiera il fuoco entra nel telefono: se no resta sul tasto dietro
     alla sovrapposizione e il Tab gira per la plancia nascosta */
  const prima = el.querySelector(".tapp, .tback, button");
  if(prima) try{ prima.focus({preventScroll:true}); }catch(e){}
  return true;
}
function telStrettoChiudi(){
  const el = document.querySelector(".ptel");
  if(!el || !el.classList.contains("on")) return false;
  el.classList.remove("on");
  document.body.classList.remove("tel-aperto");
  /* si mette giu' sulla home: riaperto, si riparte da li' */
  if(typeof TEL_APP !== "undefined" && TEL_APP && typeof telHome === "function") telHome();
  /* e il fuoco torna al tasto da cui si e' partiti, non al body */
  const btn = $("hb-telbtn");
  if(btn) try{ btn.focus({preventScroll:true}); }catch(e){}
  return true;
}
window.telStrettoApri = telStrettoApri;
window.telStrettoChiudi = telStrettoChiudi;

/* ---- la pallina sul tasto: la somma delle palline delle app ---- */
function telStrettoNuove(){
  if(typeof HUB_APP === "undefined") return 0;
  return HUB_APP.reduce((n, a) => {
    try{ return n + (a.badge ? Number(a.badge(G)) || 0 : 0); }catch(e){ return n; }
  }, 0);
}
function telStrettoAggiorna(){
  const b = $("hb-telbadge");
  if(!b) return;
  const n = telStrettoNuove();
  b.textContent = n > 9 ? "9+" : String(n);
  b.hidden = !n;
}
window.telStrettoAggiorna = telStrettoAggiorna;

/* ---- il tasto nella barra, e quello sotto al guscio ---- */
/* Si mettono da soli, una volta: la barra e' quella di gioco.html, il tasto
   sta prima del Menu cosi' i due restano vicini all'estrema destra. */
(function telStrettoMonta(){
  const menu = $("hb-menu"), tel = document.querySelector(".ptel");
  if(!menu || !tel || $("hb-telbtn")) return;
  const btn = document.createElement("button");
  btn.className = "ptelbtn"; btn.id = "hb-telbtn"; btn.type = "button";
  btn.title = "Il telefono";
  btn.setAttribute("aria-label", "Apri il telefono");
  btn.innerHTML = hsvg("telefono") + '<i class="ptelbadge" id="hb-telbadge" hidden></i>';
  menu.parentNode.insertBefore(btn, menu);
  btn.addEventListener("click", () => {
    if(typeof hubTap === "function") hubTap();
    telStrettoApri();
  });

  const giu = document.createElement("button");
  giu.className = "ptelgiu"; giu.type = "button";
  giu.innerHTML = hsvg("giu") + "Metti giù";
  tel.appendChild(giu);
  giu.addEventListener("click", () => {
    if(typeof hubTap === "function") hubTap();
    telStrettoChiudi();
  });

  /* un tocco fuori dal guscio lo mette giu' — il fondale e' `.ptel` stessa,
     e il guscio e il tasto sono figli: un bersaglio uguale al fondale e' fuori */
  tel.addEventListener("mousedown", ev => {
    if(ev.target !== tel) return;
    if(telStrettoChiudi() && typeof SFX !== "undefined") SFX.tap();
  });
})();

/* ESC: se dentro c'e' un'app aperta la chiude telefono.js (torna alla home);
   se sei gia' alla home, il telefono si mette giu'. Il registro di uscita.js
   guarda `.on` sull'elemento con quell'id: il guscio non ha un id suo, quindi
   ESC si gestisce qui, in cattura, per passare **prima** di telefono.js e
   vedere TEL_APP com'era davvero al momento del tasto. */
/* Sopra al telefono alzato puo' esserci un'altra finestra — un evento, la
   Strada, le Trasferte, l'orologio: ESC e' suo, non del telefono. Le liste
   sono quelle di uscita.js (overlayAperto) e di menu-sistema.js. */
const TEL_SOPRA = "#tras-overlay.on, #adf-result-overlay.on, #adf-social-overlay.on, " +
  "#crimeModal.on, #adf-time-controls.adf-tc-open, .adf-system-menu.on, #setts.on";
function telStrettoQualcosaSopra(){
  if(typeof overlayAperto === "function" && overlayAperto()) return true;
  return !!document.querySelector(TEL_SOPRA);
}
document.addEventListener("keydown", ev => {
  if(ev.key !== "Escape" || !telStrettoAperto()) return;
  if(telStrettoQualcosaSopra()) return;
  /* un'app aperta la chiude telefono.js (torna alla home) — ma se sta gia'
     andando via (.tout, i 160 ms dell'animazione) il secondo ESC e' per noi:
     TEL_APP si svuota solo a fine animazione, e senza questo un ESC ESC di
     fila lasciava il telefono su */
  if(typeof TEL_APP !== "undefined" && TEL_APP && !document.querySelector(".tscreen.tout")) return;
  if(telStrettoChiudi()){
    /* il tasto e' consumato: dopo di noi c'e' menu-sistema.js, che su un ESC
       «libero» apre il menu di sistema — e si troverebbe il telefono gia'
       giu', senza sapere che era lui il motivo del tasto */
    ev.preventDefault(); ev.stopImmediatePropagation();
    if(typeof SFX !== "undefined") SFX.tap();
  }
}, true);

/* allargando la finestra la colonna torna al suo posto: la sovrapposizione
   non ha piu' senso e si toglie */
window.addEventListener("resize", () => { if(!telStretto()) telStrettoChiudi(); });
