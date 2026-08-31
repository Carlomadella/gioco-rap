/* Uscire da un'azione senza portarla a termine: ✕, ESC, o un clic fuori.

   Il punto delicato non è chiudere la finestra, è il conto: l'energia viene
   scalata quando premi la card, prima ancora che la scena si apra. Se si potesse
   uscire senza rimetterla a posto, il tasto "indietro" sarebbe una punizione.
   Quindi ogni azione aperta resta "in sospeso" finché non produce un risultato:
   se la abbandoni prima, l'energia e i soldi tornano indietro. */
"use strict";

/* ==================== L'AZIONE IN SOSPESO ==================== */
let AZIONE = null;

/* La card è stata premuta: da qui in poi si può ancora tornare indietro.
   Si segna solo l'energia perché solo quella viene scalata in anticipo: i soldi
   li togliono le azioni dentro se stesse, a cose fatte. Rimborsarli qui vorrebbe
   dire regalarli a chi apre la sala e preme ESC. */
function iniziaAzione(energia){
  AZIONE = {e:energia || 0, viva:true};
}
/* l'azione ha prodotto qualcosa: il conto è chiuso, non si rimborsa più */
function azioneFatta(){
  if(AZIONE) AZIONE.viva = false;
}
/* l'azione è stata abbandonata: rimetti a posto l'energia già scalata */
function annullaAzione(){
  if(!AZIONE || !AZIONE.viva) return false;
  AZIONE.viva = false;
  G.energy = clamp(G.energy + AZIONE.e, 0, G.maxEnergy);
  save();
  return true;
}

/* ==================== LE FINESTRE APERTE ==================== */
/* Ogni voce: l'elemento che fa da fondale, e come si chiude.
   L'ordine conta: la prima aperta che si incontra è quella che ESC chiude.

   `fondale:false` toglie la chiusura col clic fuori. Serve dove dentro c'è
   lavoro che si perde: nel foglio uno scrive barre per un minuto, e un clic
   di sbieco che manda via tutto è un pessimo affare. Lì si esce con la ✕,
   con «Lascia perdere» o con ESC, che sono gesti voluti. */
const USCITE = [
  {id:"modal",  chiudi(){ return chiudiModale(); }},
  {id:"writer", fondale:false,
   chiudi(){ if(typeof WR !== "undefined" && WR){ annullaAzione(); } chiudiFoglio(); renderGioco(); return true; }},
  {id:"piazza", chiudi(){ uscitaPiazza(); return true; }},
  {id:"posto",  chiudi(){ chiudiPosto(); return true; }},
  {id:"drawer", chiudi(){ closeDiary(); return true; }},
  {id:"report", chiudi(){ $("report").classList.remove("on"); return true; }}
];
const aperto = id => { const el = $(id); return el && el.classList.contains("on"); };
function overlayAperto(){ return USCITE.some(u => aperto(u.id)); }
/* le scene vere e proprie: la modale non conta, perche' mentre si sceglie
   un'opzione e' ancora aperta e non direbbe niente di utile */
function scenaAperta(){ return aperto("writer") || aperto("piazza") || aperto("posto"); }

/* chiude la finestra più in alto; torna false se quella aperta non si può chiudere
   (gli eventi della settimana e le prove: lì una scelta va fatta per forza) */
function chiudiInCima(){
  for(const u of USCITE) if(aperto(u.id)) return u.chiudi();
  return false;
}

/* ESC: la scorciatoia che chiedeva di esistere */
document.addEventListener("keydown", e => {
  if(e.key !== "Escape") return;
  /* il foglio di scrittura ha i suoi campi: ESC dentro un input esce comunque,
     ma solo dopo aver tolto il fuoco, se no il browser si mangia il tasto */
  if(!overlayAperto()) return;
  if(chiudiInCima()){ e.preventDefault(); SFX.tap(); }
});

/* clic fuori dal riquadro: il fondale scuro è l'elemento stesso, il contenuto
   sta in un figlio, quindi un clic il cui bersaglio è il fondale è un clic fuori */
USCITE.forEach(u => {
  if(u.fondale === false) return;
  const el = $(u.id);
  if(!el) return;
  el.addEventListener("mousedown", e => {
    if(e.target !== el) return;
    if(u.chiudi()) SFX.tap();
  });
});
