/* Azioni della settimana e lavoretti, con costi e requisiti. */
"use strict";

/* ==================== AZIONI ==================== */
const BEATNAMES = ["Vetro Rotto","Fumo Blu","Terzo Piano","Sottopasso","Neve Sporca",
  "Ferro Vecchio","Ore Piccole","Cemento Armato","Luce Gialla","Ultimo Treno"];

/* Punto 39/40: con l'energia a 100 al giorno (100 non a settimana) e i giorni
   che si chiudono uno alla volta, in una settimana ci stanno molte più mosse
   di prima (~3). RITMO smorza i guadagni diretti delle mosse che si possono
   ripetere senza limiti (promo, live, freestyle veloce) perché farne 10 al
   giorno non deve valere 10 volte una sola — i pezzi restano tal quali: il
   tetto settimanale della fase (PHASES.cap) già li tiene a bada da solo. */
const RITMO = 0.4;

/* Blocco 2 — ritmo giornaliero.
   La memoria sta dentro G, quindi sopravvive al save. Non serve un reset
   esplicito: quando anno/settimana/giorno cambia, la chiave cambia con lui. */
const ADF_MAX_SCRITTURE_GIORNO = 2;
function adfGiornoKey(){
  return [Number(G.year||1), Number(G.week||1), Number(G.day||1)].join(":");
}
function adfDailyCounts(){
  const key = adfGiornoKey();
  if(!G.adfDailyActions || G.adfDailyActions.key !== key ||
     !G.adfDailyActions.counts || typeof G.adfDailyActions.counts !== "object"){
    G.adfDailyActions = {key:key, counts:{}};
  }
  return G.adfDailyActions.counts;
}
function adfOggi(id){
  return Number(adfDailyCounts()[id] || 0);
}
function adfSegnaOggi(id){
  const c = adfDailyCounts();
  c[id] = Number(c[id] || 0) + 1;
  return c[id];
}

/* Da smistare, punto 6: lo stesso contenitore, ma a settimana invece che a
   giorno — serve alle mosse che diventano "evento esclusivo" (una volta a
   settimana, non una volta al giorno), come la battle di freestyle vera. */
function adfSettimanaChiave(){
  return [Number(G.year||1), Number(G.week||1)].join(":");
}
function adfSettimanaCounts(){
  const key = adfSettimanaChiave();
  if(!G.adfWeeklyActions || G.adfWeeklyActions.key !== key ||
     !G.adfWeeklyActions.counts || typeof G.adfWeeklyActions.counts !== "object"){
    G.adfWeeklyActions = {key:key, counts:{}};
  }
  return G.adfWeeklyActions.counts;
}
function adfSettimana(id){
  return Number(adfSettimanaCounts()[id] || 0);
}
function adfSegnaSettimana(id){
  const c = adfSettimanaCounts();
  c[id] = Number(c[id] || 0) + 1;
  return c[id];
}

/* Punto 2 - Promo.
   La prima promo del giorno rende pieno, poi il pubblico si satura.
   La componente percentuale non puo' inoltre crescere all'infinito
   ricomponendosi sui follower appena guadagnati. */
const ADF_PROMO_DAILY_MULT = Object.freeze([1, 0.5, 0.2]);
const ADF_PROMO_DAILY_FLOOR = 0.1;
const ADF_PROMO_WEEKLY_PCT_CAP = 0.015;
/* Da smistare, punto 7: la promo può ripetersi tutti i giorni della settimana
   (ogni giorno riparte al massimo), ma l'hype no — se no basta fare promo ogni
   giorno per farmarlo comunque, solo più lentamente. Questo è il tetto vero,
   settimanale, oltre al quale la promo continua a dare follower ma non hype. */
const ADF_PROMO_WEEKLY_HYPE_CAP = 22;
/* Quanto un post spinge il pezzo scelto (moltiplicatore sui suoi stream della
   settimana, +0.10 a post, non oltre 1.5): un aiuto vero, non un secondo video. */
const ADF_PROMO_SPINTA = 0.10;
const ADF_PROMO_SPINTA_MAX = 1.5;
/* Punto 8 dello Studio: l'anteprima di un pezzo non ancora uscito. Al massimo
   tre per pezzo, e ognuna vale all'uscita +0,12 di spinta sulla prima
   settimana — la stessa `s.spinta` della promo, che poi scende da sola. */
const ADF_ANTEPRIME_MAX = 3;
const ADF_ANTEPRIMA_SPINTA = 0.12;
/* Quando il pezzo esce (l'azione `pubblica` qui sotto, o `studioUscitePronte`
   il venerdì) le anteprime fatte diventano la spinta della prima settimana. */
function anteprimeAllUscita(s){
  if(!s || !s.anteprime) return;
  s.spinta = Math.max(s.spinta || 1, 1 + Math.min(ADF_ANTEPRIME_MAX, s.anteprime) * ADF_ANTEPRIMA_SPINTA);
  delete s.anteprime;
}

function promoSettimanaKey(){
  return [Number(G.year||1), Number(G.week||1)].join(":");
}

function promoSettimana(){
  const key = promoSettimanaKey();
  if(!G.promoSaturation || G.promoSaturation.key !== key){
    G.promoSaturation = {
      key:key,
      baseFans:Math.max(0, Number(G.fans||0)),
      pctUsed:0,
      hypeUsed:0
    };
  }

  G.promoSaturation.baseFans =
    Math.max(0, Number(G.promoSaturation.baseFans||0));
  G.promoSaturation.pctUsed =
    Math.max(0, Number(G.promoSaturation.pctUsed||0));
  G.promoSaturation.hypeUsed =
    Math.max(0, Number(G.promoSaturation.hypeUsed||0));

  return G.promoSaturation;
}

/* «Lo stile che conta» (21/09/2026): sul palco — la serata e la piazza —
   la presenza e' l'abilita' piu' i capi da presenza che hai addosso
   (stilePresenza in stile.js). Il freestyle giocato in piazza.js ha i suoi
   conti e non passa di qui. */
function presenzaSulPalco(){
  return typeof stilePresenza === "function" ? stilePresenza() : G.skills.presenza;
}

function promoDailyMult(){
  const n = adfOggi("promo");
  return n < ADF_PROMO_DAILY_MULT.length
    ? ADF_PROMO_DAILY_MULT[n]
    : ADF_PROMO_DAILY_FLOOR;
}

/* I vecchi lavoretti restano documentati qui ma sono fuori dal gameplay
   finché non verranno riprogettati dentro luoghi/situazioni reali della città.
   Il catalogo JOBS contiene solo i lavori strutturati ancora giocabili. */
const JOBS_LEGACY_PAUSED = Object.freeze([
  {id:"volantini", n:"Volantinaggio", pay:70,  e:18, d:"Freddo, gambe, nessuna dignità."},
  {id:"fattorino", n:"Fattorino",    pay:125, e:18, d:"In giro col motorino, piove sempre."},
  {id:"barista",   n:"Barista",      pay:130, e:18, d:"Conosci gente. Ogni turno un contatto in più."},
  {id:"magazzino", n:"Magazziniere", pay:165, e:32, d:"Bancali e schiena. Paga bene, ti spegne."},
  {id:"buttafuori",n:"Buttafuori",   pay:210, e:32, d:"Notti in piedi sulla porta di un locale."},
  {id:"fonico",    n:"Fonico junior",pay:180, e:32, d:"In uno studio vero. Impari guardando."}
]);

const JOBS = [
  {id:"lavapiatti", place:"pizzeria", n:"Lavapiatti", pay:100, e:18, d:"Turni serali, cucina bollente."},
  /* punto 59: full time, non part time come il lavapiatti — paga di più e
     costa più energia, un turno vero ti si mangia la giornata */
  {id:"operaio", place:"fabbrica", n:"Operaio", pay:220, e:40, d:"Fabbrica, turno pieno, linea di montaggio. Si sente tutto."}
];

/* ================= LAVORO PER LUOGO =================
   La carriera appartiene al posto di lavoro, non alla mansione. Oggi usa
   questa base soltanto la Fabbrica; in futuro una promozione potrà cambiare
   G.job.id/n/pay/e senza perdere presenze, anzianità o storico del luogo. */
const ADF_LAVORO_CICLO_SETTIMANE = 4;
const ADF_LAVORO_GIORNI_CICLO = ADF_LAVORO_CICLO_SETTIMANE * 7;

/* Primo contratto reale: Fabbrica.
   - 5 giornate lavorative a settimana;
   - lunedì-sabato disponibili;
   - domenica riposo, salvo autorizzazione esplicita di un evento;
   - valutazione su cicli di 4 settimane.
   Le conseguenze disciplinari vengono agganciate a questi dati, non hardcodate
   nella UI o nella mansione, così restano valide anche dopo una promozione. */
const ADF_LAVORO_CONTRATTI = Object.freeze({
  fabbrica:Object.freeze({
    luogo:"fabbrica",
    nome:"Fabbrica",
    turniSettimanali:5,
    giorniConsentiti:Object.freeze([1,2,3,4,5,6]),
    giornoRiposo:7,
    giornoRiposoLabel:"domenica",
    domenicaRiposo:true,
    bonusSestoGiornoPct:30,
    bonusDomenicaPct:75,
    ferieGiorniPerCiclo:2,
    ferieAnticipoMinimoGiorni:1,
    cicloSettimane:4
  }),
  pizzeria:Object.freeze({
    luogo:"pizzeria",
    nome:"Pizzeria",
    turniSettimanali:4,
    giorniConsentiti:Object.freeze([2,3,4,5,6,7]),
    giornoRiposo:1,
    giornoRiposoLabel:"lunedì",
    domenicaRiposo:false,
    bonusSestoGiornoPct:20,
    bonusDomenicaPct:0,
    cicloSettimane:4
  })
});

/* Carriera dei lavori strutturati: requisiti di CANDIDATURA, non premi automatici.
   Le offerte reali vengono aperte da lavoro-eventi.js dopo un turno concluso;
   qui restano fonte di verità requisiti, stato persistente ed effetti.
   - aumento: dopo almeno 1 ciclo completo nel ruolo e affidabilità 60;
   - promozione di ruolo: dopo almeno 3 cicli nel ruolo, affidabilità 75 e
     almeno 2 cicli perfetti nel ruolo.
   Le soglie sono centralizzate per poterle bilanciare senza toccare gli eventi. */
const ADF_FABBRICA_CARRIERA = Object.freeze({
  aumento:Object.freeze({
    cicliNelRuolo:1,
    affidabilita:60,
    maxPerRuolo:1
  }),
  promozione:Object.freeze({
    cicliNelRuolo:3,
    affidabilita:75,
    cicliPerfettiNelRuolo:2
  }),
  disciplina:Object.freeze({
    assenzeLieveMax:2,
    assenzeRichiamoMin:3,
    richiamiPrimaLicenziamento:2,
    bloccoRiassunzioneSettimane:8,
    recuperoRichiamoCicliPerfetti:2,
    malusLieveAffidabilita:5,
    malusRichiamoAffidabilita:10
  }),
  straordinari:Object.freeze({
    chanceSestoGiorno:0.35,
    chanceDomenica:0.25,
    affidabilitaCompletato:2,
    affidabilitaSaltato:-5
  }),
  ruoli:Object.freeze([
    /* La promozione cambia davvero il modo in cui pesa il turno.
       L'energia rappresenta soprattutto il carico fisico; benessere/lucidità
       separano invece fatica e pressione mentale. I ruoli alti consumano meno
       corpo ma chiedono più testa e responsabilità. */
    Object.freeze({
      id:"operaio", n:"Operaio", energia:40, benessereTurno:-3, luciditaTurno:-1,
      fisico:"alto", stress:"basso",
      d:"Linea di montaggio: lavoro fisico, ritmo ripetitivo e poche responsabilità sugli altri."
    }),
    Object.freeze({
      id:"operaio_esperto", n:"Operaio esperto", energia:36, benessereTurno:-2, luciditaTurno:-1,
      fisico:"medio-alto", stress:"medio",
      d:"Conosci la linea e risolvi i problemi piccoli: meno fatica cieca, più attenzione a qualità e nuovi assunti."
    }),
    Object.freeze({
      id:"capolinea", n:"Capolinea", energia:32, benessereTurno:-1, luciditaTurno:-2,
      fisico:"medio", stress:"alto",
      d:"Stai meno tempo sul pezzo e più sulle persone: ritmo, qualità e problemi della linea passano da te."
    }),
    Object.freeze({
      id:"capoturno", n:"Capoturno", energia:28, benessereTurno:-1, luciditaTurno:-3,
      fisico:"basso", stress:"molto alto",
      d:"Il carico fisico scende, ma il turno intero pesa sulle decisioni: personale, produzione e responsabilità."
    })
  ])
});

const ADF_PIZZERIA_CARRIERA = Object.freeze({
  aumento:Object.freeze({
    cicliNelRuolo:1,
    affidabilita:55,
    maxPerRuolo:1
  }),
  promozione:Object.freeze({
    cicliNelRuolo:2,
    affidabilita:70,
    cicliPerfettiNelRuolo:1
  }),
  disciplina:Object.freeze({
    assenzeLieveMax:1,
    assenzeRichiamoMin:2,
    richiamiPrimaLicenziamento:2,
    bloccoRiassunzioneSettimane:4,
    recuperoRichiamoCicliPerfetti:1,
    malusLieveAffidabilita:4,
    malusRichiamoAffidabilita:8
  }),
  straordinari:Object.freeze({
    chanceSestoGiorno:0.30,
    chanceDomenica:0.35,
    affidabilitaCompletato:1,
    affidabilitaSaltato:-3
  }),
  affidabilitaCicloPerfetto:8,
  ruoli:Object.freeze([
    Object.freeze({id:"lavapiatti", n:"Lavapiatti"}),
    Object.freeze({id:"aiuto_cucina", n:"Aiuto cucina"}),
    Object.freeze({id:"aiuto_pizzaiolo", n:"Aiuto pizzaiolo"}),
    Object.freeze({id:"pizzaiolo", n:"Pizzaiolo"})
  ])
});

const ADF_LAVORO_CARRIERE = Object.freeze({
  fabbrica:ADF_FABBRICA_CARRIERA,
  pizzeria:ADF_PIZZERIA_CARRIERA
});

function lavoroCarrieraDef(luogo){
  return ADF_LAVORO_CARRIERE[luogo] || null;
}

function lavoroNomeLuogo(luogo){
  const contratto = lavoroContrattoDef(luogo);
  return contratto && contratto.nome
    ? contratto.nome
    : String(luogo || "Lavoro").replace(/^./, c => c.toUpperCase());
}

/* Identità sociale dei lavori.
   Non è un secondo sistema di persone: decide soltanto CHI puoi incontrare
   durante un turno; le persone create restano in G.gente e usano relazioni,
   chat e opportunità normali. La chiave dello stato è il luogo quando esiste
   (Fabbrica, così le promozioni non azzerano i colleghi), altrimenti l'id del
   lavoro. */
const ADF_LAVORO_RETE = Object.freeze({
  fabbrica:Object.freeze({
    chanceIncontro:0.16, cooldownGiorni:7, minTurni:3, maxContatti:4,
    ruoli:Object.freeze(["collega","collega","collega","collega","beatmaker"]),
    dettaglio:"collega di reparto in Fabbrica",
    storia:"Vi siete conosciuti lavorando nello stesso reparto in Fabbrica.",
    /* La promozione allarga gradualmente la rete invece di regalare contatti
       migliori. Crescono esposizione e capienza; il pool resta soprattutto
       fatto di colleghi, con beatmaker/fonici che esistono perché sono persone
       che fanno musica fuori dal turno, non perché il ruolo manageriale li
       materializzi. */
    perRuolo:Object.freeze({
      operaio:Object.freeze({
        chanceIncontro:0.16, cooldownGiorni:7, minTurni:3, maxContatti:4,
        ruoli:Object.freeze(["collega","collega","collega","collega","beatmaker"]),
        dettaglio:"collega di reparto in Fabbrica",
        storia:"Vi siete conosciuti lavorando nello stesso reparto in Fabbrica."
      }),
      operaio_esperto:Object.freeze({
        chanceIncontro:0.18, cooldownGiorni:6, minTurni:2, maxContatti:5,
        ruoli:Object.freeze(["collega","collega","collega","beatmaker","fonico"]),
        dettaglio:"persona conosciuta sulla linea in Fabbrica",
        storia:"Vi siete conosciuti mentre seguivi la linea come operaio esperto."
      }),
      capolinea:Object.freeze({
        chanceIncontro:0.20, cooldownGiorni:5, minTurni:2, maxContatti:6,
        ruoli:Object.freeze(["collega","collega","collega","beatmaker","fonico","fonico"]),
        dettaglio:"persona conosciuta coordinando la linea",
        storia:"Vi siete conosciuti mentre coordinavi persone e problemi della linea."
      }),
      capoturno:Object.freeze({
        chanceIncontro:0.22, cooldownGiorni:4, minTurni:1, maxContatti:7,
        ruoli:Object.freeze(["collega","collega","collega","beatmaker","beatmaker","fonico","fonico"]),
        dettaglio:"persona conosciuta gestendo il turno",
        storia:"Vi siete conosciuti mentre gestivi il turno e i reparti della Fabbrica."
      })
    })
  }),
  pizzeria:Object.freeze({
    chanceIncontro:0.24, cooldownGiorni:4, minTurni:1, maxContatti:6,
    ruoli:Object.freeze(["collega","collega","rapper","promoter","fonico"]),
    dettaglio:"collega della Pizzeria",
    storia:"Vi siete conosciuti durante i turni in Pizzeria."
  }),
  barista:Object.freeze({
    chanceIncontro:0.42, cooldownGiorni:2, minTurni:1, maxContatti:10,
    ruoli:Object.freeze(["promoter","rapper","promoter","fonico","rapper"]),
    dettaglio:"conoscenza del bar",
    storia:"Vi siete conosciuti mentre lavoravi al bar."
  }),
  fonico:Object.freeze({
    chanceIncontro:0.34, cooldownGiorni:3, minTurni:1, maxContatti:8,
    ruoli:Object.freeze(["beatmaker","rapper","fonico","beatmaker","videomaker"]),
    dettaglio:"contatto conosciuto in studio",
    storia:"Vi siete conosciuti durante un turno da fonico."
  }),
  buttafuori:Object.freeze({
    chanceIncontro:0.30, cooldownGiorni:3, minTurni:1, maxContatti:8,
    ruoli:Object.freeze(["promoter","rapper","promoter","strada"]),
    dettaglio:"conoscenza del locale",
    storia:"Vi siete conosciuti lavorando alla porta di un locale."
  }),
  fattorino:Object.freeze({
    chanceIncontro:0.28, cooldownGiorni:2, minTurni:1, maxContatti:10,
    ruoli:Object.freeze(["rapper","beatmaker","fonico","promoter","videomaker","strada"]),
    dettaglio:"incontro fatto durante le consegne",
    storia:"Vi siete incrociati durante un turno da fattorino."
  }),
  volantini:Object.freeze({
    chanceIncontro:0.24, cooldownGiorni:3, minTurni:1, maxContatti:8,
    ruoli:Object.freeze(["rapper","promoter","beatmaker"]),
    dettaglio:"incontro fatto lavorando in strada",
    storia:"Vi siete conosciuti durante un turno di volantinaggio."
  }),
  lavapiatti:Object.freeze({
    chanceIncontro:0.18, cooldownGiorni:5, minTurni:1, maxContatti:5,
    ruoli:Object.freeze(["rapper","fonico","promoter"]),
    dettaglio:"conoscenza della cucina",
    storia:"Vi siete conosciuti durante un turno da lavapiatti."
  }),
  magazzino:Object.freeze({
    chanceIncontro:0.14, cooldownGiorni:6, minTurni:2, maxContatti:4,
    ruoli:Object.freeze(["rapper","beatmaker","fonico"]),
    dettaglio:"collega di magazzino",
    storia:"Vi siete conosciuti lavorando in magazzino."
  })
});

function lavoroReteChiave(job){
  if(!job) return null;
  return lavoroLuogo(job) || job.id || null;
}

function lavoroReteDef(job){
  if(!job) return null;
  const chiave = lavoroReteChiave(job);
  const base = ADF_LAVORO_RETE[job.id] || ADF_LAVORO_RETE[chiave] || null;
  if(!base) return null;

  /* I luoghi con carriera interna possono cambiare profilo rete senza cambiare
     la chiave persistente della sede. I contatti vecchi quindi restano, ma il
     ruolo corrente decide da ora in poi ritmo, cap e persone che puoi incontrare. */
  const profilo = base.perRuolo && base.perRuolo[job.id];
  if(!profilo) return base;
  return Object.assign({},base,profilo,{perRuolo:base.perRuolo,roleId:job.id});
}

function lavoroReteRuoli(job, cfg){
  const ruoli = Array.isArray(cfg && cfg.ruoli) ? cfg.ruoli.slice() : [];
  /* I lavori possono esporre alla Strada, ma non devono avviare quella
     carriera al posto del giocatore. */
  if(!(G.strada && G.strada.giroAvviato))
    return ruoli.filter(r => r !== "strada");
  return ruoli;
}

function lavoroSettimanaAssoluta(){
  return typeof totalWeeks === "function"
    ? Math.max(1, Number(totalWeeks()) || 1)
    : Math.max(1, (Number(G.year || 1) - 1) * 52 + Number(G.week || 1));
}

function lavoroCicloCorrente(){
  return Math.floor((lavoroSettimanaAssoluta() - 1) / ADF_LAVORO_CICLO_SETTIMANE);
}

function lavoroPosizioneOggi(){
  const settimanaNelCiclo = (lavoroSettimanaAssoluta() - 1) % ADF_LAVORO_CICLO_SETTIMANE;
  const giorno = Math.max(1, Math.min(7, Number(G.day || 1)));
  return settimanaNelCiclo * 7 + (giorno - 1);
}

function lavoroGiornoAssoluto(){
  return (lavoroSettimanaAssoluta() - 1) * 7 + Math.max(1, Math.min(7, Number(G.day || 1)));
}

function lavoroCicloDaGiornoAssoluto(absoluteDay){
  return Math.floor((Math.max(1,Number(absoluteDay)||1)-1)/ADF_LAVORO_GIORNI_CICLO);
}

function lavoroFerieStato(luogo){
  const sede=lavoroSede(luogo);
  if(!sede) return null;
  if(!sede.leave || typeof sede.leave!=="object") sede.leave={requests:[]};
  if(!Array.isArray(sede.leave.requests)) sede.leave.requests=[];

  sede.leave.requests=sede.leave.requests.filter(r =>
    r && Number.isInteger(Number(r.targetAbsoluteDay)) && Number(r.targetAbsoluteDay)>0
  ).map(r=>({
    targetAbsoluteDay:Number(r.targetAbsoluteDay),
    requestedAbsoluteDay:Number(r.requestedAbsoluteDay||0),
    cycle:Number.isInteger(Number(r.cycle))
      ? Number(r.cycle)
      : lavoroCicloDaGiornoAssoluto(r.targetAbsoluteDay),
    status:r.status||"approved"
  }));

  if(sede.leave.requests.length>48)
    sede.leave.requests=sede.leave.requests.slice(-48);
  return sede.leave;
}

function lavoroFeriePerCiclo(luogo,ciclo){
  const stato=lavoroFerieStato(luogo);
  if(!stato) return [];
  ciclo=Number(ciclo);
  return stato.requests.filter(r =>
    r.status==="approved" && Number(r.cycle)===ciclo
  );
}

function lavoroFeriePerGiorno(luogo,absoluteDay){
  const stato=lavoroFerieStato(luogo);
  if(!stato) return null;
  absoluteDay=Number(absoluteDay);
  return stato.requests.find(r =>
    r.status==="approved" && Number(r.targetAbsoluteDay)===absoluteDay
  ) || null;
}

function lavoroFerieOggi(luogo){
  return lavoroFeriePerGiorno(luogo,lavoroGiornoAssoluto());
}

function lavoroFerieDisponibili(luogo,ciclo){
  const def=lavoroContrattoDef(luogo);
  const max=Math.max(0,Number(def&&def.ferieGiorniPerCiclo||0));
  if(!max) return 0;
  ciclo=ciclo==null ? lavoroCicloCorrente() : Number(ciclo);
  return Math.max(0,max-lavoroFeriePerCiclo(luogo,ciclo).length);
}

function lavoroFerieSettimana(luogo,absoluteWeek){
  const stato=lavoroFerieStato(luogo);
  const def=lavoroContrattoDef(luogo);
  if(!stato || !def) return [];
  absoluteWeek=Number(absoluteWeek);
  const from=(absoluteWeek-1)*7+1, to=from+7;
  const consentiti=Array.isArray(def.giorniConsentiti)?def.giorniConsentiti:[1,2,3,4,5,6,7];
  return stato.requests.filter(r=>{
    const d=Number(r.targetAbsoluteDay);
    if(r.status!=="approved" || d<from || d>=to) return false;
    const giorno=((d-1)%7)+1;
    return consentiti.includes(giorno);
  });
}

function lavoroFerieCoperturaSettimana(luogo,absoluteWeek,giorniLavorati,richiesti){
  const lavorati=giorniLavorati instanceof Set ? giorniLavorati : new Set(giorniLavorati||[]);
  const ferie=new Set(
    lavoroFerieSettimana(luogo,absoluteWeek)
      .map(r=>((Number(r.targetAbsoluteDay)-1)%7)+1)
      .filter(g=>!lavorati.has(g))
  );
  const utili=Math.min(ferie.size,Math.max(0,Number(richiesti||0)-lavorati.size));
  return {
    richieste:ferie.size,
    utili:utili,
    coperti:Math.min(Math.max(0,Number(richiesti||0)),lavorati.size+utili),
    giorni:Array.from(ferie)
  };
}

function lavoroFerieEtichetta(absoluteDay){
  const nomi=["","lunedì","martedì","mercoledì","giovedì","venerdì","sabato","domenica"];
  const d=Math.max(1,Number(absoluteDay)||1);
  const absoluteWeek=Math.floor((d-1)/7)+1;
  const anno=Math.floor((absoluteWeek-1)/52)+1;
  const settimana=((absoluteWeek-1)%52)+1;
  const giorno=((d-1)%7)+1;
  return "Anno "+anno+" · settimana "+settimana+" · "+nomi[giorno];
}

function lavoroFerieRichiedi(luogo,targetAbsoluteDay){
  const def=lavoroContrattoDef(luogo);
  const contratto=lavoroContratto(luogo);
  const max=Math.max(0,Number(def&&def.ferieGiorniPerCiclo||0));
  const anticipo=Math.max(1,Number(def&&def.ferieAnticipoMinimoGiorni||1));
  if(!def || !max) return {ok:false,reason:"Ferie non previste da questo contratto"};
  if(!G.job || lavoroLuogo(G.job)!==luogo || !contratto || !contratto.signed)
    return {ok:false,reason:"Non hai un contratto attivo qui"};

  const oggi=lavoroGiornoAssoluto();
  const target=Number(targetAbsoluteDay);
  if(!Number.isInteger(target) || target-oggi<anticipo)
    return {ok:false,reason:"Le ferie vanno chieste almeno il giorno prima"};

  const giorno=((target-1)%7)+1;
  const consentiti=Array.isArray(def.giorniConsentiti)?def.giorniConsentiti:[1,2,3,4,5,6,7];
  if(!consentiti.includes(giorno))
    return {ok:false,reason:"Quel giorno non è un giorno ordinario di lavoro"};

  if(lavoroFeriePerGiorno(luogo,target))
    return {ok:false,reason:"Hai già ferie approvate per quel giorno"};

  const extra=lavoroStraordinarioStato(luogo);
  const impegno=extra && (extra.accepted||extra.pendingOffer);
  if(impegno && Number(impegno.targetAbsoluteDay)===target)
    return {ok:false,reason:"Hai già un impegno di straordinario per quel giorno"};

  const ciclo=lavoroCicloDaGiornoAssoluto(target);
  if(lavoroFerieDisponibili(luogo,ciclo)<=0)
    return {ok:false,reason:"Hai già usato i 2 giorni di ferie di quel ciclo"};

  const stato=lavoroFerieStato(luogo);
  const richiesta={
    targetAbsoluteDay:target,
    requestedAbsoluteDay:oggi,
    cycle:ciclo,
    status:"approved"
  };
  stato.requests.push(richiesta);
  return {
    ok:true,
    richiesta:Object.assign({},richiesta),
    label:lavoroFerieEtichetta(target),
    remaining:lavoroFerieDisponibili(luogo,ciclo)
  };
}

function lavoroFerieCandidati(luogo,giorniAvanti){
  const def=lavoroContrattoDef(luogo);
  if(!def || !Number(def.ferieGiorniPerCiclo||0)) return [];
  const oggi=lavoroGiornoAssoluto();
  const anticipo=Math.max(1,Number(def.ferieAnticipoMinimoGiorni||1));
  const orizzonte=Math.max(anticipo,Math.min(56,Number(giorniAvanti||35)));
  const consentiti=Array.isArray(def.giorniConsentiti)?def.giorniConsentiti:[1,2,3,4,5,6,7];
  const out=[];
  for(let delta=anticipo;delta<=orizzonte;delta++){
    const target=oggi+delta;
    const giorno=((target-1)%7)+1;
    if(!consentiti.includes(giorno)) continue;
    if(lavoroFeriePerGiorno(luogo,target)) continue;
    const ciclo=lavoroCicloDaGiornoAssoluto(target);
    if(lavoroFerieDisponibili(luogo,ciclo)<=0) continue;
    const extra=lavoroStraordinarioStato(luogo);
    const impegno=extra && (extra.accepted||extra.pendingOffer);
    if(impegno && Number(impegno.targetAbsoluteDay)===target) continue;
    out.push({
      targetAbsoluteDay:target,
      cycle:ciclo,
      label:lavoroFerieEtichetta(target)
    });
  }
  return out;
}

function lavoroFerieRiepilogo(luogo){
  const def=lavoroContrattoDef(luogo);
  const stato=lavoroFerieStato(luogo);
  const ciclo=lavoroCicloCorrente();
  const max=Math.max(0,Number(def&&def.ferieGiorniPerCiclo||0));
  const oggi=lavoroGiornoAssoluto();
  if(!def || !stato || !max) return null;
  return {
    maxPerCiclo:max,
    usateCiclo:lavoroFeriePerCiclo(luogo,ciclo).length,
    disponibiliCiclo:lavoroFerieDisponibili(luogo,ciclo),
    oggi:lavoroFerieOggi(luogo),
    future:stato.requests
      .filter(r=>r.status==="approved" && Number(r.targetAbsoluteDay)>=oggi)
      .sort((a,b)=>a.targetAbsoluteDay-b.targetAbsoluteDay)
      .map(r=>Object.assign({},r,{label:lavoroFerieEtichetta(r.targetAbsoluteDay)}))
  };
}

function lavoroContrattoDef(luogo){
  return ADF_LAVORO_CONTRATTI[luogo] || null;
}

function lavoroContratto(luogo){
  const sede = lavoroSede(luogo);
  if(!sede) return null;

  /* Compatibilità: chi era già dipendente in Fabbrica prima del contratto
     non viene espulso né obbligato a rifirmare a metà partita. */
  if(!sede.contract && G.job && lavoroLuogo(G.job) === luogo){
    sede.contract = {
      signed:true,
      legacy:true,
      signedAbsoluteDay:lavoroGiornoAssoluto(),
      roleAtSign:G.job.id || null
    };
  }
  return sede.contract || null;
}

function lavoroFirmaContratto(luogo, job){
  const sede = lavoroSede(luogo);
  const def = lavoroContrattoDef(luogo);
  if(!sede || !def) return null;
  sede.contract = {
    signed:true,
    legacy:false,
    signedAbsoluteDay:lavoroGiornoAssoluto(),
    roleAtSign:job && job.id || null
  };

  const cfgCarriera = lavoroCarrieraDef(luogo);
  if(cfgCarriera){
    const carriera = lavoroCarriera(luogo);
    if(carriera){
      carriera.cyclesInRole = 0;
      carriera.perfectCyclesInRole = 0;
      carriera.perfectStreak = 0;
      carriera.roleId = job && job.id ||
        (Array.isArray(cfgCarriera.ruoli) && cfgCarriera.ruoli[0] ? cfgCarriera.ruoli[0].id : null);
      const idx = Array.isArray(cfgCarriera.ruoli)
        ? cfgCarriera.ruoli.findIndex(r => r.id === carriera.roleId)
        : -1;
      carriera.roleLevel = idx >= 0 ? idx : 0;
    }
  }

  return sede.contract;
}

function lavoroTerminaContratto(luogo, motivo){
  const sede = lavoroSede(luogo);
  if(!sede) return null;

  const contratto = sede.contract;
  const careerAtEnd = sede.career && typeof sede.career==="object"
    ? lavoroCarrieraSnapshot(luogo)
    : null;
  if(contratto && typeof contratto === "object"){
    if(!Array.isArray(sede.contractHistory)) sede.contractHistory = [];
    sede.contractHistory.push(Object.assign({}, contratto, {
      signed:false,
      endedAbsoluteDay:lavoroGiornoAssoluto(),
      endReason:motivo || "chiuso",
      careerAtEnd:careerAtEnd
    }));
    if(sede.contractHistory.length > 12) sede.contractHistory.shift();
  }

  sede.contract = null;

  if(sede.overtime && typeof sede.overtime === "object"){
    const attivo = sede.overtime.accepted || sede.overtime.pendingOffer;
    if(attivo){
      if(!Array.isArray(sede.overtime.history)) sede.overtime.history = [];
      sede.overtime.history.push({
        type:"cancelled",
        targetAbsoluteDay:attivo.targetAbsoluteDay,
        overtimeType:attivo.tipo,
        reason:motivo || "contratto chiuso"
      });
      if(sede.overtime.history.length > 24) sede.overtime.history.shift();
    }
    sede.overtime.accepted = null;
    sede.overtime.pendingOffer = null;
  }

  delete sede.sundayPermitAbsoluteDay;

  /* Dimissioni e licenziamento chiudono anche la progressione interna:
     una futura riassunzione riparte dalla mansione/paga base e da affidabilità
     iniziale. Il licenziamento conserva solo il blocco temporale necessario
     a impedire la riassunzione immediata; lo storico del rapporto appena
     chiuso resta in contractHistory.careerAtEnd. */
  if(motivo==="dimissioni" || motivo==="licenziamento"){
    /* La chiusura deve essere atomica: finché G.job resta agganciato alla sede,
       lavoroCarriera() può ricostruire roleId dal vecchio ruolo e vanificare
       il reset. Il contratto chiuso non deve lasciare un dipendente attivo
       nemmeno per un tick. */
    if(G.job && lavoroLuogo(G.job)===luogo) G.job=null;
    lavoroResetCarriera(luogo,{preserveBlock:motivo==="licenziamento"});
    if(sede.attendance && typeof sede.attendance==="object"){
      sede.attendance={
        ciclo:lavoroCicloCorrente(),
        turni:[]
      };
    }
    delete sede.leave;
  }

  return contratto || null;
}

function lavoroContrattoFirmato(luogo){
  const c = lavoroContratto(luogo);
  return !!(c && c.signed);
}

/* Un evento futuro può autorizzare ESATTAMENTE la domenica corrente.
   Non esiste un generico "sblocca domeniche": l'eccezione va consumata nel
   giorno per cui è stata concessa. */
function lavoroAutorizzaDomenica(luogo, absoluteDay){
  const sede = lavoroSede(luogo);
  if(!sede) return false;
  sede.sundayPermitAbsoluteDay = absoluteDay == null
    ? lavoroGiornoAssoluto()
    : Number(absoluteDay);
  return Number.isFinite(sede.sundayPermitAbsoluteDay);
}

function lavoroDomenicaAutorizzata(luogo){
  const sede = lavoroSede(luogo);
  return !!(sede && Number(sede.sundayPermitAbsoluteDay) === lavoroGiornoAssoluto());
}

function lavoroCarrieraBase(storia){
  storia=storia||{};
  return {
    reliability:50,
    cyclesCompleted:0,
    perfectCycles:0,
    perfectStreak:0,
    cyclesInRole:0,
    perfectCyclesInRole:0,
    roleId:null,
    roleLevel:0,
    raisesByRole:{},
    payHistory:[],
    roleHistory:[],
    warnings:0,
    warningHistory:[],
    weeklyEvaluations:[],
    /* Non è progressione corrente: serve soltanto a ricordare quante volte
       sei stato licenziato e ad applicare l'eventuale blocco di riassunzione. */
    dismissals:Math.max(0,Number(storia.dismissals||0)),
    blockedUntilWeek:storia.blockedUntilWeek==null ? null : Number(storia.blockedUntilWeek),
    lastEvaluatedCycle:null,
    lastEvaluation:null,
    evaluations:[]
  };
}

function lavoroCarrieraSnapshot(luogo){
  const c=lavoroCarriera(luogo);
  if(!c) return null;
  const job=G.job&&lavoroLuogo(G.job)===luogo ? G.job : null;
  return {
    roleId:c.roleId||job&&job.id||null,
    roleLevel:Number(c.roleLevel||0),
    pay:job ? Number(job.pay||0) : null,
    reliability:Number(c.reliability||0),
    cyclesCompleted:Number(c.cyclesCompleted||0),
    perfectCycles:Number(c.perfectCycles||0),
    cyclesInRole:Number(c.cyclesInRole||0),
    perfectCyclesInRole:Number(c.perfectCyclesInRole||0),
    raisesByRole:Object.assign({},c.raisesByRole||{}),
    warnings:Number(c.warnings||0),
    dismissals:Number(c.dismissals||0)
  };
}

function lavoroResetCarriera(luogo,opts){
  opts=opts||{};
  const sede=lavoroSede(luogo);
  if(!sede) return null;
  const precedente=sede.career&&typeof sede.career==="object" ? sede.career : {};
  const blocco=opts.preserveBlock ? precedente.blockedUntilWeek : null;
  const dismissals=Math.max(0,Number(precedente.dismissals||0));
  sede.career=lavoroCarrieraBase({
    dismissals:dismissals,
    blockedUntilWeek:blocco
  });
  return sede.career;
}

function lavoroCarriera(luogo){
  const sede = lavoroSede(luogo);
  if(!sede) return null;
  const cfg = lavoroCarrieraDef(luogo);
  if(!sede.career || typeof sede.career !== "object"){
    sede.career = lavoroCarrieraBase();
  }

  const c = sede.career;
  c.reliability = Math.max(0, Math.min(100, Number(c.reliability == null ? 50 : c.reliability)));
  c.cyclesCompleted = Math.max(0, Number(c.cyclesCompleted || 0));
  c.perfectCycles = Math.max(0, Number(c.perfectCycles || 0));
  c.perfectStreak = Math.max(0, Number(c.perfectStreak || 0));
  c.cyclesInRole = Math.max(0, Number(c.cyclesInRole || 0));
  c.perfectCyclesInRole = Math.max(0, Number(c.perfectCyclesInRole || 0));
  if(!c.raisesByRole || typeof c.raisesByRole !== "object") c.raisesByRole = {};
  if(!Array.isArray(c.payHistory)) c.payHistory = [];
  if(!Array.isArray(c.roleHistory)) c.roleHistory = [];
  const maxRichiami = cfg && cfg.disciplina
    ? Math.max(0, Number(cfg.disciplina.richiamiPrimaLicenziamento || 2))
    : 2;
  c.warnings = Math.max(0, Math.min(maxRichiami, Number(c.warnings || 0)));
  c.dismissals = Math.max(0, Number(c.dismissals || 0));
  if(!Array.isArray(c.warningHistory)) c.warningHistory = [];
  if(!Array.isArray(c.weeklyEvaluations)) c.weeklyEvaluations = [];
  if(c.blockedUntilWeek != null && !Number.isFinite(Number(c.blockedUntilWeek))) c.blockedUntilWeek = null;
  if(!Array.isArray(c.evaluations)) c.evaluations = [];

  if(cfg && Array.isArray(cfg.ruoli)){
    const job = G.job && lavoroLuogo(G.job) === luogo ? G.job : null;
    if(!c.roleId && job) c.roleId = job.id || (cfg.ruoli[0] && cfg.ruoli[0].id) || null;
    const idx = cfg.ruoli.findIndex(r => r.id === c.roleId);
    c.roleLevel = idx >= 0 ? idx : Math.max(0, Number(c.roleLevel || 0));
  }

  return c;
}

function lavoroRuoloCorrente(luogo){
  const cfg = lavoroCarrieraDef(luogo);
  if(!cfg || !Array.isArray(cfg.ruoli)) return null;
  const c = lavoroCarriera(luogo);
  if(!c) return null;
  const job = G.job && lavoroLuogo(G.job) === luogo ? G.job : null;
  const id = job && job.id ? job.id : c.roleId;
  return cfg.ruoli.find(r => r.id === id) || null;
}

function lavoroProssimoRuolo(luogo){
  const cfg = lavoroCarrieraDef(luogo);
  if(!cfg || !Array.isArray(cfg.ruoli)) return null;
  const ruolo = lavoroRuoloCorrente(luogo);
  if(!ruolo) return cfg.ruoli[0] || null;
  const idx = cfg.ruoli.findIndex(r => r.id === ruolo.id);
  return idx >= 0 ? (cfg.ruoli[idx + 1] || null) : null;
}

/* Stato leggibile della progressione. Le soglie restano qui insieme alla
   logica della carriera: la UI non deve conoscere numeri hardcoded né
   reinterpretare cosa significhi "pronto". */
function lavoroProgressoCarriera(luogo){
  const cfg=lavoroCarrieraDef(luogo);
  const c=lavoroCarriera(luogo);
  const ruolo=lavoroRuoloCorrente(luogo);
  if(!cfg || !c || !ruolo) return null;

  const ruoli=Array.isArray(cfg.ruoli) ? cfg.ruoli : [];
  const idx=Math.max(0,ruoli.findIndex(r=>r.id===ruolo.id));
  const next=idx>=0 ? (ruoli[idx+1]||null) : null;
  const raiseCfg=cfg.aumento||{};
  const promotionCfg=cfg.promozione||{};
  const ricevuti=Math.max(0,Number(c.raisesByRole&&c.raisesByRole[ruolo.id]||0));
  const maxAumenti=Math.max(0,Number(raiseCfg.maxPerRuolo||0));

  const req=(valore,soglia)=>({
    valore:Math.max(0,Number(valore||0)),
    soglia:Math.max(0,Number(soglia||0)),
    ok:Number(valore||0)>=Number(soglia||0)
  });

  return {
    luogo,
    ruolo:{
      id:ruolo.id,
      n:ruolo.n,
      livello:idx,
      descrizione:ruolo.d||""
    },
    percorso:ruoli.map((r,i)=>({id:r.id,n:r.n,livello:i,stato:i<idx?"fatto":i===idx?"corrente":"futuro"})),
    prossimo:next ? {
      id:next.id,
      n:next.n,
      descrizione:next.d||"",
      energia:Number.isFinite(Number(next.energia)) ? Number(next.energia) : null,
      benessere:Number.isFinite(Number(next.benessereTurno)) ? Number(next.benessereTurno) : null,
      lucidita:Number.isFinite(Number(next.luciditaTurno)) ? Number(next.luciditaTurno) : null,
      fisico:next.fisico||null,
      stress:next.stress||null
    } : null,
    affidabilita:Math.max(0,Math.min(100,Number(c.reliability||0))),
    aumento:{
      disponibile:lavoroAumentoDisponibile(luogo),
      ricevuti,
      maxPerRuolo:maxAumenti,
      esaurito:maxAumenti>0 && ricevuti>=maxAumenti,
      cicli:req(c.cyclesInRole,raiseCfg.cicliNelRuolo),
      affidabilita:req(c.reliability,raiseCfg.affidabilita)
    },
    promozione:{
      disponibile:lavoroPromozioneDisponibile(luogo),
      massimo:!next,
      cicli:req(c.cyclesInRole,promotionCfg.cicliNelRuolo),
      affidabilita:req(c.reliability,promotionCfg.affidabilita),
      perfetti:req(c.perfectCyclesInRole,promotionCfg.cicliPerfettiNelRuolo)
    }
  };
}

/* Profilo concreto del turno per ruolo. Per i lavori che non hanno ancora
   questa profondità mantiene esattamente il comportamento storico. */
function lavoroEffettiTurno(luogo, job){
  const corrente = job || G.job;
  const cfg = lavoroCarrieraDef(luogo);
  const ruolo = cfg && Array.isArray(cfg.ruoli) && corrente
    ? cfg.ruoli.find(r => r.id === corrente.id)
    : null;
  return {
    ruolo:ruolo || null,
    energia:ruolo && Number.isFinite(Number(ruolo.energia))
      ? Number(ruolo.energia)
      : Math.max(0, Number(corrente && corrente.e || 18)),
    benessere:ruolo && Number.isFinite(Number(ruolo.benessereTurno))
      ? Number(ruolo.benessereTurno)
      : -4,
    lucidita:ruolo && Number.isFinite(Number(ruolo.luciditaTurno))
      ? Number(ruolo.luciditaTurno)
      : -3,
    fisico:ruolo && ruolo.fisico || null,
    stress:ruolo && ruolo.stress || null
  };
}

function lavoroAumentoDisponibile(luogo){
  if(!G.job || lavoroLuogo(G.job) !== luogo) return false;
  const cfg = lavoroCarrieraDef(luogo);
  const c = lavoroCarriera(luogo);
  const ruolo = lavoroRuoloCorrente(luogo);
  if(!cfg || !cfg.aumento || !c || !ruolo) return false;
  const ricevuti = Math.max(0, Number(c.raisesByRole[ruolo.id] || 0));
  return c.cyclesInRole >= cfg.aumento.cicliNelRuolo &&
    c.reliability >= cfg.aumento.affidabilita &&
    ricevuti < cfg.aumento.maxPerRuolo;
}

function lavoroPromozioneDisponibile(luogo){
  if(!G.job || lavoroLuogo(G.job) !== luogo) return false;
  const cfg = lavoroCarrieraDef(luogo);
  const c = lavoroCarriera(luogo);
  const next = lavoroProssimoRuolo(luogo);
  if(!cfg || !cfg.promozione || !c || !next) return false;
  return c.cyclesInRole >= cfg.promozione.cicliNelRuolo &&
    c.reliability >= cfg.promozione.affidabilita &&
    c.perfectCyclesInRole >= cfg.promozione.cicliPerfettiNelRuolo;
}

/* Effetti reali che gli eventi useranno:
   l'aumento modifica G.job.pay, quindi cambia da subito paga base e
   maggiorazioni; la promozione cambia mansione ma NON il luogo di lavoro. */
function lavoroApplicaAumento(luogo, opzioni){
  opzioni = opzioni || {};
  if(!lavoroAumentoDisponibile(luogo)) return null;

  const c = lavoroCarriera(luogo);
  const ruolo = lavoroRuoloCorrente(luogo);
  const prima = Math.max(0, Number(G.job.pay || 0));
  let dopo = prima;

  if(opzioni.nuovaPaga != null) dopo = Math.round(Number(opzioni.nuovaPaga));
  else if(opzioni.percentuale != null)
    dopo = Math.round(prima * (1 + Number(opzioni.percentuale) / 100));
  else if(opzioni.aumento != null) dopo = Math.round(prima + Number(opzioni.aumento));

  if(!Number.isFinite(dopo) || dopo <= prima) return null;

  G.job.pay = dopo;
  c.raisesByRole[ruolo.id] = Math.max(0, Number(c.raisesByRole[ruolo.id] || 0)) + 1;
  c.payHistory.push({
    absoluteDay:lavoroGiornoAssoluto(),
    roleId:ruolo.id,
    from:prima,
    to:dopo,
    reason:opzioni.motivo || "aumento"
  });
  if(c.payHistory.length > 20) c.payHistory.shift();

  return {luogo:luogo, ruolo:ruolo.id, prima:prima, dopo:dopo, aumento:dopo-prima};
}

function lavoroPromuoviRuolo(luogo, opzioni){
  opzioni = opzioni || {};
  if(!lavoroPromozioneDisponibile(luogo)) return null;

  const c = lavoroCarriera(luogo);
  const prima = lavoroRuoloCorrente(luogo);
  const dopo = lavoroProssimoRuolo(luogo);
  if(!prima || !dopo) return null;

  const pagaPrima = Number(G.job.pay || 0);
  const energiaPrima = Number(G.job.e || 0);

  G.job.id = dopo.id;
  G.job.n = dopo.n;
  G.job.place = luogo;
  if(opzioni.nuovaPaga != null && Number(opzioni.nuovaPaga) > 0)
    G.job.pay = Math.round(Number(opzioni.nuovaPaga));
  else if(opzioni.aumentoPaga != null && Number(opzioni.aumentoPaga) > 0)
    G.job.pay = Math.round(pagaPrima + Number(opzioni.aumentoPaga));

  /* La mansione porta con sé il suo carico reale: non resta per sempre il
     costo energetico dell'Operaio iniziale dopo una promozione. Un override
     esplicito dell'evento resta possibile, ma altrimenti comanda il ruolo. */
  const energiaRuolo = Number(dopo.energia);
  if(opzioni.energia != null && Number(opzioni.energia) > 0)
    G.job.e = Math.round(Number(opzioni.energia));
  else if(Number.isFinite(energiaRuolo) && energiaRuolo > 0)
    G.job.e = Math.round(energiaRuolo);
  if(dopo.d) G.job.d = dopo.d;

  c.roleHistory.push({
    absoluteDay:lavoroGiornoAssoluto(),
    from:prima.id,
    to:dopo.id,
    payBefore:pagaPrima,
    payAfter:Number(G.job.pay || pagaPrima),
    energyBefore:energiaPrima,
    energyAfter:Number(G.job.e || energiaPrima),
    reason:opzioni.motivo || "promozione"
  });
  if(c.roleHistory.length > 12) c.roleHistory.shift();

  c.roleId = dopo.id;
  const cfg = lavoroCarrieraDef(luogo);
  c.roleLevel = cfg && Array.isArray(cfg.ruoli) ? cfg.ruoli.findIndex(r => r.id === dopo.id) : 0;
  c.cyclesInRole = 0;
  c.perfectCyclesInRole = 0;
  c.perfectStreak = 0;

  /* La sede e i contatti non si azzerano con la promozione, ma la nuova
     mansione deve costruire la propria esposizione sociale da zero. */
  const rete=lavoroReteStato(luogo);
  if(rete && rete.turniPerRuolo && !Object.prototype.hasOwnProperty.call(rete.turniPerRuolo,dopo.id))
    rete.turniPerRuolo[dopo.id]=0;

  return {
    luogo:luogo,
    da:prima,
    a:dopo,
    pagaPrima:pagaPrima,
    pagaDopo:Number(G.job.pay || pagaPrima),
    energiaPrima:energiaPrima,
    energiaDopo:Number(G.job.e || energiaPrima)
  };
}

function lavoroCicloInizioGiorno(ciclo){
  return Number(ciclo || 0) * ADF_LAVORO_GIORNI_CICLO + 1;
}

function lavoroBloccoRiassunzione(luogo){
  const c = lavoroCarriera(luogo);
  if(!c || c.blockedUntilWeek == null)
    return {active:false, weeksRemaining:0, untilWeek:null};

  const oggi = lavoroSettimanaAssoluta();
  const fino = Number(c.blockedUntilWeek);
  if(oggi > fino){
    c.blockedUntilWeek = null;
    return {active:false, weeksRemaining:0, untilWeek:null};
  }
  return {
    active:true,
    weeksRemaining:Math.max(1, fino - oggi + 1),
    untilWeek:fino
  };
}

function lavoroLicenzia(luogo, motivo){
  const c = lavoroCarriera(luogo);
  if(!c) return null;

  const ruolo = G.job && lavoroLuogo(G.job) === luogo
    ? {id:G.job.id, n:G.job.n}
    : null;
  const carrieraCfg = lavoroCarrieraDef(luogo);
  const cfg = carrieraCfg && carrieraCfg.disciplina ? carrieraCfg.disciplina : null;
  const blocco = cfg ? Number(cfg.bloccoRiassunzioneSettimane || 0) : 0;

  c.dismissals += 1;
  c.blockedUntilWeek = blocco > 0 ? lavoroSettimanaAssoluta() + blocco : null;
  c.warningHistory.push({
    absoluteDay:lavoroGiornoAssoluto(),
    type:"dismissal",
    reason:motivo || "assenze",
    warnings:c.warnings
  });
  if(c.warningHistory.length > 24) c.warningHistory.shift();

  lavoroTerminaContratto(luogo, "licenziamento");
  G._lastJobLossReason = luogo === "fabbrica" ? "factory_absences" : luogo + "_absences";

  return {
    luogo:luogo,
    ruolo:ruolo,
    reason:motivo || "assenze",
    blockedUntilWeek:c.blockedUntilWeek,
    weeksBlocked:blocco
  };
}

function lavoroSettimanaGiaValutata(luogo, absoluteWeek){
  const c = lavoroCarriera(luogo);
  if(!c) return false;
  return c.weeklyEvaluations.some(x => Number(x.absoluteWeek) === Number(absoluteWeek));
}

function lavoroValutaDisciplinaSettimana(luogo, absoluteWeek, cycle, weekInCycle, turni, opts){
  opts = opts || {};
  const carrieraCfg = lavoroCarrieraDef(luogo);
  if(!carrieraCfg || !carrieraCfg.disciplina) return null;

  const sede = lavoroSede(luogo);
  const contratto = lavoroContratto(luogo);
  const carriera = lavoroCarriera(luogo);
  const def = lavoroContrattoDef(luogo);
  if(!sede || !contratto || !contratto.signed || !carriera || !def) return null;

  absoluteWeek = Number(absoluteWeek);
  cycle = Number(cycle);
  weekInCycle = Number(weekInCycle);
  if(!Number.isInteger(absoluteWeek) || absoluteWeek < 1 ||
     !Number.isInteger(cycle) || cycle < 0 ||
     !Number.isInteger(weekInCycle) || weekInCycle < 0 || weekInCycle > 3)
    return null;

  const gia = carriera.weeklyEvaluations.find(x => Number(x.absoluteWeek) === absoluteWeek);
  if(gia) return gia;

  const weekStartAbsoluteDay = (absoluteWeek - 1) * 7 + 1;
  /* Un contratto firmato a settimana iniziata non genera assenze retroattive. */
  const eligible = Number(contratto.signedAbsoluteDay || Infinity) <= weekStartAbsoluteDay;
  const from = weekInCycle * 7;
  const to = from + 7;
  const lista = Array.isArray(turni) ? turni.map(Number).filter(Number.isInteger) : [];
  const consentiti = Array.isArray(def.giorniConsentiti) ? def.giorniConsentiti : [1,2,3,4,5,6,7];
  const giorni = new Set(
    lista.filter(n => n >= from && n < to && consentiti.includes((n - from) + 1))
  );
  const fatti = giorni.size;
  const richiesti = Math.max(0, Number(def.turniSettimanali || 0));
  const assenze = Math.max(0, richiesti - fatti);

  const cfg = carrieraCfg.disciplina;
  const primaAffidabilita = carriera.reliability;
  const primaRichiami = carriera.warnings;
  let warningAdded = 0;
  let dismissed = false;

  if(eligible){
    if(assenze >= Number(cfg.assenzeRichiamoMin || 3)){
      carriera.reliability = Math.max(0,
        carriera.reliability - Number(cfg.malusRichiamoAffidabilita || 0));

      if(carriera.warnings >= Number(cfg.richiamiPrimaLicenziamento || 2)){
        dismissed = true;
        lavoroLicenzia(luogo, "assenze ripetute");
      }else{
        carriera.warnings += 1;
        warningAdded = 1;
        carriera.warningHistory.push({
          absoluteDay:lavoroGiornoAssoluto(),
          absoluteWeek:absoluteWeek,
          type:"warning",
          reason:"assenze settimanali",
          absences:assenze,
          warnings:carriera.warnings
        });
      }
    }else if(assenze > 0){
      carriera.reliability = Math.max(0,
        carriera.reliability - Number(cfg.malusLieveAffidabilita || 0));
    }
  }

  const result = {
    absoluteWeek:absoluteWeek,
    cycle:cycle,
    weekInCycle:weekInCycle + 1,
    eligible:eligible,
    workedDays:fatti,
    requiredDays:richiesti,
    absences:assenze,
    warningAdded:warningAdded,
    warningsBefore:primaRichiami,
    warningsAfter:carriera.warnings,
    reliabilityBefore:primaAffidabilita,
    reliabilityAfter:carriera.reliability,
    reliabilityDelta:carriera.reliability - primaAffidabilita,
    dismissed:dismissed
  };

  carriera.weeklyEvaluations.push(result);
  if(carriera.weeklyEvaluations.length > 24) carriera.weeklyEvaluations.shift();
  if(carriera.warningHistory.length > 24)
    carriera.warningHistory.splice(0, carriera.warningHistory.length - 24);

  if(!opts.silent && eligible && typeof pushLog === "function"){
    const nome = lavoroNomeLuogo(luogo);
    const maxRichiami = Number(cfg.richiamiPrimaLicenziamento || 2);
    if(dismissed){
      pushLog("<b>Licenziato dalla " + nome + ".</b> Dopo " + maxRichiami +
        " richiami, un'altra settimana con " + assenze +
        " assenze ha chiuso il rapporto. Non puoi essere riassunto qui per " +
        Number(cfg.bloccoRiassunzioneSettimane || 0) + " settimane.", "bad");
    }else if(warningAdded){
      pushLog("<b>Richiamo formale in " + nome + ".</b> Settimana " + (weekInCycle + 1) +
        ": " + assenze + " assenze · richiami " + carriera.warnings +
        "/" + maxRichiami + " · affidabilità −" + Number(cfg.malusRichiamoAffidabilita || 0) + ".", "bad");
    }else if(assenze > 0){
      pushLog("<b>Presenze sotto contratto.</b> " + nome + " · settimana " + (weekInCycle + 1) +
        ": " + assenze + (assenze === 1 ? " assenza" : " assenze") +
        " · affidabilità −" + Number(cfg.malusLieveAffidabilita || 0) + ".", "bad");
    }
  }

  if(!opts.silent && typeof window !== "undefined" && window.ADF_WORK_EVENTS && typeof ADF_WORK_EVENTS.onDiscipline === "function")
    ADF_WORK_EVENTS.onDiscipline(luogo,result);

  return result;
}

/* Recupera le settimane già concluse del ciclo corrente.
   Serve anche da migrazione per le partite già in corso: il cartellino che
   l'utente sta guardando viene riallineato senza aspettare altre settimane. */
function lavoroSincronizzaDisciplinaSettimane(luogo, silent){
  const sede = lavoroSede(luogo);
  if(!sede || !sede.attendance || !Array.isArray(sede.attendance.turni)) return [];

  const ciclo = lavoroCicloCorrente();
  if(Number(sede.attendance.ciclo) !== ciclo) return [];

  const currentWeekInCycle = (lavoroSettimanaAssoluta() - 1) % ADF_LAVORO_CICLO_SETTIMANE;
  const out = [];
  for(let w=0; w<currentWeekInCycle; w++){
    const absoluteWeek = ciclo * ADF_LAVORO_CICLO_SETTIMANE + w + 1;
    if(lavoroSettimanaGiaValutata(luogo, absoluteWeek)) continue;
    const r = lavoroValutaDisciplinaSettimana(
      luogo, absoluteWeek, ciclo, w, sede.attendance.turni, {silent:!!silent}
    );
    if(r) out.push(r);
    if(!G.job || lavoroLuogo(G.job) !== luogo) break;
  }
  return out;
}

function lavoroChiudiSettimana(luogo){
  const sede = lavoroSede(luogo);
  if(!sede || !sede.attendance || !Array.isArray(sede.attendance.turni)) return null;
  const absoluteWeek = lavoroSettimanaAssoluta();
  const ciclo = lavoroCicloCorrente();
  const weekInCycle = (absoluteWeek - 1) % ADF_LAVORO_CICLO_SETTIMANE;
  if(Number(sede.attendance.ciclo) !== ciclo) return null;
  return lavoroValutaDisciplinaSettimana(
    luogo, absoluteWeek, ciclo, weekInCycle, sede.attendance.turni, {silent:false}
  );
}

function lavoroChiudiSettimane(){
  const luoghi = Object.keys(G.workplaces || {});
  return luoghi.map(luogo => lavoroChiudiSettimana(luogo)).filter(Boolean);
}

/* A fine ciclo non riapplichiamo le stesse assenze: la disciplina ormai è
   settimanale. Il ciclo di 4 settimane resta per bonus affidabilità, carriera
   e recupero dei richiami dopo due mesi perfetti consecutivi. */
function lavoroApplicaDisciplina(luogo, evaluation){
  const carrieraCfg = lavoroCarrieraDef(luogo);
  if(!carrieraCfg || !carrieraCfg.disciplina || !evaluation || !evaluation.eligible) return null;
  const c = lavoroCarriera(luogo);
  if(!c) return null;
  const cfg = carrieraCfg.disciplina;
  let warningRemoved = 0;

  const recupero = Math.max(1, Number(cfg.recuperoRichiamoCicliPerfetti || 2));
  if(Number(evaluation.absences || 0) === 0 &&
     c.warnings > 0 &&
     c.perfectStreak > 0 &&
     c.perfectStreak % recupero === 0){
    c.warnings -= 1;
    warningRemoved = 1;
    c.warningHistory.push({
      absoluteDay:lavoroGiornoAssoluto(),
      type:"warning_removed",
      reason:recupero + (recupero === 1 ? " ciclo perfetto consecutivo" : " cicli perfetti consecutivi"),
      warnings:c.warnings
    });
    if(typeof pushLog === "function")
      pushLog("<b>Richiamo cancellato.</b> " + lavoroNomeLuogo(luogo) + ": " +
        recupero + (recupero === 1 ? " ciclo perfetto ha" : " cicli perfetti hanno") +
        " ripulito il tuo storico recente.", "good");
  }

  return {
    absences:Number(evaluation.absences || 0),
    warningAdded:0,
    warningRemoved:warningRemoved,
    warningsAfter:c.warnings,
    reliabilityAfter:c.reliability,
    dismissed:false
  };
}

function lavoroValutaCiclo(luogo, ciclo, turni){
  const def = lavoroContrattoDef(luogo);
  const contratto = lavoroContratto(luogo);
  const carriera = lavoroCarriera(luogo);
  if(!def || !contratto || !contratto.signed || !carriera) return null;

  ciclo = Number(ciclo);
  if(!Number.isInteger(ciclo) || ciclo < 0) return null;
  if(carriera.lastEvaluatedCycle != null && Number(carriera.lastEvaluatedCycle) === ciclo) return carriera.lastEvaluation;

  const startDay = lavoroCicloInizioGiorno(ciclo);
  const eligible = Number(contratto.signedAbsoluteDay || Infinity) <= startDay;
  const lista = Array.isArray(turni) ? turni.map(Number).filter(Number.isInteger) : [];
  const settimane = [];

  for(let w=0; w<ADF_LAVORO_CICLO_SETTIMANE; w++){
    const from = w * 7, to = from + 7;
    /* Conta soltanto i giorni ordinari previsti dal contratto del luogo.
       Un doppio turno vale comunque come una sola presenza giornaliera. */
    const consentiti = Array.isArray(def.giorniConsentiti) ? def.giorniConsentiti : [1,2,3,4,5,6,7];
    const giorni = new Set(
      lista.filter(n => n >= from && n < to && consentiti.includes((n - from) + 1))
    );
    const fatti = giorni.size;
    const richiesti = Number(def.turniSettimanali || 0);
    settimane.push({
      settimana:w + 1,
      giorni:fatti,
      richiesti:richiesti,
      completa:fatti >= richiesti,
      assenze:Math.max(0, richiesti - fatti)
    });
  }

  const fullWeeks = settimane.filter(x => x.completa).length;
  const absences = settimane.reduce((n,x) => n + x.assenze, 0);
  const perfect = eligible && fullWeeks === ADF_LAVORO_CICLO_SETTIMANE;
  const reliabilityBefore = carriera.reliability;

  if(eligible){
    carriera.cyclesCompleted += 1;
    carriera.cyclesInRole += 1;
    if(perfect){
      carriera.perfectCycles += 1;
      carriera.perfectCyclesInRole += 1;
      carriera.perfectStreak += 1;
      const carrieraCfg = lavoroCarrieraDef(luogo);
      const bonusPerfetto = carrieraCfg && carrieraCfg.affidabilitaCicloPerfetto != null
        ? Number(carrieraCfg.affidabilitaCicloPerfetto)
        : 10;
      carriera.reliability = Math.min(100, carriera.reliability + bonusPerfetto);
    }else{
      carriera.perfectStreak = 0;
    }
  }

  const evaluation = {
    ciclo:ciclo,
    eligible:eligible,
    fullWeeks:fullWeeks,
    absences:absences,
    perfect:perfect,
    reliabilityBefore:reliabilityBefore,
    reliabilityAfter:carriera.reliability,
    reliabilityDelta:carriera.reliability - reliabilityBefore,
    settimane:settimane,
    disciplina:null
  };

  evaluation.disciplina = lavoroApplicaDisciplina(luogo, evaluation);
  evaluation.reliabilityAfter = carriera.reliability;
  evaluation.reliabilityDelta = carriera.reliability - reliabilityBefore;

  carriera.lastEvaluatedCycle = ciclo;
  carriera.lastEvaluation = evaluation;
  carriera.evaluations.push(evaluation);
  if(carriera.evaluations.length > 12) carriera.evaluations.shift();

  if(eligible){
    const nome = lavoroNomeLuogo(luogo);
    if(perfect){
      if(typeof pushLog === "function")
        pushLog("<b>Valutazione " + nome + ": 4/4 settimane complete.</b> Affidabilità +" +
          Math.max(0, evaluation.reliabilityDelta) + ".", "good");
    }else if(typeof pushLog === "function" &&
             !(evaluation.disciplina && evaluation.disciplina.dismissed)){
      pushLog("<b>Valutazione " + nome + ":</b> " + fullWeeks + "/4 settimane complete · " +
        absences + (absences === 1 ? " assenza." : " assenze."), absences ? "bad" : "");
    }
  }
  if(typeof window !== "undefined" && window.ADF_WORK_EVENTS && typeof ADF_WORK_EVENTS.onCycle === "function")
    ADF_WORK_EVENTS.onCycle(luogo,evaluation);
  return evaluation;
}

function lavoroChiudiCiclo(luogo){
  const sede = lavoroSede(luogo);
  if(!sede || !sede.attendance) return null;
  const ciclo = lavoroCicloCorrente();
  if(Number(sede.attendance.ciclo) !== ciclo) return null;
  return lavoroValutaCiclo(luogo, ciclo, sede.attendance.turni);
}

function lavoroChiudiCicli(){
  /* Si chiude soltanto alla quarta settimana del blocco corrente. */
  if(((lavoroSettimanaAssoluta() - 1) % ADF_LAVORO_CICLO_SETTIMANE) !==
     ADF_LAVORO_CICLO_SETTIMANE - 1) return [];
  const luoghi = Object.keys(G.workplaces || {});
  return luoghi.map(luogo => lavoroChiudiCiclo(luogo)).filter(Boolean);
}

function lavoroStraordinarioStato(luogo){
  const sede = lavoroSede(luogo);
  if(!sede) return null;
  if(!sede.overtime || typeof sede.overtime !== "object"){
    sede.overtime = {
      lastCheckAbsoluteDay:null,
      lastOfferWeek:null,
      pendingOffer:null,
      accepted:null,
      history:[]
    };
  }
  const s = sede.overtime;
  if(!Array.isArray(s.history)) s.history = [];
  return s;
}

function lavoroCandidatoStraordinario(luogo){
  if(!G.job || lavoroLuogo(G.job) !== luogo) return null;

  const cart = lavoroCartellino(luogo);
  const stato = lavoroStraordinarioStato(luogo);
  const def = lavoroContrattoDef(luogo);
  const carrieraCfg = lavoroCarrieraDef(luogo);
  const cfg = carrieraCfg && carrieraCfg.straordinari;
  if(!cart || !stato || !def || !cfg || stato.accepted || stato.pendingOffer) return null;

  const oggi = Math.max(1, Math.min(7, Number(G.day || 1)));
  const assoluto = lavoroGiornoAssoluto();
  const settimana = lavoroSettimanaAssoluta();
  if(Number(stato.lastOfferWeek) === settimana) return null;
  if(cart.giorniLavoratiSettimana < cart.turniSettimanaliRichiesti) return null;

  const bonusExtra = Math.max(0, Number(def.bonusSestoGiornoPct || 0));

  /* La Fabbrica conserva la sua logica 5/5 -> sabato/domenica.
     La Pizzeria ha invece 4 turni, martedì-domenica: dopo aver coperto la
     quota può essere chiesto un quinto turno nel weekend, con premio più basso. */
  if(oggi === 5 && Array.isArray(def.giorniConsentiti) && def.giorniConsentiti.includes(6)){
    return {
      luogo:luogo,
      tipo:luogo === "fabbrica" ? "sesto-giorno" : "giorno-extra",
      targetAbsoluteDay:assoluto + 1,
      targetDay:6,
      targetLabel:"sabato",
      bonusPct:bonusExtra,
      chance:Number(cfg.chanceSestoGiorno || 0)
    };
  }

  if(oggi === 6){
    const domenicaConsentita = Array.isArray(def.giorniConsentiti) && def.giorniConsentiti.includes(7);
    if(!domenicaConsentita && !def.domenicaRiposo) return null;
    return {
      luogo:luogo,
      tipo:def.domenicaRiposo ? "domenica" : "giorno-extra",
      targetAbsoluteDay:assoluto + 1,
      targetDay:7,
      targetLabel:"domenica",
      bonusPct:def.domenicaRiposo ? Math.max(0, Number(def.bonusDomenicaPct || 0)) : bonusExtra,
      chance:Number(cfg.chanceDomenica || 0)
    };
  }

  return null;
}

function lavoroTentaRichiestaStraordinario(luogo, roll){
  const stato = lavoroStraordinarioStato(luogo);
  if(!stato) return null;

  const assoluto = lavoroGiornoAssoluto();
  if(stato.lastCheckAbsoluteDay === assoluto) return null;
  stato.lastCheckAbsoluteDay = assoluto;

  const offerta = lavoroCandidatoStraordinario(luogo);
  if(!offerta) return null;

  const r = roll == null ? Math.random() : Number(roll);
  if(!Number.isFinite(r) || r >= offerta.chance) return null;

  stato.lastOfferWeek = lavoroSettimanaAssoluta();
  stato.pendingOffer = Object.assign({
    offeredAbsoluteDay:assoluto,
    status:"offered"
  }, offerta);
  return Object.assign({}, stato.pendingOffer);
}

function lavoroAccettaStraordinario(luogo){
  const stato = lavoroStraordinarioStato(luogo);
  if(!stato || !stato.pendingOffer) return null;

  const offerta = Object.assign({}, stato.pendingOffer, {
    status:"accepted",
    acceptedAbsoluteDay:lavoroGiornoAssoluto()
  });
  stato.pendingOffer = null;
  stato.accepted = offerta;

  if(offerta.tipo === "domenica")
    lavoroAutorizzaDomenica(luogo, offerta.targetAbsoluteDay);

  stato.history.push({
    type:"accepted",
    offeredAbsoluteDay:offerta.offeredAbsoluteDay,
    targetAbsoluteDay:offerta.targetAbsoluteDay,
    overtimeType:offerta.tipo,
    bonusPct:offerta.bonusPct
  });
  if(stato.history.length > 24) stato.history.shift();
  if(typeof window !== "undefined" && window.ADF_WORK_EVENTS && typeof ADF_WORK_EVENTS.onOvertime === "function")
    ADF_WORK_EVENTS.onOvertime(luogo,"accepted",offerta);
  return offerta;
}

function lavoroRifiutaStraordinario(luogo){
  const stato = lavoroStraordinarioStato(luogo);
  if(!stato || !stato.pendingOffer) return null;

  const offerta = Object.assign({}, stato.pendingOffer, {status:"declined"});
  stato.pendingOffer = null;
  stato.history.push({
    type:"declined",
    offeredAbsoluteDay:offerta.offeredAbsoluteDay,
    targetAbsoluteDay:offerta.targetAbsoluteDay,
    overtimeType:offerta.tipo,
    bonusPct:offerta.bonusPct
  });
  if(stato.history.length > 24) stato.history.shift();
  if(typeof window !== "undefined" && window.ADF_WORK_EVENTS && typeof ADF_WORK_EVENTS.onOvertime === "function")
    ADF_WORK_EVENTS.onOvertime(luogo,"declined",offerta);
  return offerta;
}

function lavoroAnnullaRichiestaStraordinario(luogo){
  const stato = lavoroStraordinarioStato(luogo);
  if(!stato || !stato.pendingOffer) return null;
  const offerta = stato.pendingOffer;
  stato.pendingOffer = null;
  if(Number(stato.lastOfferWeek)===lavoroSettimanaAssoluta())
    stato.lastOfferWeek = null;
  return offerta;
}

function lavoroStraordinarioOggi(luogo){
  const stato = lavoroStraordinarioStato(luogo);
  if(!stato || !stato.accepted) return null;
  return Number(stato.accepted.targetAbsoluteDay) === lavoroGiornoAssoluto()
    ? stato.accepted
    : null;
}

function lavoroCompletaStraordinario(luogo){
  const stato = lavoroStraordinarioStato(luogo);
  const offerta = lavoroStraordinarioOggi(luogo);
  if(!stato || !offerta) return null;

  const c = lavoroCarriera(luogo);
  const carrieraCfg = lavoroCarrieraDef(luogo);
  const cfg = carrieraCfg && carrieraCfg.straordinari ? carrieraCfg.straordinari : {};
  const prima = c ? c.reliability : 50;
  const delta = Math.max(0, Number(cfg.affidabilitaCompletato || 0));
  if(c) c.reliability = Math.min(100, c.reliability + delta);

  stato.history.push({
    type:"completed",
    completedAbsoluteDay:lavoroGiornoAssoluto(),
    overtimeType:offerta.tipo,
    bonusPct:offerta.bonusPct,
    reliabilityDelta:delta
  });
  if(stato.history.length > 24) stato.history.shift();
  stato.accepted = null;
  if(offerta.tipo === "domenica"){
    const sede = lavoroSede(luogo);
    if(sede) delete sede.sundayPermitAbsoluteDay;
  }

  const result = {
    tipo:offerta.tipo,
    bonusPct:offerta.bonusPct,
    affidabilitaPrima:prima,
    affidabilitaDopo:c ? c.reliability : prima,
    affidabilitaDelta:c ? c.reliability - prima : 0
  };
  if(typeof window !== "undefined" && window.ADF_WORK_EVENTS && typeof ADF_WORK_EVENTS.onOvertime === "function")
    ADF_WORK_EVENTS.onOvertime(luogo,"completed",result);
  return result;
}

function lavoroAggiornaStraordinariTempo(){
  const oggi = lavoroGiornoAssoluto();

  for(const luogo of Object.keys(G.workplaces || {})){
    const stato = lavoroStraordinarioStato(luogo);
    if(!stato || !stato.accepted) continue;
    if(Number(stato.accepted.targetAbsoluteDay) >= oggi) continue;

    const c = lavoroCarriera(luogo);
    const carrieraCfg = lavoroCarrieraDef(luogo);
    const cfg = carrieraCfg && carrieraCfg.straordinari ? carrieraCfg.straordinari : null;
    const delta = cfg ? Number(cfg.affidabilitaSaltato || 0) : 0;
    const offerta = stato.accepted;

    if(c && delta)
      c.reliability = Math.max(0, Math.min(100, c.reliability + delta));

    stato.history.push({
      type:"missed",
      targetAbsoluteDay:offerta.targetAbsoluteDay,
      overtimeType:offerta.tipo,
      bonusPct:offerta.bonusPct,
      reliabilityDelta:delta
    });
    if(stato.history.length > 24) stato.history.shift();
    stato.accepted = null;
    if(offerta.tipo === "domenica"){
      const sede = lavoroSede(luogo);
      if(sede) delete sede.sundayPermitAbsoluteDay;
    }

    if(typeof window !== "undefined" && window.ADF_WORK_EVENTS && typeof ADF_WORK_EVENTS.onOvertime === "function")
      ADF_WORK_EVENTS.onOvertime(luogo,"missed",{
        tipo:offerta.tipo,
        targetAbsoluteDay:offerta.targetAbsoluteDay,
        bonusPct:offerta.bonusPct,
        reliabilityDelta:delta
      });

    if(typeof pushLog === "function"){
      pushLog("<b>Straordinario saltato.</b> Avevi accettato il turno di " +
        offerta.targetLabel + ". Affidabilità " + (delta >= 0 ? "+" : "") + delta + ".", "bad");
    }
  }
}

function lavoroUltimoEsitoTurno(luogo){
  const sede=lavoroSede(luogo);
  return sede && sede.lastShiftOutcome && typeof sede.lastShiftOutcome==="object"
    ? sede.lastShiftOutcome
    : null;
}

function lavoroSalvaEsitoTurno(luogo,data){
  if(!luogo) return null;
  const sede=lavoroSede(luogo);
  if(!sede) return null;
  const out=Object.assign({
    absoluteDay:lavoroGiornoAssoluto(),
    year:Number(G.year)||1,
    week:Number(G.week)||1,
    day:Number(G.day)||1,
    event:null
  },data||{});
  sede.lastShiftOutcome=out;
  return out;
}

function lavoroSegnaEventoEsitoTurno(luogo,event){
  const out=lavoroUltimoEsitoTurno(luogo);
  if(!out || Number(out.absoluteDay)!==Number(lavoroGiornoAssoluto())) return null;
  out.event=event && typeof event==="object"
    ? Object.assign({},event)
    : {type:"none",title:"Nessun evento extra",detail:"Turno chiuso senza imprevisti."};
  try{ if(typeof save==="function") save(); }catch(_){}
  return out.event;
}

function lavoroReteStato(luogo){
  const sede = lavoroSede(luogo);
  if(!sede) return null;
  if(!sede.network || typeof sede.network !== "object"){
    sede.network = {
      lastCheckAbsoluteDay:null,
      lastEncounterAbsoluteDay:null,
      encounters:0,
      turniVisti:0,
      history:[]
    };
  }
  const s = sede.network;
  s.encounters = Math.max(0, Number(s.encounters || 0));
  s.turniVisti = Math.max(0, Number(s.turniVisti || 0));
  if(!s.turniPerRuolo || typeof s.turniPerRuolo!=="object") s.turniPerRuolo={};
  if(!Array.isArray(s.history)) s.history = [];
  return s;
}

/* Un turno può far nascere una conoscenza diversa a seconda del lavoro.
   La Fabbrica continua a usare la sede "fabbrica" e il suo cartellino; i
   lavori senza luogo dedicato persistono la rete sotto G.workplaces[job.id].
   Il controllo è al massimo una volta al giorno anche con doppi turni. */
function lavoroTentaIncontroContatto(luogo, roll, job){
  const corrente = job || G.job;
  if(!corrente || lavoroReteChiave(corrente) !== luogo) return null;
  if(typeof postoContattoLavoroCandidato !== "function") return null;

  const cfg = lavoroReteDef(corrente);
  const stato = lavoroReteStato(luogo);
  if(!cfg || !stato) return null;

  const oggi = lavoroGiornoAssoluto();
  if(Number(stato.lastCheckAbsoluteDay) === oggi) return null;
  stato.lastCheckAbsoluteDay = oggi;
  stato.turniVisti += 1;
  const ruoloId=String(corrente.id||luogo||"lavoro");
  /* Migrazione dei salvataggi precedenti: se esiste il vecchio contatore ma
     nessun ruolo è mai stato registrato, lo attribuiamo alla mansione che il
     giocatore ha al primo caricamento. Dopo questo passaggio, una promozione
     futura avrà una chiave nuova e ripartirà correttamente da zero. */
  if(!Object.keys(stato.turniPerRuolo).length){
    let legacy=Math.max(0,stato.turniVisti-1);
    if(luogo==="fabbrica" && typeof lavoroCartellino==="function"){
      const cart=lavoroCartellino(luogo);
      if(cart) legacy=Math.max(legacy,Math.max(0,Number(cart.totale||0)-1));
    }
    if(legacy>0) stato.turniPerRuolo[ruoloId]=legacy;
  }
  stato.turniPerRuolo[ruoloId]=Math.max(0,Number(stato.turniPerRuolo[ruoloId]||0))+1;

  /* L'esposizione per sbloccare nuovi incontri riparte quando cambia mansione.
     Non azzera la rete: impedisce soltanto che una promozione sfrutti i turni
     accumulati da Operaio per generare subito un contatto da Capolinea. */
  const esposizione = stato.turniPerRuolo[ruoloId];
  if(esposizione < Number(cfg.minTurni || 0)) return null;

  if(stato.lastEncounterAbsoluteDay != null &&
     oggi - Number(stato.lastEncounterAbsoluteDay) < Number(cfg.cooldownGiorni || 0))
    return null;

  const esistenti = (G.gente || []).filter(p =>
    p && !p.via && p.origineLuogo === luogo
  );
  const daRiprendere = esistenti.filter(p => !p.numero);
  if(!daRiprendere.length && esistenti.length >= Number(cfg.maxContatti || 0))
    return null;

  const r = roll == null ? Math.random() : Number(roll);
  if(!Number.isFinite(r) || r >= Number(cfg.chanceIncontro || 0)) return null;

  const ruoli = lavoroReteRuoli(corrente, cfg);
  if(!ruoli.length) return null;

  const persona = postoContattoLavoroCandidato(
    luogo,
    daRiprendere,
    Number(cfg.maxContatti || 0),
    ruoli,
    {
      jobId:corrente.id || null,
      workRoleId:corrente.id || null,
      workRoleName:corrente.n || null,
      dettaglio:cfg.dettaglio || "contatto conosciuto al lavoro",
      storia:cfg.storia || "Vi siete conosciuti sul lavoro."
    }
  );
  if(!persona) return null;

  stato.lastEncounterAbsoluteDay = oggi;
  stato.encounters += 1;
  stato.history.push({
    absoluteDay:oggi,
    personId:persona.id,
    role:persona.ruolo,
    jobId:corrente.id || null,
    workRoleId:corrente.id || null,
    type:persona.numero ? "known_contact" : "encounter"
  });
  if(stato.history.length > 24) stato.history.shift();

  return persona;
}

function lavoroTurnoConsentitoOggi(luogo){
  const def = lavoroContrattoDef(luogo);
  if(!def) return {ok:true, reason:null};
  if(lavoroFerieOggi(luogo))
    return {ok:false, reason:"Ferie approvate oggi", phase:"vacation"};
  const giorno = Math.max(1, Math.min(7, Number(G.day || 1)));
  if(def.domenicaRiposo && giorno === 7){
    if(!lavoroDomenicaAutorizzata(luogo))
      return {ok:false, reason:"Domenica: riposo da contratto"};
    /* Una domenica autorizzata è l'eccezione esplicita al calendario
       ordinario lunedì-sabato: non deve essere ribloccata dal controllo
       giorniConsentiti qui sotto. */
    return {ok:true, reason:null};
  }
  if(Array.isArray(def.giorniConsentiti) && !def.giorniConsentiti.includes(giorno))
    return {ok:false, reason:"Giorno non previsto dal contratto"};
  return {ok:true, reason:null};
}

function lavoroLuogo(job){
  if(!job) return null;
  if(job.place) return job.place;
  const def = (typeof JOBS !== "undefined" ? JOBS : []).find(j => j.id === job.id);
  return def && def.place ? def.place : null;
}

function lavoroSede(luogo){
  if(!luogo) return null;
  if(!G.workplaces || typeof G.workplaces !== "object") G.workplaces = {};
  if(!G.workplaces[luogo] || typeof G.workplaces[luogo] !== "object")
    G.workplaces[luogo] = {};

  const sede = G.workplaces[luogo];

  /* Migrazione trasparente del cartellino creato prima di questa base
     generica: nessuna presenza già fatta in Fabbrica viene persa. */
  if(luogo === "fabbrica" && !sede.attendance &&
     G.fabbricaPresenze && typeof G.fabbricaPresenze === "object"){
    sede.attendance = {
      ciclo:Number(G.fabbricaPresenze.ciclo),
      turni:Array.isArray(G.fabbricaPresenze.turni) ? G.fabbricaPresenze.turni.slice() : []
    };
  }
  return sede;
}

function lavoroCartellino(luogo){
  const ciclo = lavoroCicloCorrente();
  const sede = lavoroSede(luogo);
  if(!sede) return null;

  let stato = sede.attendance;
  if(stato && typeof stato === "object" && Number(stato.ciclo) !== ciclo && Array.isArray(stato.turni)){
    /* Rete di sicurezza per salvataggi/salti: se per qualunque motivo il
       cambio ciclo non è passato da advanceWeek(), non buttiamo via il mese
       precedente senza valutarlo. */
    lavoroValutaCiclo(luogo, Number(stato.ciclo), stato.turni);
  }
  if(!stato || typeof stato !== "object" || stato.ciclo !== ciclo || !Array.isArray(stato.turni)){
    stato = {ciclo:ciclo, turni:[]};
    sede.attendance = stato;
  }else{
    stato.turni = stato.turni
      .map(Number)
      .filter(n => Number.isInteger(n) && n >= 0 && n < ADF_LAVORO_GIORNI_CICLO);
  }

  const conteggi = Array(ADF_LAVORO_GIORNI_CICLO).fill(0);
  stato.turni.forEach(n => { conteggi[n] += 1; });

  const posOggi = lavoroPosizioneOggi();
  const settimana = Math.floor(posOggi / 7) + 1;
  const inizio = (settimana - 1) * 7;
  const contratto = lavoroContrattoDef(luogo);
  const giorniConsentiti = contratto && Array.isArray(contratto.giorniConsentiti)
    ? contratto.giorniConsentiti
    : [1,2,3,4,5,6,7];
  const giorniLavoratiSettimana = new Set(
    stato.turni.filter(n => {
      if(n < inizio || n >= inizio + 7) return false;
      return giorniConsentiti.includes((n - inizio) + 1);
    })
  ).size;
  /* Migrazione/sync: se questa partita era già dentro al ciclo quando il
     sistema settimanale è stato introdotto, i richiami delle settimane già
     chiuse vengono recuperati subito. */
  lavoroSincronizzaDisciplinaSettimane(luogo, true);
  const carriera = lavoroCarriera(luogo);
  return {
    luogo:luogo,
    ciclo:ciclo,
    turni:stato.turni,
    conteggi:conteggi,
    totale:stato.turni.length,
    posOggi:posOggi,
    settimana:settimana,
    giorno:(posOggi % 7) + 1,
    giorniLavoratiSettimana:giorniLavoratiSettimana,
    turniSettimanaliRichiesti:contratto ? Number(contratto.turniSettimanali || 0) : 0,
    affidabilita:carriera ? carriera.reliability : 50,
    mesiPerfetti:carriera ? carriera.perfectCycles : 0,
    mesiPerfettiDiFila:carriera ? carriera.perfectStreak : 0,
    cicliNelRuolo:carriera ? carriera.cyclesInRole : 0,
    richiami:carriera ? carriera.warnings : 0,
    licenziamenti:carriera ? carriera.dismissals : 0,
    bloccoRiassunzione:lavoroBloccoRiassunzione(luogo),
    aumentoDisponibile:lavoroAumentoDisponibile(luogo),
    promozioneDisponibile:lavoroPromozioneDisponibile(luogo),
    prossimoRuolo:(lavoroProssimoRuolo(luogo) || {}).n || null
  };
}

function lavoroRegistraPresenza(luogo){
  const cartellino = lavoroCartellino(luogo);
  if(!cartellino) return null;
  const pos = lavoroPosizioneOggi();
  const stato = lavoroSede(luogo).attendance;
  stato.turni.push(pos);
  return {
    luogo:luogo,
    totale:stato.turni.length,
    oggi:stato.turni.filter(n => n === pos).length,
    ciclo:cartellino.ciclo
  };
}

/* Maggiorazioni Fabbrica.
   - il 6° GIORNO ordinario distinto della settimana paga +30%;
   - una domenica autorizzata dall'azienda paga +75%;
   - un secondo turno nello stesso sesto giorno non riapplica il +30%.
   La domenica resta fuori dal conteggio 5/5 contrattuale. */
function lavoroPagaTurno(luogo, pagaBase){
  const base = Math.max(0, Math.round(Number(pagaBase) || 0));
  const def = lavoroContrattoDef(luogo);
  if(!def) return {base:base, totale:base, bonus:0, percentuale:0, tipo:null, etichetta:""};

  const giorno = Math.max(1, Math.min(7, Number(G.day || 1)));
  const cart = lavoroCartellino(luogo);
  let percentuale = 0;
  let tipo = null;
  let etichetta = "";

  if(giorno === 7 && lavoroDomenicaAutorizzata(luogo)){
    percentuale = Math.max(0, Number(def.bonusDomenicaPct || 0));
    tipo = "domenica";
    etichetta = "Domenica straordinaria";
  }else if(Array.isArray(def.giorniConsentiti) && def.giorniConsentiti.includes(giorno) && cart){
    const giaLavoratoOggi = Number(cart.conteggi[cart.posOggi] || 0) > 0;
    const richiesti = Math.max(0, Number(def.turniSettimanali || 0));
    if(!giaLavoratoOggi && richiesti > 0 && cart.giorniLavoratiSettimana >= richiesti){
      percentuale = Math.max(0, Number(def.bonusSestoGiornoPct || 0));
      tipo = luogo === "fabbrica" ? "sesto-giorno" : "giorno-extra";
      etichetta = (richiesti + 1) + "° giorno";
    }
  }

  const totale = Math.round(base * (1 + percentuale / 100));
  return {
    base:base,
    totale:totale,
    bonus:Math.max(0, totale - base),
    percentuale:percentuale,
    tipo:tipo,
    etichetta:etichetta
  };
}

/* Compatibilità col renderer Fabbrica già esistente. */
function fabbricaCartellino(){ return lavoroCartellino("fabbrica"); }
function fabbricaRegistraPresenza(){ return lavoroRegistraPresenza("fabbrica"); }

/* Carico di lavoro: il semplice fatto di avere un impiego non deve
   abbassare automaticamente tutto il resto del gioco. Fino a cinque turni
   settimanali il costo è già rappresentato da tempo, energia e dagli effetti
   specifici della mansione. Il malus globale nasce dal sovraccarico (6°/7°
   turno) e dalla fatica che si trascina tra più settimane pesanti. */
function lavoroFaticaCorrente(){
  return clamp(Number(G.workFatigue||0),0,100);
}

function lavoroDeltaFaticaSettimanale(turni){
  const n=Math.max(0,Math.floor(Number(turni)||0));
  if(n<=2) return -18;
  if(n===3) return -12;
  if(n===4) return -6;
  if(n===5) return 4;
  if(n===6) return 12;
  return 22 + Math.max(0,n-7)*6;
}

function lavoroAggiornaFaticaSettimanale(turni){
  const n=Math.max(0,Math.floor(Number(turni)||0));
  const prima=lavoroFaticaCorrente();

  /* Il recupero settimanale evita che il contratto normale 5/5 diventi,
     da solo, una condanna inevitabile dopo qualche mese. A cinque turni la
     fatica si assesta sotto la soglia del malus globale; il 6° e 7° turno,
     invece, accumulano più in fretta di quanto il weekend riesca a smaltire.
     Se torni a un ritmo normale dopo un periodo pesante, il residuo scende
     gradualmente: il sovraccarico lungo resta una conseguenza, non un flag. */
  const recupero=Math.round(prima*.25);
  const dopo=clamp(prima+lavoroDeltaFaticaSettimanale(n)-recupero,0,100);
  G.workFatigue=dopo;
  return {
    turni:n,
    prima:prima,
    dopo:dopo,
    delta:dopo-prima,
    recupero:recupero
  };
}

function lavoroQualitaFattore(turni,fatica){
  const n=Math.max(0,Math.floor(Number(turni==null?G.shifts:turni)||0));
  const f=clamp(Number(fatica==null?lavoroFaticaCorrente():fatica)||0,0,100);
  const acuto=n<=5 ? 1 : n===6 ? .94 : n===7 ? .86 : .80;
  const cronico=1-Math.min(.15,Math.max(0,f-20)*.003);
  return clamp(acuto*cronico,.78,1);
}

function lavoroLifestyleFattore(turni,fatica){
  const n=Math.max(0,Math.floor(Number(turni==null?G.shifts:turni)||0));
  const f=clamp(Number(fatica==null?lavoroFaticaCorrente():fatica)||0,0,100);
  const acuto=n<=5 ? 1 : n===6 ? .85 : n===7 ? .68 : .55;
  const cronico=1-Math.min(.30,Math.max(0,f-15)*.005);
  return clamp(acuto*cronico,.45,1);
}

/* Cosa determina davvero la qualità di quello che fai:
   benessere, dove vivi, sovraccarico di lavoro attuale/accumulato e quanta
   esperienza hai già costruito. */
function qFactors(){
  const f = [];
  const ben = clamp(0.58 + G.wellbeing/135, 0.58, 1.14);           f.push(["benessere", ben]);
  const casa = 1 + (G.life && G.life.casa ? G.life.casa : 0)*0.04;  f.push(["dove vivi", casa]);
  const stanco = lavoroQualitaFattore();
  if(stanco < .999) f.push(["sovraccarico lavoro", stanco]);
  const lu = 0.65 + luc()*0.005;                                    f.push(["lucidità", lu]);
  const esp = 1 + Math.min(0.14, G.songs.length*0.012);             f.push(["esperienza", esp]);
  /* l'attrezzatura da casa non c'e' piu' (21/09/2026): si registra in Studio */
  return {mult: ben*casa*stanco*esp*lu, list:f};
}
const qDetail = () => qFactors().list
  .map(([n,v]) => n + " " + (v>=1?"+":"") + Math.round((v-1)*100) + "%").join(" · ");
const wellFactor = () => qFactors().mult;
const qVeloce = () => clamp((22 + G.skills.scrittura*0.65) * wellFactor(), 5, 100);
const bestBar  = () => G.bars.slice().sort((a,b) => b.q-a.q)[0];
const bestBeat = () => G.beats.slice().sort((a,b) => b.q-a.q)[0];
const unmixed  = () => G.songs.filter(s => !s.released && !s.mixed);
const ready    = () => G.songs.filter(s => !s.released);
const songQ = (bar, beat) => clamp((bar.q*0.45 + beat.q*0.33 + G.skills.flow*0.35) * wellFactor(), 5, 100);
/* punto 12: quanto migliora il mix. Ai monitor e alle cuffie si aggiunge **chi
   c'è dietro al banco**: un fonico conosciuto alla Sala e chiamato dallo
   Studio vale quanto il rapporto che avete costruito. `typeof` perché
   studio.js si carica dopo, e perché il gioco deve reggere anche senza. */
const studioBonus = () => (typeof studioAiutoFonico === "function" ? studioAiutoFonico() : 0);
/* punto 4: il feat. Stessa strada del fonico — lo Studio dice quanto vale,
   qui si somma e basta. Vale per un pezzo solo: `studioConsumaFeat()` lo
   stacca appena la traccia esce dalla cabina. */
const featBonus = () => (typeof studioAiutoFeat === "function" ? studioAiutoFeat() : 0);
/* Quanto hype porta il feat all'uscita: la fama di chi c'e' sul pezzo
   (`s.featFama`, scritta alla registrazione). Fama 50 → +4. La stessa
   riga la usa l'uscita del venerdi' (studio-elementi.js). */
const ADF_FEAT_HYPE = 0.08;
function featHypeUscita(s){ return Math.round((s && s.featFama || 0) * ADF_FEAT_HYPE); }
/* Le due scelte dello Studio (punto 4: «ogni elemento influenza il
   risultato», e sceglierlo è metà dell'elemento). Se non hai scelto niente —
   o se il pezzo che avevi scelto non è più lì — si torna a `sort()[0]`, che
   è quello che ha sempre fatto: nessuna partita vecchia si accorge di
   niente. */
/* Stessa strada per la strofa e il beat che entrano in cabina: prima si
   incideva sempre il migliore di ognuno, e la strofa tenuta da parte per un
   altro pezzo spariva alla prima registrazione. Adesso li sceglie lo Studio
   (`registrazione_pezzo`: la colonna «CHE COSA INCIDI» ha i pallini), e se
   non hai scelto niente si torna al migliore, come prima. */
const daIncidere = () => (typeof studioStrofa === "function" && studioStrofa()) || bestBar();
const beatDaIncidere = () => (typeof studioBeatSuCui === "function" && studioBeatSuCui()) || bestBeat();
const daMixare = () => (typeof studioDaMixare === "function" && studioDaMixare()) ||
  unmixed().sort((a,b) => b.q-a.q)[0];
/* `s.tenuto` e' la cassaforte dello Studio: un pezzo messo da parte non deve
   uscire per sbaglio dalla plancia, se no «tienilo nel cassetto» e' una
   promessa che il gioco non mantiene. */
const daPubblicare = () => (typeof studioDaPubblicare === "function" && studioDaPubblicare()) ||
  ready().filter(s => !s.tenuto).sort((a,b) => b.q-a.q)[0];
/* punto 4: i tre cursori del banco (voce, bassi, aria) dello Studio. Al
   centro valgono zero — chi non li tocca mixa esattamente come si mixava
   prima che esistessero — e da lì si guadagnano o si perdono fino a tre
   punti a seconda di quanto sta in piedi quello che hai fatto. */
const bancoBonus = () => (typeof studioBancoGuadagno === "function" ? studioBancoGuadagno() : 0);
const mixGain = () => Math.round(6 + G.skills.flow*0.06)
  + studioBonus() + bancoBonus();

/* ================= LA PALESTRA (punto 9) =================
   Non è più un pulsante piatto: al cartello sulla mappa si sceglie tra
   Pesi e Cardio (hub.js), e la costanza conta più della singola seduta.
   Giorni di fila alzano il guadagno di presenza fino al +50% (dieci giorni
   di fila, poi si ferma lì); tornarci due volte nello stesso giorno non
   raddoppia niente — il corpo non recupera così in fretta, e la seconda
   seduta rende molto meno (o toglie benessere invece di darne). */
function palestraGiorno(){
  const sett = typeof totalWeeks === "function" ? totalWeeks() : ((G.year-1)*52 + G.week);
  return (sett - 1) * 7 + (G.day || 1);
}
/* streak valido *adesso*, senza scriverlo: se sono passati più di uno-due
   giorni dall'ultima volta la serie è già persa, anche se G.palestra non
   lo sa ancora — lo scrive solo la prossima sessione vera. */
function palestraStreakOra(){
  if(!G.palestra || G.palestra.ultimo == null) return 0;
  return (palestraGiorno() - G.palestra.ultimo > 1) ? 0 : (G.palestra.streak || 0);
}
function palestraRegistraSessione(){
  if(!G.palestra) G.palestra = {streak:0, ultimo:null, sessioni:0};
  const p = G.palestra, oggi = palestraGiorno();
  if(p.ultimo !== oggi) p.streak = palestraStreakOra() + 1;
  p.ultimo = oggi;
  p.sessioni = (p.sessioni || 0) + 1;
  return p.streak;
}
function palestraMoltiplicatore(){ return 1 + Math.min(10, palestraStreakOra()) * 0.05; }
function palestraFlavor(streak){
  if(streak === 3) return " Terzo giorno di fila: si comincia a vedere.";
  if(streak === 7) return " Una settimana intera senza saltarne uno.";
  if(streak >= 14 && streak % 7 === 0) return " " + (streak/7) + " settimane di fila. Adesso è abitudine.";
  return "";
}
/* per la scheda «Condizione» del profilo (hub.js): la stessa lettura a
   sola lettura di palestraStreakOra(), in una riga per l'utente */
function palestraTesto(){
  const s = palestraStreakOra();
  if(s === 0) return G.palestra && G.palestra.sessioni ? "Persa: da riprendere" : "Non ci sei ancora andato";
  return s + (s === 1 ? " giorno di fila" : " giorni di fila");
}

/* Da smistare, punto 6: la battle di freestyle vera (il minigioco della
   piazza, quello che vale ×1,5) diventa un evento esclusivo — una volta a
   settimana, e solo la sera, fra le 21:00 e le 00:30 (lo stesso orario che
   la card degli eventi dell'hub usa già, orari.js). Farla dieci volte al
   giorno per farmare hype non è più possibile: fuori da lì resta comunque
   il giro veloce, più modesto, sempre disponibile. */
function freestyleBattagliaOk(){
  if(adfSettimana("free_battle") >= 1)
    return {ok:false, motivo:"Il palco vero l'hai già tenuto questa settimana. Torna la prossima."};
  const st = (window.GAME_HOURS && typeof GAME_HOURS.eventStatus === "function")
    ? GAME_HOURS.eventStatus("free") : {open:true};
  if(!st.open){
    const quando = st.phase === "before" ? "apre alle " + st.nextText
      : "riapre stasera alle " + st.nextText;
    return {ok:false, motivo:"Il palco vero è solo la sera, fra le 21:00 e le 00:30 (" + quando + ")."};
  }
  return {ok:true};
}

const ACTIONS = [
  {id:"scrivi", n:"Scrivi barre", e:15, luc:3,
   d:"Il foglio, la penna e quello che hai in testa.",
   need:() => adfOggi("scrivi") >= ADF_MAX_SCRITTURE_GIORNO ? "TORNARE DOMANI" : null,
   give:() => adfOggi("scrivi") === 1
     ? "2ª e ultima strofa di oggi"
     : "veloce · oppure scrivila tu ×1,5",
   run(){
     scegliModo({
       t:"Scrivi barre",
       d:"Puoi buttare giù qualcosa di getto e passare oltre, oppure sederti davvero al foglio e scriverla riga per riga.",
       dv:"La butto giù io e te la faccio leggere: qualità ~" + Math.round(qVeloce()) +
          ", decisa dalle tue statistiche. Poi la tieni così o la sistemi. Oggi contano: " + qDetail() + ".",
       dg:"Foglio bianco: le barre le scrivi tu, e vale ×1,5. Se ti blocchi, «Completa la canzone» riempie il resto.",
       veloce(){
         /* non si chiude piu' al buio: la strofa si vede e si puo' correggere */
         apriFoglio({generata:true, righe:6, minimo:qVeloce()});
         return {t:"", c:""};
       },
       gioca(){ apriFoglio({righe:4}); }
     });
     return "";
   }},

  /* Punto 28: girare a cercare beat non costa più energia (era 25). Non è
     lavoro: è camminare e ascoltare, e far pagare la stanchezza per andare a
     *guardare* la roba da comprare voleva dire che a fine giornata non potevi
     nemmeno farti un giro. Non diventa gratis però: sono comunque due ore di
     gioco (`DURATE.beat` in tempo.js) e si fa solo quando lo studio è aperto,
     13:00–02:00 (orari.js). Il freno resta il tempo, che è quello giusto. */
  {id:"beat", n:"Cerca un beat", e:0, luc:1,
   d:"Giri fra i produttori. Torni con roba da comprare.",
   give:() => "3 beat, 3 generi · +rete",
   run(){
     const out = offriBeat();
     gain("rete", 0.9);
     return "Tre beat sul tavolo: " +
       out.map(b => b.n + " (" + genBeat(b.gen).n.toLowerCase() + ", q" + b.q + ")").join(" · ") +
       ". Sono sul banco dello Studio, nella stanza «Il beat».";
   }},

  /* Non costa energia (era 45): l'energia si paga in cabina, take per take —
     la prima vale la sessione intera, `STUDIO_TAKE_PRIMA` in
     studio-elementi.js — e **tenere** la take buona e' gratis. Prima chi
     insisteva con le take arrivava a «Tieni questa e chiudi» senza i 45 per
     premerlo (15/09/2026). Il tempo in sala e la sala stessa restano qui. */
  {id:"registra", n:"Registra il pezzo", e:0, luc:3,
   /* la mossa in se' costa zero perche' la prima take in Cabina li chiede
      lei (45, dal 21/09/2026 sono 25): la plancia e l'Agenda pero' devono
      dirli, non scrivere «gratis» (15/09/2026). Solo da mostrare — non si
      scala da qui. */
   costoScritto:() => (typeof studioTakeManca === "function" && studioTakeManca())
     ? (typeof STUDIO_TAKE_PRIMA !== "undefined" ? STUDIO_TAKE_PRIMA : 25) : 0,
   /* la sala: 50 € a pezzo. Erano gratis con un microfono tuo, ma
      l'attrezzatura da casa non c'e' piu' (21/09/2026) */
   money:() => 50,
   d:"Strofa più beat, in sala. Esce una traccia grezza.",
   need:() => !G.bars.length ? "1 strofa" : !G.beats.length ? "1 beat"
     : (typeof studioTakeManca === "function" && studioTakeManca()) ? "una take, in cabina" : null,
   give:() => {
     const b = daIncidere(), bt = beatDaIncidere();
     return (b && bt ? "1 traccia · qualità ~" + Math.round(songQ(b,bt) + studioBonus() + featBonus()) : "1 traccia grezza") +
       " · −3 benessere";
   },
   run(){
     const b = daIncidere(), bt = beatDaIncidere();
     /* la parte 2 prenotata dalla Discografia (seguiti.js) porta il suo titolo */
     const titoloSeguito = typeof seguitoTitolo === "function" ? seguitoTitolo() : null;
     chiediTitolo(titoloSeguito || title(), (nome, seed, img) => {
       /* punto 4: il tiro di dado della registrazione non e' piu' invisibile.
          E' la take che hai scelto in cabina (`registrazione_pezzo`), e la
          prima take e' esattamente questo `rnd(-5,6)` — chi non chiede altre
          take registra con lo stesso dado di sempre.
          Si legge **prima** di togliere strofa e beat dalla lista: la take
          porta la targhetta di quella coppia, e con la strofa gia' sfilata la
          targhetta non combaciava piu' — la take scelta non arrivava mai sul
          pezzo, dall'08/09 (controllo mirato del 15/09). */
       const presa = typeof studioTakePresa === "function" ? studioTakePresa() : rnd(-5,6);
       G.bars.splice(G.bars.indexOf(b),1);
       G.beats.splice(G.beats.indexOf(bt),1);
       G.money -= 50;
       /* punto 12: chi sta dietro al vetro conta anche in registrazione — un
          fonico che ti conosce sa dove metterti la voce prima che glielo chiedi */
       /* il feat si legge **prima** di staccarlo (studioConsumaFeat qui
          sotto lo libera): letto dopo vale zero, e in Fuori la riga della
          qualita' non lo nominava mai — trovato da segnala-problemi il 15/09 */
       const conFeat = featBonus(), conFonico = studioBonus();
       const q = clamp(Math.round(songQ(b,bt) + conFonico + conFeat + presa), 5, 100);
       /* chi era in sessione resta scritto sul pezzo — il nome e la fama,
          che e' quella che sim.js legge per far ascoltare il pezzo alla sua
          gente — e poi torna libero */
       const conMe = typeof studioConsumaFeat === "function" ? studioConsumaFeat() : null;
       const s2 = {t:nome, q, mixed:false, released:false, week:0, streams:0, last:0,
         txt:b.txt||"", tema:b.tema||"", seed:seed, img:img||"",
         feat:conMe ? conMe.n : "", featFama:conMe ? conMe.fama : 0,
         /* i numeri per elemento (foglio «LUOGO: STUDIO», idea E del 14/09):
            da cosa e' fatta la qualita', letti poi in Fuori. Il mix li
            completa quando arriva. */
         parti:{beat:bt.q, testo:b.q, fonico:conFonico, feat:conFeat, take:presa}};
       /* se era prenotata una parte 2, e' lui: resta legato al primo (seguiti.js) */
       const primo = typeof seguitoIncidi === "function" ? seguitoIncidi(s2) : null;
       G.songs.push(s2); G.wellbeing = clamp(G.wellbeing-3,0,100);
       /* appena inciso e' lui sul banco dello Studio (punto 10 «ad ogni
          pezzo»): Mix e Uscita si aprono su di lui */
       if(typeof studioMettiSulBanco === "function") studioMettiSulBanco(seed);
       pushLog("Registrato <b>«" + nome + "»</b> su «" + bt.n + "»" +
         (conMe ? " con <b>" + conMe.n + "</b>" : "") +
         (primo ? ", la parte 2 di «" + primo.t + "»" : "") + " — qualità " + q + ".", "");
       SFX.rec(); save(); renderGioco();
       if(typeof renderStudio === "function") renderStudio();
     });
     return "";
   }},

  {id:"mixa", n:"Mixa il pezzo", e:24, luc:2,
   d:"Livelli e spazio. Qui il provino diventa pezzo.",
   need:() => unmixed().length ? null : "1 traccia da mixare",
   give:() => "+" + mixGain() + " qualità · +flow",
   run(){
     const s = daMixare();
     s.q = clamp(s.q + mixGain(), 5, 100); s.mixed = true;
     /* com'e' venuto — «secco», «pesante», «aperto» — resta scritto sul pezzo:
        e' quello che nel riferimento di Fuori si legge sotto al titolo,
        «q78 · mixato · secco» */
     if(typeof studioBancoCarattere === "function") s.car = studioBancoCarattere().n;
     if(s.parti) s.parti.mix = mixGain();
     gain("flow", 1.1);
     return "«" + s.t + "» mixato: qualità " + s.q + ". Pronto per uscire.";
   }},

  {id:"pubblica", n:"Pubblica il pezzo", e:0, luc:1,
   d:"Lo metti fuori. Da qui in poi corre da solo.",
   need:() => ready().some(s => !s.tenuto) ? null : "1 traccia",
   give:() => {
     const s = daPubblicare();
     return s ? "esce «" + s.t + "» · q" + s.q + (s.mixed ? "" : " · non mixato, −8") : "un pezzo esce";
   },
   run(){
     const s = daPubblicare();
     if(!s.mixed) s.q = clamp(s.q - 8, 5, 100);
     s.released = true; s.week = totalWeeks();
     anteprimeAllUscita(s);
     /* una parte 2 che esce rimette in piedi la prima (seguiti.js) */
     if(typeof seguitoUscita === "function") seguitoUscita(s);
     /* uscito: il banco dello Studio si svuota, Mix e Uscita si richiudono */
     if(typeof studioSvuotaBanco === "function") studioSvuotaBanco(s);
     /* un nome grosso sul pezzo muove l'hype quando esce: la sua gente lo
        vede (foglio dell'hype, «feat con nomi piu' grandi») */
     G.hype = clamp(G.hype + 6 + s.q*0.12 + featHypeUscita(s), 0, (typeof hypeCap==="function"?hypeCap():100));
     return "«" + s.t + "» è fuori" + (s.mixed ? "." : ", ma non era mixato: qualità " + s.q + ".");
   }},

  /* Remastered (seguiti.js): si prenota dalla Discografia su un pezzo uscito
     da almeno REMASTER_ETA_MIN settimane e si chiude qui, al banco del Mix.
     La mossa esiste solo finche' ce n'e' una prenotata: nella plancia e
     nell'Agenda non compare a vuoto. */
  {id:"remaster", n:"Remastered", e:24, luc:2,
   d:"Il pezzo vecchio torna al banco: qualche punto in più, e riparte.",
   avail:() => typeof remasterPrenotato === "function" && !!remasterPrenotato(),
   money:() => (typeof REMASTER_COSTO !== "undefined" ? REMASTER_COSTO : 80),
   need:() => (typeof remasterPrenotato === "function" && remasterPrenotato()) ? null : "un pezzo scelto dalla Discografia",
   give:() => {
     const s = remasterPrenotato();
     return s ? "«" + s.t + "» q" + s.q + " → q" + clamp(s.q + remasterGuadagno(), 5, 100) + " · torna a girare" : "";
   },
   run(){
     const r = remasterChiudi();
     if(!r) return "";
     G.money -= (typeof REMASTER_COSTO !== "undefined" ? REMASTER_COSTO : 80);
     G.hype = clamp(G.hype + 4, 0, (typeof hypeCap==="function"?hypeCap():100));
     gain("flow", 0.6);
     return "«" + r.s.t + "» rimasterizzato: qualità " + r.prima + " → " + r.s.q + ". Torna a girare.";
   }},

  {id:"promo", n:"Promo sui social", e:12,
   d:"Clip e provocazioni. Spinge il pezzo che scegli su LaFamegram.",
   need:() => G.songs.some(s => s.released) ? null : "1 pezzo fuori",
   give:() => {
     const mult = promoDailyMult();
     const look = typeof stileBonus === "function" ? stileBonus() : {promo:1, tema:null};
     return "+" + Math.round((6 + G.skills.rete*0.12) * RITMO * mult * look.promo) +
       " hype \u00b7 follower" + (mult < 1 ? " \u00b7 resa ridotta" : "") +
       (look.tema ? " \u00b7 look " + look.tema : "");
   },
   run(){
     const mult = promoDailyMult();
     const peso = (window.AGENDA && typeof AGENDA.consumaPeso === "function")
       ? AGENDA.consumaPeso("promo") : 1;

     const p = promoSettimana();
     /* «Lo stile che conta» (21/09/2026): col look completo — tre capi dello
        stesso tema addosso — la promo rende +25% (stile.js) */
     const look = typeof stileBonus === "function" ? stileBonus() : {promo:1, tema:null};
     const hWanted = (6 + G.skills.rete*0.12) * RITMO * mult * peso * look.promo;
     const hBudget = Math.max(0, ADF_PROMO_WEEKLY_HYPE_CAP - p.hypeUsed);
     const h = Math.min(hWanted, hBudget);
     p.hypeUsed += h;
     G.hype = clamp(G.hype + h, 0, (typeof hypeCap==="function"?hypeCap():100));

     const pctWanted = G.fans * 0.012 * RITMO * mult * peso;
     const pctCap = p.baseFans * ADF_PROMO_WEEKLY_PCT_CAP;
     const pctBudget = Math.max(0, pctCap - p.pctUsed);
     const pctGain = Math.min(pctWanted, pctBudget);

     const flatGain = rnd(4,24) * RITMO * mult * peso;
     const f = Math.max(0, Math.round(flatGain + pctGain));

     p.pctUsed += pctGain;
     G.fans += f;
     G.wellbeing -= 1;
     adfSegnaOggi("promo");

     /* Punto 9 dello Studio: la promo non accende «tutto quello che hai
        fuori» — spinge un pezzo, quello scelto su LaFamegram, dal telefono
        (o l'ultimo uscito). La spinta resta attaccata al pezzo come il video
        (`s.spinta`), sim.js la legge in songWeekly() e la fa scendere ogni
        settimana: un post fa girare il pezzo, non lo rifa' uscire. */
     const sp = typeof studioDaSpingere === "function" ? studioDaSpingere() : null;
     if(sp) sp.spinta = Math.min(ADF_PROMO_SPINTA_MAX, (sp.spinta || 1) + ADF_PROMO_SPINTA * mult * peso);

     const satToday = mult < 1
       ? " Reach ridotta: oggi hai gi\u00e0 spinto parecchio."
       : "";
     const satWeek = pctCap > 0 && p.pctUsed >= pctCap - 1e-9
       ? " La crescita percentuale della settimana \u00e8 satura."
       : "";
     const satHype = hWanted > hBudget + 1e-9
       ? " L'hype non sale pi\u00f9: la settimana ha gi\u00e0 dato il massimo."
       : "";
     const bonusPeso = peso > 1 ? " Oggi vale di pi\u00f9." : "";

     return "Hype +" + Math.round(h) + ", " + f +
       " nuovi follower." + (sp ? " Spingi «" + sp.t + "»." : "") +
       bonusPeso + satToday + satWeek + satHype;
   }},

  /* Punto 8 dello Studio: «non posso spingere una canzone che non è ancora
     uscita, al massimo faccio uscire una preview». Il pezzo lo si sceglie su
     LaFamegram, fra quelli non ancora fuori; qui c'è il costo e quello che dà. */
  {id:"anteprima", n:"Anteprima del pezzo", e:8,
   d:"Quindici secondi sui social. Il pezzo non è fuori, ma la gente lo aspetta.",
   need:() => {
     const s = typeof studioDaAnticipare === "function" ? studioDaAnticipare() : null;
     /* corto: sul telefono la riga e' una sola, e i puntini mangiano la fine */
     return !s ? "un pezzo scelto su LaFamegram"
       : (s.anteprime || 0) >= ADF_ANTEPRIME_MAX ? "un pezzo che non hanno già sentito" : null;
   },
   give:() => {
     const s = typeof studioDaAnticipare === "function" ? studioDaAnticipare() : null;
     const n = s ? (s.anteprime || 0) + 1 : 1;
     return "+" + (s ? Math.round((3 + s.q * 0.05) * RITMO / n) : "?") + " hype · all'uscita parte al " +
       Math.round(100 * (1 + Math.min(ADF_ANTEPRIME_MAX, n) * ADF_ANTEPRIMA_SPINTA)) + "%";
   },
   run(){
     const s = studioDaAnticipare();
     if(!s) return "";
     const n = (s.anteprime || 0) + 1;
     s.anteprime = n;
     /* la prima anteprima rende piena, la seconda la metà, la terza un terzo:
        è un pezzo che non c'è, non si può farlo sentire all'infinito */
     const h = Math.round((3 + s.q * 0.05) * RITMO / n);
     G.hype = clamp(G.hype + h, 0, (typeof hypeCap==="function"?hypeCap():100));
     G.fans += Math.round(rnd(2, 9) * RITMO);
     return "Anteprima di «" + s.t + "»: hype +" + h + ". Quando esce parte al " +
       Math.round(100 * (1 + n * ADF_ANTEPRIMA_SPINTA)) + "%." +
       (n >= ADF_ANTEPRIME_MAX ? " L'hanno sentito abbastanza: adesso deve uscire." : "");
   }},

  {id:"free", n:"Freestyle in piazza", e:26, luc:3,
   d:"Solo il beat e la gente che passa.",
   give:() => {
     const bok = freestyleBattagliaOk();
     return bok.ok ? "veloce · oppure la battle vera ×1,5" : "veloce · battle vera: " + bok.motivo;
   },
   run(){
     const battaglia = freestyleBattagliaOk();
     scegliModo({
       t:"Freestyle in piazza",
       d:"Puoi farti il tuo giro e tornare a casa, oppure metterti lì davvero: andare a tempo e rispondere a chi ti provoca, con la folla che cresce o se ne va.",
       dv:"Un clic. Presenza e qualche fan, senza rischi.",
       dg: battaglia.ok
         ? "Vai a tempo col beat e scegli le risposte giuste. Quello che guadagni dipende da quanta gente resta, e vale 1,5 volte."
         : "La battle vera è un evento esclusivo: " + battaglia.motivo,
       veloce(){
         gain("presenza", 1.4);
         const f = Math.round((rnd(2,12) + presenzaSulPalco()*0.5) * RITMO);
         G.fans += f; G.wellbeing = clamp(G.wellbeing-2,0,100);
         return {t:"Giro veloce in piazza: " + f + " persone si sono fermate.", c:""};
       },
       gioca(){
         if(!battaglia.ok){
           if(typeof toast === "function")
             toast("<b>Non è ancora il momento.</b> " + battaglia.motivo, "bad", "!", ["#B91C1C","#7F1D1D"]);
           gain("presenza", 1.4);
           const f = Math.round((rnd(2,12) + presenzaSulPalco()*0.5) * RITMO);
           G.fans += f; G.wellbeing = clamp(G.wellbeing-2,0,100);
           azioneFatta();
           pushLog("Il palco vero non c'è ancora: giro veloce lo stesso, " + f + " persone si sono fermate.", "");
           save(); renderGioco();
           return;
         }
         apriPiazza(BOOST);
       }
     });
     return "";
   }},

  {id:"live", n:"Serata live", e:42, luc:2,
   d:"Palco piccolo, ma la gente ti vede in faccia.",
   need:() => G.songs.some(s => s.released) ? null : "1 pezzo fuori",
   give:() => "~" + Math.round((20 + G.hype*1.4 + 40) * RITMO) + " € · fan · presenza" +
     (adfOggi("live") > 0 ? " · resa ridotta, già fatta oggi" : ""),
   run(){
     const peso = (window.AGENDA && typeof AGENDA.consumaPeso === "function")
       ? AGENDA.consumaPeso("live") : 1;
     const giaOggi = adfOggi("live") > 0;
     /* sul palco del Circolo la serata si gioca a momenti (circolo.js): come
        è andata la gente, da 0,55 a 1,45, pesa sulla resa. Da fuori (l'agenda,
        una card) vale 1, com'è sempre stato. */
     const resa = typeof circoloResaSerata === "function" ? circoloResaSerata() : 1;
     const leadLavoro = (typeof window !== "undefined" && window.ADF_WORK_EVENTS && typeof ADF_WORK_EVENTS.consumeMusicLead === "function")
       ? ADF_WORK_EVENTS.consumeMusicLead("live") : null;
     const moltLavoro = leadLavoro ? Math.max(1, Number(leadLavoro.multiplier || 1)) : 1;
     const molt = (giaOggi ? 0.45 : 1) * peso * resa * moltLavoro;
     const f = Math.round((rnd(8,30) + presenzaSulPalco()*1.4 + G.hype*0.7) * RITMO * molt);
     const m = Math.round((rnd(20,60) + G.hype*1.4) * RITMO * molt);
     const lbb = lifeBonus();
     G.fans += Math.round(f*lbb.live); G.money += Math.round(m*lbb.live);
     gain("presenza", 1.2 * (giaOggi ? 0.5 : 1)); G.wellbeing -= 3;
     adfSegnaOggi("live");
     diarioBordo().live++;
     return "Serata fatta: +" + f + " fan, +" + m + " €." +
       (leadLavoro ? " <b>Il contatto nato al lavoro ha spinto davvero la serata ×" + moltLavoro.toFixed(2) + ".</b>" : "") +
       (giaOggi ? " Il palco lo conoscevano già: oggi rende meno." : "");
   }},

  {id:"turno", n:"Vai al turno", e:18, luc:0,
   d:"Nessuna musica, ma i soldi entrano.",
   avail:() => !!G.job,
   dyn:() => {
     if(!G.job) return 18;
     const luogo = lavoroLuogo(G.job);
     return luogo ? lavoroEffettiTurno(luogo,G.job).energia : G.job.e;
   },
   give:() => {
     if(!G.job) return "";
     const luogo = lavoroLuogo(G.job);
     const paga = luogo ? lavoroPagaTurno(luogo, G.job.pay) :
       {totale:G.job.pay, percentuale:0};
     const fx = lavoroEffettiTurno(luogo,G.job);
     const ben = Number(fx.benessere||0), luc = Number(fx.lucidita||0);
     return "+" + paga.totale + " €" +
       (paga.percentuale ? " · bonus +" + paga.percentuale + "%" : "") +
       (ben ? " · " + (ben>0?"+":"−") + Math.abs(ben) + " benessere" : "") +
       (luc ? " · " + (luc>0?"+":"−") + Math.abs(luc) + " lucidità" : "");
   },
   run(){
     const j = G.job;
     const luogoLavoroAttuale = lavoroLuogo(j);
     if(luogoLavoroAttuale){
       const gate = lavoroTurnoConsentitoOggi(luogoLavoroAttuale);
       if(!gate.ok) return gate.reason + ".";
     }
     const paga = luogoLavoroAttuale
       ? lavoroPagaTurno(luogoLavoroAttuale, j.pay)
       : {base:j.pay, totale:j.pay, bonus:0, percentuale:0, tipo:null, etichetta:""};
     const effettiTurno = lavoroEffettiTurno(luogoLavoroAttuale,j);
     G.money += paga.totale;
     G.wellbeing += Number(effettiTurno.benessere || 0);
     if(typeof addLuc === "function") addLuc(Number(effettiTurno.lucidita || 0));
     G.shifts = (G.shifts||0) + 1;
     /* La presenza appartiene al luogo di lavoro: se in futuro passi da
        Operaio a Capolinea/Capoturno in Fabbrica, il cartellino continua. */
     const luogoLavoro = lavoroLuogo(j);
     if(luogoLavoro) lavoroRegistraPresenza(luogoLavoro);
     const straordinario = luogoLavoro ? lavoroCompletaStraordinario(luogoLavoro) : null;
     const cartellinoDopo = luogoLavoro && typeof lavoroCartellino==="function"
       ? lavoroCartellino(luogoLavoro)
       : null;
     if(luogoLavoro){
       lavoroSalvaEsitoTurno(luogoLavoro,{
         jobId:j.id||null,
         jobName:j.n||null,
         pay:{
           base:Number(paga.base||0),
           total:Number(paga.totale||0),
           bonus:Number(paga.bonus||0),
           percent:Number(paga.percentuale||0),
           label:paga.etichetta||""
         },
         energyDelta:-Math.abs(Number(effettiTurno.energia||0)),
         wellbeingDelta:Number(effettiTurno.benessere||0),
         lucidityDelta:Number(effettiTurno.lucidita||0),
         attendance:cartellinoDopo ? {
           worked:Number(cartellinoDopo.giorniLavoratiSettimana||0),
           required:Number(cartellinoDopo.turniSettimanaliRichiesti||0),
           total:Number(cartellinoDopo.totale||0)
         } : null,
         overtime:straordinario ? {
           type:straordinario.tipo||null,
           reliabilityDelta:Number(straordinario.affidabilitaDelta||0)
         } : null
       });
     }
     const def = JOBS.find(x => x.id === j.id);
     let extra = "";
     if(def && def.extra) extra = def.extra();
     let msg = "Turno da " + j.n.toLowerCase() + ": paga " + paga.totale + " €.";
     if(luogoLavoroAttuale === "fabbrica" && effettiTurno.ruolo){
       msg += " Carico del ruolo: " + Math.abs(Number(effettiTurno.benessere || 0)) +
         " benessere e " + Math.abs(Number(effettiTurno.lucidita || 0)) +
         " lucidità.";
     }
     if(paga.bonus > 0){
       msg += " <b>" + paga.etichetta + ": bonus +" + paga.percentuale +
         "% (+" + paga.bonus + " €).</b>";
     }
     if(straordinario && straordinario.affidabilitaDelta > 0){
       msg += " <b>Straordinario concordato completato: affidabilità +" +
         straordinario.affidabilitaDelta + ".</b>";
     }
     return msg + extra;
   }},

  {id:"stacca", n:"Stacca la spina", e:14, luc:1,
   d:"Dormi, mangi, vedi gente normale.",
   need:() => adfOggi("stacca") >= 2 ? "TORNARE DOMANI" : null,
   give:() => adfOggi("stacca") === 0
     ? "+10–14 benessere · un po' di rete"
     : "+3–5 benessere · recupero ridotto",
   run(){
     /* il «Piccolo party» della plancia è questa mossa: se era segnato in
        agenda, giocarlo lo toglie (agenda.js, onora) */
     if(window.AGENDA && typeof AGENDA.consumaPeso === "function") AGENDA.consumaPeso("stacca");
     const n = adfOggi("stacca");
     const prima = G.wellbeing;
     const w = n === 0 ? Math.round(rnd(10,15)) : Math.round(rnd(3,6));
     G.wellbeing = clamp(G.wellbeing + w, 0, 100);
     const reale = Math.max(0, Math.round(G.wellbeing - prima));
     if(n === 0) gain("rete", 0.4);
     adfSegnaOggi("stacca");
     let s = "Ti sei fermato. Benessere +" + reale + (n === 0 ? ", rete +0,4." : ".");
     if(n === 1) s += " Per oggi hai recuperato abbastanza.";
     return s;
   }},

  /* La palestra sta nella vita quotidiana: ti tiene su il corpo e ti si vede
     addosso quando sali su un palco. Non fa musica, fa la persona che la
     musica la regge. Due sedute, non una — la scelta sta nel cartello sulla
     mappa (hub.js), qui c'è solo cosa succede quando la fai davvero. */
  {id:"palestra_pesi", n:"Pesi", e:16, luc:1,
   money:() => 18,
   d:"Ferro pesante, poche ripetizioni. Il fisico che si vede sotto le luci.",
   give:() => "+benessere · +presenza",
   run(){
     const giaOggi = adfOggi("palestra") > 0;
     const streak = palestraRegistraSessione();
     const molt = palestraMoltiplicatore();
     adfSegnaOggi("palestra");
     G.money -= 18;
     if(giaOggi){
       const p = Math.round(rnd(4,8));
       G.wellbeing = clamp(G.wellbeing - p, 0, 100);
       gain("presenza", 0.1);
       return "Il corpo non recupera due volte lo stesso giorno: benessere −" + p + ". Hai solo strapazzato quello che avevi già costruito prima.";
     }
     const peso = (window.AGENDA && typeof AGENDA.consumaPeso === "function")
       ? AGENDA.consumaPeso("palestra_pesi") : 1;
     const b = Math.round(rnd(10,16) * molt * peso);
     const pr = Math.round(0.6 * molt * peso * 10) / 10;
     G.wellbeing = clamp(G.wellbeing + b, 0, 100);
     gain("presenza", pr);
     let s = "Serie pesante: benessere +" + b + ", presenza +" + pr + "." + palestraFlavor(streak) +
       (peso > 1 ? " Porte aperte oggi: si sente." : "");
     if(Math.random() < .15){ gain("rete", 0.8); s += " In sala pesi c'era gente del giro."; }
     return s;
   }},

  {id:"palestra_cardio", n:"Cardio leggero", e:9, luc:3,
   d:"Una corsa, la testa che si svuota. Costa poco, ci si torna facile.",
   give:() => "+lucidità · +benessere",
   run(){
     const giaOggi = adfOggi("palestra") > 0;
     const streak = palestraRegistraSessione();
     const molt = palestraMoltiplicatore();
     adfSegnaOggi("palestra");
     if(giaOggi){
       const p = Math.round(rnd(2,5));
       G.wellbeing = clamp(G.wellbeing - p, 0, 100);
       return "Le gambe sono già andate stamattina: benessere −" + p + ". Questa seconda corsa stanca e basta.";
     }
     const b = Math.round(rnd(6,10) * molt);
     const pr = Math.round(0.25 * molt * 10) / 10;
     G.wellbeing = clamp(G.wellbeing + b, 0, 100);
     gain("presenza", pr);
     return "Corsa leggera: benessere +" + b + ", lucidità su." + palestraFlavor(streak);
   }}
];

/* ================= «NON HAI ENERGIA» — UNA RISPOSTA SOLA =================
   Le mosse si lanciano da quattro posti diversi (i cartelli della mappa, le
   card di «Eventi e attività di oggi», le tile della Settimana, l'agenda del
   telefono) e fino a ieri ognuno rispondeva a modo suo quando l'energia non
   bastava: dalla mappa usciva un avviso, altrove il bottone si spegneva e
   basta — ci clicchi sopra e non succede niente, senza che nessuno ti dica
   perché.

   L'energia però non è un ostacolo come gli altri: gli oggetti che mancano o
   i soldi che non hai te li devi andare a prendere, l'energia torna da sola
   dormendo. È l'unico «no» che vale la pena spiegare, ed è per questo che
   qui si comporta diversamente dagli altri: **solo** quando manca l'energia
   la mossa resta cliccabile e risponde con l'avviso. Se manca dell'altro
   (sei in carcere, serve un beat, servono i soldi, è l'ora sbagliata) il
   bottone resta spento come prima, col motivo già scritto sopra. */

/* Quanta energia vuole una mossa: `dyn()` per quelle che cambiano prezzo. */
function energiaChiesta(a){
  if(!a) return 0;
  return a.dyn ? a.dyn() : a.e;
}

/* Vero solo se l'UNICA cosa che manca è l'energia. Se manca anche altro il
   bottone deve restare spento: un avviso che parla di energia mentre il vero
   problema è che sei in carcere farebbe più danni che altro. */
function soloSenzaEnergia(id){
  const a = (typeof ACTIONS !== "undefined") && ACTIONS.find(x => x.id === id);
  if(!a) return false;
  if(typeof hubDetenuto === "function" && hubDetenuto()) return false;
  if(a.avail && !a.avail()) return false;
  if(a.need && a.need()) return false;
  const c = a.money ? a.money() : 0;
  if(c && G.money < c) return false;
  return G.energy < energiaChiesta(a);
}

/* L'avviso vero e proprio, uguale ovunque, col fulmine della barra in alto
   (`HIC.energia`, lo stesso disegno: preso da lì e non ricopiato, così se un
   giorno cambia il fulmine cambia anche qui). */
function avvisoSenzaEnergia(id){
  const a = (typeof ACTIONS !== "undefined") && ACTIONS.find(x => x.id === id);
  const serve = energiaChiesta(a);
  const hai = Math.max(0, Math.round(G.energy));
  const fulmine = (typeof hsvg === "function" && typeof HIC === "object" && HIC.energia)
    ? hsvg("energia") : "\u26A1";
  if(typeof SFX === "object" && SFX.fail) SFX.fail();
  if(typeof toast !== "function") return false;
  toast("<b>Non hai abbastanza energia.</b> " +
    (a ? a.n + " chiede " + serve + ", ne hai " + hai + ". " : "") +
    "L'energia torna dormendo: chiudi la giornata quando non hai più mosse.",
    "bad", fulmine, ["#FACC15", "#B45309"]);
  return true;
}
