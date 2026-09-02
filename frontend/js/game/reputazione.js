/* LA REPUTAZIONE (punto 12)

   Non è la fama. La fama è quanta gente sa chi sei; la reputazione è **quanto
   sei uno su cui contare**. Sono due cose diverse e nel giro contano diverso:
   di gente famosa e inaffidabile è pieno il mondo, e a quella gente alla fine
   non risponde più nessuno al telefono.

   Il numero c'era già, ma nascosto: `js/game/trasferte.js` teneva un `rep` da 0
   a 100 per decidere chi ti chiama da fuori città, e non lo vedeva nessuno.
   Qui quel numero esce allo scoperto, diventa una statistica della partita
   (`G.rep`) e comincia a muoversi per tutto quello che fai, non solo per le
   trasferte:

   - **tieni la parola** — accetti una data e la fai, ti presenti al lavoro,
     porti a casa quello che avevi promesso: sale;
   - **la rompi** — rifiuti in fila, salti i turni finché ti licenziano, tratti
     male la gente della Sala: scende;
   - **il giro lungo** — un feat portato a termine, una sessione, un beat pagato
     a chi te l'ha fatto sentire: sale piano;
   - **quello che ti si attacca addosso** — i precedenti, l'attenzione della
     polizia: scende, ma meno di quanto ci si aspetterebbe. Nella strada avere
     precedenti non ti rende inaffidabile: ti rende pericoloso, che è un'altra
     cosa. Quello che ti brucia davvero è mollare la gente.

   Parte da 50: nessuno ti conosce, nessuno ha motivo di diffidare. */
"use strict";

/* Gli otto gradini, dal basso. Il nome è quello che direbbe uno del giro, non
   una etichetta da scheda personaggio. */
const REP_GRADI = [
  {da: 0,  n:"venduto",              d:"Hai mollato troppa gente. Si sa in giro.",           k:"#EF4444"},
  {da:10,  n:"uno senza parola",     d:"Quello che dici non vale niente.",                   k:"#F87171"},
  {da:25,  n:"poco affidabile",      d:"Ti chiamano solo se non trovano altri.",             k:"#FB923C"},
  {da:40,  n:"uno qualsiasi",        d:"Nessuno ti conosce abbastanza da fidarsi o no.",     k:"#94A3B8"},
  {da:60,  n:"uno serio",            d:"Se dici che ci sei, ci sei.",                        k:"#38BDF8"},
  {da:75,  n:"uno su cui contare",   d:"Ti chiamano prima degli altri.",                     k:"#4ADE80"},
  {da:88,  n:"real",                 d:"Nel giro sei una garanzia.",                         k:"#A3E635"},
  {da:97,  n:"OG",                   d:"Il tuo nome apre le porte prima di te.",             k:"#FACC15"}
];

/* Il numero. Sta in `G.rep`, ma se la carriera viene da prima del punto 12 lo
   eredita dalle trasferte, dove viveva: chi si era già fatto un nome nel giro
   non riparte da zero solo perché adesso il numero si vede. */
function repValore(){
  if(typeof G.rep !== "number"){
    let da = 50;
    try{
      if(G.trasferte && typeof G.trasferte.rep === "number") da = G.trasferte.rep;
    }catch(e){}
    G.rep = clamp(da, 0, 100);
  }
  return Math.round(clamp(G.rep, 0, 100));
}

function repGrado(v){
  const n = v == null ? repValore() : v;
  let g = REP_GRADI[0];
  for(const x of REP_GRADI) if(n >= x.da) g = x;
  return g;
}

/* Muovere la reputazione è una cosa che si racconta: se sale o scende di un
   gradino il giocatore lo deve leggere, se no è un numero che si muove da solo
   e non insegna niente. `perche` è la riga che finisce nel diario. */
function repAggiungi(n, perche){
  if(!n) return repValore();
  const prima = repValore(), gPrima = repGrado(prima);
  G.rep = clamp(prima + n, 0, 100);
  /* le trasferte leggono il loro `rep`: tenerlo allineato vuol dire che chi ti
     chiama da fuori città guarda la stessa reputazione di tutti gli altri */
  try{
    if(G.trasferte && typeof G.trasferte.rep === "number") G.trasferte.rep = G.rep;
  }catch(e){}
  const dopo = repValore(), gDopo = repGrado(dopo);
  if(gDopo.n !== gPrima.n && typeof pushLog === "function"){
    const su = dopo > prima;
    pushLog("Nel giro adesso sei <b>" + gDopo.n + "</b>" +
      (perche ? " — " + perche : "") + ".", su ? "good" : "bad");
    if(typeof toast === "function")
      toast("Reputazione: <b>" + gDopo.n + "</b>", su ? "good" : "bad",
        su ? "▲" : "▼", [gDopo.k, "#0B1220"]);
  }
  else if(perche && typeof pushLog === "function" && Math.abs(n) >= 3){
    pushLog((n > 0 ? "Reputazione su" : "Reputazione giù") + ": " + perche + ".", n > 0 ? "" : "bad");
  }
  return dopo;
}

/* La riga che si legge nel profilo: numero, gradino e cosa vuol dire. */
function repRiepilogo(){
  const v = repValore(), g = repGrado(v);
  return {valore:v, nome:g.n, d:g.d, k:g.k};
}

window.REPUTAZIONE = Object.freeze({
  valore: repValore,
  grado: () => repGrado().n,
  riepilogo: repRiepilogo,
  aggiungi: repAggiungi,
  gradi: REP_GRADI
});
