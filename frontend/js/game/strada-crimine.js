﻿/* La Strada (punto 21): la professione del criminale in provincia.

   Ricostruita da zero seguendo il documento vincolante `claude/carriera-criminale.md`
   (i quattro numeri, gli 11 colpi, i soldi sporchi, la vetrina, chi ti copre, gli opp,
   il carcere, uscirne): il codice originale non era mai arrivato su GitHub, solo il
   design (vedi punto 57 in implementazioni/06-mondo-e-personaggi.md). Qui c'è la
   fetta di Provincia, giocabile davvero; Milano e Los Angeles restano in vista con
   scritto dove si aprono, come chiede il documento, perché le loro mappe non
   esistono ancora.

   File a parte da `strada.js`: quello è un'altra "strada", gli incontri per la via
   del punto 54 (il fan, l'hater, l'opp...) — nome uguale per un caso di battitura
   nel documento originale, funzioni del tutto diverse. Tenerle divise evita di
   perdere l'uno o l'altro pezzo a ogni modifica.

   Cosa NON copre ancora questa prima versione, di proposito, per restare onesti:
   - i colpi di Milano e Los Angeles (bloccati finché non esistono quelle città);
   - il casinò di Los Angeles;
   - il blocco delle altre azioni del gioco mentre sei dentro (l'arresto qui pesa sui
     numeri — fan, hype, spese, contratto — ma non impedisce fisicamente di scrivere
     o registrare: bloccare tutto il resto del gioco tocca troppi file per farlo alla
     cieca, senza poterlo provare in un browser vero);
   - i contatti criminali collegati alla rubrica (la rubrica di fase 3 non esiste ancora). */
"use strict";

/* ==================== DATI ==================== */

/* I quattro colpi di provincia, con guadagno, energia (punto 39: l'energia è
   giornaliera), difficoltà (0-1, pesa sulla riuscita) e pena base in settimane.
   Guadagni ed energia sono quelli del documento dov'era scritto un numero; dove
   il documento non fissava un valore esatto (energia, pena base) ho messo una
   stima ragionevole, da tarare quando si gioca davvero. */
const STRADA_COLPI = [
  {id:"consegne", n:"Consegne che non chiedi", energia:15, difficolta:.15, pena:2,
   d:"Porti un pacco da un posto a un altro. Meglio non sapere cosa c'è dentro.",
   min:120, max:280},
  {id:"scotta", n:"Roba che scotta", energia:20, difficolta:.30, pena:3,
   d:"È arrivata da poco e scotta: va fatta sparire in fretta.",
   min:220, max:480},
  {id:"cassa", n:"La cassa del bar", energia:28, difficolta:.50, pena:5,
   d:"Il bar chiude tardi, e la cassa resta lì fino al mattino.",
   min:420, max:950},
  {id:"macchina", n:"La macchina giusta", energia:35, difficolta:.68, pena:8,
   d:"Sai già dov'è parcheggiata, e chi non se ne accorgerà.",
   min:600, max:1350}
];

/* Città chiuse: restano in vista col nome, come chiede il documento — nessun
   numero, perché quelle mappe non esistono ancora. */
const STRADA_COLPI_MILANO = [
  {n:"Il giro dei locali"}, {n:"Il tavolo"}, {n:"Il carico"},
  {n:"La gioielleria", nota:"fino a 9.500 €"}
];
const STRADA_COLPI_LA = [
  {n:"Il porto"}, {n:"La villa sulle colline"},
  {n:"Il giro grosso", nota:"fino a 60.000 €"}
];

/* Gli approcci: numeri presi uno a uno dal documento
   (−18%/−35%/+6% · +18% · +40%/+35%/+12%/pena×2,2). */
const STRADA_APPROCCI = [
  {id:"pulito", n:"Da solo, pulito", d:"Meno guadagno, molto meno rumore, un po' più sicuro.",
   guadagno:.82, rumore:.65, riuscita:.06, pena:1},
  {id:"squadra", n:"Con uno dei tuoi", d:"Più guadagno. Se va male, può restarci lui e non tu.",
   guadagno:1.18, rumore:1, riuscita:0, pena:1, serveUomo:true},
  {id:"ferro", n:"Col ferro", d:"Molto più guadagno e più riuscita — ma se ti perquisiscono la pena raddoppia.",
   guadagno:1.40, rumore:1.35, riuscita:.12, pena:2.2, serveFerro:true}
];

/* Attività di provincia: Lavanderia, Autolavaggio, Minimarket (nomi dal
   documento). Il documento non fissa costo d'acquisto né resa esatta per la
   provincia (lo fa solo per il tipo di reparto, 45% pulito/55% sporco): i
   numeri sotto sono un punto di partenza credibile, da tarare. */
const STRADA_ATTIVITA = [
  {id:"lavanderia", n:"Lavanderia", costo:1200, resa:90, gestione:15},
  {id:"autolavaggio", n:"Autolavaggio", costo:1800, resa:130, gestione:20},
  {id:"minimarket", n:"Minimarket", costo:2600, resa:190, gestione:30}
];

/* Protezione a tre gradini più "nessuna", coi tre prezzi del documento. */
const STRADA_PROT = [
  {n:"Nessuna", costo:0},
  {n:"Occhi in giro", costo:260},
  {n:"Uomini fissi", costo:620},
  {n:"Scorta", costo:1450}
];

const STRADA_UOMO_COSTO = 500, STRADA_UOMO_UPKEEP = 140, STRADA_UOMO_MAX = 5;
const STRADA_FERRO_COSTO = 900, STRADA_AVVOCATO_COSTO = 320;

/* La Fabbrica è soltanto UNO dei punti in cui una persona della Strada può
   intercettarti. L'offerta non è "un crimine da Fabbrica": pesca da un pool
   generale della carriera criminale e resta utilizzabile anche da altri
   trigger futuri (bar, Circolo, contatti, telefono...) senza duplicare logica. */
const STRADA_FABBRICA_LEAD = Object.freeze({
  chance:.12,
  cooldownGiorni:14,
  durataGiorni:7,
  trigger:"fabbrica"
});
const STRADA_OPPORTUNITA_TRIGGER = Object.freeze({
  fabbrica:STRADA_FABBRICA_LEAD,
  mondo:Object.freeze({
    chance:.05,
    cooldownGiorni:10,
    durataGiorni:7,
    trigger:"mondo"
  })
});

/* Pool di opportunità criminali. Non aggiunge nuovi metodi operativi nel mondo
   reale: varia i quattro colpi già esistenti sul piano di gameplay.
   Ogni offerta modifica davvero ricompensa, probabilità, attenzione e
   reputazione su successo/fallimento. */
const STRADA_OPPORTUNITA = Object.freeze([
  Object.freeze({
    id:"giro-breve", minRep:0, colpoId:"consegne",
    persona:"Rami", titolo:"Un giro breve",
    intro:"«Hai cinque minuti? Ho una cosa piccola che non voglio lasciare in mano al primo che passa.»",
    pitch:"È un incarico corto: paga un po' meglio del solito e, se va storto, non dovrebbe trascinarsi troppo.",
    bonusPct:15, chanceDelta:.08, successHeat:1, failureHeat:2, successRep:1, failureRep:-1
  }),
  Object.freeze({
    id:"prova-fiducia", minRep:8, colpoId:"consegne",
    persona:"Moro", titolo:"Una prova di fiducia",
    intro:"«Soldi grossi no. Però se questa la chiudi bene, la gente giusta se lo ricorda.»",
    pitch:"Qui il premio vero è la reputazione: il guadagno non cambia quasi, ma riuscire ti apre credito nel giro.",
    bonusPct:0, chanceDelta:.05, successHeat:1, failureHeat:3, successRep:6, failureRep:-4
  }),
  Object.freeze({
    id:"pagamento-alto", minRep:24, colpoId:"consegne",
    persona:"Dado", titolo:"Pagano troppo per essere tranquilli",
    intro:"«Mi hanno dato un numero che non mi piace. Proprio per questo sto chiedendo a te.»",
    pitch:"Ricompensa alta, margine peggiore: se la prendi guadagni molto di più, ma la riuscita scende e il rumore sale.",
    bonusPct:35, chanceDelta:-.06, successHeat:3, failureHeat:5, successRep:2, failureRep:-2
  }),
  Object.freeze({
    id:"merce-urgente", minRep:0, colpoId:"scotta",
    persona:"Nina", titolo:"Deve muoversi adesso",
    intro:"«Non è roba mia e non voglio sapere di chi è. So solo che deve sparire dal tavolo in fretta.»",
    pitch:"È urgente ma organizzata decentemente: premio sopra la media, con un piccolo vantaggio sulla riuscita.",
    bonusPct:25, chanceDelta:.04, successHeat:2, failureHeat:4, successRep:2, failureRep:-1
  }),
  Object.freeze({
    id:"nessuno-la-vuole", minRep:20, colpoId:"scotta",
    persona:"Toni", titolo:"Nessuno vuole prenderla",
    intro:"«Ho già sentito due persone. Tutti hanno trovato una scusa. Tu almeno dimmi sì o no in faccia.»",
    pitch:"Il compenso è molto alto perché il rischio è peggiore: meno probabilità di riuscita, più attenzione e più reputazione se la chiudi.",
    bonusPct:45, chanceDelta:-.08, successHeat:5, failureHeat:7, successRep:4, failureRep:-3
  }),
  Object.freeze({
    id:"occasione-facile", minRep:0, colpoId:"cassa",
    persona:"Vale", titolo:"Un'occasione più pulita del solito",
    intro:"«Non ti sto vendendo il colpo del secolo. Ti sto dicendo che, per una volta, il quadro è meno sporco del solito.»",
    pitch:"Paga poco più del normale ma aumenta molto la riuscita e può perfino ridurre leggermente l'attenzione se va bene.",
    bonusPct:10, chanceDelta:.10, successHeat:-1, failureHeat:2, successRep:1, failureRep:-1
  }),
  Object.freeze({
    id:"serata-grossa", minRep:25, colpoId:"cassa",
    persona:"Mauri", titolo:"Stasera gira più del normale",
    intro:"«Se vuoi fare soldi veri, questa è una di quelle sere. Però non venirmi a dire dopo che non te l'avevo detto.»",
    pitch:"Guadagno alto e pressione alta: la riuscita peggiora, il rumore cresce e il fallimento costa reputazione.",
    bonusPct:40, chanceDelta:-.06, successHeat:4, failureHeat:7, successRep:4, failureRep:-3
  }),
  Object.freeze({
    id:"nome-da-farsi", minRep:40, colpoId:"cassa",
    persona:"Ciro", titolo:"Qui conta più il nome dei soldi",
    intro:"«Se la chiudi, non ti pagano solo in euro. Ti pagano col fatto che domani il tuo nome gira.»",
    pitch:"Bonus economico moderato ma reputazione molto alta sul successo. Fallire davanti alla gente giusta pesa parecchio.",
    bonusPct:15, chanceDelta:.02, successHeat:2, failureHeat:3, successRep:7, failureRep:-5
  }),
  Object.freeze({
    id:"auto-richiesta", minRep:0, colpoId:"macchina",
    persona:"Nico", titolo:"Ne cercano proprio una così",
    intro:"«C'è richiesta. Non generica: proprio per quella roba lì. Se la prendi, non resta ferma.»",
    pitch:"La richiesta precisa migliora il margine e rende il colpo un po' più favorevole, ma porta comunque attenzione.",
    bonusPct:20, chanceDelta:.08, successHeat:2, failureHeat:4, successRep:2, failureRep:-1
  }),
  Object.freeze({
    id:"auto-scomoda", minRep:30, colpoId:"macchina",
    persona:"Zeta", titolo:"La vogliono, ma nessuno la vuole fare",
    intro:"«È una di quelle occasioni in cui tutti vogliono la percentuale e nessuno vuole stare davanti.»",
    pitch:"Molto denaro, meno probabilità di riuscita e conseguenze più rumorose. Se va bene, però, la reputazione sale forte.",
    bonusPct:50, chanceDelta:-.10, successHeat:6, failureHeat:9, successRep:5, failureRep:-4
  })
]);

function stradaSegnoPct(v){
  const n=Math.round(Number(v||0)*100);
  return (n>0?"+":"") + n + "%";
}

function stradaSegno(v){
  const n=Number(v||0);
  return (n>0?"+":"") + n;
}

function stradaDescriviOpportunita(p){
  if(!p) return "";
  const successoHeat=Number(p.successHeat||0);
  const fallimentoHeat=Number(p.failureHeat||0);
  const colpo=STRADA_COLPI.find(x=>x.id===p.colpoId);
  const parti=[
    colpo ? colpo.n : String(p.colpoId||"Colpo"),
    (Number(p.bonusPct||0)>=0?"+":"")+Number(p.bonusPct||0)+"% guadagno",
    stradaSegnoPct(p.chanceDelta)+" riuscita",
    "attenzione "+stradaSegno(successoHeat)+" se riesce / "+stradaSegno(fallimentoHeat)+" se fallisce",
    "reputazione "+stradaSegno(p.successRep)+" / "+stradaSegno(p.failureRep)
  ];
  return parti.join(" · ");
}

/* ==================== LA SCENA IN CORSO ====================
   Come modal.js, ma tutta dentro alla schermata: showEvent (z-index 60) finirebbe
   sotto ai pannelli come questo (z-index 93, stessa famiglia di posto/negozio),
   quindi qui le scelte del colpo si disegnano nella scheda della Strada, non sopra.

   La scheda la disegna renderStScheda() qui sotto:
   {k, titolo, testo, stats:[{t,c}], approcci, opts:[{n,d,sx,dx,hot,no,run()}]} */
let STRADA_SCENA = null;

function stScenaAvviso(colpo, msg){
  return {k:"Non si può", titolo:"Così no", testo:msg,
    opts:[
      {n:"Torna alle scelte", d:"Rivedi come muoverti", run(){ STRADA_SCENA = stScenaApproccio(colpo); }},
      {n:"Lascia stare", d:"Torni alla strada", run(){ STRADA_SCENA = null; }}
    ]};
}

/* Le tre righe sotto a ogni approccio escono dai numeri veri: quanto cambia il
   guadagno, e cosa ti serve o cosa rischi in più. */
function stRigaApproccio(a){
  const delta = Math.round((a.guadagno - 1) * 100);
  return {
    sx:(delta > 0 ? "+" : "−") + Math.abs(delta) + "% guadagno",
    dx:a.serveFerro ? "pena ×2,2" : a.serveUomo ? "serve un uomo" : "rischio ↓"
  };
}

function stScenaApproccio(colpo){
  const s = G.strada;
  return {k:"Come vuoi muoverti?", titolo:colpo.n, testo:colpo.d, approcci:true,
    stats:[
      {t:fmt(colpo.min) + "–" + fmt(colpo.max) + " €", c:"money"},
      {t:colpo.energia + " energia"},
      {t:"Rischio " + stRischio(colpo).toLowerCase(), c:stClasseRischio(colpo)}
    ],
    opts:STRADA_APPROCCI.map(a => {
      const riga = stRigaApproccio(a);
      return {n:a.n, d:a.d, sx:riga.sx, dx:riga.dx, hot:a.id === "ferro",
        no:(a.serveUomo && s.uomini <= 0) || (a.serveFerro && !s.ferro) || G.energy < colpo.energia,
        run(){ stradaTenta(colpo.id, a.id); }};
    })};
}

function stAvviaColpo(colpoId){
  const colpo = STRADA_COLPI.find(c => c.id === colpoId);
  if(!colpo) return;
  STRADA_SCENA = stScenaApproccio(colpo);
  renderStrada();
}

/* ==================== TENTARE UN COLPO ==================== */

/* Gli Opp criminali appartengono solo a chi è davvero entrato nel giro.
   Il flag resta per tutta la carriera. I salvataggi precedenti al flag vengono
   migrati da prove criminali già presenti nello stato. */
function stradaGiroAvviato(){
  const s=G.strada||{};
  if(!stradaAttivitaSbloccate()) return false;
  if(s.giroAvviato===true)return true;
  if(s.giroAvviato===false)return false;

  const attive=Object.values(s.attivita||{}).some(Boolean);
  const riciclato=!!(s.lavaggio&&Number(s.lavaggio.used)>0);
  const evidenza=
    Number(s.precedenti)>0 ||
    Number(s.sporchi)>0 ||
    Number(s.uomini)>0 ||
    Number(s.prot)>0 ||
    !!s.ferro ||
    !!s.avvocato ||
    !!s.arresto ||
    !!s.carcere ||
    attive ||
    riciclato ||
    Number(s.rep)>0 ||
    Number(s.heat)>0;

  s.giroAvviato=!!evidenza;
  return s.giroAvviato;
}

function stradaAbsDay(){
  return Math.max(1,
    ((Number(G.year || 1) - 1) * 52 + (Number(G.week || 1) - 1)) * 7 +
    Math.max(1, Math.min(7, Number(G.day || 1)))
  );
}


/* ==================== INGRESSO NELLA STRADA ====================
   Punto 1 della revisione 02/10/2026.
   Una nuova partita non mostra Attività criminali. Prima serve una persona
   reale già presente in G.gente, poi due piccoli favori introduttivi. In questa
   fase si possono perdere soldi, energia e accumulare attenzione, ma non si
   può finire in carcere. */
const STRADA_INGRESSO = Object.freeze({
  colpiRichiesti:2,
  chanceProposta:.12,
  cooldownRifiutoGiorni:7,
  cooldownTraColpiGiorni:3,
  energia:[10,14],
  riuscita:[.74,.66],
  min:[120,220],
  max:[240,420],
  heatSuccesso:[2,3],
  heatFallimento:[4,6]
});

function stradaEvidenzaCriminaleLegacy(){
  const s=G.strada||{};
  const attive=Object.values(s.attivita||{}).some(Boolean);
  const riciclato=!!(s.lavaggio&&Number(s.lavaggio.used)>0);
  return s.giroAvviato===true ||
    Number(s.precedenti)>0 ||
    Number(s.sporchi)>0 ||
    Number(s.uomini)>0 ||
    Number(s.prot)>0 ||
    !!s.ferro ||
    !!s.avvocato ||
    !!s.arresto ||
    !!s.carcere ||
    attive ||
    riciclato ||
    Number(s.rep)>0 ||
    Number(s.heat)>0 ||
    Number(G.diario&&G.diario.colpi)>0;
}

function stradaIngressoStato(){
  const s=G.strada||(G.strada={});

  /* badgeSbloccato è NON_COMPLETARE in state.js: se manca davvero stiamo
     caricando un salvataggio precedente a questo sistema. In quel caso non
     nascondiamo la Strada a chi aveva già una carriera criminale. */
  if(typeof s.badgeSbloccato!=="boolean")
    s.badgeSbloccato=!!stradaEvidenzaCriminaleLegacy();

  if(!s.ingressoFase)
    s.ingressoFase=s.badgeSbloccato?"unlocked":"locked";
  if(!Number.isFinite(Number(s.ingressoTentativi)))
    s.ingressoTentativi=0;
  s.ingressoTentativi=Math.max(0,Math.floor(Number(s.ingressoTentativi)||0));

  if(s.badgeSbloccato) s.ingressoFase="unlocked";
  return s;
}

function stradaAttivitaSbloccate(){
  return stradaIngressoStato().badgeSbloccato===true;
}

/* Punto 2: il TrapPhone è un oggetto reale e persistente. I vecchi salvataggi
   che avevano già accesso alla Strada lo possiedono automaticamente, perché
   prima di questo gate il telefono era sempre presente nella schermata. */
function stradaTrapPhoneStato(){
  const s=stradaIngressoStato();
  if(!s.traphone || typeof s.traphone!=="object"){
    s.traphone={
      owned:!!s.badgeSbloccato,
      sourcePersonId:null,
      sourceName:null,
      acquiredAbsoluteDay:s.badgeSbloccato?stradaAbsDay():null,
      source:s.badgeSbloccato?"legacy":null
    };
  }
  if(typeof s.traphone.owned!=="boolean") s.traphone.owned=!!s.badgeSbloccato;
  return s.traphone;
}

function stradaHaTrapPhone(){
  return stradaTrapPhoneStato().owned===true;
}

function stradaConsegnaTrapPhone(personId,personName,source){
  const t=stradaTrapPhoneStato();
  if(t.owned) return {acquired:false,state:t};

  t.owned=true;
  t.sourcePersonId=personId||null;
  t.sourceName=personName||null;
  t.acquiredAbsoluteDay=stradaAbsDay();
  t.source=source||"intro";

  /* Il modulo grafico viene caricato dopo strada-crimine.js, ma quando il
     giocatore completa l'introduzione è già disponibile. Se non lo fosse,
     lo stato persistente resta comunque la fonte di verità. */
  try{
    if(window.TRAPHONE16 && typeof TRAPHONE16.acquire==="function")
      TRAPHONE16.acquire({
        personId:t.sourcePersonId,
        personName:t.sourceName,
        acquiredAbsoluteDay:t.acquiredAbsoluteDay,
        source:t.source
      });
  }catch(_){}

  return {acquired:true,state:t};
}

function stradaPersonaIngressoValida(p){
  if(!p || p.via || !p.id || !p.n || p.ruolo==="giornalista") return false;
  /* Contatti del lavoro: esistono perché li hai incontrati davvero.
     Contatti del Circolo: devono essere già stati visti/conosciuti, non una
     faccia appena generata dal pool della Sala. Il punto 2 raffinerà fiducia
     e percorsi; qui impediamo soltanto proposte da sconosciuti virtuali. */
  if(p.origineLuogo==="fabbrica" || p.origineLuogo==="pizzeria" || p.origine==="lavoro")
    return true;
  return !!p.visto || !!p.numero || Number(p.rel)>0 || Number(p.pt)>0;
}

function stradaPersonaIngresso(variantRoll){
  const s=stradaIngressoStato();
  if(s.ingressoPersonaId){
    const stessa=(G.gente||[]).find(p=>p && p.id===s.ingressoPersonaId && !p.via);
    if(stessa) return stessa;
  }

  const pool=(G.gente||[]).filter(stradaPersonaIngressoValida);
  if(!pool.length) return null;

  /* Un rapporto già iniziato pesa più di una conoscenza appena nata, senza
     trasformarlo ancora nel sistema di fiducia criminale del punto 4. */
  pool.sort((a,b)=>
    (Number(b.rel||0)*10+Number(b.pt||0)+(b.numero?4:0)) -
    (Number(a.rel||0)*10+Number(a.pt||0)+(a.numero?4:0))
  );
  const fascia=pool.slice(0,Math.max(1,Math.ceil(pool.length/2)));
  const r=Number.isFinite(Number(variantRoll))
    ? Math.max(0,Math.min(.999999,Number(variantRoll)))
    : Math.random();
  return fascia[Math.floor(r*fascia.length)] || fascia[0] || null;
}

function stradaTentaIngresso(roll,variantRoll){
  const s=stradaIngressoStato();
  if(s.badgeSbloccato || s.arresto) return null;

  const oggi=stradaAbsDay();

  /* Una proposta già comparsa resta la stessa finché il giocatore non decide.
     Se oggi l'ha già vista non la ripetiamo dopo ogni azione: torna dal giorno
     successivo, utile anche quando manca energia per accettarla. */
  if(s.ingressoPending && typeof s.ingressoPending==="object"){
    if(Number(s.ingressoLastShownAbsoluteDay)===oggi) return null;
    s.ingressoLastShownAbsoluteDay=oggi;
    return Object.assign({},s.ingressoPending);
  }
  if(s.ingressoNextOfferAbsoluteDay!=null &&
     oggi<Number(s.ingressoNextOfferAbsoluteDay)) return null;
  if(Number(s.ingressoLastCheckAbsoluteDay)===oggi) return null;

  const persona=stradaPersonaIngresso(variantRoll);
  if(!persona) return null;

  s.ingressoLastCheckAbsoluteDay=oggi;
  const r=Number.isFinite(Number(roll))
    ? Math.max(0,Math.min(.999999,Number(roll)))
    : Math.random();
  if(r>=STRADA_INGRESSO.chanceProposta) return null;

  const step=Math.min(
    STRADA_INGRESSO.colpiRichiesti,
    Math.max(1,Number(s.ingressoTentativi||0)+1)
  );
  const seconda=step>1;
  const proposta={
    kind:"crime-intro",
    step,
    personId:persona.id,
    persona:persona.n,
    titolo:seconda?"Un altro favore":"Una strana proposta",
    intro:seconda
      ?"«L'altra volta non sei scappato. Ho un'altra cosa piccola, se ti interessa.»"
      :"«Mi serve uno che porti una cosa da un punto all'altro. Niente domande.»",
    pitch:seconda
      ?"È ancora roba piccola, ma stavolta ti espone un po' di più. Se accetti, entri davvero nel radar del giro."
      :"È un favore breve e chiaramente losco. Non sai ancora abbastanza per vedere il resto del giro.",
    energia:Number(STRADA_INGRESSO.energia[step-1]||10)
  };

  s.ingressoPersonaId=persona.id;
  s.ingressoPersonaNome=persona.n;
  s.ingressoFase="offered";
  s.ingressoPending=Object.assign({},proposta);
  s.ingressoLastShownAbsoluteDay=oggi;
  return Object.assign({},proposta);
}

function stradaRifiutaIngresso(){
  const s=stradaIngressoStato();
  if(!s.ingressoPending) return null;
  const out=Object.assign({},s.ingressoPending,{status:"declined"});
  s.ingressoPending=null;
  s.ingressoLastShownAbsoluteDay=null;
  s.ingressoFase=s.ingressoTentativi>0?"contact":"locked";
  s.ingressoNextOfferAbsoluteDay=stradaAbsDay()+STRADA_INGRESSO.cooldownRifiutoGiorni;
  if(typeof save==="function") save();
  return out;
}

function stradaAccettaIngresso(successRoll,rewardRoll){
  const s=stradaIngressoStato();
  const proposta=s.ingressoPending;
  if(!proposta || s.badgeSbloccato) return null;

  const step=Math.max(1,Math.min(
    STRADA_INGRESSO.colpiRichiesti,
    Number(proposta.step)||1
  ));
  const energia=Number(STRADA_INGRESSO.energia[step-1]||10);
  if(Number(G.energy||0)<energia){
    return {ok:false,reason:"Ti servono "+energia+" energia per prenderti questo favore.",proposal:Object.assign({},proposta)};
  }

  G.energy=Math.max(0,Number(G.energy||0)-energia);
  s.ingressoFase="accepted";

  const r=Number.isFinite(Number(successRoll))
    ? Math.max(0,Math.min(.999999,Number(successRoll)))
    : Math.random();
  const successo=r<Number(STRADA_INGRESSO.riuscita[step-1]||.7);
  const rr=Number.isFinite(Number(rewardRoll))
    ? Math.max(0,Math.min(.999999,Number(rewardRoll)))
    : Math.random();

  let pulito=0,sporco=0,multa=0;
  if(successo){
    const min=Number(STRADA_INGRESSO.min[step-1]||120);
    const max=Number(STRADA_INGRESSO.max[step-1]||240);
    const grezzo=Math.round(min+(max-min)*rr);
    pulito=Math.round(grezzo*.4);
    sporco=grezzo-pulito;
    G.money=Number(G.money||0)+pulito;
    s.sporchi=Number(s.sporchi||0)+sporco;
    s.rep=clamp(Number(s.rep||0)+(step===1?1:2),0,100);
    s.heat=clamp(Number(s.heat||0)+Number(STRADA_INGRESSO.heatSuccesso[step-1]||2),0,100);
  }else{
    multa=Math.round(Number(STRADA_INGRESSO.min[step-1]||120)*.45);
    G.money=Math.max(0,Number(G.money||0)-multa);
    s.heat=clamp(Number(s.heat||0)+Number(STRADA_INGRESSO.heatFallimento[step-1]||4),0,100);
    /* Regola esplicita del punto 1: nessun precedente e nessuna detenzione
       durante l'ingresso. Il fallimento resta reale tramite soldi/heat. */
  }

  s.ingressoTentativi=Math.max(Number(s.ingressoTentativi||0),step);
  s.ingressoPending=null;
  s.ingressoLastShownAbsoluteDay=null;
  const sbloccato=s.ingressoTentativi>=STRADA_INGRESSO.colpiRichiesti;
  let trapPhoneAcquired=false;
  if(sbloccato){
    s.badgeSbloccato=true;
    s.ingressoFase="unlocked";
    s.giroAvviato=true;
    s.ingressoSbloccatoAbsoluteDay=stradaAbsDay();
    trapPhoneAcquired=stradaConsegnaTrapPhone(
      proposta.personId||s.ingressoPersonaId,
      proposta.persona||s.ingressoPersonaNome,
      "intro"
    ).acquired;
  }else{
    s.ingressoFase="contact";
    s.ingressoNextOfferAbsoluteDay=stradaAbsDay()+STRADA_INGRESSO.cooldownTraColpiGiorni;
  }

  if(typeof diarioBordo==="function") diarioBordo().colpi++;
  if(typeof pushLog==="function"){
    const nome=proposta.persona||s.ingressoPersonaNome||"Un contatto";
    pushLog(
      successo
        ? "<b>"+nome+"</b>: il favore è andato bene. "+fmt(pulito)+" € puliti e "+fmt(sporco)+" € sporchi."
        : "<b>"+nome+"</b>: il favore è saltato. Hai perso "+fmt(multa)+" € e attirato attenzione, ma non sei finito dentro.",
      successo?"good":""
    );
    if(sbloccato){
      const nome=proposta.persona||s.ingressoPersonaNome||"Il contatto";
      pushLog("<b>Attività criminali sbloccate.</b> Adesso sai dove andare e con chi parlare.", "big");
      pushLog("<b>"+nome+" ti consegna un TrapPhone.</b> Da ora le dritta che non passano faccia a faccia possono arrivare lì.", "good");
    }
  }
  if(typeof save==="function") save();
  return {
    ok:true,
    success:successo,
    step,
    unlocked:sbloccato,
    trapPhoneAcquired,
    personId:proposta.personId||s.ingressoPersonaId,
    persona:proposta.persona||s.ingressoPersonaNome,
    energia,
    pulito,
    sporco,
    multa,
    heat:Number(s.heat||0)
  };
}

function stradaOpportunitaStato(){
  const s=G.strada||(G.strada={});
  if(!s.crimeOpportunity || typeof s.crimeOpportunity!=="object"){
    /* Migrazione trasparente: il vecchio fabbricaLead diventa lo stesso stato
       generico. I salvataggi già esistenti non perdono offerte o storico. */
    s.crimeOpportunity=(s.fabbricaLead && typeof s.fabbricaLead==="object")
      ? s.fabbricaLead
      : {
          lastCheckAbsoluteDay:null,
          lastOfferAbsoluteDay:null,
          pending:null,
          active:null,
          history:[]
        };
  }
  const st=s.crimeOpportunity;
  if(!Array.isArray(st.history)) st.history=[];
  if(!Array.isArray(st.recentIds)) st.recentIds=[];
  if(!st.lastCheckByTrigger || typeof st.lastCheckByTrigger!=="object")
    st.lastCheckByTrigger={};
  /* Migrazione UNA SOLA VOLTA del vecchio contatore giornaliero. Prima veniva
     reinterpretato a ogni tentativo: un check "mondo" fallito aggiornava
     lastCheckAbsoluteDay e il successivo check Fabbrica dello stesso giorno
     sembrava falsamente un dato legacy, bruciando la seconda occasione. */
  if(st.triggerChecksMigrated!==true){
    if(st.lastCheckAbsoluteDay!=null &&
       st.lastCheckByTrigger.fabbrica==null &&
       st.lastCheckByTrigger.mondo==null)
      st.lastCheckByTrigger.fabbrica=Number(st.lastCheckAbsoluteDay);
    st.triggerChecksMigrated=true;
  }
  if(st.nextOfferAbsoluteDay==null && st.lastOfferAbsoluteDay!=null)
    st.nextOfferAbsoluteDay=Number(st.lastOfferAbsoluteDay)+Number(STRADA_FABBRICA_LEAD.cooldownGiorni||14);
  /* alias legacy finché tutti i salvataggi non sono passati dal nuovo runtime */
  s.fabbricaLead=st;
  return st;
}

/* Nome legacy mantenuto perché altri moduli già caricati lo usano. */
function stradaFabbricaLeadStato(){ return stradaOpportunitaStato(); }

function stradaAggiornaOpportunita(silent){
  const st=stradaOpportunitaStato();
  if(!st.active) return null;

  const oggi=stradaAbsDay();
  if(Number(st.active.expiresAbsoluteDay)>=oggi) return st.active;

  const scaduta=Object.assign({},st.active,{status:"expired",expiredAbsoluteDay:oggi});
  st.history.push(scaduta);
  if(st.history.length>30) st.history.shift();
  st.active=null;

  if(!silent && typeof pushLog==="function"){
    pushLog("<b>L'opportunità della Strada è scaduta.</b> Quella proposta non è più disponibile.", "");
  }
  return null;
}
function stradaAggiornaPropostaFabbrica(silent){ return stradaAggiornaOpportunita(silent); }

function stradaOpportunitaAttiva(colpoId){
  const st=stradaOpportunitaStato();
  stradaAggiornaOpportunita(true);
  if(!st.active) return null;
  if(colpoId && st.active.colpoId!==colpoId) return null;
  return st.active;
}
function stradaFabbricaLeadAttivo(colpoId){ return stradaOpportunitaAttiva(colpoId); }

function stradaScegliOpportunita(roll){
  const st=stradaOpportunitaStato();
  const rep=Math.max(0,Number((G.strada&&G.strada.rep)||0));
  let pool=STRADA_OPPORTUNITA.filter(x=>
    rep>=Number(x.minRep||0) &&
    (x.maxRep==null || rep<=Number(x.maxRep)) &&
    !st.recentIds.includes(x.id)
  );
  if(!pool.length)
    pool=STRADA_OPPORTUNITA.filter(x=>
      rep>=Number(x.minRep||0) && (x.maxRep==null || rep<=Number(x.maxRep))
    );
  if(!pool.length) return null;

  const r=Number.isFinite(Number(roll))
    ? Math.max(0,Math.min(.999999,Number(roll)))
    : Math.random();
  return Object.assign({},pool[Math.floor(r*pool.length)]);
}
function stradaFabbricaLeadVariante(roll){ return stradaScegliOpportunita(roll); }

function stradaTentaOpportunita(trigger,roll,variantRoll){
  if(!stradaGiroAvviato() || (G.strada&&G.strada.arresto)) return null;
  /* Le dritta "dal mondo" viaggiano sul TrapPhone. Gli incontri Fabbrica
     restano faccia a faccia e non dipendono dal dispositivo. */
  if(trigger==="mondo" && !stradaHaTrapPhone()) return null;

  const st=stradaOpportunitaStato();
  stradaAggiornaOpportunita(true);
  if(st.active || st.pending) return null;

  const oggi=stradaAbsDay();
  const cfg=STRADA_OPPORTUNITA_TRIGGER[trigger];
  if(!cfg) return null;

  /* Ogni contesto può controllare una volta al giorno: fallire il roll del
     mondo al mattino non deve bruciare la chance Fabbrica della sera. */
  if(Number(st.lastCheckByTrigger[trigger])===oggi) return null;
  st.lastCheckByTrigger[trigger]=oggi;
  st.lastCheckAbsoluteDay=oggi; /* alias legacy */

  if(st.nextOfferAbsoluteDay!=null && oggi<Number(st.nextOfferAbsoluteDay))
    return null;

  const r=roll==null ? Math.random() : Number(roll);
  if(!Number.isFinite(r) || r>=Number(cfg.chance||0)) return null;

  const variante=stradaScegliOpportunita(variantRoll);
  if(!variante) return null;

  st.lastOfferAbsoluteDay=oggi;
  st.nextOfferAbsoluteDay=oggi+Number(cfg.cooldownGiorni||10);
  st.recentIds.unshift(variante.id);
  if(st.recentIds.length>4) st.recentIds.length=4;

  st.pending=Object.assign({
    source:"street-opportunity",
    sourceLabel:"Incontro della Strada",
    trigger:trigger||"unknown",
    status:"offered",
    offeredAbsoluteDay:oggi,
    durataGiorni:Number(cfg.durataGiorni||7)
  },variante);
  return Object.assign({},st.pending);
}

function stradaTentaPropostaFabbrica(roll,variantRoll){
  if(!G.job) return null;
  const luogo=typeof lavoroLuogo==="function" ? lavoroLuogo(G.job) : (G.job.place||null);
  if(luogo!=="fabbrica") return null;
  return stradaTentaOpportunita("fabbrica",roll,variantRoll);
}

function stradaAccettaOpportunita(){
  const st=stradaOpportunitaStato();
  if(!st.pending) return null;
  const oggi=stradaAbsDay();
  const lead=Object.assign({},st.pending,{
    status:"active",
    acceptedAbsoluteDay:oggi,
    expiresAbsoluteDay:oggi+Math.max(1,Number(st.pending.durataGiorni||7))
  });
  st.pending=null;
  st.active=lead;
  st.history.push({
    type:"accepted",
    absoluteDay:oggi,
    opportunityId:lead.id,
    trigger:lead.trigger||null,
    colpoId:lead.colpoId,
    bonusPct:Number(lead.bonusPct||0),
    chanceDelta:Number(lead.chanceDelta||0),
    successHeat:Number(lead.successHeat||0),
    failureHeat:Number(lead.failureHeat||0),
    successRep:Number(lead.successRep||0),
    failureRep:Number(lead.failureRep||0),
    expiresAbsoluteDay:lead.expiresAbsoluteDay
  });
  if(st.history.length>30) st.history.shift();
  return Object.assign({},lead);
}
function stradaAccettaPropostaFabbrica(){ return stradaAccettaOpportunita(); }

function stradaRifiutaOpportunita(){
  const st=stradaOpportunitaStato();
  if(!st.pending) return null;
  const proposta=Object.assign({},st.pending,{status:"declined",declinedAbsoluteDay:stradaAbsDay()});
  st.pending=null;
  st.history.push({
    type:"declined",
    absoluteDay:stradaAbsDay(),
    opportunityId:proposta.id,
    trigger:proposta.trigger||null,
    colpoId:proposta.colpoId
  });
  if(st.history.length>30) st.history.shift();
  return proposta;
}
function stradaRifiutaPropostaFabbrica(){ return stradaRifiutaOpportunita(); }

function stradaAnnullaOpportunita(){
  const st=stradaOpportunitaStato();
  if(!st.pending) return null;
  const proposta=st.pending;
  st.pending=null;
  if(Number(st.lastOfferAbsoluteDay)===Number(proposta.offeredAbsoluteDay)){
    st.lastOfferAbsoluteDay=null;
    st.nextOfferAbsoluteDay=null;
    if(Array.isArray(st.recentIds) && st.recentIds[0]===proposta.id)
      st.recentIds.shift();
  }
  return proposta;
}
function stradaAnnullaPropostaFabbrica(){ return stradaAnnullaOpportunita(); }

function stradaConsumaOpportunita(colpoId,successo){
  const st=stradaOpportunitaStato();
  const lead=stradaOpportunitaAttiva(colpoId);
  if(!lead) return null;
  const usata=Object.assign({},lead,{
    status:"consumed",
    consumedAbsoluteDay:stradaAbsDay(),
    success:!!successo
  });
  st.active=null;
  st.history.push({
    type:"consumed",
    absoluteDay:usata.consumedAbsoluteDay,
    opportunityId:usata.id,
    colpoId:usata.colpoId,
    success:usata.success,
    bonusPct:Number(usata.bonusPct||0),
    chanceDelta:Number(usata.chanceDelta||0),
    heatDelta:Number(successo?usata.successHeat:usata.failureHeat)||0,
    repDelta:Number(successo?usata.successRep:usata.failureRep)||0
  });
  if(st.history.length>30) st.history.shift();
  return usata;
}
function stradaConsumaPropostaFabbrica(colpoId,successo){
  return stradaConsumaOpportunita(colpoId,successo);
}

function stradaChanceConOpportunita(colpo,approccio,lead){
  return clamp(
    stradaChance(colpo,approccio)+Number(lead&&lead.chanceDelta||0),
    .06,.93
  );
}

function stradaEffettiOpportunita(lead,successo){
  if(!lead) return {bonusPct:0,heatDelta:0,repDelta:0};
  if(lead.source==="street-opportunity"){
    return {
      bonusPct:Number(lead.bonusPct||0),
      heatDelta:Number(successo ? lead.successHeat : lead.failureHeat)||0,
      repDelta:Number(successo ? lead.successRep : lead.failureRep)||0
    };
  }
  return {
    bonusPct:Number(lead.bonusPct||0),
    heatDelta:Number(lead.extraHeat||0),
    repDelta:0
  };
}

function stradaChance(colpo, approccio){
  const s = G.strada;
  let p = .62 - colpo.difficolta * .34;
  p += s.rep/100 * .20;
  p += Math.min(s.uomini, 5) * .025;
  p += s.prot * .045;
  p -= s.heat/100 * .30;
  p -= s.precedenti * .035;
  p += approccio.riuscita;
  return clamp(p, .06, .93);
}

function stradaLavaggioStato(){
  const s=G.strada, key=(G.year||1)+":"+(G.week||1);
  if(!s.lavaggio || typeof s.lavaggio!=="object" || s.lavaggio.key!==key) s.lavaggio={key:key,used:0};
  if(typeof s.lavaggio.used!=="number") s.lavaggio.used=0;
  return s.lavaggio;
}

function stradaTenta(colpoId, approccioId){
  const colpo = STRADA_COLPI.find(c => c.id === colpoId);
  const approccio = STRADA_APPROCCI.find(a => a.id === approccioId);
  if(!colpo || !approccio) return;
  const s = G.strada;

  if(G.energy < colpo.energia){ STRADA_SCENA = stScenaAvviso(colpo, "Non hai abbastanza energia per questo colpo (serve " + colpo.energia + ")."); return; }
  if(approccio.serveUomo && s.uomini <= 0){ STRADA_SCENA = stScenaAvviso(colpo, "Ti serve avere almeno un uomo con te."); return; }
  if(approccio.serveFerro && !s.ferro){ STRADA_SCENA = stScenaAvviso(colpo, "Ti serve il ferro, e non ce l'hai ancora."); return; }

  if(stradaAttivitaSbloccate()) s.giroAvviato=true;
  G.energy -= colpo.energia;
  const opportunita = stradaOpportunitaAttiva(colpoId);
  const leadLavoro = !opportunita && window.ADF_WORK_EVENTS &&
    typeof ADF_WORK_EVENTS.crimeLeadActive === "function"
      ? ADF_WORK_EVENTS.crimeLeadActive()
      : null;
  const successo = Math.random() < stradaChanceConOpportunita(colpo,approccio,opportunita);
  const leadUsato = opportunita
    ? stradaConsumaOpportunita(colpoId, successo)
    : (leadLavoro && window.ADF_WORK_EVENTS && typeof ADF_WORK_EVENTS.consumeCrimeLead === "function"
      ? ADF_WORK_EVENTS.consumeCrimeLead(successo)
      : null);
  const effettiLead=stradaEffettiOpportunita(leadUsato,successo);
  const moltiplicatoreLead = 1 + Number(effettiLead.bonusPct||0) / 100;
  const rumore = clamp((6 + colpo.difficolta * 10) * approccio.rumore, 2, 30);
  const rumoreLead = Number(effettiLead.heatDelta||0);
  const reputazioneLead = Number(effettiLead.repDelta||0);
  /* Da smistare, punto 6: "Il giro grosso" segnato in agenda per oggi vale
     il suo peso — è il più rischioso dei sei eventi della settimana, e
     deve rendere in proporzione quando capita davvero quel giorno lì.
     Si legge prima del dado: al colpo ci sei andato anche se va male, e
     l'appuntamento esce dall'agenda lo stesso (giro del 20/09). */
  const peso = (window.AGENDA && typeof AGENDA.consumaPeso === "function")
    ? AGENDA.consumaPeso("colpo") : 1;

  if(successo){
    const grezzo = rnd(colpo.min, colpo.max) * approccio.guadagno * peso * moltiplicatoreLead;
    const pulito = Math.round(grezzo * .4), sporco = Math.round(grezzo * .6);
    G.money += pulito; s.sporchi += sporco;
    s.rep = clamp(s.rep + 3 + colpo.difficolta * 6 + reputazioneLead, 0, 100);
    s.heat = clamp(s.heat + rumore * .6 + rumoreLead, 0, 100);
    diarioBordo().colpi++;
    const fonteLead = leadUsato && leadUsato.source==="street-opportunity"
      ? (leadUsato.titolo||"Opportunità della Strada")
      : (leadUsato && leadUsato.sourceLabel
        ? "Dritta dal lavoro (" + leadUsato.sourceLabel + ")"
        : "Dritta");
    const notaLead = leadUsato
      ? " <b>" + fonteLead + ": " +
        (Number(leadUsato.bonusPct||0)>=0?"+":"") + Number(leadUsato.bonusPct||0) +
        "% guadagno, attenzione " + stradaSegno(rumoreLead) +
        (reputazioneLead ? ", reputazione " + stradaSegno(reputazioneLead) : "") + ".</b>"
      : "";
    STRADA_SCENA = {k:"Com'è andata", titolo:"Andata bene", testo:"<b>" + colpo.n + "</b>: " + fmt(pulito) + " € in tasca, " +
        fmt(sporco) + " € sporchi da ripulire. In giro si comincia a parlarne." + notaLead,
      opts:[{n:"Continua", d:"Torni alla strada", run(){ STRADA_SCENA = null; }}]};
  }else{
    s.heat = clamp(s.heat + rumore + rumoreLead, 0, 100);
    if(reputazioneLead) s.rep=clamp(s.rep+reputazioneLead,0,100);
    const notaLeadFallita = leadUsato
      ? (leadUsato.source==="street-opportunity"
          ? " <b>L'opportunità «" + (leadUsato.titolo||"senza nome") + "» è bruciata: attenzione " +
            stradaSegno(rumoreLead) +
            (reputazioneLead ? ", reputazione " + stradaSegno(reputazioneLead) : "") + ".</b>"
          : " La dritta arrivata dal lavoro è bruciata.")
      : "";
    if(approccio.id === "squadra" && s.uomini > 0 && Math.random() < .5){
      s.uomini--;
      STRADA_SCENA = {k:"Com'è andata", titolo:"È andata male", testo:"<b>" + colpo.n + "</b> è saltato. Uno dei tuoi ci è rimasto sotto: " +
          "tu sei rientrato pulito, lui no. Un uomo in meno." + notaLeadFallita,
        opts:[{n:"Continua", d:"Torni alla strada", run(){ STRADA_SCENA = null; }}]};
    }else{
      const ingressoProtetto = !stradaAttivitaSbloccate();
      const primaVolta = s.precedenti === 0 && approccio.id !== "ferro" && colpo.difficolta <= .3;
      if(ingressoProtetto){
        const multa = Math.max(40, Math.round(colpo.min * .45));
        G.money = Math.max(0, G.money - multa);
        STRADA_SCENA = {k:"Com'è andata", titolo:"Saltato, ma sei fuori", testo:"<b>" + colpo.n + "</b> è saltato. " +
            "Perdi " + fmt(multa) + " € e attiri attenzione, ma in questa fase nessuno ha abbastanza per mandarti dentro." + notaLeadFallita,
          opts:[{n:"Continua", d:"", run(){ STRADA_SCENA = null; }}]};
      }else if(primaVolta && Math.random() < .6){
        const multa = Math.round(colpo.min * .8);
        G.money = Math.max(0, G.money - multa);
        STRADA_SCENA = {k:"Com'è andata", titolo:"Denuncia", testo:"<b>" + colpo.n + "</b> è saltato, ma te la cavi con una denuncia e " +
            fmt(multa) + " € di multa. Stavolta è andata." + notaLeadFallita,
          opts:[{n:"Continua", d:"Torni alla strada", run(){ STRADA_SCENA = null; }}]};
      }else{
        const settimane = Math.max(1, Math.round(colpo.pena * approccio.pena *
          (1 + s.precedenti * .35) * (s.avvocato ? .55 : 1)));
        s.precedenti++;
        s.arresto = {settimane:settimane, colpo:colpo.n};
        STRADA_SCENA = {k:"Com'è andata", titolo:"Arrestato", testo:"<b>" + colpo.n + "</b> è saltato, e stavolta non te la cavi: " +
            settimane + (settimane === 1 ? " settimana dentro" : " settimane dentro") +
            ". Niente musica, niente strada: solo il tempo che passa." + notaLeadFallita,
          opts:[{n:"Continua", d:"", run(){ STRADA_SCENA = null; }}]};
      }
    }
  }
  save(); renderStrada(); renderGioco();
}

/* ==================== SOLDI SPORCHI ====================
   Le azioni piccole (ripulire, prendere un uomo, rilevare un'attività) tornano
   la frase da mostrare: il pannello la fa comparire in basso, senza fermare
   niente. Chi non può fare la cosa riceve il motivo, non il silenzio. */
function stradaCapienzaTotale(){
  let cap=400;
  for(const a of STRADA_ATTIVITA) if(G.strada.attivita[a.id]) cap+=a.resa;
  return cap;
}
function stradaCapienza(){
  return Math.max(0,stradaCapienzaTotale()-stradaLavaggioStato().used);
}
function stradaTempoRiciclaggio(){
  try{
    if(typeof GAME_EVENTS !== "undefined" && GAME_EVENTS.blocked && GAME_EVENTS.blocked())
      return "Prima devi risolvere l'evento in corso.";
  }catch(_){}
  if(typeof GAME_TIME === "undefined") return null;
  const minuti = typeof GAME_TIME.durationFor === "function" ? GAME_TIME.durationFor("ricicla") : 45;
  if(typeof GAME_TIME.remaining === "function" && GAME_TIME.remaining() < minuti)
    return "È troppo tardi per ripulire adesso: servono " +
      (GAME_TIME.formatDuration ? GAME_TIME.formatDuration(minuti) : minuti + " minuti") + ".";
  const tx = GAME_TIME.advance(minuti, "crime:launder");
  if(tx && tx.blocked) return "Prima devi chiudere quello che stai facendo.";
  return null;
}
function stradaRipulisci(){
  const s = G.strada;
  if(s.arresto) return "Sei in carcere: non puoi ripulire i soldi finché non esci.";
  if(s.sporchi <= 0) return "Non hai soldi sporchi da ripulire.";
  if(stradaCapienza()<=0) return "Hai già usato tutta la capacità di ripulitura di questa settimana.";
  const tempoRiciclaggio = stradaTempoRiciclaggio();
  if(tempoRiciclaggio) return tempoRiciclaggio;
  const importo = Math.min(s.sporchi, stradaCapienza());
  const soglia = 400;
  const bassa = Math.min(importo, soglia), alta = Math.max(0, importo - soglia);
  const pulito = Math.round(bassa * .58 + alta * .86);
  s.sporchi -= importo;
  stradaLavaggioStato().used += importo;
  G.money += pulito;
  s.heat = clamp(s.heat + 2, 0, 100);
  pushLog("Ripuliti " + fmt(importo) + " € sporchi: in tasca ne restano " + fmt(pulito) + " €.", "");
  save(); renderStrada(); renderGioco();
  return "Ripuliti " + fmt(importo) + " €: in tasca ne restano " + fmt(pulito) + " €.";
}

/* ==================== CHI TI COPRE ==================== */
function stAssumiUomo(){
  const s = G.strada;
  if(s.uomini >= STRADA_UOMO_MAX) return "Hai già cinque uomini: di più non se ne tengono.";
  if(G.money < STRADA_UOMO_COSTO) return "Non hai " + fmt(STRADA_UOMO_COSTO) + " € per prenderne un altro.";
  G.money -= STRADA_UOMO_COSTO; s.uomini++;
  pushLog("Hai preso un uomo in più: ora sono " + s.uomini + ".", "");
  save(); renderStrada(); renderGioco();
  return "Uno dei tuoi si è unito al giro: ora siete in " + s.uomini + ".";
}
function stLicenziaUomo(){
  const s = G.strada;
  if(s.uomini <= 0) return "Non hai nessuno da mandare via.";
  s.uomini--;
  save(); renderStrada(); renderGioco();
  return "Uno se n'è andato. Ne restano " + s.uomini + ".";
}
function stImpostaProtezione(livello){
  G.strada.prot = clamp(livello, 0, STRADA_PROT.length - 1);
  save(); renderStrada(); renderGioco();
  const p = STRADA_PROT[G.strada.prot];
  return G.strada.prot === 0 ? "Niente protezione: da qui in poi sei scoperto."
    : "Protezione: " + p.n.toLowerCase() + ", " + fmt(p.costo) + " €/sett.";
}
function stCompraFerro(){
  const s = G.strada;
  if(s.ferro) return "Il ferro ce l'hai già.";
  if(G.money < STRADA_FERRO_COSTO) return "Non hai " + fmt(STRADA_FERRO_COSTO) + " €.";
  G.money -= STRADA_FERRO_COSTO; s.ferro = true;
  pushLog("Hai preso il ferro. Cambia i conti, in bene e in male.", "");
  save(); renderStrada(); renderGioco();
  return "Hai preso il ferro. Cambia i conti, in bene e in male.";
}
function stToggleAvvocato(){
  G.strada.avvocato = !G.strada.avvocato;
  save(); renderStrada(); renderGioco();
  return G.strada.avvocato ? "Avvocato preso: " + fmt(STRADA_AVVOCATO_COSTO) + " €/sett."
    : "Avvocato mandato via.";
}
function stCompraAttivita(id){
  const a = STRADA_ATTIVITA.find(x => x.id === id);
  if(!a) return "";
  if(G.strada.attivita[id]) return a.n + " è già tua.";
  if(G.money < a.costo) return "Non hai " + fmt(a.costo) + " € per rilevare " + a.n.toLowerCase() + ".";
  G.money -= a.costo; G.strada.attivita[id] = true;
  pushLog("Hai rilevato: <b>" + a.n + "</b>.", "good");
  save(); renderStrada(); renderGioco();
  return a.n + " è tua. Adesso puoi ripulire di più.";
}
function stMollaIlGiro(){
  const s = G.strada;
  const costo = Math.max(1500, Math.round(s.sporchi * .3));
  if(s.sporchi >= costo) s.sporchi -= costo;
  else { G.money = Math.max(0, G.money - (costo - s.sporchi)); s.sporchi = 0; }
  s.rep = clamp(s.rep * .7, 0, 100);
  addLuc(15);
  pushLog("<b>Hai mollato il giro.</b> Ti è costato " + fmt(costo) + " €. Qualcuno se la lega al dito.", "");
  save(); renderStrada(); renderGioco();
}


/* ==================== CARCERE EVENTI V2 — 35 SCENE CONTESTUALI ====================
   Regola narrativa: mentre sei detenuto il mondo "normale" non entra dalla
   porta. Qui succedono solo vita interna, rapporti fra detenuti, criminalità
   interna e contatti esterni plausibili (posta, colloqui, legale).
   I cinque HIGH sono obbligatori, persistono al refresh e bloccano il tempo. */

const CARCERE_EVENTI = [
  /* ---------- ROUTINE · 10 ---------- */
  {id:"jail_conta_22",n:"Conta delle ventidue",cat:"routine",tier:"low",weight:1.8,
   run(){G.wellbeing=clamp(G.wellbeing-1,0,100);return {t:"Porte, passi e nomi letti ad alta voce. Benessere -1.",c:"bad"};}},
  {id:"jail_cella_rivoltata",n:"Cella rivoltata",cat:"routine",tier:"medium",weight:1.1,
   run(){G.wellbeing=clamp(G.wellbeing-2,0,100);carcereLuc(-1);return {t:"Ti svuotano il poco che hai e rimettono tutto come capita. Benessere -2, lucidità -1.",c:"bad"};}},
  {id:"jail_mensa_fondo",n:"Tavolo in fondo alla mensa",cat:"routine",tier:"low",weight:1.5,
   run(){G.wellbeing=clamp(G.wellbeing+2,0,100);return {t:"Per mezz'ora mangi senza che nessuno ti chieda niente. Benessere +2.",c:"good"};}},
  {id:"jail_notte_senza_sonno",n:"Notte senza sonno",cat:"routine",tier:"low",weight:1.4,
   run(){carcereLuc(-2);return {t:"Nel corridoio non smettono di parlare. Lucidità -2.",c:"bad"};}},
  {id:"jail_acqua_fredda",n:"Acqua fredda",cat:"routine",tier:"low",weight:1.1,
   run(){G.wellbeing=clamp(G.wellbeing-1,0,100);carcereLuc(1);return {t:"Doccia gelata. Ti sveglia, ma non ti migliora la giornata. Benessere -1, lucidità +1.",c:""};}},
  {id:"jail_biblioteca",n:"Un'ora in biblioteca",cat:"routine",tier:"low",weight:1.25,minDays:3,
   run(){carcereLuc(2);carcereSkill("scrittura",.25);return {t:"Un'ora senza televisori né urla. Lucidità +2, scrittura +0,25.",c:"good"};}},
  {id:"jail_pulizie",n:"Turno nel corridoio",cat:"routine",tier:"low",weight:1.0,minDays:2,
   run(){G.wellbeing=clamp(G.wellbeing-1,0,100);carcereLuc(1);return {t:"Secchio, pavimento, un'ora che passa. Benessere -1, lucidità +1.",c:""};}},
  {id:"jail_sopravvitto",n:"Due cose dal sopravvitto",cat:"routine",tier:"medium",weight:.8,
   when:()=>Number(G.money)>=12,
   run(){G.money-=12;G.wellbeing=clamp(G.wellbeing+2,0,100);return {t:"Dodici euro per rendere la cella un po' meno ostile. -12 €, benessere +2.",c:""};}},
  {id:"jail_cambio_braccio",n:"Cambio di braccio",cat:"routine",tier:"medium",weight:.72,minDays:10,cooldown:28,
   run(){G.wellbeing=clamp(G.wellbeing-2,0,100);return {t:"Nuove porte, nuovi nomi, stesse regole da capire. Benessere -2.",c:"bad"};}},
  {id:"jail_infermeria",n:"Passaggio in infermeria",cat:"routine",tier:"medium",weight:.75,
   when:()=>Number(G.wellbeing)<=48,
   run(){G.wellbeing=clamp(G.wellbeing+4,0,100);return {t:"Ti controllano e per una volta nessuno ti chiede di essere duro. Benessere +4.",c:"good"};}},

  /* ---------- RAPPORTI TRA DETENUTI · 8 ---------- */
  {id:"jail_compagno_parla",n:"Il compagno rompe il silenzio",cat:"rapporti",tier:"low",weight:1.25,minDays:2,
   run(){G.wellbeing=clamp(G.wellbeing+1,0,100);return {t:"Dieci minuti di discorsi normali. Benessere +1.",c:"good"};}},
  {id:"jail_vecchio_consiglio",n:"Uno che è qui da anni",cat:"rapporti",tier:"medium",weight:.9,minDays:6,
   when:s=>(Number(s.precedenti)||0)<=1,
   run(){carcereLuc(2);G.strada.rep=clamp((G.strada.rep||0)+.2,0,100);return {t:"Ti spiega cosa conviene non fare quando sei nuovo. Lucidità +2, reputazione +0,2.",c:"good"};}},
  {id:"jail_tavolo_cortile",n:"Posto al tavolo del cortile",cat:"rapporti",tier:"medium",weight:1.0,minDays:7,
   when:s=>(Number(s.rep)||0)<30,
   run(){G.strada.rep=clamp((G.strada.rep||0)+.4,0,100);G.wellbeing=clamp(G.wellbeing+1,0,100);return {t:"Ti fanno spazio senza tante parole. Reputazione +0,4, benessere +1.",c:"good"};}},
  {id:"jail_riconosciuto_dentro",n:"La tua voce è arrivata fin qui",cat:"rapporti",tier:"medium",weight:.72,minFans:500,
   run(){G.wellbeing=clamp(G.wellbeing+3,0,100);return {t:"Un detenuto conosce un tuo pezzo. Non è un fan per strada: è uno qui dentro con te. Benessere +3.",c:"good"};}},
  {id:"jail_favore_piccolo",n:"Un favore da niente",cat:"rapporti",tier:"medium",weight:.86,minDays:5,minRep:3,
   run(){G.strada.rep=clamp((G.strada.rep||0)+.6,0,100);G.wellbeing=clamp(G.wellbeing-1,0,100);return {t:"Gli sistemi una cosa piccola e adesso si ricordano che l'hai fatto. Reputazione +0,6, benessere -1.",c:""};}},
  {id:"jail_chiamano_nome",n:"Ti chiamano per nome",cat:"rapporti",tier:"medium",weight:.72,minRep:15,
   run(){G.strada.rep=clamp((G.strada.rep||0)+.5,0,100);G.wellbeing=clamp(G.wellbeing+1,0,100);return {t:"Non sei più soltanto quello della cella in fondo. Reputazione +0,5, benessere +1.",c:"good"};}},
  {id:"jail_aria_pesante",n:"Aria pesante nel braccio",cat:"rapporti",tier:"medium",weight:.85,minDays:12,
   run(){G.wellbeing=clamp(G.wellbeing-2,0,100);G.strada.rep=clamp((G.strada.rep||0)+.2,0,100);return {t:"Nessuno fa niente, ma tutti guardano tutti. Benessere -2, reputazione +0,2.",c:"bad"};}},
  {id:"jail_barre_quaderno",n:"Barre sul quaderno",cat:"rapporti",tier:"low",weight:1.0,minDays:5,
   run(){carcereLuc(1);carcereSkill("scrittura",.35);return {t:"Uno scrive due righe, tu ne aggiungi quattro. Lucidità +1, scrittura +0,35.",c:"good"};}},

  /* ---------- CRIMINALITÀ INTERNA · 7 ---------- */
  {id:"jail_voce_giro",n:"Una voce dal giro passa le sbarre",cat:"crime",tier:"medium",weight:1.0,minRep:4,
   run(){G.strada.rep=clamp((G.strada.rep||0)+.5,0,100);return {t:"Qualcuno ti fa arrivare due nomi e una notizia da fuori. Reputazione +0,5.",c:"good"};}},
  {id:"jail_messaggio_piegato",n:"Messaggio piegato in quattro",cat:"crime",tier:"medium",weight:.82,minRep:12,minDays:7,
   run(){G.strada.rep=clamp((G.strada.rep||0)+.4,0,100);carcereLuc(1);return {t:"Poche parole, abbastanza per capire che fuori si stanno muovendo. Reputazione +0,4, lucidità +1.",c:""};}},
  {id:"jail_nome_pesa",n:"Il nome pesa anche dentro",cat:"crime",tier:"medium",weight:.7,minRep:30,
   run(){G.strada.rep=clamp((G.strada.rep||0)+.8,0,100);return {t:"Una conversazione si ferma quando arrivi. Reputazione +0,8.",c:"good"};}},
  {id:"jail_perquisizione_mirata",n:"Perquisizione mirata",cat:"crime",tier:"medium",weight:.66,minDays:8,
   when:s=>(Number(s.rep)||0)>=25||(Number(s.precedenti)||0)>=2,
   run(){G.wellbeing=clamp(G.wellbeing-3,0,100);carcereLuc(-1);return {t:"Questa volta non stanno controllando il piano: stanno controllando te. Benessere -3, lucidità -1.",c:"bad"};}},
  {id:"jail_faccia_giro",n:"Una faccia del giro",cat:"crime",tier:"medium",weight:.72,minRep:18,minDays:10,
   run(){G.strada.rep=clamp((G.strada.rep||0)+.7,0,100);carcereSkill("rete",.25);return {t:"Non vi conoscete, ma conoscete le stesse persone. Reputazione +0,7, rete +0,25.",c:"good"};}},
  {id:"jail_conto_vecchio",n:"Un conto vecchio",cat:"crime",tier:"medium",weight:.62,minPrecedents:1,minDays:10,
   run(){G.wellbeing=clamp(G.wellbeing-2,0,100);G.strada.rep=clamp((G.strada.rep||0)-.4,0,100);return {t:"Un nome del passato torna fuori in una conversazione che non volevi avere. Benessere -2, reputazione -0,4.",c:"bad"};}},
  {id:"jail_fuori_silenzio",n:"Fuori non risponde nessuno",cat:"crime",tier:"medium",weight:.58,minRep:10,minDays:14,
   run(){G.wellbeing=clamp(G.wellbeing-3,0,100);G.strada.rep=clamp((G.strada.rep||0)-.5,0,100);return {t:"Quelli che dicevano «qualsiasi cosa serve» oggi non rispondono. Benessere -3, reputazione -0,5.",c:"bad"};}},

  /* ---------- LEGALE / MONDO ESTERNO · 5 ---------- */
  {id:"jail_busta_legale",n:"Busta dello studio legale",cat:"esterno",tier:"low",weight:1.0,lawyer:true,
   run(){carcereLuc(2);return {t:"Il legale ti aggiorna sulla pratica. Nessun miracolo, ma almeno sai cosa succede. Lucidità +2.",c:"good"};}},
  {id:"jail_carta_casa",n:"Carta da casa",cat:"esterno",tier:"low",weight:.92,minDays:4,
   run(){G.wellbeing=clamp(G.wellbeing+4,0,100);return {t:"Una pagina scritta fuori vale più di quanto pensavi. Benessere +4.",c:"good"};}},
  {id:"jail_posta_nome_arte",n:"Posta col nome d'arte",cat:"esterno",tier:"low",weight:.55,minFans:2000,minDays:7,
   run(){G.wellbeing=clamp(G.wellbeing+3,0,100);return {t:"Qualcuno ha scritto al carcere usando il tuo nome d'arte. Il pubblico è fuori, la lettera è qui. Benessere +3.",c:"good"};}},
  {id:"jail_vetro_vuoto",n:"Vetro del colloquio vuoto",cat:"esterno",tier:"medium",weight:.68,minDays:7,
   run(){G.wellbeing=clamp(G.wellbeing-3,0,100);return {t:"Aspetti un colloquio che oggi non arriva. Benessere -3.",c:"bad"};}},
  {id:"jail_udienza_spostata",n:"Data dell'udienza spostata",cat:"esterno",tier:"medium",weight:.62,lawyer:true,minWeeks:3,minDays:10,
   run(){G.wellbeing=clamp(G.wellbeing-2,0,100);carcereLuc(1);return {t:"Il legale ti dice che la data si sposta ancora. Benessere -2, lucidità +1.",c:""};}},

  /* ---------- HIGH · 5 · SEMPRE SCELTA ---------- */
  {id:"jail_high_schieramento",n:"Nel cortile vogliono una risposta",cat:"high",tier:"high",weight:1,minDays:10,minRep:8,once:true,
   desc:()=>"Due gruppi hanno smesso di parlarsi e qualcuno decide che anche il tuo silenzio è una risposta. Vogliono sapere da che parte stai.",
   choices:()=>[
     {n:"Resti neutrale",d:"Provi a far capire che non sei entrato nel loro conto",
      run(){const p=(G.skills&&Number(G.skills.presenza))||0;if(p>=32){G.wellbeing=clamp(G.wellbeing+1,0,100);return {t:"La fai passare senza sembrare debole. Benessere +1.",c:"good"};}G.wellbeing=clamp(G.wellbeing-3,0,100);G.strada.rep=clamp((G.strada.rep||0)-1,0,100);return {t:"La neutralità viene letta come paura. Benessere -3, reputazione -1.",c:"bad"};}},
     {n:"Prendi una parte",d:"Dentro peserai di più, ma il braccio diventa più stretto",
      run(){G.strada.rep=clamp((G.strada.rep||0)+4,0,100);G.wellbeing=clamp(G.wellbeing-5,0,100);return {t:"Adesso sanno dove stai. Reputazione +4, benessere -5.",c:""};}},
     {n:"Provi a spegnere la cosa",d:"Presenza e reputazione decidono se ti ascoltano",
      run(){const score=((G.skills&&Number(G.skills.presenza))||0)+(G.strada.rep||0)*.45;if(score>=45){G.strada.rep=clamp((G.strada.rep||0)+2,0,100);G.wellbeing=clamp(G.wellbeing+1,0,100);return {t:"Non hai risolto il carcere, hai evitato una guerra stupida. Reputazione +2, benessere +1.",c:"good"};}G.wellbeing=clamp(G.wellbeing-4,0,100);return {t:"Nessuno ti ha chiesto di mediare. Benessere -4.",c:"bad"};}}
   ]},
  {id:"jail_high_telefono",n:"Un telefono passa di mano",cat:"high",tier:"high",weight:1,minDays:14,once:true,
   when:s=>(Number(s.rep)||0)>=15||(Number(s.precedenti)||0)>=2,
   desc:()=>"Per pochi minuti arriva fino a te un telefono che non dovrebbe essere nel braccio. Puoi usarlo, rifiutarlo o farlo passare senza toccarlo.",
   choices:ctx=>[
     {n:"Fai una chiamata",d:"Parli con fuori, ma se arriva una perquisizione paghi tu",
      run(){if(Math.random()<.34){const c=carcereStato();c.airBlockedUntil=carcereSerialeGiorno()+3;G.wellbeing=clamp(G.wellbeing-4,0,100);return {t:"Il telefono sparisce, ma il controllo arriva dopo. Ora d'aria sospesa per 3 giorni, benessere -4.",c:"bad"};}G.strada.rep=clamp((G.strada.rep||0)+2,0,100);carcereLuc(1);return {t:"Due minuti con fuori e il telefono riparte. Reputazione +2, lucidità +1.",c:"good"};}},
     {n:"Lo rifiuti",d:"Nessun rischio disciplinare, qualcuno però se lo ricorda",
      run(){G.strada.rep=clamp((G.strada.rep||0)-1,0,100);G.wellbeing=clamp(G.wellbeing+1,0,100);return {t:"Non lo tocchi. Reputazione -1, benessere +1.",c:""};}},
     {n:"Lo fai passare",d:"Non chiami nessuno, ma non blocchi il favore",
      run(){G.strada.rep=clamp((G.strada.rep||0)+1,0,100);return {t:"Il telefono continua il suo giro. Reputazione +1.",c:""};}}
   ]},
  {id:"jail_high_vecchio_opp",n:"Una faccia del passato nel braccio",cat:"high",tier:"high",weight:1,minDays:18,minRep:24,minPrecedents:1,once:true,
   desc:()=>"Nel cortile riconosci una faccia legata a un conto vecchio. Anche lui ti ha riconosciuto. Questa volta nessuno può semplicemente cambiare strada.",
   choices:()=>[
     {n:"Parli prima che salga",d:"Provi a chiuderla con la testa",
      run(){const p=(G.skills&&Number(G.skills.presenza))||0;if(p+(G.strada.rep||0)*.3>=40){G.strada.rep=clamp((G.strada.rep||0)+1,0,100);G.wellbeing=clamp(G.wellbeing+1,0,100);return {t:"Non diventate amici, ma il conto resta fuori dal cortile. Reputazione +1, benessere +1.",c:"good"};}G.wellbeing=clamp(G.wellbeing-4,0,100);G.strada.rep=clamp((G.strada.rep||0)-1,0,100);return {t:"Le parole non bastano e la tensione resta lì. Benessere -4, reputazione -1.",c:"bad"};}},
     {n:"Lo affronti",d:"Rischio alto: reputazione o una settimana fisicamente pesante",
      run(){const p=(G.skills&&Number(G.skills.presenza))||0;const win=Math.random()<clamp(.30+(G.strada.rep||0)/220+p/190,.2,.78);if(win){G.strada.rep=clamp((G.strada.rep||0)+5,0,100);G.wellbeing=clamp(G.wellbeing-4,0,100);return {t:"La situazione finisce dalla tua parte. Reputazione +5, benessere -4.",c:"good"};}G.wellbeing=clamp(G.wellbeing-12,0,100);G.strada.rep=clamp((G.strada.rep||0)-2,0,100);return {t:"Hai scelto lo scontro e l'hai pagato. Benessere -12, reputazione -2.",c:"bad"};}},
     {n:"Chiedi di cambiare sezione",d:"Ti togli dal problema, ma dentro si legge in un solo modo",
      run(){G.strada.rep=clamp((G.strada.rep||0)-3,0,100);G.wellbeing=clamp(G.wellbeing+3,0,100);return {t:"Il problema resta dall'altra parte di una porta. Reputazione -3, benessere +3.",c:""};}}
   ]},
  {id:"jail_high_disciplinare",n:"Rapporto sul tavolo del comandante",cat:"high",tier:"high",weight:1,minDays:12,once:true,
   desc:()=>"Ti chiamano fuori dalla cella: c'è un rapporto disciplinare con il tuo nome. Non è un processo, ma può rendere i prossimi giorni molto più stretti.",
   choices:ctx=>[
     {n:"Testa bassa",d:"Non contesti e assorbi la sanzione",
      run(){const c=carcereStato();c.airBlockedUntil=carcereSerialeGiorno()+2;G.wellbeing=clamp(G.wellbeing-2,0,100);return {t:"Due giorni senza ora d'aria. Benessere -2.",c:"bad"};}},
     {n:"Contesti il rapporto",d:"Se reggi la versione eviti la sanzione, altrimenti peggiora",
      run(){const p=(G.skills&&Number(G.skills.presenza))||0;if(p>=35||Math.random()<.42){carcereLuc(1);return {t:"Il rapporto non regge abbastanza per toglierti il cortile. Lucidità +1.",c:"good"};}const c=carcereStato();c.airBlockedUntil=carcereSerialeGiorno()+4;G.wellbeing=clamp(G.wellbeing-3,0,100);return {t:"Hai contestato e non è servito: quattro giorni senza ora d'aria, benessere -3.",c:"bad"};}},
     {n:"Fai intervenire il legale",d:"Il legale riduce il danno amministrativo",
      when:()=>!!G.strada.avvocato,
      run(){const c=carcereStato();c.airBlockedUntil=carcereSerialeGiorno()+1;carcereLuc(2);return {t:"Il legale riduce la sanzione a un giorno senza ora d'aria. Lucidità +2.",c:"good"};}}
   ]},
  {id:"jail_high_quando_esci",n:"Ti aspettano quando esci",cat:"high",tier:"high",weight:1,minDays:21,minRep:35,minWeeks:3,once:true,
   desc:()=>"Un messaggio arriva attraverso il giro: quando esci c'è posto per te in una cosa più grossa. Nessun dettaglio scritto, proprio per questo capisci che è seria.",
   choices:()=>[
     {n:"Dici sì",d:"Dentro guadagni peso; fuori tornerai con più reputazione e più attenzione",
      run(){const c=carcereStato();c.releaseRepBonus=(c.releaseRepBonus||0)+4;c.releaseHeatBonus=(c.releaseHeatBonus||0)+5;G.strada.rep=clamp((G.strada.rep||0)+2,0,100);G.wellbeing=clamp(G.wellbeing-2,0,100);return {t:"La risposta torna fuori: sì. Reputazione +2 adesso; all'uscita il giro e l'attenzione ti aspettano.",c:""};}},
     {n:"Dici no",d:"Perdi peso nel giro, ma esci senza quella promessa addosso",
      run(){G.strada.rep=clamp((G.strada.rep||0)-3,0,100);G.wellbeing=clamp(G.wellbeing+2,0,100);return {t:"Hai chiuso la porta prima di uscire. Reputazione -3, benessere +2.",c:""};}},
     {n:"Non dai una risposta",d:"Lasci uno spiraglio senza impegnarti",
      run(){const c=carcereStato();c.releaseRepBonus=(c.releaseRepBonus||0)+1;c.releaseHeatBonus=(c.releaseHeatBonus||0)+1;carcereLuc(-1);return {t:"Non hai detto né sì né no. All'uscita qualcosa sarà ancora aperto. Lucidità -1.",c:""};}}
   ]}
];

function carcereDetenuto(){return !!(G.strada&&G.strada.arresto);}
function carcereSerialeGiorno(){return (((Math.max(1,Number(G.year)||1)-1)*52+(Math.max(1,Number(G.week)||1)-1))*7+(Math.max(1,Number(G.day)||1)-1));}
function carcereSerialeSettimana(){return (Math.max(1,Number(G.year)||1)-1)*52+Math.max(1,Number(G.week)||1);}
function carcereLuc(n){if(typeof addLuc==="function")addLuc(n);else G.lucidita=clamp((Number(G.lucidita)||0)+n,0,100);}
function carcereSkill(k,n){if(typeof gain==="function")gain(k,n);else{G.skills=G.skills||{};G.skills[k]=clamp((Number(G.skills[k])||0)+n,0,88);}}

function carcereStato(){
  if(!carcereDetenuto())return null;
  const s=G.strada,a=s.arresto,d=carcereSerialeGiorno();
  if(!a.jailId)a.jailId="J:"+(G.year||1)+":"+(G.week||1)+":"+(G.day||1)+":"+(s.precedenti||0)+":"+String(a.colpo||"arresto");
  if(!s.carcere||typeof s.carcere!=="object"||s.carcere.jailId!==a.jailId){
    s.carcere={jailId:a.jailId,eventi:[],recenti:[],seen:{},lastEventDay:d,lastHighDay:d-30,startedDay:d,
      daily:{key:d},weekly:{key:carcereSerialeSettimana()},ricorsoUsato:false,pendingHigh:null,airBlockedUntil:0,
      releaseRepBonus:0,releaseHeatBonus:0};
  }
  const c=s.carcere;
  if(!Array.isArray(c.eventi))c.eventi=[];
  if(!Array.isArray(c.recenti))c.recenti=[];
  if(!c.seen||typeof c.seen!=="object")c.seen={};
  if(!Number.isFinite(c.startedDay))c.startedDay=d;
  if(!Number.isFinite(c.lastHighDay))c.lastHighDay=d-30;
  if(!Number.isFinite(c.airBlockedUntil))c.airBlockedUntil=0;
  if(!Number.isFinite(c.releaseRepBonus))c.releaseRepBonus=0;
  if(!Number.isFinite(c.releaseHeatBonus))c.releaseHeatBonus=0;
  const dk=carcereSerialeGiorno();if(!c.daily||c.daily.key!==dk)c.daily={key:dk};
  const wk=carcereSerialeSettimana();if(!c.weekly||c.weekly.key!==wk)c.weekly={key:wk};
  return c;
}
function carcereCtx(){
  const c=carcereStato(),s=G.strada,a=s&&s.arresto;
  return {state:c,street:s,arrest:a,day:carcereSerialeGiorno(),days:c?Math.max(0,carcereSerialeGiorno()-c.startedDay):0,
    weeks:a?Math.max(0,Number(a.settimane)||0):0,rep:s?Number(s.rep)||0:0,precedents:s?Number(s.precedenti)||0:0,
    fans:Number(G.fans)||0,lawyer:!!(s&&s.avvocato)};
}
function carcereEligible(e,ctx){
  if(e.minDays!=null&&ctx.days<e.minDays)return false;
  if(e.minRep!=null&&ctx.rep<e.minRep)return false;
  if(e.minPrecedents!=null&&ctx.precedents<e.minPrecedents)return false;
  if(e.minFans!=null&&ctx.fans<e.minFans)return false;
  if(e.minWeeks!=null&&ctx.weeks<e.minWeeks)return false;
  if(e.lawyer===true&&!ctx.lawyer)return false;
  if(e.lawyer===false&&ctx.lawyer)return false;
  if(e.once&&ctx.state.seen[e.id])return false;
  if(e.cooldown){
    const last=ctx.state.eventLast&&Number(ctx.state.eventLast[e.id]);
    if(Number.isFinite(last)&&ctx.day-last<e.cooldown)return false;
  }
  if(e.when&&!e.when(ctx.street,ctx))return false;
  return true;
}
function carcerePick(pool){
  if(!pool.length)return null;
  let total=pool.reduce((n,e)=>n+Math.max(.05,Number(e.weight)||1),0),r=Math.random()*total;
  for(const e of pool){r-=Math.max(.05,Number(e.weight)||1);if(r<=0)return e;}
  return pool[pool.length-1];
}
function carcereChanged(){try{window.dispatchEvent(new CustomEvent("jail:changed"));}catch(_){}}
function carcereRegistra(id,titolo,testo,kind){
  const c=carcereStato();if(!c)return;
  c.eventi.unshift({id:id,t:titolo,txt:testo,kind:kind||"evento",year:G.year||1,week:G.week||1,day:G.day||1});
  if(c.eventi.length>14)c.eventi.length=14;
}
function carcereMark(e,ctx){
  const c=ctx.state;
  c.eventLast=c.eventLast||{};c.eventLast[e.id]=ctx.day;
  c.recenti.unshift(e.id);if(c.recenti.length>7)c.recenti.length=7;
  if(e.once)c.seen[e.id]=true;
}
function carcereModalLayer(on){
  const m=document.getElementById("modal");if(!m)return;
  if(on){
    if(m.dataset.jailOldZ==null)m.dataset.jailOldZ=m.style.zIndex||"";
    m.style.zIndex="130";document.body.classList.add("adf-jail-high");
  }else{
    m.style.zIndex=m.dataset.jailOldZ||"";delete m.dataset.jailOldZ;
    document.body.classList.remove("adf-jail-high");
  }
}
function carcereHighObject(e){
  const ctx=carcereCtx(),choices=(typeof e.choices==="function"?e.choices(ctx):[]).filter(o=>!o.when||o.when(ctx));
  return {k:"CARCERE · DECISIONE",t:e.n,d:typeof e.desc==="function"?e.desc(ctx):String(e.desc||""),
    opts:choices.map(o=>({n:o.n,d:o.d,run(){return carcereResolveHigh(e,o);}}))};
}
function carcereResolveHigh(e,o){
  const ctx=carcereCtx(),c=ctx.state;
  const r=(o&&o.run?o.run(ctx):null)||{t:e.n,c:""};
  c.pendingHigh=null;c.lastHighDay=ctx.day;carcereMark(e,ctx);
  carcereRegistra(e.id,e.n,r.t||e.n,"high");
  carcereModalLayer(false);carcereChanged();if(typeof save==="function")save();
  return r;
}
function carcereShowHigh(e){
  if(!e||!carcereDetenuto())return false;
  const c=carcereStato();if(c.pendingHigh)return false;
  c.pendingHigh=e.id;carcereModalLayer(true);if(typeof save==="function")save();
  const obj=carcereHighObject(e);
  if(typeof SALTO!=="undefined"&&SALTO){
    if(typeof SALTO_STOP!=="undefined")SALTO_STOP=obj;
    return true;
  }
  setTimeout(()=>{if(typeof showEvent==="function")showEvent(obj);},80);
  return true;
}
function carcereRestoreHigh(){
  if(!carcereDetenuto())return false;
  const c=carcereStato();if(!c.pendingHigh)return false;
  const e=CARCERE_EVENTI.find(x=>x.id===c.pendingHigh&&x.tier==="high");
  if(!e){c.pendingHigh=null;carcereModalLayer(false);return false;}
  const m=document.getElementById("modal");
  if(m&&m.classList.contains("on"))return false;
  carcereModalLayer(true);setTimeout(()=>{if(typeof showEvent==="function")showEvent(carcereHighObject(e));},80);
  return true;
}
function carcereGiorno(){
  if(!carcereDetenuto())return false;
  const ctx=carcereCtx(),c=ctx.state,d=ctx.day;
  if(c.pendingHigh)return false;
  const gap=d-(Number.isFinite(c.lastEventDay)?c.lastEventDay:d);
  if(gap<4)return false;
  if(gap<8&&Math.random()>=.28)return false;

  const recent=new Set(c.recenti.slice(0,4));
  const highReady=ctx.days>=10&&(d-c.lastHighDay)>=18;
  const highPool=CARCERE_EVENTI.filter(e=>e.tier==="high"&&carcereEligible(e,ctx));
  let e=null;
  if(highReady&&highPool.length&&Math.random()<.22)e=carcerePick(highPool);
  if(!e){
    let pool=CARCERE_EVENTI.filter(e=>e.tier!=="high"&&carcereEligible(e,ctx)&&!recent.has(e.id));
    if(!pool.length)pool=CARCERE_EVENTI.filter(e=>e.tier!=="high"&&carcereEligible(e,ctx));
    e=carcerePick(pool);
  }
  if(!e)return false;
  c.lastEventDay=d;
  if(e.tier==="high")return carcereShowHigh(e);

  const r=(e.run?e.run(ctx):null)||{t:e.n,c:""};
  carcereMark(e,ctx);carcereRegistra(e.id,e.n,r.t||e.n,e.tier);
  carcereChanged();if(typeof save==="function")save();return true;
}
function carcereTempo(minuti,id){
  if(carcereStato()&&carcereStato().pendingHigh)return {ok:false,t:"Prima devi prendere la decisione aperta in carcere."};
  try{
    if(typeof GAME_TIME==="undefined")return {ok:true};
    if(GAME_TIME.remaining()<minuti)return {ok:false,t:"Non c'è abbastanza tempo prima delle 04:00."};
    const r=GAME_TIME.advance(minuti,"jail:"+id,{detail:{jail:true,jailAction:id}});
    if(r&&r.blocked)return {ok:false,t:"Adesso il tempo è bloccato da un'altra situazione."};
  }catch(_){}
  return {ok:true};
}
function carcereAirDays(c){
  return Math.max(0,(Number(c.airBlockedUntil)||0)-carcereSerialeGiorno());
}
function carcereAzioni(){
  const c=carcereStato();if(!c)return [];
  const s=G.strada,a=s.arresto,pending=!!c.pendingHigh;
  let rem=9999;try{if(typeof GAME_TIME!=="undefined")rem=GAME_TIME.remaining();}catch(_){}
  const airDays=carcereAirDays(c),ariaUsata=!!c.daily.aria,giroUsato=!!c.weekly.giro;
  const legaleNoSoldi=!s.avvocato&&Number(G.money)<STRADA_AVVOCATO_COSTO,legaleFine=(Number(a.settimane)||0)<=1;
  return [
    {id:"aria",n:"Ora d'aria",d:"60 min · recuperi un po' di testa e benessere",
     disabled:pending||airDays>0||ariaUsata||rem<60,
     reason:pending?"Decisione in sospeso":airDays>0?"Sospesa per "+airDays+(airDays===1?" giorno":" giorni"):ariaUsata?"Già fatta oggi":rem<60?"Troppo tardi oggi":""},
    {id:"giro",n:"Parla con il giro",d:"45 min · una volta a settimana · reputazione di strada",
     disabled:pending||giroUsato||rem<45,
     reason:pending?"Decisione in sospeso":giroUsato?"Già fatto questa settimana":rem<45?"Troppo tardi oggi":""},
    {id:"avvocato",n:s.avvocato?"Parla con l'avvocato":"Chiama un avvocato",
     d:(s.avvocato?"30 min · ricorso incluso nell'incarico":"30 min · 320 € per incaricarlo")+" · può togliere 1 settimana",
     disabled:pending||!!c.ricorsoUsato||legaleNoSoldi||legaleFine||rem<30,
     reason:pending?"Decisione in sospeso":c.ricorsoUsato?"Ricorso già usato in questa detenzione":legaleNoSoldi?"Non hai 320 €":legaleFine?"Ti resta solo 1 settimana":rem<30?"Troppo tardi oggi":""}
  ];
}
function carcereAzione(id){
  if(!carcereDetenuto())return {ok:false,t:"Non sei in carcere."};
  const c=carcereStato(),s=G.strada,a=s.arresto;
  if(c.pendingHigh)return {ok:false,t:"Prima devi prendere la decisione aperta in carcere."};

  if(id==="aria"){
    const airDays=carcereAirDays(c);if(airDays>0)return {ok:false,t:"L'ora d'aria è sospesa ancora per "+airDays+(airDays===1?" giorno.":" giorni.")};
    if(c.daily.aria)return {ok:false,t:"Hai già fatto l'ora d'aria oggi."};
    const tempo=carcereTempo(60,id);if(!tempo.ok)return tempo;c.daily.aria=true;
    G.wellbeing=clamp(G.wellbeing+4,0,100);carcereLuc(3);
    const t="Un'ora fuori dalla cella. Benessere +4, lucidità +3.";carcereRegistra("azione_aria","Ora d'aria",t,"azione");
    carcereChanged();if(typeof save==="function")save();return {ok:true,t:t,c:"good"};
  }
  if(id==="giro"){
    if(c.weekly.giro)return {ok:false,t:"Per questa settimana hai già mosso abbastanza il giro dentro."};
    const tempo=carcereTempo(45,id);if(!tempo.ok)return tempo;c.weekly.giro=true;
    s.rep=clamp((s.rep||0)+.8,0,100);G.wellbeing=clamp(G.wellbeing-1,0,100);
    const t="Due parole nel cortile, niente promesse. Reputazione +0,8, benessere -1.";carcereRegistra("azione_giro","Parla con il giro",t,"azione");
    carcereChanged();if(typeof save==="function")save();return {ok:true,t:t,c:""};
  }
  if(id==="avvocato"){
    if(c.ricorsoUsato)return {ok:false,t:"Hai già usato il ricorso in questa detenzione."};
    if((Number(a.settimane)||0)<=1)return {ok:false,t:"Con una sola settimana residua non c'è più margine per il ricorso."};
    if(!s.avvocato&&Number(G.money)<STRADA_AVVOCATO_COSTO)return {ok:false,t:"Ti servono "+STRADA_AVVOCATO_COSTO+" € per incaricare l'avvocato."};
    const tempo=carcereTempo(30,id);if(!tempo.ok)return tempo;
    if(!s.avvocato){G.money-=STRADA_AVVOCATO_COSTO;s.avvocato=true;}
    a.settimane=Math.max(1,(Number(a.settimane)||1)-1);c.ricorsoUsato=true;carcereLuc(2);
    const t="Il legale ottiene una revisione: 1 settimana in meno sulla pena residua. Lucidità +2.";
    carcereRegistra("azione_avvocato","Parla con l'avvocato",t,"azione");
    if(typeof pushLog==="function")pushLog("<b>Dal carcere: ricorso accolto.</b> Una settimana in meno.","good");
    carcereChanged();if(typeof save==="function")save();return {ok:true,t:t,c:"good"};
  }
  return {ok:false,t:"Azione carcere sconosciuta."};
}
function carcereVista(){
  const c=carcereStato();if(!c)return {detenuto:false,azioni:[],eventi:[],pendingHigh:null};
  return {detenuto:true,azioni:carcereAzioni(),eventi:c.eventi.slice(0,10),pendingHigh:c.pendingHigh||null};
}
window.addEventListener("jail-ui:opened",()=>setTimeout(carcereRestoreHigh,100));
window.ADF_JAIL=Object.freeze({
  inJail:carcereDetenuto,day:carcereGiorno,view:carcereVista,act:carcereAzione,
  blocked:()=>!!(carcereStato()&&carcereStato().pendingHigh),restore:carcereRestoreHigh,
  catalog:()=>CARCERE_EVENTI.map(e=>({id:e.id,n:e.n,cat:e.cat,tier:e.tier}))
});

/* ==================== IL CICLO SETTIMANALE ====================
   Chiamata da sim.js, dentro advanceWeek(), prima che la settimana avanzi:
   heat che decade, attività che rendono, uomini/protezione/avvocato che
   costano, la vetrina che alza l'attenzione, il controllo delle sei del
   mattino, gli opp a sorpresa, e — se sei dentro — il carcere che macina
   fan, hype e contratto finché non esci. */
function stradaSettimana(){
  const s = G.strada;

  if(s.arresto){
    s.arresto.settimane--;
    const persi = Math.round(G.fans * rnd(.06, .13));
    if(persi > 0){ G.fans = Math.max(0, G.fans - persi); pushLog(fmt(persi) + " fan spariti mentre eri dentro.", "bad"); }
    G.hype = clamp(G.hype * .72, 0, (typeof hypeCap==="function"?hypeCap():100));
    /* dentro si paga di più: l'avvocato, i pacchi, le telefonate, sopra alle
       spese di fuori che advanceWeek() ha già tolto. Prima non lo diceva
       nessuno e il resoconto ne mostrava una sola (giro del 27/09, voce 61) */
    const dentro = Math.round(weeklyCosts() * .6);
    G.money -= dentro;
    pushLog("Da dentro costa: <b>−" + fmt(dentro) + " €</b> fra avvocato, pacchi e telefonate, oltre alle spese di fuori.", "bad");
    if(G.contract && Math.random() < .20){
      pushLog("<b>L'etichetta ha rescisso.</b> I giornali ci sono andati pesante.", "bad");
      G.contract = null;
      /* senza contratto la consegna non esiste più: lasciata lì, alla
         scadenza advanceWeek() cercava la penale su un contratto che non c'è
         e la settimana non si chiudeva più (giro del 27/09) */
      G.obligation = null;
    }
    if(s.arresto.settimane <= 0){
      const colpoFatto = s.arresto.colpo;
      const jailFx = s.carcere || {};
      s.arresto = null;
      s.rep = clamp(s.rep + 12 + (Number(jailFx.releaseRepBonus)||0), 0, 100);
      s.heat = clamp(s.heat + (Number(jailFx.releaseHeatBonus)||0), 0, 100);
      if(jailFx.releaseRepBonus || jailFx.releaseHeatBonus)
        pushLog("<b>Quello che hai deciso dentro ti aspetta fuori.</b> Il giro e l'attenzione ripartono da dove li avevi lasciati.", "");
      showEvent({k:"Sei uscito", t:"Fuori", d:"La storia di «" + colpoFatto + "» ti ha seguito fin qui.",
        annulla(){},
        opts:[
          {n:"Raccontala", d:"+lucidità, +hype: la trasformi in un pezzo",
           run(){ addLuc(25); G.hype = clamp(G.hype + 14, 0, (typeof hypeCap==="function"?hypeCap():100)); return {t:"L'hai raccontata. La gente ascolta.", c:"good"}; }},
          {n:"Torna dove avevi lasciato", d:"+reputazione di strada, ma +attenzione",
           run(){ s.rep = clamp(s.rep + 10, 0, 100); s.heat = clamp(s.heat + 8, 0, 100); return {t:"Sei tornato dove eri rimasto.", c:""}; }}
        ]});
    }
    return; /* dentro non succede altro: niente attività, niente opp */
  }

  /* attività: rendita settimanale (45% pulito, 55% sporco), meno la gestione */
  let attive = 0;
  for(const a of STRADA_ATTIVITA){
    if(!s.attivita[a.id]) continue;
    attive++;
    G.money += Math.round(a.resa * .45) - a.gestione;
    s.sporchi += Math.round(a.resa * .55);
  }

  /* Blocco 4: le coperture non sono credito infinito.
     A fine settimana resta attivo solo ciò che puoi davvero pagare. */
  if(s.uomini > 0){
    const prima = s.uomini;
    const pagabili = Math.min(prima, Math.floor(Math.max(0, G.money) / STRADA_UOMO_UPKEEP));
    if(pagabili < prima){
      s.uomini = pagabili;
      pushLog((prima - pagabili === 1 ? "Un uomo se n'è andato" :
        (prima - pagabili) + " uomini se ne sono andati") +
        ": non entrava abbastanza per tenerli.", "");
    }
    G.money -= s.uomini * STRADA_UOMO_UPKEEP;
  }
  if(s.prot > 0){
    const costoProt = STRADA_PROT[s.prot].costo;
    if(G.money >= costoProt) G.money -= costoProt;
    else{
      s.prot = 0;
      pushLog("<b>Protezione saltata.</b> Non avevi abbastanza per pagarla questa settimana.", "bad");
    }
  }
  if(s.avvocato){
    if(G.money >= STRADA_AVVOCATO_COSTO) G.money -= STRADA_AVVOCATO_COSTO;
    else{
      s.avvocato = false;
      pushLog("<b>L'avvocato si è tirato indietro.</b> La parcella non era coperta.", "bad");
    }
  }

  /* attenzione: scende ~6% a settimana, ~12% con l'avvocato */
  s.heat = clamp(s.heat * (1 - (s.avvocato ? .12 : .06)), 0, 100);
  /* la reputazione si sgonfia un po' se non ti fai vedere */
  s.rep = clamp(s.rep - .6, 0, 100);

  /* la vetrina: se il tenore di vita non regge con quello che dichiari */
  const spesa = lifeCost(), entrate = G._entratePulite || 0;
  if(spesa > entrate * 1.5 + 70){
    const osten = (G.life.casa||0) + (G.life.auto||0) * 1.2 + (G.life.look||0) * 1.5 + (G.life.uscite||0) * 1.1;
    const salita = clamp(1.5 + osten * .5, 1.5, 9);
    s.heat = clamp(s.heat + salita, 0, 100);
    s.rep = clamp(s.rep + salita * .5, 0, 100);
  }

  /* il controllo delle sei del mattino, oltre i 50 di attenzione */
  if(s.heat > 50 && Math.random() < .15){
    if(s.ferro){
      s.ferro = false;
      const settimane = Math.max(1, Math.round(2 * (1 + s.precedenti * .35) * (s.avvocato ? .55 : 1)));
      s.precedenti++; s.arresto = {settimane:settimane, colpo:"perquisizione"};
      pushLog("<b>Controllo alle sei del mattino.</b> Il ferro in casa non si spiega da solo.", "bad");
    }else pushLog("Controllo alle sei del mattino. Non hanno trovato niente, ma l'hanno fatto girare in paese.", "");
  }

  /* Gli Opp criminali non possono nascere dal nulla su una carriera pulita. */
  const giroAvviato=stradaGiroAvviato();
  const probOpp = clamp(.018 + s.heat/100 * .05 + s.rep/100 * .04 + attive * .008 - s.prot * .015, .01, .3);
  if(giroAvviato && !s.arresto && Math.random() < probOpp) stradaOpp();
}

function stradaOpp(){
  const s = G.strada;
  showEvent({k:"Fuori programma", t:"Ti aspettano", d:"Non te l'aspettavi: qualcuno ti sta aspettando sotto casa.",
    annulla(){},
    opts:[
      {n:"Scappi", d:"Ti prendono il contante che hai addosso", run(){
        const perso = Math.round(G.money * .15);
        G.money -= perso;
        return {t:"Sei scappato. Ti hanno preso " + fmt(perso) + " €, e in giro si è visto.", c:"bad"};
      }},
      {n:"Li affronti", d:"Rischi, ma se vinci sali", run(){
        const vinci = Math.random() < clamp(.4 + s.rep/200 + Math.min(s.uomini,5) * .05, .15, .85);
        if(vinci){ s.rep = clamp(s.rep + 6, 0, 100); G.hype = clamp(G.hype + 4, 0, (typeof hypeCap==="function"?hypeCap():100));
          return {t:"Li hai affrontati e hai vinto. La cosa gira.", c:"good"}; }
        G.wellbeing = clamp(G.wellbeing - 15, 0, 100);
        return {t:"Li hai affrontati e sei rimasto male. Settimana da dimenticare.", c:"bad"};
      }},
      {n:"Chiami i tuoi", d:"Serve avere qualcuno da chiamare", run(){
        if(s.uomini <= 0) return {t:"Non avevi nessuno da chiamare. Te la sei vista brutta da solo.", c:"bad"};
        if(Math.random() < .72) return {t:"I tuoi sono arrivati in tempo. Liscia.", c:"good"};
        s.uomini--; G.wellbeing = clamp(G.wellbeing - 10, 0, 100);
        return {t:"Uno dei tuoi ci è rimasto sotto per te.", c:"bad"};
      }}
    ]});
}

/* ==================== IL PANNELLO ====================
   Il disegno arriva dal prototipo `attivita-criminali-crime-v8.html`, portato
   dentro al gioco: l'impalcatura sta in index.html, qui c'è quello che cambia.
   Tre pannelli sopra a un fondale che scorre — a sinistra i tuoi numeri, al
   centro i colpi, a destra chi ti copre e le attività — con in basso le tre
   città e il ritorno alla mappa.

   Le scelte del colpo e i suoi esiti restano dentro alla schermata (la scheda
   `#st-modal`, non `showEvent`): questo pannello sta a z-index 93, il modal
   globale a 60, e finirebbe sotto. */

/* Il fondale: trenta immagini che si danno il cambio ogni quindici secondi.
   Sono le stesse del prototipo, ancora servite da un CDN: prima di impacchettare
   per gli store vanno scaricate in `media/photo/` e messe qui coi percorsi
   locali (punto 33), altrimenti a gioco installato non si vedono. */
const STRADA_SFONDI = [
  "media/pagina-attivita-criminali/pagina-attivita-01.jpg",
  "media/pagina-attivita-criminali/pagina-attivita-02.jpg",
  "media/pagina-attivita-criminali/pagina-attivita-03.jpg",
  "media/pagina-attivita-criminali/pagina-attivita-04.jpg",
  "media/pagina-attivita-criminali/pagina-attivita-05.jpg",
  "media/pagina-attivita-criminali/pagina-attivita-06.jpg",
  "media/pagina-attivita-criminali/pagina-attivita-07.png",
  "media/pagina-attivita-criminali/pagina-attivita-08.jpg",
  "media/pagina-attivita-criminali/pagina-attivita-09.png",
  "media/pagina-attivita-criminali/pagina-attivita-10.png",
  "media/pagina-attivita-criminali/pagina-attivita-11.png",
  "media/pagina-attivita-criminali/pagina-attivita-12.png",
  "media/pagina-attivita-criminali/pagina-attivita-13.png",
  "media/pagina-attivita-criminali/pagina-attivita-14.png",
  "media/pagina-attivita-criminali/pagina-attivita-15.jpg",
  "media/pagina-attivita-criminali/pagina-attivita-16.jpg",
  "media/pagina-attivita-criminali/pagina-attivita-17.jpg",
  "media/pagina-attivita-criminali/pagina-attivita-18.jpg",
  "media/pagina-attivita-criminali/pagina-attivita-19.jpg",
  "media/pagina-attivita-criminali/pagina-attivita-20.jpg",
  "media/pagina-attivita-criminali/pagina-attivita-21.jpg",
  "media/pagina-attivita-criminali/pagina-attivita-22.jpg",
  "media/pagina-attivita-criminali/pagina-attivita-23.jpg",
  "media/pagina-attivita-criminali/pagina-attivita-24.jpg",
  "media/pagina-attivita-criminali/pagina-attivita-25.jpg",
  "media/pagina-attivita-criminali/pagina-attivita-26.jpg",
  "media/pagina-attivita-criminali/pagina-attivita-27.jpg",
  "media/pagina-attivita-criminali/pagina-attivita-28.png",
  "media/pagina-attivita-criminali/pagina-attivita-29.jpg",
  "media/pagina-attivita-criminali/pagina-attivita-30.jpg"
];
const STRADA_SFONDO_MS = 15000;
let ST_SFONDO = 0, ST_STRATO = 0, ST_GIRO = null;
const ST_PRECARICATI = new Set();

function stPrecarica(i){
  const k = (i + STRADA_SFONDI.length) % STRADA_SFONDI.length;
  if(ST_PRECARICATI.has(k)) return;
  ST_PRECARICATI.add(k);
  const img = new Image(); img.decoding = "async"; img.src = STRADA_SFONDI[k];
}
function stMostraSfondo(i, subito){
  const strati = [$("st-bgA"), $("st-bgB")];
  if(!strati[0] || !strati[1]) return;
  const prossimo = subito ? strati[0] : strati[1 - ST_STRATO];
  prossimo.style.backgroundImage = 'url("' + STRADA_SFONDI[i] + '")';
  prossimo.classList.add("on");
  if(subito){ ST_STRATO = 0; return; }
  strati[ST_STRATO].classList.remove("on");
  ST_STRATO = 1 - ST_STRATO;
}
/* Il giro parte quando la schermata si apre e si ferma quando si chiude: niente
   timer che macinano mentre giochi da un'altra parte. */
function stAvviaSfondi(){
  stPrecarica(ST_SFONDO); stPrecarica(ST_SFONDO + 1);
  stMostraSfondo(ST_SFONDO, true);
  clearInterval(ST_GIRO);
  ST_GIRO = setInterval(() => {
    ST_SFONDO = (ST_SFONDO + 1) % STRADA_SFONDI.length;
    stPrecarica(ST_SFONDO + 1); stPrecarica(ST_SFONDO + 2);
    stMostraSfondo(ST_SFONDO);
  }, STRADA_SFONDO_MS);
}
function stFermaSfondi(){ clearInterval(ST_GIRO); ST_GIRO = null; }

/* Il messaggio di passaggio in basso: le cose piccole si dicono qui. */
let ST_TOAST = null;
function stToast(t){
  const el = $("st-toast");
  if(!el || !t) return;
  el.textContent = t; el.classList.add("on");
  clearTimeout(ST_TOAST);
  ST_TOAST = setTimeout(() => el.classList.remove("on"), 2200);
}

/* Le tre città: la provincia si gioca, le altre due si guardano. */
const STRADA_CITTA = [
  {id:"provincia", n:"Provincia", d:"4 colpi disponibili", req:null},
  {id:"milano", n:"Milano", d:"4 colpi · livello 10", req:"Livello 10 · fama 50 · hype 40",
   colpi:STRADA_COLPI_MILANO},
  {id:"la", n:"Los Angeles", d:"3 colpi · da GOAT", req:"Si apre da GOAT",
   colpi:STRADA_COLPI_LA}
];
let ST_CITTA = "provincia";

function apriStrada(){
  if(!stradaAttivitaSbloccate()){
    if(typeof pushLog==="function")
      pushLog("La Strada non è ancora un posto a cui sai accedere.", "");
    return;
  }
  hubTap();
  STRADA_SCENA = null;
  ST_CITTA = "provincia";
  renderStrada();
  $("strada").classList.add("on");
  stAvviaSfondi();
}
function chiudiStrada(){
  $("strada").classList.remove("on");
  stFermaSfondi();
}

/* ==================== QUELLO CHE CAMBIA ==================== */
function stRischio(colpo){
  return colpo.difficolta <= .2 ? "Basso" : colpo.difficolta <= .45 ? "Medio" : "Alto";
}
function stClasseRischio(colpo){
  return colpo.difficolta <= .2 ? "risk-low" : colpo.difficolta <= .45 ? "risk-mid" : "risk-high";
}
function stOcchiAddosso(){
  const h = G.strada.heat;
  return h < 20 ? "Nessuno" : h < 45 ? "Qualcuno" : h < 70 ? "Troppi" : "Ti stanno addosso";
}
function stCopertura(){
  const s = G.strada;
  return s.uomini * STRADA_UOMO_UPKEEP + STRADA_PROT[s.prot].costo + (s.avvocato ? STRADA_AVVOCATO_COSTO : 0);
}

/* ---- la testata e la colonna di sinistra ---- */
function renderStBarre(){
  const s = G.strada;
  const art = window.ARTIST || {};
  const citta = (art.city || "").trim() || "Città di provincia";
  $("str-dove").textContent = "Il giro // " + citta;
  $("st-citta").textContent = citta;
  $("st-sett").textContent = G.week;
  $("st-ora").textContent = typeof hubOra === "function" ? hubOra() : "";

  $("st-sporchi").textContent = fmt(s.sporchi) + " €";
  const rip = $("st-ripulisci");
  const ripCap = stradaCapienza();
  const ripMin = typeof GAME_TIME !== "undefined" && GAME_TIME.durationFor ? GAME_TIME.durationFor("ricicla") : 45;
  const ripDur = typeof GAME_TIME !== "undefined" && GAME_TIME.formatDuration ? GAME_TIME.formatDuration(ripMin) : ripMin + " min";
  rip.textContent = s.arresto ? "In carcere: nessuna ripulitura"
    : ripCap <= 0 ? "Limite settimanale raggiunto"
    : "Ripulisci fino a " + fmt(ripCap) + " € · " + ripDur;
  rip.classList.toggle("no", s.sporchi <= 0 || !!s.arresto || ripCap <= 0);
  rip.disabled = !!s.arresto || s.sporchi <= 0 || ripCap <= 0;

  $("st-repn").textContent = Math.round(s.rep);
  $("st-repbar").style.width = clamp(s.rep, 0, 100) + "%";
  $("st-heatn").textContent = Math.round(s.heat);
  $("st-heatbar").style.width = clamp(s.heat, 0, 100) + "%";
  $("st-energia").textContent = G.energy + " / " + G.maxEnergy;
  $("st-puliti").textContent = fmt(G.money) + " €";
  $("st-precedenti").textContent = s.precedenti;
  const occhi = $("st-occhi");
  occhi.textContent = stOcchiAddosso();
  occhi.classList.toggle("hot", s.heat >= 45);
}

/* ---- il centro: i colpi, o il tempo che passa ---- */
function renderStColpi(){
  const s = G.strada;
  const centro = $("st-center"), griglia = $("st-colpi");
  const citta = STRADA_CITTA.find(c => c.id === ST_CITTA);

  if(s.arresto){
    centro.classList.remove("locked");
    griglia.className = "dentro";
    griglia.innerHTML = "<b>Sei dentro</b><p>«" + s.arresto.colpo + "»: ancora " + s.arresto.settimane +
      (s.arresto.settimane === 1 ? " settimana" : " settimane") +
      ". Niente colpi finché non esci — le settimane le fa passare il gioco, non tu.</p>";
    return;
  }

  griglia.className = "crimes";
  if(ST_CITTA !== "provincia"){
    centro.classList.add("locked");
    $("st-lock-n").textContent = citta.n;
    $("st-lock-req").textContent = citta.req;
    griglia.innerHTML = citta.colpi.map((c, i) =>
      '<div class="crime lock"><span class="num">0' + (i + 1) + '</span><b>' + c.n + '</b>' +
      '<p>' + (c.nota ? c.nota : "Si apre quando ci arrivi.") + '</p></div>').join("");
    return;
  }

  centro.classList.remove("locked");
  const leadIncontro = stradaOpportunitaAttiva();
  const leadLavoro = window.ADF_WORK_EVENTS &&
    typeof ADF_WORK_EVENTS.crimeLeadActive === "function"
      ? ADF_WORK_EVENTS.crimeLeadActive()
      : null;
  griglia.innerHTML = STRADA_COLPI.map((c, i) => {
    const senzaEnergia = G.energy < c.energia;
    const leadIncontroQui = leadIncontro && leadIncontro.colpoId === c.id ? leadIncontro : null;
    /* L'opportunità dell'incontro vale solo per il colpo indicato; sugli altri
       colpi un eventuale lead da Buttafuori/Fattorino continua a funzionare. */
    const lead = leadIncontroQui || leadLavoro;
    const giorniLead = lead
      ? Math.max(1, Number(lead.expiresAbsoluteDay) - stradaAbsDay())
      : 0;
    const fonteLead = leadIncontroQui
      ? (leadIncontroQui.titolo||"Opportunità")
      : (lead && lead.sourceLabel ? "Dritta " + lead.sourceLabel : "Dritta lavoro");
    return '<button class="crime' + (senzaEnergia ? " no" : "") + '" data-stcolpo="' + c.id + '">' +
      '<span class="num">0' + (i + 1) + '</span><b>' + c.n + '</b><p>' + c.d + '</p>' +
      '<div class="stchips">' +
        '<span class="stchip money">' + fmt(c.min) + '–' + fmt(c.max) + ' €</span>' +
        '<span class="stchip">' + c.energia + ' energia</span>' +
        '<span class="stchip ' + stClasseRischio(c) + '">Rischio ' + stRischio(c).toLowerCase() + '</span>' +
        (lead
          ? '<span class="stchip money">' + fonteLead + ' ' +
            (Number(lead.bonusPct||0)>=0?'+':'') + Number(lead.bonusPct||0) + '% · ' +
            (lead.source==="street-opportunity"
              ? stradaSegnoPct(lead.chanceDelta) + ' riuscita · '
              : '') +
            giorniLead + (giorniLead === 1 ? ' giorno' : ' giorni') + '</span>'
          : '') +
      '</div><span class="go">→</span></button>';
  }).join("");
}

/* ---- a destra: chi ti copre, le attività ---- */
function renderStCopre(){
  const s = G.strada;
  const prot = STRADA_PROT[s.prot];
  const pieno = s.uomini >= STRADA_UOMO_MAX, caro = G.money < STRADA_UOMO_COSTO;
  $("st-tab-copre").innerHTML =
    '<div class="cover-row"><div class="t"><strong>Uomini (' + s.uomini + '/' + STRADA_UOMO_MAX + ')</strong>' +
      '<span>' + fmt(STRADA_UOMO_COSTO) + ' € all\'ingresso · ' + fmt(STRADA_UOMO_UPKEEP) + ' €/sett.</span></div>' +
      '<div class="pills"><button class="pill' + (pieno || caro ? " no" : "") + '" data-stuomo="piu">+ Prendi</button>' +
      (s.uomini > 0 ? '<button class="pill" data-stuomo="meno">Manda via</button>' : '') + '</div></div>' +

    '<div class="cover-row"><div class="t"><strong>Protezione</strong>' +
      '<span>Riduce il rischio quando la zona si scalda.</span></div>' +
      '<div class="pills"><button class="pill' + (s.prot > 0 ? " on" : "") + '" data-stprot>' + prot.n + '</button></div></div>' +

    '<div class="cover-row"><div class="t"><strong>Il ferro</strong>' +
      '<span>Più riuscita. Se ti trovano, la pena raddoppia.</span></div>' +
      '<div class="pills"><button class="pill danger' + (s.ferro ? " on" : G.money < STRADA_FERRO_COSTO ? " no" : "") + '" data-stferro>' +
      (s.ferro ? "Ce l'hai" : fmt(STRADA_FERRO_COSTO) + " €") + '</button></div></div>' +

    '<div class="cover-row"><div class="t"><strong>Avvocato</strong>' +
      '<span>' + fmt(STRADA_AVVOCATO_COSTO) + ' €/sett. · l\'attenzione cala più in fretta.</span></div>' +
      '<div class="pills"><button class="pill' + (s.avvocato ? " on" : "") + '" data-stavvocato>' +
      (s.avvocato ? "Ce l'hai" : "Prendilo") + '</button></div></div>' +

    '<div class="cover-row"><div class="t"><strong>Costo copertura</strong>' +
      '<span>Quello che ti esce di tasca ogni settimana.</span></div>' +
      '<div class="pills"><span class="pill on">' + fmt(stCopertura()) + ' €/sett.</span></div></div>' +

    '<div class="street-note">Nel giro non compri sicurezza. Compri solo qualche minuto in più prima che qualcosa vada storto.</div>';
}

function renderStAttivita(){
  const s = G.strada;
  $("st-tab-attivita").innerHTML =
    STRADA_ATTIVITA.map(a => {
      const tua = !!s.attivita[a.id];
      return '<div class="activity' + (tua ? " owned" : "") + '">' +
        '<div class="a-top"><strong>' + a.n + '</strong><span class="price">' +
          (tua ? "TUA" : fmt(a.costo) + " €") + '</span></div>' +
        '<p>' + (tua
          ? "Resa " + fmt(a.resa) + " €/sett. · 45% pulito / 55% sporco · −" + fmt(a.gestione) + " € di gestione"
          : "Resa " + fmt(a.resa) + " €/sett. · alza di altrettanto quanto puoi ripulire.") + '</p>' +
        (tua ? "" : '<button class="pill' + (G.money < a.costo ? " no" : "") + '" data-stattivita="' + a.id + '">Rileva</button>') +
        '</div>';
    }).join("") +
    '<div class="business-foot">Le attività rendono ogni settimana e allargano quanto denaro sporco riesci a far sparire.</div>';
}

/* ---- in basso: le tre città ---- */
function renderStCitta(){
  $("st-citta-lista").innerHTML = STRADA_CITTA.map(c =>
    '<button class="city' + (c.id === ST_CITTA ? " on" : "") + (c.id === "provincia" ? "" : " lock") +
    '" data-stcitta="' + c.id + '"><span class="n">' + c.n + '</span><span class="d">' + c.d + '</span></button>'
  ).join("");
}

/* ---- la scheda: le scelte del colpo, gli esiti, le conferme ---- */
function renderStScheda(){
  const modal = $("st-modal");
  if(!STRADA_SCENA){ modal.classList.remove("on"); $("st-sheet").innerHTML = ""; return; }
  const sc = STRADA_SCENA;
  const stats = (sc.stats || []).map(x => '<span class="stchip ' + (x.c || "") + '">' + x.t + '</span>').join("");
  $("st-sheet").innerHTML =
    '<div class="sheet-head"><div>' +
      '<span class="k">' + (sc.k || "La strada") + '</span>' +
      '<h2>' + sc.titolo + '</h2>' +
      '<p>' + sc.testo + '</p>' +
      (stats ? '<div class="sheet-stats">' + stats + '</div>' : "") +
    '</div><button class="closemodal" id="st-chiudi-scheda" aria-label="Chiudi">×</button></div>' +
    '<div class="' + (sc.approcci ? "approaches" : "esiti") + '">' +
      sc.opts.map((o, i) =>
        '<button class="approach' + (o.hot ? " hot" : "") + (o.no ? " no" : "") + '" data-stopt="' + i + '">' +
        (sc.approcci ? '<span class="a-num">0' + (i + 1) + '</span>' : "") +
        '<b>' + o.n + '</b>' + (o.d ? '<p>' + o.d + '</p>' : "") +
        (o.sx || o.dx ? '<span class="riskline"><span>' + (o.sx || "") + '</span><span>' + (o.dx || "") + '</span></span>' : "") +
        '</button>').join("") +
    '</div>';
  modal.classList.add("on");
}

function renderStrada(){
  if(!$("st-colpi")) return;
  renderStBarre();
  renderStColpi();
  renderStCopre();
  renderStAttivita();
  renderStCitta();
  renderStScheda();
}

/* ==================== I TASTI ==================== */
$("st-colpi").addEventListener("click", ev => {
  const c = ev.target.closest("[data-stcolpo]");
  if(!c) return;
  hubTap(); stAvviaColpo(c.dataset.stcolpo);
});

$("st-modal").addEventListener("click", ev => {
  if(ev.target === $("st-modal") || ev.target.closest("#st-chiudi-scheda")){
    hubTap(); STRADA_SCENA = null; renderStScheda(); return;
  }
  const opt = ev.target.closest("[data-stopt]");
  if(!opt || !STRADA_SCENA) return;
  hubTap();
  const o = STRADA_SCENA.opts[+opt.dataset.stopt];
  if(o && typeof o.run === "function") o.run();
  save(); renderStrada(); renderGioco();
});

$("st-ripulisci").onclick = () => {
  hubTap();
  if(G.strada.arresto){ stToast("Sei in carcere: non puoi ripulire i soldi finché non esci."); return; }
  stToast(stradaRipulisci());
};

$("st-tab-copre").addEventListener("click", ev => {
  const uomo = ev.target.closest("[data-stuomo]");
  if(uomo){ hubTap(); stToast(uomo.dataset.stuomo === "piu" ? stAssumiUomo() : stLicenziaUomo()); return; }
  if(ev.target.closest("[data-stprot]")){
    hubTap(); stToast(stImpostaProtezione((G.strada.prot + 1) % STRADA_PROT.length)); return;
  }
  if(ev.target.closest("[data-stferro]")){ hubTap(); stToast(stCompraFerro()); return; }
  if(ev.target.closest("[data-stavvocato]")){ hubTap(); stToast(stToggleAvvocato()); return; }
});

$("st-tab-attivita").addEventListener("click", ev => {
  const a = ev.target.closest("[data-stattivita]");
  if(!a) return;
  hubTap(); stToast(stCompraAttivita(a.dataset.stattivita));
});

$("st-citta-lista").addEventListener("click", ev => {
  const c = ev.target.closest("[data-stcitta]");
  if(!c) return;
  hubTap(); ST_CITTA = c.dataset.stcitta; renderStColpi(); renderStCitta();
});

document.querySelectorAll("#strada [data-sttab]").forEach(t => {
  t.onclick = () => {
    hubTap();
    document.querySelectorAll("#strada [data-sttab]").forEach(x => x.classList.toggle("on", x === t));
    $("st-tab-copre").classList.toggle("on", t.dataset.sttab === "copre");
    $("st-tab-attivita").classList.toggle("on", t.dataset.sttab === "attivita");
  };
});

/* Mollare il giro costa: prima di farlo, lo si dice. */
$("st-molla").onclick = () => {
  hubTap();
  if(G.strada.arresto){ stToast("Da dentro non si molla niente."); return; }
  const costo = Math.max(1500, Math.round(G.strada.sporchi * .3));
  STRADA_SCENA = {k:"Uscirne", titolo:"Molla il giro",
    testo:"Ti costa " + fmt(costo) + " € — il 30% dei soldi sporchi, e mai meno di 1.500 € — " +
      "e la reputazione di strada cala di un terzo. In cambio ti torna la testa per la musica. Qualcuno se la lega al dito.",
    opts:[
      {n:"Mollo", d:"Chiudi i conti e sparisci dal giro", hot:true,
       run(){ stMollaIlGiro(); STRADA_SCENA = null; stToast("Hai mollato il giro."); }},
      {n:"Lascia stare", d:"Resti dentro al giro", run(){ STRADA_SCENA = null; }}
    ]};
  renderStScheda();
};

$("str-x").onclick = () => { hubTap(); chiudiStrada(); };
$("st-mappa").onclick = () => { hubTap(); chiudiStrada(); };

/* ESC: lo gestisce uscita.js per tutte le finestre, e chiama questa. Un passo
   alla volta — prima si chiude la scheda aperta, poi la schermata. */
function uscitaStrada(){
  if(STRADA_SCENA){ STRADA_SCENA = null; renderStScheda(); return true; }
  chiudiStrada();
  return true;
}
