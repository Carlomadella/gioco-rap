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
const STRADA_CATEGORIE_COLPO = Object.freeze({
  trasporto:Object.freeze({
    n:"Trasporto", tag:"meno resa · meno attenzione",
    guadagno:.94, chance:.05, heat:.82, sporco:.56, rep:.90
  }),
  merce:Object.freeze({
    n:"Merce", tag:"equilibrato · più soldi sporchi",
    guadagno:1.02, chance:.01, heat:.96, sporco:.64, rep:1
  }),
  furto:Object.freeze({
    n:"Furto", tag:"resa alta · rischio più alto",
    guadagno:1.10, chance:-.02, heat:1.10, sporco:.66, rep:1.08
  }),
  veicoli:Object.freeze({
    n:"Veicoli", tag:"resa molto alta · molta attenzione",
    guadagno:1.16, chance:-.035, heat:1.16, sporco:.68, rep:1.12
  }),
  incassi:Object.freeze({
    n:"Recuperi", tag:"reputazione alta · situazione rumorosa",
    guadagno:1.08, chance:-.015, heat:1.20, sporco:.60, rep:1.15
  })
});

/* Punto 7: la Provincia non è più composta da quattro pulsanti eterni.
   Questo è il pool: il giocatore ne vede solo quattro per giornata. Non
   imponiamo una categoria per slot, quindi due offerte della stessa famiglia
   possono convivere e un'altra famiglia può non comparire affatto. minRep
   non crea una gerarchia esplicita: fa semplicemente arrivare lavori più
   pesanti quando il nome del personaggio ha iniziato a girare davvero. */
const STRADA_COLPI = [
  {id:"consegne",categoria:"trasporto",minRep:0,n:"Consegne che non chiedi",energia:15,difficolta:.15,pena:2,min:120,max:280,
   d:"Porti qualcosa da un punto all'altro. Meno domande fai, meglio è."},
  {id:"busta-chiusa",categoria:"trasporto",minRep:0,n:"La busta chiusa",energia:16,difficolta:.20,pena:2,min:140,max:300,
   d:"Un passaggio breve, una consegna precisa e nessun motivo per curiosare."},
  {id:"passaggio-rapido",categoria:"trasporto",minRep:0,n:"Passaggio rapido",energia:18,difficolta:.26,pena:2,min:170,max:360,
   d:"Deve cambiare mano in fretta. Il valore sta soprattutto nel non perdere tempo."},
  {id:"giro-notturno",categoria:"trasporto",minRep:5,n:"Il giro notturno",energia:21,difficolta:.34,pena:3,min:230,max:460,
   d:"Una commissione dopo l'orario giusto, quando in giro resta meno gente."},
  {id:"pacco-fuori-zona",categoria:"trasporto",minRep:10,n:"Fuori zona",energia:24,difficolta:.42,pena:4,min:300,max:620,
   d:"La destinazione è più lontana e chi ti manda vuole qualcuno che non faccia storie."},
  {id:"tratta-corta",categoria:"trasporto",minRep:16,n:"Tratta corta",energia:26,difficolta:.50,pena:5,min:360,max:760,
   d:"Pochi chilometri, ma abbastanza valore perché un errore faccia rumore."},
  {id:"consegna-sensibile",categoria:"trasporto",minRep:24,n:"Consegna sensibile",energia:29,difficolta:.58,pena:6,min:480,max:900,
   d:"Non è una commissione da affidare al primo che passa. Ti chiamano perché ormai il nome gira."},

  {id:"scotta",categoria:"merce",minRep:0,n:"Roba che scotta",energia:20,difficolta:.30,pena:3,min:220,max:480,
   d:"È arrivata da poco e va fatta sparire dal giro in fretta."},
  {id:"scatole-senza-marchio",categoria:"merce",minRep:0,n:"Scatole senza marchio",energia:21,difficolta:.34,pena:3,min:240,max:520,
   d:"Nessuna etichetta, nessuna ricevuta. Qualcuno vuole solo liberare spazio."},
  {id:"stock-sparito",categoria:"merce",minRep:6,n:"Lo stock sparito",energia:23,difficolta:.40,pena:4,min:300,max:620,
   d:"Una partita è sparita dai conti ufficiali e adesso deve cambiare mani."},
  {id:"merce-rientro",categoria:"merce",minRep:12,n:"Merce di rientro",energia:25,difficolta:.47,pena:4,min:350,max:720,
   d:"Doveva essere già fuori dal giro. È tornata indietro e qualcuno deve sistemare il problema."},
  {id:"deposito-caldo",categoria:"merce",minRep:20,n:"Deposito caldo",energia:28,difficolta:.56,pena:6,min:460,max:920,
   d:"Troppa roba ferma nello stesso posto. Se resta lì ancora, iniziano le domande."},
  {id:"partita-sbagliata",categoria:"merce",minRep:30,n:"La partita sbagliata",energia:31,difficolta:.64,pena:7,min:560,max:1100,
   d:"È finita alle persone sbagliate. Rimetterla in movimento paga bene, ma attira occhi."},

  {id:"retrobottega",categoria:"furto",minRep:0,n:"Il retrobottega",energia:24,difficolta:.38,pena:4,min:320,max:650,
   d:"Dietro la serranda resta più valore di quanto sembri da fuori."},
  {id:"cassa",categoria:"furto",minRep:4,n:"La cassa del bar",energia:28,difficolta:.50,pena:5,min:420,max:950,
   d:"Il locale chiude tardi e l'incasso non sparisce insieme alle luci."},
  {id:"serranda-abbassata",categoria:"furto",minRep:8,n:"Serranda abbassata",energia:27,difficolta:.46,pena:5,min:390,max:800,
   d:"Da fuori sembra tutto spento. Dentro è rimasto qualcosa che interessa a qualcuno."},
  {id:"ufficio-vuoto",categoria:"furto",minRep:16,n:"L'ufficio vuoto",energia:30,difficolta:.55,pena:6,min:480,max:960,
   d:"Nel fine settimana resta chiuso, ma non tutto quello che c'è dentro può aspettare lunedì."},
  {id:"deposito-weekend",categoria:"furto",minRep:24,n:"Deposito del weekend",energia:33,difficolta:.63,pena:7,min:600,max:1200,
   d:"Un posto che per due giorni nessuno dovrebbe guardare troppo da vicino."},
  {id:"incasso-notte",categoria:"furto",minRep:34,n:"L'incasso della notte",energia:36,difficolta:.72,pena:9,min:760,max:1500,
   d:"Più soldi, più occhi, più possibilità che qualcosa vada storto."},

  {id:"scooter",categoria:"veicoli",minRep:0,n:"Lo scooter giusto",energia:22,difficolta:.32,pena:3,min:250,max:520,
   d:"Serve un mezzo preciso e qualcuno ha già fatto sapere che lo pagherebbe."},
  {id:"furgone",categoria:"veicoli",minRep:8,n:"Il furgone",energia:27,difficolta:.46,pena:5,min:400,max:780,
   d:"Non interessa per come appare. Interessa perché è proprio quel mezzo."},
  {id:"auto-parcheggio",categoria:"veicoli",minRep:15,n:"Parcheggio lungo",energia:30,difficolta:.56,pena:6,min:480,max:980,
   d:"È lì da abbastanza tempo perché qualcuno abbia iniziato a farci caso."},
  {id:"macchina",categoria:"veicoli",minRep:22,n:"La macchina giusta",energia:35,difficolta:.68,pena:8,min:600,max:1350,
   d:"Sai qual è. Anche chi la vuole sa esattamente qual è."},
  {id:"mezzo-commissione",categoria:"veicoli",minRep:30,n:"Su commissione",energia:34,difficolta:.64,pena:8,min:620,max:1250,
   d:"Questa volta non cercano un mezzo qualsiasi: il lavoro arriva già con un nome sopra."},
  {id:"chiavi-giuste",categoria:"veicoli",minRep:42,n:"Le chiavi giuste",energia:38,difficolta:.76,pena:10,min:800,max:1650,
   d:"Una commissione pesante, riservata a chi ha già dimostrato di reggere la pressione."},

  {id:"conto-aperto",categoria:"incassi",minRep:0,n:"Un conto aperto",energia:20,difficolta:.28,pena:3,min:180,max:420,
   d:"Qualcuno deve ancora chiudere una questione e preferisce farlo attraverso un intermediario."},
  {id:"debito-vecchio",categoria:"incassi",minRep:7,n:"Debito vecchio",energia:23,difficolta:.38,pena:4,min:250,max:540,
   d:"È rimasto lì troppo a lungo. Adesso chi aspetta vuole almeno vedere che la cosa si muove."},
  {id:"quota-mancante",categoria:"incassi",minRep:14,n:"La quota mancante",energia:27,difficolta:.48,pena:5,min:340,max:720,
   d:"I conti non tornano e qualcuno vuole capire se è un errore o una scelta."},
  {id:"favore-da-chiudere",categoria:"incassi",minRep:24,n:"Favore da chiudere",energia:30,difficolta:.58,pena:7,min:440,max:900,
   d:"Non è solo una questione di soldi: c'è una promessa che qualcuno vuole vedere rispettata."},
  {id:"conto-pesante",categoria:"incassi",minRep:36,n:"Il conto pesante",energia:35,difficolta:.70,pena:9,min:650,max:1300,
   d:"Quando la cifra sale, salgono anche le persone che vogliono sapere come va a finire."}
]


function stradaCategoria(colpo){
  return STRADA_CATEGORIE_COLPO[colpo&&colpo.categoria] || STRADA_CATEGORIE_COLPO.merce;
}

function stradaEffettiCategoria(colpo){
  const cat=stradaCategoria(colpo);
  const scala=.65+clamp(Number(colpo&&colpo.difficolta||0),0,1)*.70;
  return {
    categoria:cat,
    guadagno:1+(Number(cat.guadagno||1)-1)*scala,
    chance:Number(cat.chance||0)*scala,
    heat:1+(Number(cat.heat||1)-1)*scala,
    sporco:clamp(.60+(Number(cat.sporco||.60)-.60)*scala,.48,.76),
    rep:1+(Number(cat.rep||1)-1)*scala
  };
}

function stradaCategoriaLabel(colpo){
  const cat=stradaCategoria(colpo);
  return cat.n+" · "+cat.tag;
}

/* Punto 9: i colpi occupano tempo reale della giornata.
   La durata nasce dalla categoria e cresce con la difficoltà, a scatti di
   15 minuti. Il range attuale resta intenzionalmente compatto (circa
   1h15–2h30): abbastanza da competere con Studio/lavoro/vita, ma senza
   rendere impraticabile la Strada a chi fa 4 turni serali in Pizzeria. */
const STRADA_DURATA_BASE_CATEGORIA = Object.freeze({
  trasporto:60,
  merce:75,
  furto:90,
  veicoli:75,
  incassi:60
});

function stradaDurataColpo(colpo){
  const base=Number(STRADA_DURATA_BASE_CATEGORIA[colpo&&colpo.categoria]||75);
  const diff=clamp(Number(colpo&&colpo.difficolta||0),0,1);
  const extra=Math.round((diff*75)/15)*15;
  return Math.max(60,Math.min(150,base+extra));
}

function stradaDurataColpoLabel(colpo){
  const minuti=stradaDurataColpo(colpo);
  return (typeof GAME_TIME!=="undefined" && GAME_TIME.formatDuration)
    ? GAME_TIME.formatDuration(minuti)
    : minuti+" min";
}

function stradaSpendiTempoColpo(colpo){
  const minuti=stradaDurataColpo(colpo);
  if(typeof GAME_TIME==="undefined")
    return {ok:false,reason:"Il sistema del tempo non è disponibile."};

  const gate=typeof GAME_TIME.canSpend==="function"
    ? GAME_TIME.canSpend(minuti)
    : {ok:typeof GAME_TIME.remaining!=="function" || GAME_TIME.remaining()>=minuti};

  if(!gate || gate.ok===false){
    return {
      ok:false,
      reason:gate&&gate.reason==="day-end"
        ? "Non fai in tempo oggi: questo colpo richiede "+stradaDurataColpoLabel(colpo)+"."
        : "Prima devi chiudere la decisione o l'azione in corso."
    };
  }

  const tx=typeof GAME_TIME.spend==="function"
    ? GAME_TIME.spend(minuti,"crime:job",{detail:{crimeJob:true,colpoId:colpo&&colpo.id}})
    : GAME_TIME.advance(minuti,"crime:job");

  if(tx && tx.blocked)
    return {ok:false,reason:"Prima devi chiudere la decisione o l'azione in corso."};

  return {ok:true,minutes:minuti,tx:tx||null};
}

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

/* Punto 8: preparazione corta e leggibile. Ogni colpo consente UNA sola
   preparazione prima dell'approccio: niente alberi di pianificazione e niente
   stacking. Le opzioni astratte cambiano chance/attenzione e costano tempo
   oppure un favore reale maturato con una persona del giro. */
const STRADA_PREPARAZIONI = Object.freeze([
  Object.freeze({
    id:"subito", n:"Vai adesso",
    d:"Non perdi tempo e non chiami nessuno. Ti prendi il colpo così com'è.",
    minuti:0, chance:0, heat:1
  }),
  Object.freeze({
    id:"informazioni", n:"Chiedi informazioni",
    d:"Spendi un po' di tempo per capire meglio la situazione prima di muoverti.",
    minuti:45, chance:.05, heat:.90
  }),
  Object.freeze({
    id:"finestra", n:"Aspetta il momento migliore",
    d:"Aspetti una finestra più favorevole: costa più tempo, ma riduce l'improvvisazione.",
    minuti:90, chance:.08, heat:.82
  }),
  Object.freeze({
    id:"contatto", n:"Chiama un contatto",
    d:"Usi un favore che qualcuno del giro ti deve per arrivare più preparato.",
    minuti:0, chance:.07, heat:.88, favore:1
  })
]);

/* Attività di provincia: Lavanderia, Autolavaggio, Minimarket (nomi dal
   documento). Il documento non fissa costo d'acquisto né resa esatta per la
   provincia (lo fa solo per il tipo di reparto, 45% pulito/55% sporco): i
   numeri sotto sono un punto di partenza credibile, da tarare. */
/* Punto Strada 17: le attività di copertura non sono più moltiplicatori
   astratti. Ognuna è una piccola impresa con ricavi normali, capacità di
   assorbire denaro sporco, rischio diverso e persone reali collegate.
   `resa` resta come alias della capacità per compatibilità con strumenti e
   salvataggi precedenti. */
const STRADA_ATTIVITA = [
  {id:"lavanderia", n:"Lavanderia", costo:1200, resa:150, capienza:150,
    ricavoPulito:80, gestione:25, rischio:.05, heatMax:1.6, efficienza:.72,
    nota:"piccoli importi, poca esposizione"},
  {id:"autolavaggio", n:"Autolavaggio", costo:1800, resa:240, capienza:240,
    ricavoPulito:120, gestione:35, rischio:.08, heatMax:2.2, efficienza:.78,
    nota:"più volume, più occhi addosso"},
  {id:"minimarket", n:"Minimarket", costo:2600, resa:330, capienza:330,
    ricavoPulito:170, gestione:50, rischio:.12, heatMax:3.0, efficienza:.82,
    nota:"molto volume, attività più esposta"}
];

const STRADA_ATTIVITA_PROBLEMI = Object.freeze([
  Object.freeze({id:"cassa", n:"La cassa non torna", tipo:"dipendente",
    testo:"Qualcuno ha iniziato a fare domande sui movimenti che non riconosce.",
    costo:120, heatIgnora:1.5}),
  Object.freeze({id:"fornitore", n:"Fornitore bloccato", tipo:"operativo",
    testo:"Una consegna saltata sta rallentando l'attività e il socio vuole una decisione.",
    costo:90, heatIgnora:.5}),
  Object.freeze({id:"controllo", n:"Controllo amministrativo", tipo:"controllo",
    testo:"Sono passati a verificare documenti e contabilità. Finché la situazione non è chiusa conviene tenere il profilo basso.",
    costo:180, heatIgnora:2.5})
]);

function stradaAttivitaDef(id){
  return STRADA_ATTIVITA.find(x=>x.id===id)||null;
}

function stradaAttivitaPersonaNuova(a,ruolo){
  if(!a) return null;
  G.gente=Array.isArray(G.gente)?G.gente:[];
  let p=null;
  if(typeof nuovaPersona==="function"){
    p=nuovaPersona(ruolo==="socio"?"fornitore":"collega");
  }else{
    p={
      id:"p"+Math.floor(Math.random()*1e9),
      ruolo:ruolo==="socio"?"fornitore":"collega",
      n:(ruolo==="socio"?"Socio ":"Dipendente ")+a.n,
      rel:0,pt:0,ult:-1,via:false
    };
  }
  p.origine="attivita";
  p.origineLuogo="attivita-"+a.id;
  p.origineDettaglio=(ruolo==="socio"?"socio/responsabile della ":"dipendente della ")+a.n;
  p.storia=(ruolo==="socio"
    ?"Gestisce con te la parte ordinaria dell'attività."
    :"Lavora qui e vede ogni settimana cosa succede davvero.");
  p.circoloSbloccato=false;
  p.visto=true;
  p.attivita={id:a.id,ruolo};
  if(ruolo==="socio") p.rel=Math.max(1,Number(p.rel||0));
  G.gente.push(p);
  return p;
}

function stradaAttivitaStato(id,creaPersone){
  const a=stradaAttivitaDef(id);
  if(!a) return null;
  const s=G.strada||(G.strada={});
  if(!s.attivitaStato || typeof s.attivitaStato!=="object") s.attivitaStato={};
  let st=s.attivitaStato[id];
  if(!st || typeof st!=="object"){
    st=s.attivitaStato[id]={
      partnerPersonId:null,employeePersonId:null,
      pressione:0,issue:null,history:[],
      blockedUntilAbsoluteDay:null,lastMeetingWeek:null,lastIssueWeek:null
    };
  }
  if(!Array.isArray(st.history)) st.history=[];
  if(!Number.isFinite(Number(st.pressione))) st.pressione=0;
  st.pressione=Math.max(0,Math.min(100,Number(st.pressione)||0));

  const owned=!!(s.attivita&&s.attivita[id]);
  if(owned && creaPersone!==false){
    const trova=pid=>(G.gente||[]).find(p=>p&&p.id===pid&&!p.via)||null;
    let partner=st.partnerPersonId?trova(st.partnerPersonId):null;
    let employee=st.employeePersonId?trova(st.employeePersonId):null;
    if(!partner){
      partner=stradaAttivitaPersonaNuova(a,"socio");
      if(partner) st.partnerPersonId=partner.id;
    }
    if(!employee){
      employee=stradaAttivitaPersonaNuova(a,"dipendente");
      if(employee) st.employeePersonId=employee.id;
    }
    if(partner&&employee&&typeof postoCollegaPersone==="function")
      postoCollegaPersone(partner,employee,"attivita-lavoro");
  }
  return st;
}

function stradaAttivitaPersone(id){
  const st=stradaAttivitaStato(id,true);
  const trova=pid=>(G.gente||[]).find(p=>p&&p.id===pid&&!p.via)||null;
  return {
    partner:st&&st.partnerPersonId?trova(st.partnerPersonId):null,
    employee:st&&st.employeePersonId?trova(st.employeePersonId):null
  };
}

function stradaAttivitaWeekIndex(){
  return (Math.max(1,Number(G.year)||1)-1)*52+Math.max(1,Number(G.week)||1);
}

function stradaAttivitaOperativa(id){
  const st=stradaAttivitaStato(id,true);
  if(!st) return false;
  return st.blockedUntilAbsoluteDay==null || stradaAbsDay()>=Number(st.blockedUntilAbsoluteDay);
}

/* Protezione a tre gradini più "nessuna", coi tre prezzi del documento. */
const STRADA_PROT = [
  {n:"Nessuna", costo:0},
  {n:"Occhi in giro", costo:260},
  {n:"Presenza fissa", costo:620},
  {n:"Scorta", costo:1450}
];

const STRADA_UOMO_COSTO = 500, STRADA_UOMO_UPKEEP = 140, STRADA_UOMO_MAX = 5;
const STRADA_FERRO_COSTO = 1200, STRADA_AVVOCATO_COSTO = 320;
const STRADA_FERRO_REP_MIN = 20, STRADA_FERRO_FIDUCIA_MIN = 50;

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

function stradaOpportunitaTriggerConfig(trigger){
  const base=STRADA_OPPORTUNITA_TRIGGER[trigger];
  if(!base) return null;
  const cap=stradaCapacitaRete();
  let chance=Number(base.chance||0);
  let cooldown=Math.max(1,Number(base.cooldownGiorni||1));

  /* Più persone ti conoscono e il tuo nome gira, più spesso qualcuno prova a
     coinvolgerti. Non esiste alcun "livello": cambia soltanto il mondo. */
  if(trigger==="mondo" && cap.piuChiamate){
    chance+=.035;
    cooldown=Math.max(7,cooldown-2);
  }
  if(trigger==="mondo" && cap.richiestaNome){
    chance+=.015;
    cooldown=Math.max(6,cooldown-1);
  }

  const heat=stradaHeatProfilo();
  chance*=Number(heat.opportunita||1);
  if(heat.id==="alto") cooldown+=2;
  else if(heat.id==="critico") cooldown+=4;

  return {
    chance:Math.min(.16,chance),
    cooldownGiorni:cooldown,
    durataGiorni:Number(base.durataGiorni||7),
    trigger,
    heatBand:heat.id
  };
}

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
    "nome nel giro "+stradaSegno(p.successRep)+" / "+stradaSegno(p.failureRep)
  ];
  return parti.join(" · ");
}

function stradaPresentazioneDopoSuccesso(persona,roll,variantRoll){
  if(!persona || persona.via || stradaRivalitaAttiva(persona)) return null;
  const st=stradaPersonaMeta(persona);
  if(stradaFiduciaValore(persona)<45) return null;
  const oggi=stradaAbsDay();
  if(st.lastReferralAbsoluteDay!=null &&
     oggi-Number(st.lastReferralAbsoluteDay)<35) return null;

  const r=Number.isFinite(Number(roll))
    ? Math.max(0,Math.min(.999999,Number(roll)))
    : Math.random();
  if(r>=.25) return null;

  const candidati=STRADA_OPPORTUNITA.filter(o=>{
    if(stradaReputazioneGlobale()<Number(o.minRep||0)) return false;
    if(o.persona===persona.n) return false;
    const key=o.contactKey||stradaContattoKey(o.persona);
    const existing=(G.gente||[]).find(p=>p && !p.via &&
      ((p.strada&&p.strada.key===key) || p.n===o.persona));
    return !existing || !existing.strada || !existing.strada.known;
  });
  if(!candidati.length) return null;

  const rv=Number.isFinite(Number(variantRoll))
    ? Math.max(0,Math.min(.999999,Number(variantRoll)))
    : Math.random();
  const variante=candidati[Math.floor(rv*candidati.length)]||candidati[0];
  const nuovo=stradaCreaContatto(
    variante.persona,
    variante.contactKey||stradaContattoKey(variante.persona),
    {
      source:"referral-after-success",
      opportunityId:variante.id,
      introducedByPersonId:persona.id,
      story:"Te l'ha presentato "+persona.n+" dopo un colpo chiuso bene."
    }
  );
  if(!nuovo) return null;
  if(typeof postoCollegaPersone==="function")
    postoCollegaPersone(persona,nuovo,"strada-referral");

  st.lastReferralAbsoluteDay=oggi;
  stradaModificaFiducia(nuovo,3,"presentazione-da-"+persona.id);
  stradaRegistraConseguenzaPersona(persona,"introduced-contact",{
    personId:nuovo.id,personName:nuovo.n
  });
  stradaRegistraConseguenzaPersona(nuovo,"introduced-by",{
    personId:persona.id,personName:persona.n
  });
  return {persona,nuovo,variante};
}

/* ==================== LA SCENA IN CORSO ====================
   Come modal.js, ma tutta dentro alla schermata: showEvent (z-index 60) finirebbe
   sotto ai pannelli come questo (z-index 93, stessa famiglia di posto/negozio),
   quindi qui le scelte del colpo si disegnano nella scheda della Strada, non sopra.

   La scheda la disegna renderStScheda() qui sotto:
   {k, titolo, testo, stats:[{t,c}], approcci, opts:[{n,d,sx,dx,hot,no,run()}]} */
let STRADA_SCENA = null;

function stScenaAvviso(colpo, msg, preparazione){
  return {k:"Non si può", titolo:"Così no", testo:msg,
    opts:[
      {n:"Torna alle scelte", d:"Rivedi come muoverti", run(){ STRADA_SCENA = stScenaApproccio(colpo,preparazione); }},
      {n:"Lascia stare", d:"Torni alla strada", run(){ STRADA_SCENA = null; }}
    ]};
}

/* Le tre righe sotto a ogni approccio escono dai numeri veri: quanto cambia il
   guadagno, e cosa ti serve o cosa rischi in più. */
function stRigaApproccio(a){
  const delta = Math.round((a.guadagno - 1) * 100);
  return {
    sx:(delta > 0 ? "+" : "−") + Math.abs(delta) + "% guadagno",
    dx:a.serveFerro ? "pena ×2,2" : a.serveUomo ? "serve una persona fidata" : "rischio ↓"
  };
}

function stradaPreparazioneDaId(id){
  return STRADA_PREPARAZIONI.find(p=>p.id===id) || STRADA_PREPARAZIONI[0];
}

function stradaPreparazioneContesto(ctx){
  if(!ctx || ctx.pagata!==true) return {
    id:"subito", pagata:true, personId:null, personName:null
  };
  const prep=stradaPreparazioneDaId(ctx.id);
  return {
    id:prep.id,
    pagata:true,
    personId:ctx.personId||null,
    personName:ctx.personName||null
  };
}

function stradaPreparazioneEffetti(ctx){
  const c=stradaPreparazioneContesto(ctx);
  const prep=stradaPreparazioneDaId(c.id);
  return {
    id:prep.id,
    n:prep.n,
    chance:Number(prep.chance||0),
    heat:Number(prep.heat||1),
    minuti:Number(prep.minuti||0),
    personId:c.personId,
    personName:c.personName
  };
}

function stradaPreparazioneEtichetta(ctx){
  const eff=stradaPreparazioneEffetti(ctx);
  return eff.id==="contatto" && eff.personName
    ? eff.n+" · "+eff.personName
    : eff.n;
}

function stradaErroreTempoPreparazione(minuti){
  const durata=(typeof GAME_TIME!=="undefined" && GAME_TIME.formatDuration)
    ? GAME_TIME.formatDuration(minuti)
    : minuti+" minuti";
  return "Non hai abbastanza tempo oggi: questa preparazione richiede "+durata+".";
}

function stradaApplicaPreparazione(colpo,prepId,personId){
  const prep=stradaPreparazioneDaId(prepId);

  if(prep.id==="contatto"){
    const p=stradaPersonaDaId(personId);
    if(!p || !p.strada || !p.strada.known || stradaFavoriValore(p)<1)
      return {ok:false,reason:"Non hai un favore disponibile con questo contatto."};
    if(!stradaConsumaFavore(p,"preparazione:"+String(colpo&&colpo.id||"colpo")))
      return {ok:false,reason:"Quel favore non è più disponibile."};
    if(typeof save==="function") save();
    return {
      ok:true,
      context:{id:prep.id,pagata:true,personId:p.id,personName:p.n}
    };
  }

  const minuti=Math.max(0,Math.round(Number(prep.minuti)||0));
  if(minuti>0){
    if(typeof GAME_TIME==="undefined")
      return {ok:false,reason:"Il sistema del tempo non è ancora disponibile."};
    const gate=typeof GAME_TIME.canSpend==="function"
      ? GAME_TIME.canSpend(minuti)
      : {ok:typeof GAME_TIME.remaining!=="function" || GAME_TIME.remaining()>=minuti};
    if(!gate || gate.ok===false){
      const reason=gate&&gate.reason;
      return {
        ok:false,
        reason:reason==="day-end"
          ? stradaErroreTempoPreparazione(minuti)
          : "Prima devi chiudere la decisione o l'azione in corso."
      };
    }
    const tx=typeof GAME_TIME.spend==="function"
      ? GAME_TIME.spend(minuti,"crime:prepare",{detail:{crimePreparation:prep.id,colpoId:colpo&&colpo.id}})
      : GAME_TIME.advance(minuti,"crime:prepare");
    if(tx && tx.blocked)
      return {ok:false,reason:"Prima devi chiudere la decisione o l'azione in corso."};
  }

  return {ok:true,context:{id:prep.id,pagata:true,personId:null,personName:null}};
}

function stScenaPreparazioneErrore(colpo,msg){
  return {
    k:"Preparazione",
    titolo:"Non adesso",
    testo:msg,
    opts:[
      {n:"Torna alla preparazione",d:"Scegli un'altra strada",run(){STRADA_SCENA=stScenaPreparazione(colpo);}},
      {n:"Lascia stare",d:"Torni alla strada",run(){STRADA_SCENA=null;}}
    ]
  };
}

function stScenaContattoPreparazione(colpo){
  const persone=stradaPersoneConFavore();
  return {
    k:"Chiami chi?",
    titolo:colpo.n,
    testo:"Un favore vale perché nasce da qualcosa che hai già fatto per quella persona. Se lo usi, è consumato.",
    stats:[
      {t:persone.length+" "+(persone.length===1?"contatto disponibile":"contatti disponibili")},
      {t:"Costo: 1 favore"}
    ],
    opts:[
      ...persone.map(p=>({
        n:p.n,
        d:"Fiducia nel giro: "+stradaFiduciaEtichetta(p),
        sx:stradaFavoriValore(p)+" "+(stradaFavoriValore(p)===1?"favore":"favori"),
        dx:"+7% riuscita · attenzione ↓",
        run(){
          const out=stradaApplicaPreparazione(colpo,"contatto",p.id);
          STRADA_SCENA=out.ok
            ? stScenaApproccio(colpo,out.context)
            : stScenaPreparazioneErrore(colpo,out.reason);
        }
      })),
      {n:"Torna indietro",d:"Scegli un'altra preparazione",run(){STRADA_SCENA=stScenaPreparazione(colpo);}}
    ]
  };
}

function stScenaPreparazione(colpo){
  const personeFavori=stradaPersoneConFavore();
  return {
    k:"Prima di muoverti",
    titolo:colpo.n,
    testo:"Puoi partire subito oppure spendere tempo o un favore per arrivare più preparato. Una sola scelta: poi si decide come affrontare il colpo.",
    stats:[
      {t:fmt(colpo.min)+"–"+fmt(colpo.max)+" €",c:"money"},
      {t:colpo.energia+" energia"},
      {t:stradaDurataColpoLabel(colpo)+" di tempo"},
      {t:"Rischio "+stRischio(colpo).toLowerCase(),c:stClasseRischio(colpo)}
    ],
    opts:STRADA_PREPARAZIONI.map(p=>{
      const favore=p.id==="contatto";
      const minuti=Math.max(0,Number(p.minuti||0));
      const costo=favore
        ? (personeFavori.length?"1 favore":"nessun favore disponibile")
        : (minuti?((typeof GAME_TIME!=="undefined"&&GAME_TIME.formatDuration)?GAME_TIME.formatDuration(minuti):minuti+" min"):"nessun costo");
      const effetto=Number(p.chance||0)>0
        ? "+"+Math.round(Number(p.chance||0)*100)+"% riuscita · attenzione ↓"
        : "nessun bonus";
      return {
        n:p.n,d:p.d,sx:costo,dx:effetto,
        no:favore&&!personeFavori.length,
        run(){
          if(favore){STRADA_SCENA=stScenaContattoPreparazione(colpo);return;}
          const out=stradaApplicaPreparazione(colpo,p.id);
          STRADA_SCENA=out.ok
            ? stScenaApproccio(colpo,out.context)
            : stScenaPreparazioneErrore(colpo,out.reason);
        }
      };
    })
  };
}

function stScenaPersonaSquadra(colpo,preparazione){
  const persone=stradaPersoneSquadra();
  return {
    k:"Con chi ti muovi?",
    titolo:colpo.n,
    testo:"Per questo approccio non basta pagare qualcuno: serve una persona che si fidi abbastanza da metterci la faccia con te.",
    stats:[
      {t:persone.length+" "+(persone.length===1?"persona disponibile":"persone disponibili")},
      {t:"Fiducia costruita facendo cose insieme"},
      {t:"Preparazione: "+stradaPreparazioneEtichetta(preparazione)}
    ],
    opts:[
      ...persone.map(p=>({
        n:p.n,
        d:"Fiducia nel giro: "+stradaFiduciaEtichetta(p),
        sx:"+"+Math.round(stradaBonusFiduciaSquadra(p)*100)+"% riuscita",
        dx:String(p.ruolo||"contatto"),
        run(){ stradaTenta(colpo.id,"squadra",p.id,preparazione); }
      })),
      {n:"Torna indietro",d:"Scegli un altro approccio",run(){STRADA_SCENA=stScenaApproccio(colpo,preparazione);}}
    ]
  };
}

function stScenaApproccio(colpo,preparazione){
  const s = G.strada;
  preparazione=stradaPreparazioneContesto(preparazione);
  const personeSquadra=stradaPersoneSquadra();
  return {k:"Come vuoi muoverti?", titolo:colpo.n, testo:colpo.d, approcci:true,
    stats:[
      {t:fmt(colpo.min) + "–" + fmt(colpo.max) + " €", c:"money"},
      {t:colpo.energia + " energia"},
      {t:stradaDurataColpoLabel(colpo)+" di tempo"},
      {t:"Rischio " + stRischio(colpo).toLowerCase(), c:stClasseRischio(colpo)},
      {t:stradaCategoriaLabel(colpo)},
      {t:"Preparazione: "+stradaPreparazioneEtichetta(preparazione)}
    ],
    opts:STRADA_APPROCCI.map(a => {
      const riga = stRigaApproccio(a);
      const squadra=a.id==="squadra";
      const dx=squadra
        ? (personeSquadra.length
          ? personeSquadra.length+" "+(personeSquadra.length===1?"persona fidata":"persone fidate")
          : "nessuno si fida abbastanza")
        : riga.dx;
      return {n:a.n, d:a.d, sx:riga.sx, dx, hot:a.id === "ferro",
        no:(squadra && !personeSquadra.length) || (a.serveFerro && !s.ferro) || G.energy < colpo.energia,
        run(){
          if(squadra){ STRADA_SCENA=stScenaPersonaSquadra(colpo,preparazione); return; }
          stradaTenta(colpo.id, a.id, null, preparazione);
        }};
    })};
}

function stAvviaColpo(colpoId){
  if(!stradaPartecipazioneAttiva()){stToast("Hai mollato il giro: non accetti più colpi.");return;}
  const colpo = STRADA_COLPI.find(c => c.id === colpoId);
  if(!colpo) return;
  STRADA_SCENA = stScenaPreparazione(colpo);
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

/* ==================== USCIRE DAL GIRO · PUNTO 21 ====================
   Essere entrato nel giro e parteciparvi adesso sono due fatti diversi.
   giroAvviato resta memoria storica; uscitaGiro decide invece se il giocatore
   sta ancora accettando colpi, riciclando e ricevendo opportunità nuove. */
function stradaUscitaStato(){
  const s=G.strada||(G.strada={});
  if(!s.uscitaGiro || typeof s.uscitaGiro!=="object"){
    s.uscitaGiro={
      mollato:false,leftAbsoluteDay:null,profondita:0,memoryUntilAbsoluteDay:null,
      lastKnockAbsoluteDay:null,history:[]
    };
  }
  const u=s.uscitaGiro;
  u.mollato=!!u.mollato;
  if(!Array.isArray(u.history))u.history=[];
  if(!Number.isFinite(Number(u.profondita)))u.profondita=0;
  return u;
}

function stradaPartecipazioneAttiva(){
  if(!stradaAttivitaSbloccate()) return false;
  return stradaUscitaStato().mollato!==true;
}

function stradaProfonditaUscita(){
  const s=G.strada||{};
  const contatti=(G.gente||[]).filter(p=>p&&!p.via&&p.strada&&p.strada.known);
  const fidati=contatti.filter(p=>stradaFiduciaValore(p)>=STRADA_FIDUCIA_SQUADRA).length;
  const rivali=contatti.filter(p=>stradaRivalitaAttiva(p)).length;
  const debiti=contatti.reduce((n,p)=>n+Math.max(0,Number(stradaConseguenzePersona(p).debiti||0)),0);
  const attive=Object.values(s.attivita||{}).filter(Boolean).length;
  const colpi=Math.max(0,Number(G.diario&&G.diario.colpi)||0);
  const score=
    Number(s.rep||0)*.30+
    Math.min(4,Number(s.precedenti||0))*11+
    Math.min(12,colpi)*2.5+
    Math.min(8,contatti.length)*2+
    Math.min(4,fidati)*3+
    Math.min(3,rivali)*5+
    Math.min(4,debiti)*2+
    Math.min(3,attive)*2+
    (s.carcere?5:0);
  return clamp(Math.round(score),0,100);
}

function stradaMemoriaGiorni(profondita){
  const p=Math.max(0,Number(profondita)||0);
  return p<25 ? 120 : p<50 ? 365 : p<75 ? 730 : 1460;
}

function stradaPassatoAttivo(){
  const u=stradaUscitaStato();
  if(!u.mollato) return false;
  if(!Number.isFinite(Number(u.memoryUntilAbsoluteDay))) return false;
  return stradaAbsDay()<=Number(u.memoryUntilAbsoluteDay);
}

function stradaRischioCriminaleAttivo(){
  return stradaPartecipazioneAttiva() || stradaPassatoAttivo();
}

function stradaPassatoCandidati(){
  return (G.gente||[]).filter(p=>p&&!p.via&&p.strada&&p.strada.known).map(p=>{
    const st=stradaPersonaMeta(p),cons=stradaConseguenzePersona(p);
    const kind=st.rivalita?"rival":Number(cons.debiti||0)>0?"debt":
      (stradaFiduciaValore(p)>=35 || p.origine==="carcere")?"contact":null;
    if(!kind)return null;
    const peso=(kind==="rival"?6:kind==="debt"?5:2)+stradaFiduciaValore(p)/40;
    return {p,kind,peso};
  }).filter(Boolean);
}

function stradaPassatoSettimana(roll,variantRoll){
  const u=stradaUscitaStato();
  if(!u.mollato || !stradaPassatoAttivo()) return null;
  const oggi=stradaAbsDay();
  const last=Number(u.lastKnockAbsoluteDay);
  if(Number.isFinite(last)&&oggi-last<21) return null;

  const durata=Math.max(1,Number(u.memoryUntilAbsoluteDay)-Number(u.leftAbsoluteDay||oggi));
  const resta=Math.max(0,Number(u.memoryUntilAbsoluteDay)-oggi);
  const frazione=clamp(resta/durata,0,1);
  const chance=.015+(Number(u.profondita||0)/100)*.085*frazione;
  const r=Number.isFinite(Number(roll))?Number(roll):Math.random();
  if(r>=chance)return null;

  const candidati=stradaPassatoCandidati();
  if(!candidati.length)return null;
  const totale=candidati.reduce((n,x)=>n+x.peso,0);
  let pickRoll=Number.isFinite(Number(variantRoll))?Math.max(0,Math.min(.999999,Number(variantRoll))):Math.random();
  let cursore=pickRoll*totale,scelta=candidati[candidati.length-1];
  for(const x of candidati){cursore-=x.peso;if(cursore<=0){scelta=x;break;}}

  const p=scelta.p;
  u.lastKnockAbsoluteDay=oggi;
  const e={
    type:"past-knock",absoluteDay:oggi,personId:p.id,personName:p.n,
    kind:scelta.kind,profondita:Number(u.profondita||0)
  };
  u.history.push(e);if(u.history.length>20)u.history.shift();
  stradaRegistraConseguenzaPersona(p,"past-knock",{kind:scelta.kind,profondita:u.profondita});

  if(scelta.kind==="rival"){
    G.strada.heat=clamp(Number(G.strada.heat||0)+1.5,0,100);
    G.wellbeing=clamp(Number(G.wellbeing||0)-2,0,100);
    if(typeof pushLog==="function")
      pushLog("<b>Il passato torna a bussare.</b> "+p.n+" si è fatto sentire. Hai mollato il giro, non il conto aperto.","bad");
  }else if(scelta.kind==="debt"){
    G.wellbeing=clamp(Number(G.wellbeing||0)-1,0,100);
    if(typeof pushLog==="function")
      pushLog("<b>"+p.n+" non ha dimenticato il favore.</b> Non ti propone un colpo: ti ricorda soltanto che certi conti restano.","");
  }else{
    if(typeof pushLog==="function")
      pushLog("<b>"+p.n+" ricompare.</b> Non ti sta riportando nel giro: è una persona che faceva parte di quella vita e non è sparita quando hai mollato.","");
  }
  return e;
}

function stradaAbsDay(){
  return Math.max(1,
    ((Number(G.year || 1) - 1) * 52 + (Number(G.week || 1) - 1)) * 7 +
    Math.max(1, Math.min(7, Number(G.day || 1)))
  );
}

function stradaOfferteColpiStato(){
  const s=G.strada||(G.strada={});
  if(!s.offerteColpi || typeof s.offerteColpi!=="object")
    s.offerteColpi={absoluteDay:null,ids:[],previousIds:[]};
  if(!Array.isArray(s.offerteColpi.ids)) s.offerteColpi.ids=[];
  if(!Array.isArray(s.offerteColpi.previousIds)) s.offerteColpi.previousIds=[];
  return s.offerteColpi;
}

function stradaRngDeterministico(seed){
  let x=(Number(seed)||1)>>>0;
  return function(){
    x^=x<<13;x^=x>>>17;x^=x<<5;
    return (x>>>0)/4294967296;
  };
}

function stradaGeneraOfferteColpi(seed,rep,previousIds){
  rep=Math.max(0,Number(rep||0));
  previousIds=Array.isArray(previousIds)?previousIds:[];
  const pool=STRADA_COLPI.filter(c=>
    rep>=Number(c.minRep||0) &&
    (c.maxRep==null || rep<=Number(c.maxRep))
  );
  if(pool.length<=4) return pool.slice();

  const rndLocal=stradaRngDeterministico(seed);
  const scored=pool.map(c=>({
    c,
    /* Il giorno precedente è solo penalizzato, non vietato: così una dritta
       o un pool piccolo possono far ricomparire un lavoro senza creare cicli
       artificiosi. Nessun bonus per diversità categoria: i duplicati sono
       intenzionali. */
    score:rndLocal()+(previousIds.includes(c.id)?.55:0)
  })).sort((a,b)=>a.score-b.score);

  return scored.slice(0,4).map(x=>x.c);
}

function stradaColpiDisponibili(){
  const st=stradaOfferteColpiStato();
  const oggi=stradaAbsDay();
  const rep=stradaReputazioneGlobale();

  if(Number(st.absoluteDay)!==oggi || !st.ids.length){
    const prev=st.ids.filter(id=>STRADA_COLPI.some(c=>c.id===id));
    const seed=((oggi*2654435761) ^ (Math.floor(rep/5)*2246822519) ^
      (Number(G.strada&&G.strada.precedenti||0)*3266489917))>>>0;
    const offerte=stradaGeneraOfferteColpi(seed,rep,prev);
    st.previousIds=prev.slice(0,4);
    st.ids=offerte.map(c=>c.id);
    st.absoluteDay=oggi;
  }

  /* Una dritta attiva non può puntare a un colpo invisibile. Se il target non
     è nelle quattro offerte, entra sostituendo l'ultimo slot e resta visibile
     fino al cambio giornata anche dopo che la dritta è stata consumata. */
  const lead=typeof stradaOpportunitaAttiva==="function" ? stradaOpportunitaAttiva() : null;
  if(lead&&lead.colpoId&&STRADA_COLPI.some(c=>c.id===lead.colpoId) &&
     !st.ids.includes(lead.colpoId)){
    st.ids=st.ids.slice(0,3).concat(lead.colpoId);
  }

  return st.ids.map(id=>STRADA_COLPI.find(c=>c.id===id)).filter(Boolean);
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
  const s=stradaIngressoStato();
  /* Se il salvataggio è stato creato dopo il punto 1 ma prima del punto 2 può
     essere ancora a metà introduzione e non avere affatto il campo traphone.
     Qui non va trattato come legacy già sbloccato: è proprio il momento in cui
     l'oggetto viene consegnato. */
  if(!s.traphone || typeof s.traphone!=="object"){
    s.traphone={owned:false,sourcePersonId:null,sourceName:null,acquiredAbsoluteDay:null,source:null};
  }
  const t=s.traphone;
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


/* ==================== PERSONE DELLA STRADA ====================
   Punto 3: nessun nome criminale deve restare solo testo in un popup.
   Ogni contatto vive in G.gente, conserva la propria identità/origine e può
   ricomparire nei sistemi sociali esistenti. Il punto 4 aggiungerà la fiducia
   criminale: qui costruiamo soltanto identità e continuità. */
const STRADA_FIDUCIA_SQUADRA = 25;

/* Punto 10: una relazione criminale non perde un punto a settimana.
   Può invece cambiare stato quando il giocatore sparisce davvero oppure
   ignora ripetutamente la stessa persona. Il personaggio resta sempre in
   G.gente: è il suo rapporto col giro a diventare inattivo/non raggiungibile. */
const STRADA_RELAZIONI = Object.freeze({
  ignoredLimit:3,
  inactiveAfterDays:84,
  unreachableAfterDays:168,
  strongTrust:50,
  strongJobs:2,
  coldReturnAfterDays:84,
  coldTrustLoss:15
});

/* Punto Strada 19: l'heat cambia il mondo, non soltanto il dado del colpo.
   Le quattro fasce sono una fonte unica di verità per opportunità, persone,
   controlli e costo degli errori. Nessun "livello criminale" viene salvato:
   la fascia deriva sempre dall'heat attuale. */
const STRADA_HEAT_FASCE = Object.freeze([
  Object.freeze({
    id:"basso",min:0,label:"Basso",occhi:"Nessuno",
    opportunita:1,cautela:.00,controllo:.00,controlloFerro:.03,
    errore:1,pena:1,escalation:0,bruciaOpportunita:0,stopCooldown:0,
    mondo:"Il giro scorre normalmente. Nessuno sta cambiando abitudini per colpa tua."
  }),
  Object.freeze({
    id:"medio",min:25,label:"Medio",occhi:"Gente prudente",
    opportunita:.82,cautela:.25,controllo:.04,controlloFerro:.07,
    errore:1.12,pena:1.05,escalation:.08,bruciaOpportunita:.08,stopCooldown:0,
    mondo:"Le persone meno legate a te iniziano a tenersi basse e le porte si aprono più lentamente."
  }),
  Object.freeze({
    id:"alto",min:50,label:"Alto",occhi:"Giro caldo",
    opportunita:.55,cautela:.45,controllo:.13,controlloFerro:.14,
    errore:1.35,pena:1.15,escalation:.22,bruciaOpportunita:.28,stopCooldown:21,
    mondo:"Qualcuno evita di farsi vedere con te, le occasioni possono saltare e i controlli diventano concreti."
  }),
  Object.freeze({
    id:"critico",min:75,label:"Molto alto",occhi:"Ti stanno addosso",
    opportunita:.30,cautela:.70,controllo:.22,controlloFerro:.22,
    errore:1.65,pena:1.35,escalation:.42,bruciaOpportunita:.52,stopCooldown:14,
    mondo:"Il giro si restringe. Anche un errore piccolo può trascinare conseguenze molto più pesanti."
  })
]);

function stradaHeatProfilo(valore){
  const h=clamp(Number(valore==null?(G.strada&&G.strada.heat):valore)||0,0,100);
  for(let i=STRADA_HEAT_FASCE.length-1;i>=0;i--)
    if(h>=STRADA_HEAT_FASCE[i].min) return STRADA_HEAT_FASCE[i];
  return STRADA_HEAT_FASCE[0];
}

function stradaHeatMondoStato(){
  const s=G.strada||(G.strada={});
  if(!s.heatMondo || typeof s.heatMondo!=="object")
    s.heatMondo={lastStopRequestAbsoluteDay:null,history:[]};
  if(!Array.isArray(s.heatMondo.history)) s.heatMondo.history=[];
  return s.heatMondo;
}

function stradaPersonaMeta(p){
  if(!p) return null;
  if(!p.strada || typeof p.strada!=="object"){
    p.strada={
      known:false,
      key:null,
      firstLinkedAbsoluteDay:null,
      sources:[],
      opportunityIds:[],
      introducedByPersonId:null,
      fiducia:0,
      fiduciaEventi:[],
      favori:0,
      favoriEventi:[],
      colpiInsieme:0,
      streetStatus:"active",
      lastPlayerStreetInteractionAbsoluteDay:null,
      lastStreetContactAttemptAbsoluteDay:null,
      ignoredStreetOffers:0,
      inactiveSinceAbsoluteDay:null,
      unreachableSinceAbsoluteDay:null,
      returnAfterAbsoluteDay:null,
      streetStatusReason:null,
      streetStatusHistory:[],
      debitiGiocatore:0,
      tensione:0,
      rivalita:false,
      lastReferralAbsoluteDay:null,
      conseguenzeEventi:[],
      heatCaution:false,
      heatCautionBand:null,
      heatCautionSinceAbsoluteDay:null
    };
  }
  if(!Array.isArray(p.strada.sources)) p.strada.sources=[];
  if(!Array.isArray(p.strada.opportunityIds)) p.strada.opportunityIds=[];
  if(!Array.isArray(p.strada.fiduciaEventi)) p.strada.fiduciaEventi=[];
  if(!Array.isArray(p.strada.favoriEventi)) p.strada.favoriEventi=[];
  if(!Array.isArray(p.strada.streetStatusHistory)) p.strada.streetStatusHistory=[];
  if(!Array.isArray(p.strada.conseguenzeEventi)) p.strada.conseguenzeEventi=[];
  if(!Number.isFinite(Number(p.strada.debitiGiocatore))) p.strada.debitiGiocatore=0;
  p.strada.debitiGiocatore=Math.max(0,Math.min(3,Math.floor(Number(p.strada.debitiGiocatore)||0)));
  if(!Number.isFinite(Number(p.strada.tensione))) p.strada.tensione=0;
  p.strada.tensione=Math.max(0,Math.min(3,Math.floor(Number(p.strada.tensione)||0)));
  p.strada.rivalita=!!p.strada.rivalita;
  p.strada.heatCaution=!!p.strada.heatCaution;
  if(p.strada.heatCautionBand!=null) p.strada.heatCautionBand=String(p.strada.heatCautionBand);
  if(!Number.isFinite(Number(p.strada.favori))) p.strada.favori=0;
  p.strada.favori=Math.max(0,Math.min(3,Math.floor(Number(p.strada.favori)||0)));
  if(!Number.isFinite(Number(p.strada.colpiInsieme))) p.strada.colpiInsieme=0;
  if(!["active","inactive","unreachable","cold"].includes(p.strada.streetStatus))
    p.strada.streetStatus="active";
  if(!Number.isFinite(Number(p.strada.ignoredStreetOffers))) p.strada.ignoredStreetOffers=0;
  p.strada.ignoredStreetOffers=Math.max(0,Math.floor(Number(p.strada.ignoredStreetOffers)||0));
  /* I salvataggi precedenti al punto 10 non vengono puniti retroattivamente:
     il loro contatore di assenza parte dal primo caricamento col nuovo sistema. */
  if(p.strada.known &&
     (p.strada.lastPlayerStreetInteractionAbsoluteDay==null ||
      !Number.isFinite(Number(p.strada.lastPlayerStreetInteractionAbsoluteDay))))
    p.strada.lastPlayerStreetInteractionAbsoluteDay=stradaAbsDay();
  if(!Number.isFinite(Number(p.strada.fiducia))){
    let base=p.strada.known?10:0;
    if(p.strada.sources.includes("intro")) base+=10;
    base+=Math.min(3,p.strada.opportunityIds.length)*5;
    p.strada.fiducia=clamp(base,0,40);
  }else p.strada.fiducia=clamp(Number(p.strada.fiducia)||0,0,100);
  return p.strada;
}

function stradaHeatSincronizzaPersone(){
  const prof=stradaHeatProfilo();
  const oggi=stradaAbsDay();
  const pool=(G.gente||[]).filter(p=>{
    if(!p || p.via || !p.strada || !p.strada.known) return false;
    const st=stradaPersonaMeta(p);
    return (st.streetStatus==="active" || st.streetStatus==="cold") && !st.rivalita;
  }).sort((a,b)=>{
    const fa=stradaFiduciaValore(a), fb=stradaFiduciaValore(b);
    if(fa!==fb) return fa-fb; /* si tirano indietro prima i legami più deboli */
    const la=Number(stradaPersonaMeta(a).lastPlayerStreetInteractionAbsoluteDay||0);
    const lb=Number(stradaPersonaMeta(b).lastPlayerStreetInteractionAbsoluteDay||0);
    return la-lb;
  });

  const quanti=prof.cautela>0 && pool.length
    ? Math.min(pool.length,Math.max(1,Math.ceil(pool.length*prof.cautela)))
    : 0;
  const prudenti=new Set(pool.slice(0,quanti).map(p=>p.id));

  for(const p of pool){
    const st=stradaPersonaMeta(p);
    const prima=st.heatCaution===true;
    const dopo=prudenti.has(p.id);
    st.heatCaution=dopo;
    st.heatCautionBand=dopo?prof.id:null;
    if(dopo&&!prima) st.heatCautionSinceAbsoluteDay=oggi;
    if(!dopo) st.heatCautionSinceAbsoluteDay=null;
  }
  return pool.filter(p=>prudenti.has(p.id));
}

function stradaHeatPersonaCauta(p){
  const st=stradaPersonaMeta(p);
  return !!(st&&st.heatCaution);
}

function stradaRelazioneOperativa(p){
  return stradaRelazioneDisponibile(p) && !stradaHeatPersonaCauta(p);
}

function stradaHeatCostoErrore(){
  return Number(stradaHeatProfilo().errore||1);
}

function stradaHeatPenaMoltiplicatore(){
  return Number(stradaHeatProfilo().pena||1);
}

function stradaHeatChanceSoloDenuncia(base){
  const p=stradaHeatProfilo();
  return clamp(Number(base==null?.6:base)*(1-Number(p.escalation||0)),.12,.9);
}

function stradaHeatRischioControllo(){
  const s=G.strada||{};
  const p=stradaHeatProfilo();
  let rischio=s.ferro
    ? Math.max(Number(p.controlloFerro||0),.03+Math.max(0,Number(s.heat||0)-20)/100*.18)
    : Number(p.controllo||0);
  rischio+=Number(s.precedenti||0)*.02;
  rischio-=Number(s.prot||0)*.01;
  return clamp(rischio,0,.42);
}

function stradaHeatBruciaOpportunita(roll,silent){
  const p=stradaHeatProfilo();
  if(Number(p.bruciaOpportunita||0)<=0) return null;
  const st=stradaOpportunitaStato();
  stradaAggiornaOpportunita(true);
  const tutte=[];
  if(st.active) tutte.push(st.active);
  if(st.pending) tutte.push(st.pending);
  if(Array.isArray(st.pendingChoices)) tutte.push(...st.pendingChoices);
  if(!tutte.length) return null;

  const r=Number.isFinite(Number(roll))
    ? Math.max(0,Math.min(.999999,Number(roll)))
    : Math.random();
  if(r>=Number(p.bruciaOpportunita||0)) return null;

  const oggi=stradaAbsDay();
  const viste=new Set();
  for(const lead of tutte){
    if(!lead || viste.has(lead.id)) continue;
    viste.add(lead.id);
    const persona=lead.personId?stradaPersonaDaId(lead.personId):null;
    st.history.push({
      type:"burned-by-heat",absoluteDay:oggi,opportunityId:lead.id,
      personId:lead.personId||null,heat:Number(G.strada.heat||0),heatBand:p.id
    });
    if(persona) stradaRegistraConseguenzaPersona(persona,"heat-opportunity-burned",{
      heat:Number(G.strada.heat||0),opportunityId:lead.id
    });
  }
  while(st.history.length>30) st.history.shift();
  st.active=null;
  st.pending=null;
  st.pendingChoices=[];
  st.nextOfferAbsoluteDay=Math.max(
    Number(st.nextOfferAbsoluteDay||0),
    oggi+(p.id==="critico"?10:7)
  );

  const hm=stradaHeatMondoStato();
  hm.history.push({type:"opportunity-burned",absoluteDay:oggi,heat:Number(G.strada.heat||0),count:viste.size});
  if(hm.history.length>30) hm.history.shift();
  if(!silent && typeof pushLog==="function"){
    const nomi=[...viste].length;
    pushLog("<b>Una porta si è chiusa perché il giro è troppo caldo.</b> "+
      (nomi>1?"Le proposte aperte sono saltate.":"La proposta aperta è saltata.")+
      " Nessuno vuole restare esposto adesso.","bad");
  }
  return {count:viste.size,heatBand:p.id};
}

function stradaHeatRichiestaFermati(silent){
  const p=stradaHeatProfilo();
  if(!Number(p.stopCooldown||0)) return null;
  const hm=stradaHeatMondoStato();
  const oggi=stradaAbsDay();
  const last=Number(hm.lastStopRequestAbsoluteDay);
  if(Number.isFinite(last)&&oggi-last<Number(p.stopCooldown)) return null;

  stradaHeatSincronizzaPersone();
  const candidati=(G.gente||[]).filter(x=>
    x&&!x.via&&x.strada&&x.strada.known&&stradaRelazioneDisponibile(x)&&!stradaRivalitaAttiva(x)
  ).sort((a,b)=>stradaFiduciaValore(b)-stradaFiduciaValore(a));
  const persona=candidati[0]||null;
  if(!persona) return null;

  hm.lastStopRequestAbsoluteDay=oggi;
  hm.history.push({
    type:"stop-request",absoluteDay:oggi,heat:Number(G.strada.heat||0),
    heatBand:p.id,personId:persona.id,personName:persona.n
  });
  if(hm.history.length>30) hm.history.shift();
  stradaRegistraConseguenzaPersona(persona,"heat-stop-request",{heat:Number(G.strada.heat||0)});
  if(!silent&&typeof pushLog==="function")
    pushLog("<b>"+persona.n+" ti ha chiesto di abbassare il profilo.</b> «Per un po' non farti vedere ovunque. C'è troppa attenzione addosso.»","bad");
  return persona;
}

function stradaHeatMuoviMondo(rollBrucia,silent){
  const prudenti=stradaHeatSincronizzaPersone();
  const bruciata=stradaHeatBruciaOpportunita(rollBrucia,silent);
  const fermati=stradaHeatRichiestaFermati(silent);
  return {profilo:stradaHeatProfilo(),prudenti,bruciata,fermatoDa:fermati};
}

function stradaRelazioneForte(p){
  const st=stradaPersonaMeta(p);
  if(!st) return false;
  return Number(st.fiducia||0)>=STRADA_RELAZIONI.strongTrust ||
    Number(st.colpiInsieme||0)>=STRADA_RELAZIONI.strongJobs ||
    Number(st.favori||0)>0;
}

/* Punto 13: i risultati dei colpi lasciano conseguenze nelle persone, non
   soltanto nei contatori globali. Debiti, tensioni e rivalità vivono sulla
   stessa persona persistente di G.gente. */
function stradaConseguenzePersona(p){
  const st=stradaPersonaMeta(p);
  if(!st) return null;
  return {
    debiti:Math.max(0,Number(st.debitiGiocatore||0)),
    tensione:Math.max(0,Number(st.tensione||0)),
    rivalita:st.rivalita===true
  };
}

function stradaRivalitaAttiva(p){
  const st=stradaPersonaMeta(p);
  return !!(st&&st.rivalita);
}

function stradaRegistraConseguenzaPersona(p,type,meta){
  if(!p || p.via) return null;
  const st=stradaPersonaMeta(p);
  const e={
    type:String(type||"street-consequence"),
    absoluteDay:stradaAbsDay(),
    meta:meta&&typeof meta==="object"?Object.assign({},meta):null
  };
  st.conseguenzeEventi.push(e);
  if(st.conseguenzeEventi.length>20) st.conseguenzeEventi.shift();
  return e;
}

/* Punto Strada 17: porta l'esito criminale sulla relazione generale della
   stessa persona. In questo modo un collega/Frequentatore del Circolo non
   dimentica quello che è successo appena cambia schermata. Se quella persona
   era arrivata tramite una presentazione reale, una versione attenuata
   dell'esito torna anche a chi aveva fatto il nome: il passaparola del punto
   16 produce quindi conseguenze, non solo accessi. */
function stradaEcoMondo(p,tipo,punti,meta){
  if(!p || p.via || typeof postoRegistraConseguenzaMondo!=="function") return null;

  const m=meta&&typeof meta==="object" ? meta : {};
  const diretto=postoRegistraConseguenzaMondo(p,tipo,punti,{
    source:"strada",
    reason:m.reason||tipo,
    relatedPersonId:m.relatedPersonId||null,
    relatedPersonName:m.relatedPersonName||null,
    context:m.context||"strada"
  });

  const st=stradaPersonaMeta(p);
  let passaparola=null;
  if(m.noHearsay!==true && st.introducedByPersonId){
    const introd=stradaPersonaDaId(st.introducedByPersonId);
    if(introd && introd.id!==p.id && !introd.via){
      const ecoPunti=Number(punti)>0 ? 1 : Number(punti)<0 ? -1 : 0;
      passaparola=postoRegistraConseguenzaMondo(
        introd,
        "street-hearsay-"+String(tipo||"consequence"),
        ecoPunti,
        {
          source:"strada",
          reason:"passaparola-"+String(tipo||"consequence"),
          relatedPersonId:p.id,
          relatedPersonName:p.n,
          context:"passaparola"
        }
      );
      if(ecoPunti) stradaModificaFiducia(introd,ecoPunti,"passaparola-"+String(tipo||"consequence"));
    }
  }

  if(diretto && diretto.relChanged && typeof pushLog==="function"){
    const nomeRel=typeof relNome==="function" ? relNome(p) : "un rapporto diverso";
    pushLog(
      "<b>Con "+p.n+" la cosa esce dalla Strada.</b> Anche il rapporto fra voi cambia: "+nomeRel+".",
      Number(punti)<0 ? "bad" : "good"
    );
  }

  return {direct:diretto,hearsay:passaparola};
}

function stradaModificaDebitoPersona(p,delta,reason){
  if(!p || p.via || !delta) return 0;
  const st=stradaPersonaMeta(p);
  const prima=Math.max(0,Number(st.debitiGiocatore||0));
  st.debitiGiocatore=Math.max(0,Math.min(3,prima+Math.trunc(Number(delta)||0)));
  const reale=st.debitiGiocatore-prima;
  if(reale) stradaRegistraConseguenzaPersona(p,reale>0?"debt-created":"debt-repaid",{
    delta:reale,reason:String(reason||"street-debt")
  });
  return reale;
}

function stradaModificaTensionePersona(p,delta,reason){
  if(!p || p.via || !delta) return {delta:0,rivalitaNata:false};
  const st=stradaPersonaMeta(p);
  const prima=Math.max(0,Number(st.tensione||0));
  st.tensione=Math.max(0,Math.min(3,prima+Math.trunc(Number(delta)||0)));
  const reale=st.tensione-prima;
  if(reale) stradaRegistraConseguenzaPersona(p,reale>0?"tension-up":"tension-down",{
    delta:reale,reason:String(reason||"street-tension")
  });
  let rivalitaNata=false;
  if(!st.rivalita && st.tensione>=2 && stradaFiduciaValore(p)<=20){
    st.rivalita=true;
    rivalitaNata=true;
    stradaRegistraConseguenzaPersona(p,"rivalry-start",{
      reason:String(reason||"street-rivalry")
    });
  }
  return {delta:reale,rivalitaNata};
}

function stradaRelazioneDisponibile(p){
  if(!p || p.via || !p.strada || !p.strada.known) return false;
  const st=stradaPersonaMeta(p);
  return (st.streetStatus==="active" || st.streetStatus==="cold") && !st.rivalita;
}

/* Punto 11: nessun grado criminale. Queste non sono "promozioni": sono
   capacità derivate da quello che il personaggio ha davvero costruito nel
   giro. Non vengono mostrate come livelli o titoli. */
const STRADA_CAPACITA_RETE = Object.freeze({
  chiamate:Object.freeze({rep:12,contatti:2}),
  scelta:Object.freeze({rep:25,contatti:3}),
  nome:Object.freeze({rep:40,contatti:4,fidati:1}),
  ponte:Object.freeze({rep:60,contatti:5,fidati:2})
});

function stradaContattiAttivi(){
  stradaAggiornaRelazioniCriminali(true);
  return (G.gente||[]).filter(stradaRelazioneDisponibile);
}

function stradaCapacitaRete(){
  const rep=stradaReputazioneGlobale();
  const attivi=stradaContattiAttivi();
  const fidati=attivi.filter(p=>stradaFiduciaValore(p)>=STRADA_FIDUCIA_SQUADRA);
  const ok=req=>rep>=Number(req.rep||0) &&
    attivi.length>=Number(req.contatti||0) &&
    fidati.length>=Number(req.fidati||0);
  return {
    rep,
    contatti:attivi.length,
    fidati:fidati.length,
    piuChiamate:ok(STRADA_CAPACITA_RETE.chiamate),
    sceltaOpportunita:ok(STRADA_CAPACITA_RETE.scelta),
    richiestaNome:ok(STRADA_CAPACITA_RETE.nome),
    creaPonte:ok(STRADA_CAPACITA_RETE.ponte)
  };
}

function stradaRelazioneTransizione(p,status,reason,oggi){
  if(!p) return null;
  const st=stradaPersonaMeta(p);
  oggi=Number.isFinite(Number(oggi))?Number(oggi):stradaAbsDay();
  if(st.streetStatus===status) return st;

  const from=st.streetStatus||"active";
  st.streetStatus=status;
  st.streetStatusReason=String(reason||"street");
  st.streetStatusHistory.push({from,to:status,absoluteDay:oggi,reason:st.streetStatusReason});
  if(st.streetStatusHistory.length>12) st.streetStatusHistory.shift();

  if(status==="inactive"){
    st.inactiveSinceAbsoluteDay=oggi;
  }else if(status==="unreachable"){
    st.unreachableSinceAbsoluteDay=oggi;
    st.returnAfterAbsoluteDay=stradaRelazioneForte(p)
      ? oggi+STRADA_RELAZIONI.coldReturnAfterDays
      : null;
  }else if(status==="cold"){
    st.inactiveSinceAbsoluteDay=null;
    st.unreachableSinceAbsoluteDay=null;
    st.returnAfterAbsoluteDay=null;
    st.ignoredStreetOffers=0;
    st.fiducia=clamp(Number(st.fiducia||0)-STRADA_RELAZIONI.coldTrustLoss,5,100);
  }else if(status==="active"){
    st.inactiveSinceAbsoluteDay=null;
    st.unreachableSinceAbsoluteDay=null;
    st.returnAfterAbsoluteDay=null;
  }
  return st;
}

function stradaRegistraInterazione(p,reason){
  if(!p || p.via) return null;
  const st=stradaPersonaMeta(p);
  const oggi=stradaAbsDay();
  st.lastPlayerStreetInteractionAbsoluteDay=oggi;
  st.ignoredStreetOffers=0;
  if(st.streetStatus!=="active")
    stradaRelazioneTransizione(p,"active",reason||"player-interaction",oggi);
  return st;
}

function stradaRegistraTentativoContatto(p,reason){
  if(!p || p.via) return null;
  const st=stradaPersonaMeta(p);
  st.lastStreetContactAttemptAbsoluteDay=stradaAbsDay();
  if(reason) st.lastStreetContactReason=String(reason);
  return st;
}

function stradaIgnoraContatto(p,reason){
  if(!p || p.via) return null;
  const st=stradaPersonaMeta(p);
  const oggi=stradaAbsDay();
  st.lastStreetContactAttemptAbsoluteDay=oggi;
  st.ignoredStreetOffers=Math.max(0,Number(st.ignoredStreetOffers||0))+1;
  if(st.ignoredStreetOffers>=STRADA_RELAZIONI.ignoredLimit)
    stradaRelazioneTransizione(p,"inactive",reason||"ignored-three-times",oggi);
  return st;
}

function stradaAggiornaRelazioniCriminali(silent){
  const oggi=stradaAbsDay();
  const cambi=[];
  for(const p of (G.gente||[])){
    if(!p || p.via || !p.strada || !p.strada.known) continue;
    const st=stradaPersonaMeta(p);
    const last=Number(st.lastPlayerStreetInteractionAbsoluteDay);
    const giorni=Number.isFinite(last)?Math.max(0,oggi-last):0;

    if((st.streetStatus==="active" || st.streetStatus==="cold") &&
       st.ignoredStreetOffers>=STRADA_RELAZIONI.ignoredLimit){
      stradaRelazioneTransizione(p,"inactive","ignored-three-times",oggi);
      cambi.push({p,status:"inactive"});
    }else if((st.streetStatus==="active" || st.streetStatus==="cold") &&
             giorni>=STRADA_RELAZIONI.inactiveAfterDays){
      stradaRelazioneTransizione(p,"inactive","long-silence",oggi);
      cambi.push({p,status:"inactive"});
    }

    if(st.streetStatus==="inactive" && giorni>=STRADA_RELAZIONI.unreachableAfterDays){
      stradaRelazioneTransizione(p,"unreachable","six-months-away",oggi);
      cambi.push({p,status:"unreachable"});
    }else if(st.streetStatus==="unreachable" &&
             st.returnAfterAbsoluteDay!=null &&
             Number.isFinite(Number(st.returnAfterAbsoluteDay)) &&
             oggi>=Number(st.returnAfterAbsoluteDay)){
      stradaRelazioneTransizione(p,"cold","old-history-resurfaces",oggi);
      st.lastPlayerStreetInteractionAbsoluteDay=oggi;
      cambi.push({p,status:"cold"});
    }
  }

  if(!silent && typeof pushLog==="function"){
    for(const c of cambi){
      if(c.status==="inactive")
        pushLog("<b>"+c.p.n+" si è raffreddato.</b> È da troppo che non vi incrociate davvero nel giro.", "");
      else if(c.status==="unreachable")
        pushLog("<b>"+c.p.n+" non è più raggiungibile nel giro.</b> La persona resta nel tuo mondo, ma quella porta si è chiusa.", "bad");
      else if(c.status==="cold")
        pushLog("<b>"+c.p.n+" è ricomparso.</b> La storia comune pesa ancora, ma il rapporto è molto più freddo.", "");
    }
  }
  stradaHeatSincronizzaPersone();
  return cambi;
}

/* Punto 12: "quanto gira il tuo nome" e "cosa pensa questa persona di te"
   sono due assi diversi. rep resta il valore globale compatibile con i vecchi
   salvataggi; la fiducia continua a vivere esclusivamente sulla persona. */
function stradaReputazioneStato(){
  const s=G.strada||(G.strada={});
  if(!s.repStato || typeof s.repStato!=="object") s.repStato={history:[]};
  if(!Array.isArray(s.repStato.history)) s.repStato.history=[];
  return s.repStato;
}

function stradaReputazioneGlobale(){
  return clamp(Number(G.strada&&G.strada.rep||0),0,100);
}

function stradaModificaReputazione(delta,motivo,meta){
  const s=G.strada||(G.strada={});
  const prima=stradaReputazioneGlobale();
  const dopo=clamp(prima+Number(delta||0),0,100);
  s.rep=dopo;
  const reale=dopo-prima;
  if(reale){
    const st=stradaReputazioneStato();
    st.history.push({
      absoluteDay:stradaAbsDay(),
      delta:reale,
      reason:String(motivo||"street-global-reputation"),
      meta:meta&&typeof meta==="object"?Object.assign({},meta):null
    });
    if(st.history.length>30) st.history.shift();
  }
  return dopo;
}

function stradaFiduciaValore(p){
  const st=stradaPersonaMeta(p);
  return st?Number(st.fiducia||0):0;
}

function stradaFiduciaEtichetta(p){
  const v=stradaFiduciaValore(p);
  if(v>=75) return "si gioca la faccia";
  if(v>=50) return "fidato";
  if(v>=STRADA_FIDUCIA_SQUADRA) return "si fida";
  if(v>=10) return "ti conosce";
  return "appena entrati in contatto";
}

function stradaModificaFiducia(p,delta,motivo){
  if(!p || p.via || !delta) return p;
  const st=stradaPersonaMeta(p);
  stradaRegistraInterazione(p,motivo||"fiducia");
  st.fiducia=clamp(Number(st.fiducia||0)+Number(delta||0),0,100);
  st.fiduciaEventi.push({absoluteDay:stradaAbsDay(),delta:Number(delta||0),reason:String(motivo||"street")});
  if(st.fiduciaEventi.length>12) st.fiduciaEventi.shift();
  return p;
}

/* I favori non sono comprabili. Nascono quando fai qualcosa con successo per
   una persona concreta e si consumano quando le chiedi una mano in fase di
   preparazione. Cap a 3: evita di trasformarli in una seconda moneta da farmare. */
function stradaFavoriValore(p){
  const st=stradaPersonaMeta(p);
  return st?Math.max(0,Math.floor(Number(st.favori)||0)):0;
}

function stradaAggiungiFavore(p,delta,motivo){
  if(!p || p.via || !delta) return 0;
  const st=stradaPersonaMeta(p);
  const prima=stradaFavoriValore(p);
  st.favori=Math.max(0,Math.min(3,prima+Math.trunc(Number(delta)||0)));
  const reale=st.favori-prima;
  if(reale){
    st.favoriEventi.push({
      absoluteDay:stradaAbsDay(),
      delta:reale,
      reason:String(motivo||"street-favor")
    });
    if(st.favoriEventi.length>12) st.favoriEventi.shift();
  }
  return reale;
}

function stradaConsumaFavore(p,motivo){
  if(stradaFavoriValore(p)<1) return false;
  return stradaAggiungiFavore(p,-1,motivo)<0;
}

function stradaPersoneConFavore(){
  stradaAggiornaRelazioniCriminali(true);
  return (G.gente||[])
    .filter(p=>stradaRelazioneDisponibile(p) && stradaFavoriValore(p)>0)
    .sort((a,b)=>stradaFavoriValore(b)-stradaFavoriValore(a) ||
      stradaFiduciaValore(b)-stradaFiduciaValore(a));
}

function stradaPersoneSquadra(){
  stradaAggiornaRelazioniCriminali(true);
  return (G.gente||[])
    .filter(p=>stradaRelazioneOperativa(p) &&
      stradaFiduciaValore(p)>=STRADA_FIDUCIA_SQUADRA)
    .sort((a,b)=>stradaFiduciaValore(b)-stradaFiduciaValore(a) || Number(b.rel||0)-Number(a.rel||0));
}

function stradaPersonaSquadra(id){
  if(!id) return null;
  const p=(G.gente||[]).find(x=>x&&x.id===id&&!x.via) || null;
  if(!stradaRelazioneDisponibile(p)) return null;
  return stradaFiduciaValore(p)>=STRADA_FIDUCIA_SQUADRA ? p : null;
}

function stradaBonusFiduciaSquadra(p){
  if(!p) return 0;
  return clamp(stradaFiduciaValore(p)/100*.10,.03,.10);
}

const STRADA_PROTEZIONE_REQ = Object.freeze([
  Object.freeze({rep:0,fiducia:0}),
  Object.freeze({rep:8,fiducia:25}),
  Object.freeze({rep:25,fiducia:50}),
  Object.freeze({rep:45,fiducia:75})
]);
const STRADA_AVVOCATO_REL_MIN = 2;

function stradaWeekKey(){
  return String(Number(G.year||1))+"-"+String(Number(G.week||1));
}

function stradaProtezioneStato(){
  const s=G.strada||(G.strada={});
  if(!s.protezioneStato || typeof s.protezioneStato!=="object"){
    s.protezioneStato={
      providerPersonId:null,providerName:null,level:Number(s.prot||0),
      source:Number(s.prot||0)>0?"legacy":null,prepaidWeekKey:null,history:[]
    };
  }
  const st=s.protezioneStato;
  if(!Array.isArray(st.history)) st.history=[];
  if(Number(s.prot||0)>0 && !st.source){
    st.level=Number(s.prot||0);
    st.source="legacy";
  }
  st.level=Number(s.prot||0);
  return st;
}

function stradaProtezioneProvider(livello){
  const req=STRADA_PROTEZIONE_REQ[livello];
  if(!req || livello<=0 || stradaReputazioneGlobale()<req.rep) return null;
  stradaAggiornaRelazioniCriminali(true);
  return (G.gente||[])
    .filter(p=>stradaRelazioneDisponibile(p) &&
      stradaFiduciaValore(p)>=req.fiducia)
    .sort((a,b)=>stradaFiduciaValore(b)-stradaFiduciaValore(a) ||
      Number((b.strada&&b.strada.colpiInsieme)||0)-Number((a.strada&&a.strada.colpiInsieme)||0))[0] || null;
}

function stradaProtezioneDisponibile(livello,personId){
  const req=STRADA_PROTEZIONE_REQ[livello];
  if(!req || livello<=0) return null;
  if(stradaReputazioneGlobale()<req.rep) return null;
  const p=personId ? stradaPersonaDaId(personId) : stradaProtezioneProvider(livello);
  if(!stradaRelazioneDisponibile(p) || stradaFiduciaValore(p)<req.fiducia) return null;
  return p;
}

function stradaAvvocatoStato(){
  const s=G.strada||(G.strada={});
  if(!s.avvocatoStato || typeof s.avvocatoStato!=="object"){
    s.avvocatoStato={
      personId:null,name:null,retained:!!s.avvocato,
      source:s.avvocato?"legacy":null,prepaidWeekKey:null,history:[]
    };
  }
  const st=s.avvocatoStato;
  if(!Array.isArray(st.history)) st.history=[];
  if(s.avvocato && !st.retained){
    st.retained=true;
    st.source=st.source||"legacy";
  }
  s.avvocato=!!st.retained;
  return st;
}

function stradaHaAvvocatoPrivato(){
  return stradaAvvocatoStato().retained===true;
}

function stradaAvvocatiConosciuti(){
  return (G.gente||[])
    .filter(p=>p && !p.via && p.ruolo==="avvocato" &&
      Number(p.rel||0)>=STRADA_AVVOCATO_REL_MIN)
    .sort((a,b)=>Number(b.rel||0)-Number(a.rel||0) || Number(b.pt||0)-Number(a.pt||0));
}

function stImpostaProtezione(livello,personId){
  const s=G.strada,st=stradaProtezioneStato();
  livello=clamp(Number(livello)||0,0,STRADA_PROT.length-1);
  if(livello===0){
    if(st.providerPersonId){
      const old=stradaPersonaDaId(st.providerPersonId);
      if(old) stradaModificaFiducia(old,-1,"protezione-chiusa");
    }
    st.history.push({status:"closed",level:Number(s.prot||0),providerPersonId:st.providerPersonId||null,
      providerName:st.providerName||null,absoluteDay:stradaAbsDay()});
    if(st.history.length>12)st.history.shift();
    s.prot=0;st.level=0;st.providerPersonId=null;st.providerName=null;st.source=null;st.prepaidWeekKey=null;
    save();renderStrada();renderGioco();
    return "Hai chiuso l'accordo di protezione.";
  }

  const p=stradaProtezioneDisponibile(livello,personId);
  const req=STRADA_PROTEZIONE_REQ[livello];
  if(!p){
    if(Number(s.rep||0)<req.rep) return "Il tuo nome non gira ancora abbastanza per questo tipo di copertura.";
    return "Non hai una persona che si fidi abbastanza da garantirti questa copertura.";
  }
  const costo=Number(STRADA_PROT[livello].costo||0);
  if(Number(G.money||0)<costo) return "Ti servono "+fmt(costo)+" € per coprire la prima settimana dell'accordo.";

  G.money-=costo;
  s.prot=livello;
  st.level=livello;
  st.providerPersonId=p.id;
  st.providerName=p.n;
  st.source="trusted-contact";
  st.prepaidWeekKey=stradaWeekKey();
  st.history.push({status:"started",level:livello,providerPersonId:p.id,providerName:p.n,
    absoluteDay:stradaAbsDay(),cost:costo});
  if(st.history.length>12)st.history.shift();
  stradaModificaFiducia(p,1,"protezione-accordo");
  save();renderStrada();renderGioco();
  return p.n+" ti copre con «"+STRADA_PROT[livello].n+"». Prima settimana pagata: "+fmt(costo)+" €.";
}

function stScenaProtezione(){
  if(!stradaPartecipazioneAttiva())return {k:"Protezione",titolo:"Hai mollato il giro",testo:"Non stai più pagando qualcuno per coprirti nel giro.",opts:[{n:"Chiudi",run(){STRADA_SCENA=null;}}]};
  const s=G.strada,st=stradaProtezioneStato();
  const opts=[];
  if(Number(s.prot||0)>0){
    opts.push({n:"Chiudi l'accordo",d:(st.providerName?"Con "+st.providerName+" · ":"")+"rinunci alla copertura",hot:true,
      run(){const t=stImpostaProtezione(0);STRADA_SCENA=null;stToast(t);}});
  }
  for(let livello=1;livello<STRADA_PROT.length;livello++){
    const p=stradaProtezioneProvider(livello),req=STRADA_PROTEZIONE_REQ[livello],cfg=STRADA_PROT[livello];
    opts.push({
      n:cfg.n,
      d:p ? p.n+" · "+fmt(cfg.costo)+" €/sett." :
        "Serve rep "+req.rep+" e una persona con fiducia "+req.fiducia,
      no:!p || Number(G.money||0)<Number(cfg.costo||0),
      run(){
        const t=stImpostaProtezione(livello,p&&p.id);
        STRADA_SCENA=null;stToast(t);
      }
    });
  }
  opts.push({n:"Torna indietro",d:"Non cambi niente",run(){STRADA_SCENA=null;}});
  return {k:"Chi ti copre",titolo:"Protezione",testo:"La copertura non è un interruttore: qualcuno deve mettere il proprio nome e la propria rete dietro di te. Il primo costo si paga subito.",opts};
}

function stIncaricaAvvocato(personId){
  const s=G.strada,st=stradaAvvocatoStato();
  if(st.retained) return "Hai già un avvocato privato.";
  const p=(G.gente||[]).find(x=>x&&x.id===personId&&!x.via&&x.ruolo==="avvocato")||null;
  if(!p || Number(p.rel||0)<STRADA_AVVOCATO_REL_MIN)
    return "Con questo avvocato non hai ancora un rapporto abbastanza solido.";
  if(Number(G.money||0)<STRADA_AVVOCATO_COSTO)
    return "Ti servono "+fmt(STRADA_AVVOCATO_COSTO)+" € per la prima settimana.";

  G.money-=STRADA_AVVOCATO_COSTO;
  s.avvocato=true;
  st.personId=p.id;st.name=p.n;st.retained=true;st.source="relationship";st.prepaidWeekKey=stradaWeekKey();
  st.history.push({status:"retained",personId:p.id,name:p.n,absoluteDay:stradaAbsDay(),cost:STRADA_AVVOCATO_COSTO});
  if(st.history.length>12)st.history.shift();
  p.numero=true;
  p.circoloSbloccato=true;
  save();renderStrada();renderGioco();
  return p.n+" è diventato il tuo avvocato. Prima settimana pagata: "+fmt(STRADA_AVVOCATO_COSTO)+" €.";
}

function stRevocaAvvocato(){
  const s=G.strada,st=stradaAvvocatoStato();
  if(!st.retained) return "Non hai un avvocato privato da revocare.";
  st.history.push({status:"revoked",personId:st.personId||null,name:st.name||null,absoluteDay:stradaAbsDay()});
  if(st.history.length>12)st.history.shift();
  s.avvocato=false;st.retained=false;st.prepaidWeekKey=null;
  save();renderStrada();renderGioco();
  return "Hai chiuso l'incarico con "+(st.name||"il tuo avvocato")+".";
}

function stScenaAvvocato(){
  const st=stradaAvvocatoStato();
  if(st.retained){
    return {k:"Legale",titolo:st.name||"Avvocato privato",
      testo:"È il tuo legale di fiducia. Il rapporto esiste perché lo hai conosciuto e incaricato, non perché hai acceso un bonus.",
      opts:[
        {n:"Mantieni l'incarico",d:fmt(STRADA_AVVOCATO_COSTO)+" €/sett.",run(){STRADA_SCENA=null;}},
        {n:"Chiudi l'incarico",d:"Resterai con la difesa d'ufficio in caso di arresto",hot:true,
          run(){const t=stRevocaAvvocato();STRADA_SCENA=null;stToast(t);}}
      ]};
  }
  const candidati=stradaAvvocatiConosciuti();
  return {k:"Legale",titolo:"Avvocato",
    testo:candidati.length
      ? "Conosci qualcuno abbastanza bene da potergli affidare stabilmente i tuoi problemi legali."
      : "Se finisci dentro hai comunque un difensore d'ufficio. Per avere un legale tuo devi prima conoscere davvero un avvocato nel mondo.",
    opts:[
      ...candidati.map(p=>({n:"Incarica "+p.n,d:"Rapporto "+Number(p.rel||0)+" · "+fmt(STRADA_AVVOCATO_COSTO)+" €/sett.",
        no:Number(G.money||0)<STRADA_AVVOCATO_COSTO,
        run(){const t=stIncaricaAvvocato(p.id);STRADA_SCENA=null;stToast(t);}})),
      {n:"Torna indietro",d:"Non cambi niente",run(){STRADA_SCENA=null;}}
    ]};
}

function stradaFerroStato(){
  const s=G.strada||(G.strada={});
  if(!s.ferroStato || typeof s.ferroStato!=="object"){
    s.ferroStato={
      sourcePersonId:null,sourceName:null,acquiredAbsoluteDay:null,source:null,
      lastCheckAbsoluteDay:null,nextOfferAbsoluteDay:null,pending:null,history:[]
    };
  }
  const st=s.ferroStato;
  if(!Array.isArray(st.history)) st.history=[];
  /* Legacy: prima del punto 5 il ferro non aveva provenienza. Non lo togliamo
     a chi lo possiede già: lo marchiamo come legacy e basta. */
  if(s.ferro && !st.source){
    st.source="legacy";
    st.acquiredAbsoluteDay=st.acquiredAbsoluteDay||stradaAbsDay();
  }
  return st;
}

function stradaPersonaFerro(){
  stradaAggiornaRelazioniCriminali(true);
  return (G.gente||[])
    .filter(p=>stradaRelazioneDisponibile(p) &&
      stradaFiduciaValore(p)>=STRADA_FERRO_FIDUCIA_MIN)
    .sort((a,b)=>
      stradaFiduciaValore(b)-stradaFiduciaValore(a) ||
      Number((b.strada&&b.strada.colpiInsieme)||0)-Number((a.strada&&a.strada.colpiInsieme)||0)
    )[0] || null;
}

function stradaTentaPropostaFerro(roll){
  const s=G.strada||{}, st=stradaFerroStato();
  if(!stradaGiroAvviato() || s.arresto || s.ferro || st.pending) return null;
  if(stradaReputazioneGlobale()<STRADA_FERRO_REP_MIN) return null;
  if(typeof stradaHaTrapPhone==="function" && !stradaHaTrapPhone()) return null;

  const persona=stradaPersonaFerro();
  if(!persona) return null;

  const oggi=stradaAbsDay();
  if(Number(st.lastCheckAbsoluteDay)===oggi) return null;
  if(st.nextOfferAbsoluteDay!=null && oggi<Number(st.nextOfferAbsoluteDay)) return null;
  st.lastCheckAbsoluteDay=oggi;

  const r=roll==null?Math.random():Number(roll);
  if(!Number.isFinite(r) || r>=.08) return null;

  st.pending={
    personId:persona.id,
    persona:persona.n,
    costo:STRADA_FERRO_COSTO,
    createdAbsoluteDay:oggi
  };
  return Object.assign({},st.pending);
}

function stradaAnnullaPropostaFerro(){
  const st=stradaFerroStato();
  st.pending=null;
  return true;
}

function stradaRifiutaFerro(){
  const st=stradaFerroStato();
  if(!st.pending) return null;
  st.history.push(Object.assign({},st.pending,{status:"declined",closedAbsoluteDay:stradaAbsDay()}));
  if(st.history.length>12) st.history.shift();
  st.pending=null;
  st.nextOfferAbsoluteDay=stradaAbsDay()+14;
  if(typeof save==="function") save();
  return true;
}

function stradaAccettaFerro(){
  const s=G.strada, st=stradaFerroStato(), p=st.pending;
  if(!p) return {ok:false,reason:"Non c'è nessuna proposta aperta."};
  if(G.money<Number(p.costo||STRADA_FERRO_COSTO))
    return {ok:false,reason:"Ti servono "+fmt(p.costo||STRADA_FERRO_COSTO)+" € per chiudere il favore."};

  G.money-=Number(p.costo||STRADA_FERRO_COSTO);
  s.ferro=true;
  st.sourcePersonId=p.personId||null;
  st.sourceName=p.persona||null;
  st.acquiredAbsoluteDay=stradaAbsDay();
  st.source="trusted-contact";
  st.history.push(Object.assign({},p,{status:"acquired",closedAbsoluteDay:stradaAbsDay()}));
  if(st.history.length>12) st.history.shift();
  st.pending=null;
  st.nextOfferAbsoluteDay=null;

  const persona=stradaPersonaDaId(st.sourcePersonId);
  if(persona) stradaModificaFiducia(persona,4,"ferro-procurato");

  pushLog("<b>"+(st.sourceName||"Un contatto")+" ti ha procurato il ferro.</b> Da questo momento averlo addosso o in casa cambia davvero il rischio.", "bad");
  if(typeof save==="function") save();
  if(typeof renderStrada==="function") renderStrada();
  if(typeof renderGioco==="function") renderGioco();
  return {ok:true,persona:st.sourceName,costo:Number(p.costo||STRADA_FERRO_COSTO)};
}

function stradaSegnaPersona(p,meta){
  if(!p || p.via) return null;
  meta=meta||{};
  const st=stradaPersonaMeta(p);
  const eraConosciuto=!!st.known;
  st.known=true;
  if(!eraConosciuto){
    if(stradaFiduciaValore(p)<5) st.fiducia=5;
    st.streetStatus="active";
    st.lastPlayerStreetInteractionAbsoluteDay=stradaAbsDay();
    st.ignoredStreetOffers=0;
  }
  if(!st.key && meta.key) st.key=String(meta.key);
  if(st.firstLinkedAbsoluteDay==null) st.firstLinkedAbsoluteDay=stradaAbsDay();
  if(meta.source && !st.sources.includes(meta.source)) st.sources.push(meta.source);
  if(meta.opportunityId && !st.opportunityIds.includes(meta.opportunityId))
    st.opportunityIds.push(meta.opportunityId);
  if(st.introducedByPersonId==null && meta.introducedByPersonId)
    st.introducedByPersonId=meta.introducedByPersonId;

  /* Una persona conosciuta sul lavoro continua a essere collega/rider/cliente:
     non le cambiamo ruolo. Da quando scopri il suo lato Strada può però
     ricomparire anche al Circolo, come la stessa identica persona. */
  p.circoloSbloccato=true;
  p.visto=true;
  if(!p.storia && meta.story) p.storia=meta.story;
  return p;
}

function stradaContattoKey(nome){
  return "street:"+String(nome||"contatto")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
}

function stradaPersonaDaId(id){
  return id ? (G.gente||[]).find(p=>p&&p.id===id&&!p.via) || null : null;
}

function stradaContattiLuogo(luogo){
  return (G.gente||[]).filter(p=>
    p && !p.via && p.origineLuogo===luogo
  );
}

/* Punto 14: la Fabbrica è una storyline parallela, non un distributore di
   crimini. Prima devi averci lavorato davvero e aver conosciuto una persona
   reale. Solo dopo quella stessa persona può rivelare il lato Strada. */
const STRADA_FABBRICA_STORY_MIN_TURNI = 10;

function stradaFabbricaTurniLavorati(){
  try{
    if(typeof lavoroTurniTotaliSede==="function")
      return Math.max(0,Number(lavoroTurniTotaliSede("fabbrica")||0));
  }catch(_){}
  /* Fallback per runtime/test vecchi: usa soltanto prove persistite esistenti. */
  let totale=0;
  try{
    if(typeof lavoroCartellino==="function"){
      const c=lavoroCartellino("fabbrica");
      if(c && Number.isFinite(Number(c.totale))) totale=Math.max(totale,Number(c.totale));
    }
  }catch(_){}
  try{
    if(typeof lavoroReteStato==="function"){
      const r=lavoroReteStato("fabbrica");
      if(r && Number.isFinite(Number(r.turniVisti))) totale=Math.max(totale,Number(r.turniVisti));
    }
  }catch(_){}
  return totale;
}

function stradaFabbricaPersonaConosciuta(p){
  if(!p || p.via || p.origineLuogo!=="fabbrica") return false;
  if(p.workEncountered || p.numero || Number(p.rel)>0 || Number(p.pt)>0) return true;
  try{
    if(typeof lavoroReteStato==="function"){
      const r=lavoroReteStato("fabbrica");
      return !!(r && Array.isArray(r.history) && r.history.some(x=>x&&x.personId===p.id));
    }
  }catch(_){}
  return false;
}

function stradaFabbricaPersonaMatura(p){
  return stradaFabbricaTurniLavorati()>=STRADA_FABBRICA_STORY_MIN_TURNI &&
    stradaFabbricaPersonaConosciuta(p);
}

function stradaFabbricaPersonaCandidata(){
  const s=G.strada||{};
  if(s.ingressoPersonaId){
    const stessa=stradaPersonaDaId(s.ingressoPersonaId);
    if(stessa && stessa.origineLuogo==="fabbrica" && stradaFabbricaPersonaMatura(stessa))
      return stessa;
  }

  return stradaContattiLuogo("fabbrica")
    .filter(p=>stradaFabbricaPersonaMatura(p))
    .filter(p=>!p.strada || !p.strada.known || stradaRelazioneDisponibile(p))
    .sort((a,b)=>{
      const ak=a.strada&&a.strada.known?1:0;
      const bk=b.strada&&b.strada.known?1:0;
      return (bk-ak) ||
        Number(b.rel||0)-Number(a.rel||0) ||
        Number(b.pt||0)-Number(a.pt||0);
    })[0] || null;
}

function stradaCreaContatto(nome,key,meta){
  if(!G.gente) G.gente=[];
  meta=meta||{};

  /* Se un nome già appartiene a una persona persistente, quello non diventa
     un omonimo nuovo: scopri semplicemente un lato che prima non conoscevi.
     È intenzionale e collega davvero Circolo/lavoro/Strada. */
  let p=(G.gente||[]).find(x=>x && !x.via && x.strada && x.strada.key===key) || null;
  if(!p && nome)
    p=(G.gente||[]).find(x=>x && !x.via && x.n===nome) || null;

  if(!p){
    if(typeof nuovaPersona!=="function") return null;
    p=nuovaPersona("strada");
    p.n=String(nome||p.n||"Contatto");
    p.origine="strada";
    p.origineDettaglio="conoscenza della Strada";
    p.storia=meta.story||"L'hai conosciuto attraverso il giro della Strada.";
    p.circoloSbloccato=true;
    p.numero=false; /* il TrapPhone non equivale al numero personale */
    p.numDa=null;
    G.gente.push(p);
  }else if(meta.story &&
           (!p.storia || p.storia==="L'hai conosciuto attraverso il giro della Strada.")){
    p.storia=meta.story;
  }

  return stradaSegnaPersona(p,{
    key,
    source:meta.source||"street",
    opportunityId:meta.opportunityId||null,
    introducedByPersonId:meta.introducedByPersonId||null,
    story:meta.story||null
  });
}

/* Punto 16: prima di creare una proposta dal "mondo" costruiamo il perché.
   Il tiro resta interno, ma il risultato arriva sempre attraverso una faccia
   già vista, un contatto che fa il tuo nome o, nei vecchi salvataggi privi di
   relazioni ricostruibili, il passaparola generato dalla reputazione. */
function stradaCausaOpportunita(variante,trigger){
  if(!variante || trigger==="fabbrica") return null;
  const key=variante.contactKey||stradaContattoKey(variante.persona);
  const esistente=(G.gente||[]).find(x=>x && !x.via &&
    ((x.strada&&x.strada.key===key) || (variante.persona&&x.n===variante.persona))) || null;

  if(esistente){
    if(esistente.strada&&esistente.strada.known){
      const circolo=Number(esistente.circoloPresenze||0)>0 || esistente.origine==="circolo";
      return {
        type:circolo?"recontact-circolo":"recontact",
        person:esistente,
        introducedBy:null,
        text:circolo
          ?"Hai già incrociato <b>"+esistente.n+"</b> al Circolo. Stavolta è lui a farsi vivo."
          :"<b>"+esistente.n+"</b> fa già parte dei contatti che hai costruito nel giro. Non arriva dal nulla.",
        label:circolo?"Ricontatto dal Circolo":"Ricontatto"
      };
    }

    const giaNelMondo=Number(esistente.circoloPresenze||0)>0 || esistente.visto ||
      esistente.numero || Number(esistente.rel||0)>0 || Number(esistente.pt||0)>0;
    if(giaNelMondo){
      let dove="nel giro";
      if(Number(esistente.circoloPresenze||0)>0 || esistente.origine==="circolo") dove="al Circolo";
      else if(esistente.origineLuogo==="pizzeria") dove="in Pizzeria";
      else if(esistente.origineLuogo) dove="al lavoro";
      return {
        type:"known-face",
        person:esistente,
        introducedBy:null,
        text:"Hai già conosciuto <b>"+esistente.n+"</b> "+dove+". Stavolta il discorso prende un'altra piega.",
        label:"Faccia già conosciuta"
      };
    }
  }

  let candidati=stradaContattiAttivi().filter(p=>
    p && !p.via && (!esistente || p.id!==esistente.id) &&
    (!variante.persona || p.n!==variante.persona)
  ).sort((a,b)=>
    stradaFiduciaValore(b)-stradaFiduciaValore(a) ||
    stradaFavoriValore(b)-stradaFavoriValore(a) ||
    Number(b.rel||0)-Number(a.rel||0)
  );

  if(!candidati.length && G.strada&&G.strada.ingressoPersonaId){
    const ingresso=stradaPersonaDaId(G.strada.ingressoPersonaId);
    if(ingresso && (!esistente || ingresso.id!==esistente.id)) candidati=[ingresso];
  }

  let introducer=null;
  if(candidati.length){
    const seed=String(variante.id||variante.persona||"rete")+":"+String(stradaAbsDay());
    let n=0;
    for(let i=0;i<seed.length;i++) n=(n+seed.charCodeAt(i)*(i+1))>>>0;
    introducer=candidati[n%Math.min(3,candidati.length)]||candidati[0];
  }

  if(introducer){
    return {
      type:"referral",
      person:esistente,
      introducedBy:introducer,
      text:"<b>"+introducer.n+"</b> ha fatto il tuo nome a <b>"+(variante.persona||"un suo contatto")+"</b>. È così che ti arriva la proposta.",
      label:"Passaparola di "+introducer.n
    };
  }

  return {
    type:"reputation",
    person:esistente,
    introducedBy:null,
    text:"Il tuo nome ha iniziato a girare nel sottobosco. <b>"+(variante.persona||"Un contatto")+"</b> arriva a te per passaparola.",
    label:"Passaparola"
  };
}

function stradaRisolviContattoOpportunita(variante,trigger,legacy){
  if(!variante) return null;

  /* Una dritta nata fuori dalla Fabbrica può introdurre una nuova persona.
     Da quel momento quella persona è persistente e il suo id accompagna
     l'offerta, lo storico e ogni ricomparsa futura. */
  if(trigger!=="fabbrica" || legacy===true){
    const key=variante.contactKey||stradaContattoKey(variante.persona);
    const causa=legacy===true
      ? {
          type:"legacy",
          person:null,
          introducedBy:null,
          text:"Questo contatto era già attivo prima che il gioco iniziasse a tracciare il passaparola fra le persone.",
          label:"Contatto già attivo"
        }
      : stradaCausaOpportunita(variante,trigger);
    const esistente=causa&&causa.person ? causa.person : (G.gente||[]).find(x=>x && !x.via &&
      ((x.strada&&x.strada.key===key) || (variante.persona&&x.n===variante.persona))) || null;
    if(esistente && esistente.strada && esistente.strada.known){
      stradaHeatSincronizzaPersone();
      if(!stradaRelazioneOperativa(esistente)) return null;
    }

    variante.networkCause=causa?causa.type:null;
    variante.networkCauseText=causa?causa.text:null;
    variante.networkSourceLabel=causa?causa.label:null;
    variante.introducedByPersonId=causa&&causa.introducedBy?causa.introducedBy.id:null;
    variante.introducedByName=causa&&causa.introducedBy?causa.introducedBy.n:null;

    const storia=causa&&causa.introducedBy
      ?"Te l'ha presentato "+causa.introducedBy.n+": ha fatto il tuo nome nel giro."
      : null;
    const p=stradaCreaContatto(variante.persona,key,{
      source:legacy===true?"legacy-opportunity":"opportunity",
      opportunityId:variante.id,
      introducedByPersonId:variante.introducedByPersonId,
      story:storia
    });
    if(p && causa&&causa.introducedBy && typeof postoCollegaPersone==="function")
      postoCollegaPersone(causa.introducedBy,p,"strada-introduzione");
    stradaHeatSincronizzaPersone();
    return p && stradaRelazioneOperativa(p) ? p : null;
  }

  /* La Fabbrica non inventa una faccia del giro fuori dal nulla. Serve un
     collega già incontrato e abbastanza vita condivisa in stabilimento. */
  const p=stradaFabbricaPersonaCandidata();
  if(!p) return null;
  stradaHeatSincronizzaPersone();
  if(stradaHeatPersonaCauta(p)) return null;
  variante.factoryStory=true;
  variante.factoryPersonId=p.id;
  variante.factoryWasKnown=!!(p.strada&&p.strada.known);
  return stradaSegnaPersona(p,{
    source:"factory-opportunity",
    opportunityId:variante.id
  });
}

function stradaCollegaLeadPersona(lead,trigger,legacy){
  if(!lead || lead.personId) return lead||null;
  const p=stradaRisolviContattoOpportunita(lead,trigger||lead.trigger,legacy===true);
  if(!p) return null;
  lead.personId=p.id;
  lead.persona=p.n;
  lead.contactKey=(p.strada&&p.strada.key)||lead.contactKey||stradaContattoKey(p.n);
  return lead;
}

function stradaPersonaIngressoValida(p){
  if(!p || p.via || !p.id || !p.n || p.ruolo==="giornalista") return false;
  /* La Fabbrica ha il proprio percorso contestuale post-turno (punto 14):
     un collega di stabilimento non può materializzare una proposta criminale
     durante un'azione generica fuori dal lavoro. */
  if(p.origineLuogo==="fabbrica") return false;
  /* Gli altri contatti del lavoro restano percorsi validi nel mondo. */
  if(p.origineLuogo==="pizzeria" || p.origine==="lavoro")
    return true;
  return !!p.visto || !!p.numero || Number(p.rel)>0 || Number(p.pt)>0;
}

function stradaPersonaIngresso(variantRoll,context){
  const s=stradaIngressoStato();
  if(s.ingressoPersonaId){
    const stessa=(G.gente||[]).find(p=>p && p.id===s.ingressoPersonaId && !p.via);
    if(stessa){
      if(stessa.origineLuogo==="fabbrica" && context!=="fabbrica") return null;
      return stessa;
    }
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

function stradaCreaPropostaIngresso(persona,roll,sourceContext){
  const s=stradaIngressoStato();
  if(s.badgeSbloccato || s.arresto || !persona) return null;

  const oggi=stradaAbsDay();

  /* Una proposta Fabbrica già avviata torna soltanto nel suo contesto:
     non segue il giocatore magicamente in palestra, Studio o Circolo. */
  if(s.ingressoPending && typeof s.ingressoPending==="object"){
    if(s.ingressoPending.sourceContext==="fabbrica" && sourceContext!=="fabbrica")
      return null;
    if(Number(s.ingressoLastShownAbsoluteDay)===oggi) return null;
    s.ingressoLastShownAbsoluteDay=oggi;
    return Object.assign({},s.ingressoPending);
  }
  if(s.ingressoNextOfferAbsoluteDay!=null &&
     oggi<Number(s.ingressoNextOfferAbsoluteDay)) return null;
  if(Number(s.ingressoLastCheckAbsoluteDay)===oggi) return null;

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
    sourceContext:sourceContext||"world",
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

function stradaTentaIngresso(roll,variantRoll){
  const persona=stradaPersonaIngresso(variantRoll,"world");
  return stradaCreaPropostaIngresso(persona,roll,"world");
}

function stradaTentaIngressoFabbrica(roll){
  if(!G.job) return null;
  const luogo=typeof lavoroLuogo==="function" ? lavoroLuogo(G.job) : (G.job.place||null);
  if(luogo!=="fabbrica") return null;
  const persona=stradaFabbricaPersonaCandidata();
  if(!persona) return null;
  return stradaCreaPropostaIngresso(persona,roll,"fabbrica");
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

  const personaIngresso=stradaPersonaDaId(proposta.personId||s.ingressoPersonaId);
  if(personaIngresso){
    stradaSegnaPersona(personaIngresso,{
      key:"intro:"+personaIngresso.id,
      source:"intro",
      story:"È la persona che ti ha aperto per prima la porta della Strada."
    });
  }

  const r=Number.isFinite(Number(successRoll))
    ? Math.max(0,Math.min(.999999,Number(successRoll)))
    : Math.random();
  const successo=r<Number(STRADA_INGRESSO.riuscita[step-1]||.7);
  const rr=Number.isFinite(Number(rewardRoll))
    ? Math.max(0,Math.min(.999999,Number(rewardRoll)))
    : Math.random();

  let pulito=0,sporco=0,multa=0;
  if(personaIngresso)
    stradaModificaFiducia(personaIngresso,successo?8:-3,"intro-"+step+(successo?"-success":"-failure"));
  if(successo && personaIngresso)
    stradaAggiungiFavore(personaIngresso,1,"intro-"+step+"-success");
  if(successo){
    const min=Number(STRADA_INGRESSO.min[step-1]||120);
    const max=Number(STRADA_INGRESSO.max[step-1]||240);
    const grezzo=Math.round(min+(max-min)*rr);
    pulito=Math.round(grezzo*.4);
    sporco=grezzo-pulito;
    G.money=Number(G.money||0)+pulito;
    s.sporchi=Number(s.sporchi||0)+sporco;
    stradaModificaReputazione(step===1?1:2,"intro-success",{step});
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
      pushLog("<b>"+nome+" ti consegna un TrapPhone.</b> Da ora le dritte che non passano faccia a faccia possono arrivare lì.", "good");
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
  if(!Array.isArray(st.pendingChoices)) st.pendingChoices=[];
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
  /* Punto 3: migrazione di offerte create quando la "persona" era solo testo. */
  if(st.pending && !st.pending.personId) stradaCollegaLeadPersona(st.pending,st.pending.trigger,true);
  if(st.active && !st.active.personId) stradaCollegaLeadPersona(st.active,st.active.trigger,true);

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

function stradaPoolOpportunita(escludi){
  const st=stradaOpportunitaStato();
  const rep=stradaReputazioneGlobale();
  const skip=new Set(Array.isArray(escludi)?escludi:[]);
  let pool=STRADA_OPPORTUNITA.filter(x=>
    rep>=Number(x.minRep||0) &&
    (x.maxRep==null || rep<=Number(x.maxRep)) &&
    !st.recentIds.includes(x.id) &&
    !skip.has(x.id)
  );
  if(!pool.length)
    pool=STRADA_OPPORTUNITA.filter(x=>
      rep>=Number(x.minRep||0) &&
      (x.maxRep==null || rep<=Number(x.maxRep)) &&
      !skip.has(x.id)
    );
  return pool;
}

function stradaScegliOpportunita(roll,escludi){
  const pool=stradaPoolOpportunita(escludi);
  if(!pool.length) return null;
  const r=Number.isFinite(Number(roll))
    ? Math.max(0,Math.min(.999999,Number(roll)))
    : Math.random();
  return Object.assign({},pool[Math.floor(r*pool.length)]);
}
function stradaFabbricaLeadVariante(roll){ return stradaScegliOpportunita(roll); }

function stradaPreparaPropostaOpportunita(variante,trigger,cfg,oggi){
  if(!variante) return null;
  const persona=stradaRisolviContattoOpportunita(variante,trigger,false);
  if(!persona) return null;
  const proposta=Object.assign({
    source:"street-opportunity",
    sourceLabel:variante.networkSourceLabel||"Incontro della Strada",
    trigger:trigger||"unknown",
    status:"offered",
    offeredAbsoluteDay:oggi,
    durataGiorni:Number(cfg.durataGiorni||7)
  },variante,{
    personId:persona.id,
    persona:persona.n,
    contactKey:(persona.strada&&persona.strada.key)||stradaContattoKey(persona.n)
  });
  stradaRegistraTentativoContatto(persona,"opportunity:"+String(variante.id||""));
  return proposta;
}

function stradaOpportunitaPendenti(){
  const st=stradaOpportunitaStato();
  if(Array.isArray(st.pendingChoices) && st.pendingChoices.length)
    return st.pendingChoices.map(x=>Object.assign({},x));
  return st.pending ? [Object.assign({},st.pending)] : [];
}

function stradaSelezionaOpportunita(opportunityId){
  const st=stradaOpportunitaStato();
  const scelte=stradaOpportunitaPendenti();
  if(!scelte.length) return null;
  const scelta=opportunityId
    ? scelte.find(x=>x.id===opportunityId)
    : scelte[0];
  if(!scelta) return null;

  /* Le altre proposte sono state viste e scartate, non ignorate: nessun
     ghosting artificiale quando il giocatore esercita la nuova capacità di
     scegliere tra due occasioni. */
  for(const altra of scelte){
    if(altra.id===scelta.id) continue;
    const p=stradaPersonaDaId(altra.personId);
    if(p) stradaRegistraInterazione(p,"opportunity-not-selected");
    st.history.push({
      type:"not-selected",
      absoluteDay:stradaAbsDay(),
      opportunityId:altra.id,
      trigger:altra.trigger||null,
      colpoId:altra.colpoId,
      personId:altra.personId||null
    });
  }
  while(st.history.length>30) st.history.shift();
  st.pending=Object.assign({},scelta);
  st.pendingChoices=[];
  return st.pending;
}

function stradaTentaOpportunita(trigger,roll,variantRoll){
  if(!stradaPartecipazioneAttiva() || !stradaGiroAvviato() || (G.strada&&G.strada.arresto)) return null;
  stradaAggiornaRelazioniCriminali(true);
  /* Le dritte "dal mondo" viaggiano sul TrapPhone. Gli incontri Fabbrica
     restano faccia a faccia e non dipendono dal dispositivo. */
  if(trigger==="mondo" && !stradaHaTrapPhone()) return null;

  const st=stradaOpportunitaStato();
  stradaAggiornaOpportunita(true);
  if(st.active || st.pending || (st.pendingChoices&&st.pendingChoices.length)) return null;

  const oggi=stradaAbsDay();
  const cfg=stradaOpportunitaTriggerConfig(trigger);
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

  const cap=stradaCapacitaRete();
  const prima=stradaScegliOpportunita(variantRoll);
  const proposte=[];
  const p1=stradaPreparaPropostaOpportunita(prima,trigger,cfg,oggi);
  if(p1) proposte.push(p1);

  /* Solo le chiamate dal mondo diventano una scelta simultanea. La Fabbrica
     resta un incontro faccia a faccia con una persona concreta. */
  if(trigger==="mondo" && cap.sceltaOpportunita && proposte.length){
    const r2=Number.isFinite(Number(variantRoll))
      ? (Math.max(0,Math.min(.999999,Number(variantRoll)))+.47)%1
      : Math.random();
    const seconda=stradaScegliOpportunita(r2,[proposte[0].id]);
    const p2=stradaPreparaPropostaOpportunita(seconda,trigger,cfg,oggi);
    if(p2 && p2.id!==proposte[0].id) proposte.push(p2);
  }

  if(!proposte.length) return null;

  st.lastOfferAbsoluteDay=oggi;
  st.nextOfferAbsoluteDay=oggi+Number(cfg.cooldownGiorni||10);
  for(const proposta of proposte){
    st.recentIds.unshift(proposta.id);
  }
  st.recentIds=[...new Set(st.recentIds)].slice(0,4);

  if(proposte.length>1){
    st.pendingChoices=proposte.map(x=>Object.assign({},x));
    st.pending=null;
    return Object.assign({},proposte[0],{
      multi:true,
      choices:st.pendingChoices.map(x=>Object.assign({},x))
    });
  }

  st.pending=Object.assign({},proposte[0]);
  st.pendingChoices=[];
  return Object.assign({},st.pending);
}

function stradaTentaPropostaFabbrica(roll,variantRoll){
  if(!G.job) return null;
  const luogo=typeof lavoroLuogo==="function" ? lavoroLuogo(G.job) : (G.job.place||null);
  if(luogo!=="fabbrica") return null;
  /* Anche se sei già nel giro, la Fabbrica parla solo attraverso una persona
     che hai realmente conosciuto dopo abbastanza turni insieme. */
  if(!stradaFabbricaPersonaCandidata()) return null;
  return stradaTentaOpportunita("fabbrica",roll,variantRoll);
}

function stradaAccettaOpportunita(opportunityId){
  const st=stradaOpportunitaStato();
  if((st.pendingChoices&&st.pendingChoices.length) || opportunityId)
    stradaSelezionaOpportunita(opportunityId);
  if(!st.pending) return null;

  const persona=stradaPersonaDaId(st.pending.personId);
  if(persona) stradaRegistraInterazione(persona,"opportunity-accepted");
  const oggi=stradaAbsDay();
  const lead=Object.assign({},st.pending,{
    status:"active",
    acceptedAbsoluteDay:oggi,
    expiresAbsoluteDay:oggi+Math.max(1,Number(st.pending.durataGiorni||7))
  });
  st.pending=null;
  st.pendingChoices=[];
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
function stradaAccettaPropostaFabbrica(opportunityId){ return stradaAccettaOpportunita(opportunityId); }

function stradaRifiutaOpportunita(){
  const st=stradaOpportunitaStato();
  const proposte=stradaOpportunitaPendenti();
  if(!proposte.length) return null;

  const oggi=stradaAbsDay();
  for(const proposta of proposte){
    const persona=stradaPersonaDaId(proposta.personId);
    if(persona){
      stradaRegistraInterazione(persona,"opportunity-declined");
      /* Dire no in faccia non viene punito: resta però memoria della scelta,
         così una successiva scena con la stessa persona non nasce dal nulla. */
      stradaEcoMondo(persona,"street-opportunity-declined",0,{
        reason:"opportunity-declined",context:"trap-phone"
      });
    }
    st.history.push({
      type:"declined",
      absoluteDay:oggi,
      opportunityId:proposta.id,
      trigger:proposta.trigger||null,
      colpoId:proposta.colpoId,
      personId:proposta.personId||null
    });
  }
  while(st.history.length>30) st.history.shift();
  st.pending=null;
  st.pendingChoices=[];
  const chiuse=proposte.map(x=>Object.assign({},x,{status:"declined",declinedAbsoluteDay:oggi}));
  return chiuse.length===1 ? chiuse[0] : chiuse;
}
function stradaRifiutaPropostaFabbrica(){ return stradaRifiutaOpportunita(); }

function stradaIgnoraOpportunita(){
  const st=stradaOpportunitaStato();
  const proposte=stradaOpportunitaPendenti();
  if(!proposte.length) return null;

  const oggi=stradaAbsDay();
  for(const proposta of proposte){
    const persona=stradaPersonaDaId(proposta.personId);
    if(persona){
      stradaIgnoraContatto(persona,"opportunity-ignored");
      stradaEcoMondo(persona,"street-opportunity-ignored",-1,{
        reason:"opportunity-ignored",context:"trap-phone"
      });
    }
    st.history.push({
      type:"ignored",
      absoluteDay:oggi,
      opportunityId:proposta.id,
      trigger:proposta.trigger||null,
      colpoId:proposta.colpoId,
      personId:proposta.personId||null
    });
  }
  while(st.history.length>30) st.history.shift();
  st.pending=null;
  st.pendingChoices=[];
  const ignorate=proposte.map(x=>Object.assign({},x,{status:"ignored",ignoredAbsoluteDay:oggi}));
  return ignorate.length===1 ? ignorate[0] : ignorate;
}
function stradaIgnoraPropostaFabbrica(){ return stradaIgnoraOpportunita(); }

/* Cancellazione tecnica: se un altro evento ha già occupato quello slot il
   giocatore non ha visto né ignorato nessuno, quindi la relazione non cambia. */
function stradaAnnullaOpportunita(){
  const st=stradaOpportunitaStato();
  const proposte=stradaOpportunitaPendenti();
  if(!proposte.length) return null;

  const offeredDay=proposte[0].offeredAbsoluteDay;
  st.pending=null;
  st.pendingChoices=[];
  if(Number(st.lastOfferAbsoluteDay)===Number(offeredDay)){
    st.lastOfferAbsoluteDay=null;
    st.nextOfferAbsoluteDay=null;
    const ids=new Set(proposte.map(x=>x.id));
    if(Array.isArray(st.recentIds))
      st.recentIds=st.recentIds.filter(id=>!ids.has(id));
  }
  return proposte.length===1 ? proposte[0] : proposte;
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
  const persona=stradaPersonaDaId(usata.personId);
  if(persona) stradaRegistraInterazione(persona,"opportunity-consumed");
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

/* Punto 11: quando la rete pesa davvero, il giocatore smette di essere solo
   destinatario di lavori. Prima gli chiedono "hai un nome?"; più avanti può
   essere lui a far incontrare due persone. Anche qui nessun grado formale. */
const STRADA_EVENTI_RETE = Object.freeze({
  nome:Object.freeze({chance:.06,cooldownGiorni:21}),
  ponte:Object.freeze({chance:.045,cooldownGiorni:28})
});

function stradaEventoReteStato(){
  const s=G.strada||(G.strada={});
  if(!s.reteInfluenza || typeof s.reteInfluenza!=="object"){
    s.reteInfluenza={
      lastCheckAbsoluteDay:null,
      nextEventAbsoluteDay:null,
      pending:null,
      history:[],
      connectionsMade:0
    };
  }
  const st=s.reteInfluenza;
  if(!Array.isArray(st.history)) st.history=[];
  if(!Number.isFinite(Number(st.connectionsMade))) st.connectionsMade=0;
  st.connectionsMade=Math.max(0,Math.floor(Number(st.connectionsMade)||0));
  return st;
}

function stradaReteRoll(roll){
  return Number.isFinite(Number(roll))
    ? Math.max(0,Math.min(.999999,Number(roll)))
    : Math.random();
}

function stradaTentaEventoRete(roll,variantRoll){
  if(!stradaPartecipazioneAttiva() || !stradaGiroAvviato() || (G.strada&&G.strada.arresto)) return null;
  if(typeof stradaHaTrapPhone==="function" && !stradaHaTrapPhone()) return null;

  const opp=stradaOpportunitaStato();
  stradaAggiornaOpportunita(true);
  if(opp.active || opp.pending || (opp.pendingChoices&&opp.pendingChoices.length)) return null;
  const ferro=typeof stradaFerroStato==="function" ? stradaFerroStato() : null;
  if(ferro&&ferro.pending) return null;

  const cap=stradaCapacitaRete();
  const mode=cap.creaPonte ? "bridge" : cap.richiestaNome ? "ask-name" : null;
  if(!mode) return null;

  const st=stradaEventoReteStato();
  if(st.pending) return null;
  const oggi=stradaAbsDay();
  if(Number(st.lastCheckAbsoluteDay)===oggi) return null;
  if(st.nextEventAbsoluteDay!=null && oggi<Number(st.nextEventAbsoluteDay)) return null;
  st.lastCheckAbsoluteDay=oggi;

  const cfg=mode==="bridge" ? STRADA_EVENTI_RETE.ponte : STRADA_EVENTI_RETE.nome;
  if(stradaReteRoll(roll)>=Number(cfg.chance||0)) return null;

  const attivi=stradaContattiAttivi().filter(p=>!stradaHeatPersonaCauta(p)).slice().sort((a,b)=>
    stradaFiduciaValore(b)-stradaFiduciaValore(a) ||
    Number((b.strada&&b.strada.colpiInsieme)||0)-Number((a.strada&&a.strada.colpiInsieme)||0)
  );
  const rv=stradaReteRoll(variantRoll);

  if(mode==="ask-name"){
    if(attivi.length<3) return null;
    const requester=attivi[Math.floor(rv*attivi.length)] || attivi[0];
    const candidati=attivi.filter(p=>p.id!==requester.id)
      .sort((a,b)=>stradaFiduciaValore(b)-stradaFiduciaValore(a))
      .slice(0,3);
    if(candidati.length<2) return null;
    st.pending={
      mode,
      requesterId:requester.id,
      requesterName:requester.n,
      candidateIds:candidati.map(p=>p.id),
      candidateNames:candidati.map(p=>p.n),
      createdAbsoluteDay:oggi
    };
  }else{
    const fidati=attivi.filter(p=>stradaFiduciaValore(p)>=STRADA_FIDUCIA_SQUADRA);
    if(fidati.length<2) return null;
    const primo=Math.floor(rv*fidati.length);
    const a=fidati[primo] || fidati[0];
    const b=fidati[(primo+1)%fidati.length];
    if(!a || !b || a.id===b.id) return null;
    st.pending={
      mode,
      personAId:a.id,personAName:a.n,
      personBId:b.id,personBName:b.n,
      createdAbsoluteDay:oggi
    };
  }

  st.nextEventAbsoluteDay=oggi+Number(cfg.cooldownGiorni||21);
  return Object.assign({},st.pending);
}

function stradaRisolviEventoRete(personId){
  const st=stradaEventoReteStato();
  const p=st.pending;
  if(!p) return {ok:false,reason:"Non c'è nessuna richiesta di rete aperta."};
  const oggi=stradaAbsDay();

  if(p.mode==="ask-name"){
    const requester=stradaPersonaDaId(p.requesterId);
    const candidato=(p.candidateIds||[]).includes(personId)
      ? stradaPersonaDaId(personId)
      : null;
    stradaHeatSincronizzaPersone();
    if(!stradaRelazioneOperativa(requester) || !stradaRelazioneOperativa(candidato))
      return {ok:false,reason:"Con tutta questa attenzione, uno dei due non vuole esporsi adesso."};

    stradaModificaFiducia(requester,2,"rete-nome-dato");
    stradaModificaFiducia(candidato,2,"rete-presentato");
    stradaEcoMondo(requester,"street-network-favor",1,{
      reason:"rete-nome-dato",context:"rete",noHearsay:true,
      relatedPersonId:candidato.id,relatedPersonName:candidato.n
    });
    stradaEcoMondo(candidato,"street-network-introduction",1,{
      reason:"rete-presentato",context:"rete",noHearsay:true,
      relatedPersonId:requester.id,relatedPersonName:requester.n
    });
    stradaAggiungiFavore(requester,1,"rete-nome-dato");
    if(typeof postoCollegaPersone==="function")
      postoCollegaPersone(requester,candidato,"strada-nome");
    st.connectionsMade++;
    st.history.push({
      type:"name-given",absoluteDay:oggi,
      requesterId:requester.id,personId:candidato.id
    });
    st.pending=null;
    if(st.history.length>20) st.history.shift();
    return {ok:true,mode:p.mode,requester:requester.n,persona:candidato.n};
  }

  if(p.mode==="bridge"){
    const a=stradaPersonaDaId(p.personAId), b=stradaPersonaDaId(p.personBId);
    stradaHeatSincronizzaPersone();
    if(!stradaRelazioneOperativa(a) || !stradaRelazioneOperativa(b))
      return {ok:false,reason:"Con tutta questa attenzione, uno dei due non vuole farsi vedere adesso."};

    stradaModificaFiducia(a,3,"rete-ponte");
    stradaModificaFiducia(b,3,"rete-ponte");
    stradaEcoMondo(a,"street-network-bridge",1,{
      reason:"rete-ponte",context:"rete",noHearsay:true,
      relatedPersonId:b.id,relatedPersonName:b.n
    });
    stradaEcoMondo(b,"street-network-bridge",1,{
      reason:"rete-ponte",context:"rete",noHearsay:true,
      relatedPersonId:a.id,relatedPersonName:a.n
    });
    stradaAggiungiFavore(a,1,"rete-ponte");
    stradaAggiungiFavore(b,1,"rete-ponte");
    if(typeof postoCollegaPersone==="function")
      postoCollegaPersone(a,b,"strada-ponte");
    st.connectionsMade++;
    st.history.push({
      type:"bridge-made",absoluteDay:oggi,
      personAId:a.id,personBId:b.id
    });
    st.pending=null;
    if(st.history.length>20) st.history.shift();
    return {ok:true,mode:p.mode,personaA:a.n,personaB:b.n};
  }

  return {ok:false,reason:"Richiesta di rete non riconosciuta."};
}

function stradaRifiutaEventoRete(){
  const st=stradaEventoReteStato();
  if(!st.pending) return null;
  const p=Object.assign({},st.pending,{status:"declined",closedAbsoluteDay:stradaAbsDay()});
  st.history.push({
    type:"declined",mode:p.mode,absoluteDay:stradaAbsDay(),
    requesterId:p.requesterId||null,
    personAId:p.personAId||null,personBId:p.personBId||null
  });
  if(st.history.length>20) st.history.shift();
  st.pending=null;
  return p;
}

function stradaAnnullaEventoRete(){
  const st=stradaEventoReteStato();
  if(!st.pending) return null;
  const p=st.pending;
  st.pending=null;
  st.nextEventAbsoluteDay=null;
  return p;
}

function stradaChanceConOpportunita(colpo,approccio,lead,personaSquadra,preparazione){
  return clamp(
    stradaChance(colpo,approccio,personaSquadra,preparazione)+Number(lead&&lead.chanceDelta||0),
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

function stradaChance(colpo, approccio, personaSquadra, preparazione){
  const s = G.strada;
  const categoria=stradaEffettiCategoria(colpo);
  const prep=stradaPreparazioneEffetti(preparazione);
  let p = .62 - colpo.difficolta * .34;
  p += categoria.chance;
  p += prep.chance;
  p += stradaReputazioneGlobale()/100 * .20;
  if(approccio && approccio.id==="squadra" && personaSquadra)
    p += stradaBonusFiduciaSquadra(personaSquadra);
  p += s.prot * .045;
  p -= s.heat/100 * .30;
  p -= s.precedenti * .035;
  p += approccio.riuscita;
  return clamp(p, .06, .93);
}

function stradaLavaggioStato(){
  const s=G.strada, key=(G.year||1)+":"+(G.week||1);
  if(!s.lavaggio || typeof s.lavaggio!=="object" || s.lavaggio.key!==key)
    s.lavaggio={key:key,used:0,canali:{}};
  if(typeof s.lavaggio.used!=="number") s.lavaggio.used=0;
  if(!s.lavaggio.canali || typeof s.lavaggio.canali!=="object") s.lavaggio.canali={};

  if(!s.lavaggio.canaliMigrati){
    let residuo=Math.max(0,Number(s.lavaggio.used)||0);
    s.lavaggio.canali.base=Math.min(400,residuo);
    residuo=Math.max(0,residuo-s.lavaggio.canali.base);
    for(const a of STRADA_ATTIVITA){
      if(!s.attivita || !s.attivita[a.id]) continue;
      const preso=Math.min(Number(a.capienza||a.resa||0),residuo);
      s.lavaggio.canali[a.id]=preso;
      residuo=Math.max(0,residuo-preso);
    }
    s.lavaggio.canaliMigrati=true;
  }
  return s.lavaggio;
}

function stradaTenta(colpoId, approccioId, personaSquadraId, preparazione){
  const colpo = STRADA_COLPI.find(c => c.id === colpoId);
  const approccio = STRADA_APPROCCI.find(a => a.id === approccioId);
  if(!colpo || !approccio) return;
  const s = G.strada;
  preparazione=stradaPreparazioneContesto(preparazione);
  const effettiPreparazione=stradaPreparazioneEffetti(preparazione);

  if(G.energy < colpo.energia){ STRADA_SCENA = stScenaAvviso(colpo, "Non hai abbastanza energia per questo colpo (serve " + colpo.energia + ").", preparazione); return; }
  const personaSquadra=approccio.id==="squadra" ? stradaPersonaSquadra(personaSquadraId) : null;
  if(approccio.serveUomo && !personaSquadra){
    STRADA_SCENA = stScenaAvviso(colpo, "Per muoverti con il giro ti serve una persona reale che si fidi abbastanza di te.", preparazione);
    return;
  }
  if(approccio.serveFerro && !s.ferro){ STRADA_SCENA = stScenaAvviso(colpo, "Ti serve il ferro, e non ce l'hai ancora.", preparazione); return; }

  /* Il tempo viene impegnato solo dopo avere superato i requisiti
     dell'approccio, ma prima di energia, dado e consumo dell'opportunità:
     se non fai in tempo oggi non perdi né energia né la dritta. */
  const tempoColpo=stradaSpendiTempoColpo(colpo);
  if(!tempoColpo.ok){
    STRADA_SCENA=stScenaAvviso(colpo,tempoColpo.reason,preparazione);
    return;
  }

  if(stradaAttivitaSbloccate()) s.giroAvviato=true;
  G.energy -= colpo.energia;
  const opportunita = stradaOpportunitaAttiva(colpoId);
  const leadLavoro = !opportunita && window.ADF_WORK_EVENTS &&
    typeof ADF_WORK_EVENTS.crimeLeadActive === "function"
      ? ADF_WORK_EVENTS.crimeLeadActive()
      : null;
  const successo = Math.random() < stradaChanceConOpportunita(colpo,approccio,opportunita,personaSquadra,preparazione);
  const leadUsato = opportunita
    ? stradaConsumaOpportunita(colpoId, successo)
    : (leadLavoro && window.ADF_WORK_EVENTS && typeof ADF_WORK_EVENTS.consumeCrimeLead === "function"
      ? ADF_WORK_EVENTS.consumeCrimeLead(successo)
      : null);
  const effettiLead=stradaEffettiOpportunita(leadUsato,successo);
  const moltiplicatoreLead = 1 + Number(effettiLead.bonusPct||0) / 100;
  const effettiCategoria=stradaEffettiCategoria(colpo);
  const rumore = clamp((6 + colpo.difficolta * 10) * approccio.rumore *
    effettiCategoria.heat * effettiPreparazione.heat, 2, 30);
  const rumoreLead = Number(effettiLead.heatDelta||0);
  const reputazioneLead = Number(effettiLead.repDelta||0);
  const personaLead=leadUsato&&leadUsato.personId?stradaPersonaDaId(leadUsato.personId):null;
  const squadraCopre=!successo && approccio.id==="squadra" && personaSquadra && Math.random()<.5;
  let notaPersone="";

  if(personaSquadra){
    const stessa=personaLead&&personaLead.id===personaSquadra.id;
    stradaModificaFiducia(
      personaSquadra,
      successo?(stessa?10:7):(stessa?-8:-6),
      successo?"colpo-insieme-success":"colpo-insieme-failure"
    );
    stradaEcoMondo(
      personaSquadra,
      successo?"crime-together-success":"crime-together-failure",
      successo?2:-1,
      {reason:successo?"colpo-insieme-success":"colpo-insieme-failure",context:"colpo-squadra"}
    );
    stradaPersonaMeta(personaSquadra).colpiInsieme++;
  }
  if(personaLead && (!personaSquadra || personaLead.id!==personaSquadra.id)){
    stradaModificaFiducia(personaLead,successo?8:-5,
      successo?"opportunita-success":"opportunita-failure");
    stradaEcoMondo(
      personaLead,
      successo?"street-opportunity-success":"street-opportunity-failure",
      successo?2:-2,
      {reason:successo?"opportunita-success":"opportunita-failure",context:"opportunita"}
    );
  }
  if(successo && personaLead)
    stradaAggiungiFavore(personaLead,1,"opportunita-success");

  if(successo){
    if(personaSquadra && stradaConseguenzePersona(personaSquadra).debiti>0){
      if(stradaModificaDebitoPersona(personaSquadra,-1,"colpo-insieme-success")<0)
        notaPersone+=" <b>Con "+personaSquadra.n+" chiudi uno dei conti rimasti aperti fra voi.</b>";
    }
    if(personaLead){
      stradaModificaTensionePersona(personaLead,-1,"opportunita-success");
      const presentazione=stradaPresentazioneDopoSuccesso(personaLead,Math.random(),Math.random());
      if(presentazione)
        notaPersone+=" <b>"+personaLead.n+" ti apre un'altra porta e ti presenta "+presentazione.nuovo.n+".</b>";
    }
  }else{
    if(personaLead){
      const tensione=stradaModificaTensionePersona(personaLead,1,"opportunita-failure");
      if(tensione.rivalitaNata){
        stradaEcoMondo(personaLead,"street-rivalry-start",0,{
          reason:"opportunita-failure",
          context:"rivalita",
          noHearsay:true
        });
        notaPersone+=" <b>Con "+personaLead.n+" non è più solo un rapporto freddo: la cosa è diventata personale.</b>";
      }
    }
    if(personaSquadra && squadraCopre){
      if(stradaModificaDebitoPersona(personaSquadra,1,"si-prende-il-casino")>0){
        stradaEcoMondo(personaSquadra,"street-debt-created",0,{
          reason:"si-prende-il-casino",
          context:"debito",
          noHearsay:true
        });
        notaPersone+=" <b>"+personaSquadra.n+" ti ha coperto: adesso gli devi un favore.</b>";
      }
    }
  }

  /* Da smistare, punto 6: "Il giro grosso" segnato in agenda per oggi vale
     il suo peso — è il più rischioso dei sei eventi della settimana, e
     deve rendere in proporzione quando capita davvero quel giorno lì.
     Si legge prima del dado: al colpo ci sei andato anche se va male, e
     l'appuntamento esce dall'agenda lo stesso (giro del 20/09). */
  const peso = (window.AGENDA && typeof AGENDA.consumaPeso === "function")
    ? AGENDA.consumaPeso("colpo") : 1;

  if(successo){
    const grezzo = rnd(colpo.min, colpo.max) * approccio.guadagno * peso *
      moltiplicatoreLead * effettiCategoria.guadagno;
    const sporco = Math.round(grezzo * effettiCategoria.sporco);
    const pulito = Math.round(grezzo - sporco);
    G.money += pulito; s.sporchi += sporco;
    const repBase=(3 + colpo.difficolta * 6) * effettiCategoria.rep;
    stradaModificaReputazione(repBase+reputazioneLead,"crime-success",{colpoId:colpo.id});
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
        (reputazioneLead ? ", nome nel giro " + stradaSegno(reputazioneLead) : "") + ".</b>"
      : "";
    STRADA_SCENA = {k:"Com'è andata", titolo:"Andata bene", testo:"<b>" + colpo.n + "</b>: " + fmt(pulito) + " € in tasca, " +
        fmt(sporco) + " € sporchi da ripulire. In giro si comincia a parlarne." + notaLead + notaPersone,
      opts:[{n:"Continua", d:"Torni alla strada", run(){ STRADA_SCENA = null; }}]};
  }else{
    const costoErrore=stradaHeatCostoErrore();
    s.heat = clamp(s.heat + (rumore + rumoreLead) * costoErrore, 0, 100);
    if(reputazioneLead) stradaModificaReputazione(reputazioneLead,"crime-failure",{colpoId:colpo.id});
    const notaLeadFallita = leadUsato
      ? (leadUsato.source==="street-opportunity"
          ? " <b>L'opportunità «" + (leadUsato.titolo||"senza nome") + "» è bruciata: attenzione " +
            stradaSegno(rumoreLead) +
            (reputazioneLead ? ", nome nel giro " + stradaSegno(reputazioneLead) : "") + ".</b>"
          : " La dritta arrivata dal lavoro è bruciata.")
      : "";
    if(squadraCopre){
      STRADA_SCENA = {k:"Com'è andata", titolo:"È andata male", testo:"<b>" + colpo.n + "</b> è saltato. <b>" +
          personaSquadra.n + "</b> si prende la parte peggiore del casino e tu riesci a rientrare. La fiducia fra voi ne risente." + notaLeadFallita + notaPersone,
        opts:[{n:"Continua", d:"Torni alla strada", run(){ STRADA_SCENA = null; }}]};
    }else{
      const ingressoProtetto = !stradaAttivitaSbloccate();
      const primaVolta = s.precedenti === 0 && approccio.id !== "ferro" && colpo.difficolta <= .3;
      if(ingressoProtetto){
        const multa = Math.max(40, Math.round(colpo.min * .45 * costoErrore));
        G.money = Math.max(0, G.money - multa);
        STRADA_SCENA = {k:"Com'è andata", titolo:"Saltato, ma sei fuori", testo:"<b>" + colpo.n + "</b> è saltato. " +
            "Perdi " + fmt(multa) + " € e attiri attenzione, ma in questa fase nessuno ha abbastanza per mandarti dentro." + notaLeadFallita + notaPersone,
          opts:[{n:"Continua", d:"", run(){ STRADA_SCENA = null; }}]};
      }else if(primaVolta && Math.random() < stradaHeatChanceSoloDenuncia(.6)){
        const multa = Math.round(colpo.min * .8 * costoErrore);
        G.money = Math.max(0, G.money - multa);
        STRADA_SCENA = {k:"Com'è andata", titolo:"Denuncia", testo:"<b>" + colpo.n + "</b> è saltato, ma te la cavi con una denuncia e " +
            fmt(multa) + " € di multa. Stavolta è andata." + notaLeadFallita + notaPersone,
          opts:[{n:"Continua", d:"Torni alla strada", run(){ STRADA_SCENA = null; }}]};
      }else{
        const settimane = Math.max(1, Math.round(colpo.pena * approccio.pena *
          (1 + s.precedenti * .35) * stradaHeatPenaMoltiplicatore() *
          (stradaHaAvvocatoPrivato() ? .55 : 1)));
        s.precedenti++;
        if(approccio.id==="ferro" && s.ferro){
          const ferroSt=stradaFerroStato();
          s.ferro=false;
          ferroSt.history.push({
            status:"seized-on-crime",
            sourcePersonId:ferroSt.sourcePersonId||null,
            sourceName:ferroSt.sourceName||null,
            closedAbsoluteDay:stradaAbsDay()
          });
          if(ferroSt.history.length>12) ferroSt.history.shift();
          ferroSt.nextOfferAbsoluteDay=stradaAbsDay()+30;
        }
        s.arresto = {settimane:settimane, colpo:colpo.n};
        if(personaLead) stradaEcoMondo(personaLead,"street-arrest",0,{
          reason:"arresto-dopo-colpo",context:"carcere"
        });
        if(personaSquadra && (!personaLead || personaSquadra.id!==personaLead.id))
          stradaEcoMondo(personaSquadra,"street-arrest",0,{
            reason:"arresto-dopo-colpo",context:"carcere",noHearsay:true
          });
        STRADA_SCENA = {k:"Com'è andata", titolo:"Arrestato", testo:"<b>" + colpo.n + "</b> è saltato, e stavolta non te la cavi: " +
            settimane + (settimane === 1 ? " settimana dentro" : " settimane dentro") +
            ". Niente musica, niente strada: solo il tempo che passa." + notaLeadFallita + notaPersone,
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
function stradaAttivitaCapienzaEffettiva(a){
  if(!a || !G.strada.attivita[a.id] || !stradaAttivitaOperativa(a.id)) return 0;
  const st=stradaAttivitaStato(a.id,true);
  const base=Number(a.capienza||a.resa||0);
  return Math.max(0,Math.round(base*(st&&st.issue ? .55 : 1)));
}
function stradaLavaggioUsatoCanale(id){
  const l=stradaLavaggioStato();
  return Math.max(0,Number(l.canali[id]||0));
}
function stradaLavaggioResiduoCanale(id){
  if(id==="base") return Math.max(0,400-stradaLavaggioUsatoCanale("base"));
  const a=stradaAttivitaDef(id);
  if(!a) return 0;
  return Math.max(0,stradaAttivitaCapienzaEffettiva(a)-stradaLavaggioUsatoCanale(id));
}
function stradaCapienzaTotale(){
  let cap=400;
  for(const a of STRADA_ATTIVITA) cap+=stradaAttivitaCapienzaEffettiva(a);
  return cap;
}
function stradaCapienza(){
  return Math.max(0,stradaCanaliLavaggio().reduce((n,x)=>n+Math.max(0,Number(x.residuo||0)),0));
}
function stradaCanaliLavaggio(){
  const out=[{
    id:"base",n:"Giri piccoli",capienza:400,residuo:stradaLavaggioResiduoCanale("base"),
    rischio:"basso",efficienza:.58,heatMax:1.1,blocked:false,issue:false
  }];
  for(const a of STRADA_ATTIVITA){
    if(!G.strada.attivita[a.id]) continue;
    const st=stradaAttivitaStato(a.id,true);
    out.push({
      id:a.id,n:a.n,capienza:stradaAttivitaCapienzaEffettiva(a),
      residuo:stradaLavaggioResiduoCanale(a.id),
      rischio:a.rischio<.07?"basso":a.rischio<.1?"medio":"alto",
      efficienza:Number(a.efficienza||.75),heatMax:Number(a.heatMax||2),
      blocked:!stradaAttivitaOperativa(a.id),issue:!!(st&&st.issue)
    });
  }
  return out;
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
function stradaRipulisci(importo,canaleId){
  const s = G.strada;
  if(s.arresto) return "Sei in carcere: non puoi ripulire i soldi finché non esci.";
  if(!stradaPartecipazioneAttiva()) return "Hai mollato il giro: non fai più passare denaro sporco.";
  if(s.sporchi <= 0) return "Non hai soldi sporchi da ripulire.";
  if(stradaCapienza()<=0) return "Hai già usato tutta la capacità di ripulitura di questa settimana.";

  const canali=stradaCanaliLavaggio().filter(x=>x.residuo>0&&!x.blocked);
  let canale=canaleId?canali.find(x=>x.id===canaleId):null;
  if(!canale) canale=canali[0]||null;
  if(!canale) return "Non hai un canale disponibile questa settimana.";

  const max=Math.min(Number(s.sporchi||0),Number(canale.residuo||0));
  const richiesto=Number.isFinite(Number(importo))?Math.max(1,Math.round(Number(importo))):max;
  const passa=Math.min(max,richiesto);
  if(passa<=0) return "Da qui questa settimana non può passare altro.";

  const tempoRiciclaggio=stradaTempoRiciclaggio();
  if(tempoRiciclaggio) return tempoRiciclaggio;

  const eff=Math.max(.45,Math.min(.9,Number(canale.efficienza||.58)));
  const pulito=Math.round(passa*eff);
  const ratio=canale.capienza>0?passa/canale.capienza:1;
  let heatDelta=.35+ratio*Number(canale.heatMax||1);
  s.sporchi-=passa;
  const lav=stradaLavaggioStato();
  lav.used=Number(lav.used||0)+passa;
  lav.canali[canale.id]=Number(lav.canali[canale.id]||0)+passa;
  G.money+=pulito;

  if(canale.id!=="base"){
    const st=stradaAttivitaStato(canale.id,true);
    st.pressione=Math.min(100,Number(st.pressione||0)+Math.round(ratio*24)+(ratio>=.75?6:0));
    heatDelta+=Number(st.pressione||0)/100*.8;
    st.history.push({type:"launder",week:stradaAttivitaWeekIndex(),amount:passa,ratio:Number(ratio.toFixed(3))});
    if(st.history.length>24) st.history.shift();
    const persone=stradaAttivitaPersone(canale.id);
    if(persone.employee&&ratio>=.75&&typeof postoRegistraConseguenzaMondo==="function")
      postoRegistraConseguenzaMondo(persone.employee,"business-heavy-flow",0,{
        source:"attivita",reason:"movimenti-insoliti",context:canale.id
      });
  }

  s.heat=clamp(s.heat+heatDelta,0,100);
  pushLog("Fatti passare <b>"+fmt(passa)+" €</b> da "+canale.n+
    ": "+fmt(pulito)+" € puliti, attenzione +"+heatDelta.toFixed(1)+".","");
  save(); renderStrada(); renderGioco();
  return canale.n+": "+fmt(passa)+" € passati, "+fmt(pulito)+" € puliti.";
}

function stScenaLavaggioCanale(canaleId){
  const canale=stradaCanaliLavaggio().find(x=>x.id===canaleId);
  if(!canale || canale.residuo<=0)
    return {k:"Riciclaggio",titolo:"Canale pieno",testo:"Da qui questa settimana non può passare altro.",
      opts:[{n:"Torna indietro",d:"Scegli un altro canale",run(){STRADA_SCENA=stScenaRiciclaggio();renderStScheda();}}]};

  const max=Math.min(Number(G.strada.sporchi||0),Number(canale.residuo||0));
  const importi=[Math.max(1,Math.round(max*.25)),Math.max(1,Math.round(max*.5)),max]
    .filter((v,i,arr)=>v>0&&arr.indexOf(v)===i);
  return {
    k:"Riciclaggio",titolo:canale.n,
    testo:"Capienza residua <b>"+fmt(canale.residuo)+" €</b>. Rischio "+canale.rischio+
      ". Più ne fai passare insieme, più l'attività si espone.",
    stats:[
      {t:"residuo "+fmt(canale.residuo)+" €"},
      {t:"rischio "+canale.rischio},
      {t:"resa "+Math.round(canale.efficienza*100)+"%"}
    ],
    opts:[
      ...importi.map(v=>({n:"Fai passare "+fmt(v)+" €",d:"Una singola operazione · 45 min",
        hot:v===max&&max>Math.round(canale.capienza*.7),
        run(){
          const t=stradaRipulisci(v,canale.id);
          STRADA_SCENA=null;stToast(t);
        }})),
      {n:"Torna indietro",d:"Scegli un altro canale",run(){STRADA_SCENA=stScenaRiciclaggio();renderStScheda();}}
    ]
  };
}
function stScenaRiciclaggio(){
  const canali=stradaCanaliLavaggio().filter(x=>x.residuo>0&&!x.blocked);
  return {
    k:"Riciclaggio",titolo:"Come li fai passare",
    testo:"Non esiste più un unico rubinetto. Ogni attività ha capienza, resa e rischio propri. Scegli prima <b>dove</b>, poi <b>quanto</b>.",
    opts:canali.length
      ? canali.map(x=>({
          n:x.n,d:"Residuo "+fmt(x.residuo)+" € · rischio "+x.rischio+(x.issue?" · problema aperto":""),
          run(){STRADA_SCENA=stScenaLavaggioCanale(x.id);renderStScheda();}
        }))
      : [{n:"Chiudi",d:"Nessun canale disponibile",run(){STRADA_SCENA=null;}}]
  };
}

/* ==================== CHI TI COPRE ==================== */
function stAssumiUomo(){
  return "Non puoi comprare la fiducia di qualcuno: per portarlo a un colpo devi costruire un rapporto nel giro.";
}
function stLicenziaUomo(){
  return "Le persone del giro non sono un organico da licenziare: i rapporti cambiano attraverso quello che succede fra voi.";
}
function stCompraFerro(){
  if(!stradaPartecipazioneAttiva())return "Hai mollato il giro: non stai cercando un altro ferro.";
  if(G.strada.ferro) return "Il ferro ce l'hai già.";
  const st=stradaFerroStato();
  if(st.pending) return "Non lo compri da questa schermata: devi rispondere alla proposta di "+(st.pending.persona||"un contatto")+".";
  const p=stradaPersonaFerro();
  if(!p) return "Non hai ancora nessuno che si fidi abbastanza da procurartelo.";
  if(Number(G.strada.rep||0)<STRADA_FERRO_REP_MIN)
    return "Il contatto c'è, ma il tuo nome non gira ancora abbastanza perché si prenda quel rischio.";
  return "Non è merce da scaffale. Se "+p.n+" decide di aprirti quella porta, la proposta arriverà sul TrapPhone.";
}
function stToggleAvvocato(){
  return "L'avvocato non è più un toggle: devi conoscerne uno e affidargli davvero l'incarico.";
}
function stCompraAttivita(id){
  const a = stradaAttivitaDef(id);
  if(!a) return "";
  if(G.strada.attivita[id]) return a.n + " è già tua.";
  if(G.money < a.costo) return "Non hai " + fmt(a.costo) + " € per rilevare " + a.n.toLowerCase() + ".";
  G.money -= a.costo;
  G.strada.attivita[id] = true;
  const st=stradaAttivitaStato(id,true);
  const persone=stradaAttivitaPersone(id);
  if(st) st.history.push({type:"acquired",week:stradaAttivitaWeekIndex()});
  pushLog("Hai rilevato: <b>" + a.n + "</b>." +
    (persone.partner?" A gestirla con te c'è <b>"+persone.partner.n+"</b>.":""), "good");
  save(); renderStrada(); renderGioco();
  return a.n + " è tua. Da ora ha ricavi, persone, problemi e una capacità di riciclaggio propria.";
}
function stMollaIlGiro(){
  const s=G.strada,u=stradaUscitaStato();
  if(u.mollato) return "Hai già mollato il giro.";
  const costo=Math.max(1500,Math.round(s.sporchi*.3));
  if(s.sporchi>=costo)s.sporchi-=costo;
  else{G.money=Math.max(0,G.money-(costo-s.sporchi));s.sporchi=0;}

  const profondita=stradaProfonditaUscita(),memoria=stradaMemoriaGiorni(profondita),oggi=stradaAbsDay();
  u.mollato=true;u.leftAbsoluteDay=oggi;u.profondita=profondita;
  u.memoryUntilAbsoluteDay=oggi+memoria;u.lastKnockAbsoluteDay=null;
  u.history.push({type:"left",absoluteDay:oggi,profondita,memoryDays:memoria});
  if(u.history.length>20)u.history.shift();

  /* Chiudi gli accordi operativi, non le persone che li rendevano possibili. */
  const opp=stradaOpportunitaStato();
  opp.pending=null;opp.pendingChoices=[];opp.active=null;
  const rete=stradaEventoReteStato();rete.pending=null;
  const prot=stradaProtezioneStato();
  if(Number(s.prot||0)>0)prot.history.push({status:"ended-left-giro",absoluteDay:oggi,providerPersonId:prot.providerPersonId||null});
  s.prot=0;prot.level=0;prot.prepaidWeekKey=null;
  const ferro=stradaFerroStato();
  if(s.ferro)ferro.history.push({status:"disposed-left-giro",absoluteDay:oggi,sourcePersonId:ferro.sourcePersonId||null,sourceName:ferro.sourceName||null});
  s.ferro=false;ferro.pending=null;
  const avv=stradaAvvocatoStato();
  if(avv.retained)avv.history.push({status:"ended-left-giro",absoluteDay:oggi,personId:avv.personId||null,name:avv.name||null});
  s.avvocato=false;avv.retained=false;avv.prepaidWeekKey=null;

  s.rep=clamp(s.rep*.7,0,100);
  addLuc(15);
  pushLog("<b>Hai mollato il giro.</b> Ti è costato "+fmt(costo)+" €. Hai smesso di partecipare, ma persone, precedenti e conti restano.","");
  save();renderStrada();renderGioco();
  return "Hai mollato il giro.";
}


/* ==================== CARCERE EVENTI V2 — 35 SCENE CONTESTUALI ====================
   Regola narrativa: mentre sei detenuto il mondo "normale" non entra dalla
   porta. Qui succedono solo vita interna, rapporti fra detenuti, criminalità
   interna e contatti esterni plausibili (posta, colloqui, legale).
   I cinque HIGH sono obbligatori, persistono al refresh e bloccano il tempo. */

/* Punto Strada 20: il carcere è una seconda fonte di relazioni.
   Le persone conosciute dentro entrano in G.gente e restano le stesse dopo
   la scarcerazione. Il rapporto costruito qui è separato dalla fiducia della
   Strada: solo un legame davvero forte apre un contatto criminale fuori. */
const CARCERE_RELAZIONI_PROFILI = Object.freeze({
  compagno:Object.freeze({ruolo:"strada",dettaglio:"compagno di detenzione"}),
  veterano:Object.freeze({ruolo:"strada",dettaglio:"detenuto più anziano del braccio"}),
  cortile:Object.freeze({ruolo:"strada",dettaglio:"conoscenza del cortile"}),
  giro:Object.freeze({ruolo:"strada",dettaglio:"faccia del giro conosciuta dentro"}),
  conto:Object.freeze({ruolo:"strada",dettaglio:"conto nato o riemerso in carcere"})
});

const CARCERE_EVENTO_RELAZIONE = Object.freeze({
  jail_compagno_parla:Object.freeze({profilo:"compagno",delta:1}),
  jail_vecchio_consiglio:Object.freeze({profilo:"veterano",delta:2}),
  jail_tavolo_cortile:Object.freeze({profilo:"cortile",delta:1}),
  jail_riconosciuto_dentro:Object.freeze({profilo:"compagno",delta:2}),
  jail_favore_piccolo:Object.freeze({profilo:"cortile",delta:2}),
  jail_chiamano_nome:Object.freeze({profilo:"cortile",delta:1}),
  jail_aria_pesante:Object.freeze({profilo:"cortile",delta:-1}),
  jail_barre_quaderno:Object.freeze({profilo:"compagno",delta:2}),
  jail_voce_giro:Object.freeze({profilo:"giro",delta:1}),
  jail_messaggio_piegato:Object.freeze({profilo:"giro",delta:1}),
  jail_nome_pesa:Object.freeze({profilo:"giro",delta:1}),
  jail_faccia_giro:Object.freeze({profilo:"giro",delta:3}),
  jail_conto_vecchio:Object.freeze({profilo:"conto",delta:-2})
});

function carcerePersonaMeta(p){
  if(!p) return null;
  if(!p.carcere || typeof p.carcere!=="object"){
    p.carcere={
      conosciuto:true,rapporto:0,interazioni:[],jailIds:[],
      currentJailId:null,profilo:null,firstMetAbsoluteDay:null,lastMetAbsoluteDay:null,
      linkedStreet:false,releasedAbsoluteDay:null,returnAfterAbsoluteDay:null,
      outsideFollowupDone:false
    };
  }
  if(!Array.isArray(p.carcere.interazioni)) p.carcere.interazioni=[];
  if(!Array.isArray(p.carcere.jailIds)) p.carcere.jailIds=[];
  if(!Number.isFinite(Number(p.carcere.rapporto))) p.carcere.rapporto=0;
  if(p.carcere.returnAfterAbsoluteDay!=null &&
     !Number.isFinite(Number(p.carcere.returnAfterAbsoluteDay)))
    p.carcere.returnAfterAbsoluteDay=null;
  p.carcere.outsideFollowupDone=!!p.carcere.outsideFollowupDone;
  return p.carcere;
}

function carcerePersonaNuova(profilo){
  const def=CARCERE_RELAZIONI_PROFILI[profilo]||CARCERE_RELAZIONI_PROFILI.cortile;
  G.gente=Array.isArray(G.gente)?G.gente:[];
  let p=null;
  if(typeof nuovaPersona==="function") p=nuovaPersona(def.ruolo||"strada");
  if(!p){
    const usati=new Set(G.gente.map(x=>x&&x.n).filter(Boolean));
    const basi={compagno:"Dani",veterano:"Bruno",cortile:"Rami",giro:"Nox",conto:"Moro"};
    let n=basi[profilo]||"Rami",s=2;
    while(usati.has(n)) n=(basi[profilo]||"Rami")+" "+s++;
    p={id:"p"+Math.floor(Math.random()*1e9),ruolo:"strada",n,rel:0,pt:0,ult:-1,feat:-99,via:false};
  }
  p.origine="carcere";
  p.origineLuogo="carcere";
  p.origineDettaglio=def.dettaglio;
  p.storia="Vi siete conosciuti durante una detenzione. Quello che è successo dentro non sparisce quando si apre il cancello.";
  p.circoloSbloccato=false;
  p.numero=false;
  p.visto=true;
  const meta=carcerePersonaMeta(p);
  meta.profilo=profilo;
  meta.firstMetAbsoluteDay=stradaAbsDay();
  meta.lastMetAbsoluteDay=stradaAbsDay();
  G.gente.push(p);
  return p;
}

function carcerePersonaProfilo(profilo,crea){
  const c=carcereStato();
  if(!c) return null;
  if(!c.persone || typeof c.persone!=="object") c.persone={};
  const id=c.persone[profilo];
  let p=id?(G.gente||[]).find(x=>x&&x.id===id&&!x.via):null;
  if(!p && crea!==false){
    p=carcerePersonaNuova(profilo);
    c.persone[profilo]=p.id;
  }
  if(p){
    const m=carcerePersonaMeta(p);
    if(!m.jailIds.includes(c.jailId)) m.jailIds.push(c.jailId);
    m.currentJailId=c.jailId;
    m.lastMetAbsoluteDay=stradaAbsDay();
  }
  return p;
}

function carcereModificaRapporto(profilo,delta,motivo){
  const p=carcerePersonaProfilo(profilo,true);
  if(!p) return null;
  const m=carcerePersonaMeta(p);
  const prima=Number(m.rapporto||0);
  m.rapporto=clamp(prima+Number(delta||0),-10,10);
  m.lastMetAbsoluteDay=stradaAbsDay();
  m.interazioni.push({
    absoluteDay:stradaAbsDay(),delta:Number(delta||0),
    reason:String(motivo||"carcere")
  });
  if(m.interazioni.length>20)m.interazioni.shift();
  if(typeof postoRegistraConseguenzaMondo==="function" && delta)
    postoRegistraConseguenzaMondo(p,delta>0?"jail-bond-positive":"jail-bond-negative",delta>0?1:-1,{
      source:"carcere",reason:String(motivo||"carcere"),context:"carcere"
    });
  return p;
}

function carcereApplicaRelazioneEvento(e,r){
  const cfg=e&&CARCERE_EVENTO_RELAZIONE[e.id];
  if(!cfg) return r;
  const p=carcereModificaRapporto(cfg.profilo,cfg.delta,e.id);
  if(p&&r&&r.t) r.t=p.n+" — "+r.t;
  return r;
}

function carcereApplicaRelazioneHigh(e,o,r){
  if(!e) return r;
  let profilo=null,delta=0;
  if(e.id==="jail_high_schieramento"){
    profilo="cortile";delta=r&&r.c==="good"?2:r&&r.c==="bad"?-2:1;
  }else if(e.id==="jail_high_telefono"){
    profilo="giro";delta=o&&o.n==="Lo rifiuti"?-1:1;
  }else if(e.id==="jail_high_vecchio_opp"){
    profilo="conto";delta=r&&r.c==="good"?1:r&&r.c==="bad"?-3:-1;
  }else if(e.id==="jail_high_quando_esci"){
    profilo="giro";delta=o&&o.n==="Dici sì"?3:o&&o.n==="Dici no"?-2:1;
  }
  if(!profilo) return r;
  const p=carcereModificaRapporto(profilo,delta,e.id+":"+(o&&o.n||"scelta"));
  if(p&&r&&r.t) r.t=p.n+" — "+r.t;
  return r;
}

function carcerePersone(){
  const c=carcereStato();
  if(!c||!c.persone) return [];
  return Object.values(c.persone).map(id=>(G.gente||[]).find(p=>p&&p.id===id&&!p.via))
    .filter(Boolean)
    .sort((a,b)=>Number(carcerePersonaMeta(b).rapporto||0)-Number(carcerePersonaMeta(a).rapporto||0));
}

function carcereRelazioneEtichetta(p){
  const v=Number(carcerePersonaMeta(p)?.rapporto||0);
  return v>=7?"legame forte":v>=4?"si fida di te":v>=1?"rapporto buono":v<=-5?"conto aperto":v<=-2?"tensione":"vi conoscete";
}

function carcereScarcerazioneRelazioni(c){
  if(!c||!c.persone) return {contatti:[],rivali:[]};
  const contatti=[],rivali=[];
  for(const id of Object.values(c.persone)){
    const p=(G.gente||[]).find(x=>x&&x.id===id&&!x.via);
    if(!p) continue;
    const m=carcerePersonaMeta(p),rapporto=Number(m.rapporto||0);
    m.currentJailId=null;
    m.releasedAbsoluteDay=stradaAbsDay();

    if(rapporto>=4){
      stradaSegnaPersona(p,{
        key:"carcere:"+p.id,
        source:"carcere",
        story:"Vi siete conosciuti dentro e il rapporto ha retto fino all'uscita."
      });
      const st=stradaPersonaMeta(p);
      st.fiducia=Math.max(Number(st.fiducia||0),Math.min(35,5+rapporto*3));
      st.lastPlayerStreetInteractionAbsoluteDay=stradaAbsDay();
      m.linkedStreet=true;
      m.returnAfterAbsoluteDay=null;
      m.outsideFollowupDone=true;
      contatti.push(p);
      stradaRegistraConseguenzaPersona(p,"jail-contact-released",{jailId:c.jailId,rapporto});
    }else if(rapporto<=-4){
      stradaSegnaPersona(p,{key:"carcere:"+p.id,source:"carcere",story:"Un conto nato dentro è uscito insieme a voi."});
      const st=stradaPersonaMeta(p);
      st.fiducia=Math.min(Number(st.fiducia||5),10);
      stradaModificaTensionePersona(p,2,"carcere-conto-uscita");
      /* La rivalità esiste subito nella Strada, ma la faccia non deve apparire
         al Circolo nello stesso istante con un dialogo neutro. Il reincontro
         fisico arriva dopo, e mantiene il conto aperto. */
      p.circoloSbloccato=false;
      m.returnAfterAbsoluteDay=stradaAbsDay()+28;
      m.outsideFollowupDone=false;
      rivali.push(p);
    }else{
      /* Un rapporto non abbastanza forte da diventare subito contatto non
         sparisce dal gioco. Dopo settimane o mesi quella stessa faccia può
         ricomparire fuori; il giocatore deciderà allora se riaprire il filo. */
      const ritardo=rapporto>=2?42:rapporto>=1?56:rapporto===0?84:63;
      m.linkedStreet=false;
      m.returnAfterAbsoluteDay=stradaAbsDay()+ritardo;
      m.outsideFollowupDone=false;
    }
  }
  return {contatti,rivali};
}

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
      when:()=>stradaHaAvvocatoPrivato(),
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
      releaseRepBonus:0,releaseHeatBonus:0,persone:{}};
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
  if(!c.persone||typeof c.persone!=="object")c.persone={};
  const dk=carcereSerialeGiorno();if(!c.daily||c.daily.key!==dk)c.daily={key:dk};
  const wk=carcereSerialeSettimana();if(!c.weekly||c.weekly.key!==wk)c.weekly={key:wk};
  return c;
}
function carcereCtx(){
  const c=carcereStato(),s=G.strada,a=s&&s.arresto;
  return {state:c,street:s,arrest:a,day:carcereSerialeGiorno(),days:c?Math.max(0,carcereSerialeGiorno()-c.startedDay):0,
    weeks:a?Math.max(0,Number(a.settimane)||0):0,rep:s?Number(s.rep)||0:0,precedents:s?Number(s.precedenti)||0:0,
    fans:Number(G.fans)||0,lawyer:stradaHaAvvocatoPrivato()};
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
  let r=(o&&o.run?o.run(ctx):null)||{t:e.n,c:""};
  r=carcereApplicaRelazioneHigh(e,o,r)||r;
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

  let r=(e.run?e.run(ctx):null)||{t:e.n,c:""};
  r=carcereApplicaRelazioneEvento(e,r)||r;
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
  const privato=stradaHaAvvocatoPrivato(),avvSt=stradaAvvocatoStato();
  const legaleFine=(Number(a.settimane)||0)<=1;
  return [
    {id:"aria",n:"Ora d'aria",d:"60 min · recuperi un po' di testa e benessere",
     disabled:pending||airDays>0||ariaUsata||rem<60,
     reason:pending?"Decisione in sospeso":airDays>0?"Sospesa per "+airDays+(airDays===1?" giorno":" giorni"):ariaUsata?"Già fatta oggi":rem<60?"Troppo tardi oggi":""},
    {id:"giro",n:"Parla con il giro",d:"45 min · una volta a settimana · reputazione di strada",
     disabled:pending||giroUsato||rem<45,
     reason:pending?"Decisione in sospeso":giroUsato?"Già fatto questa settimana":rem<45?"Troppo tardi oggi":""},
    {id:"avvocato",n:privato?"Parla con "+(avvSt.name||"il tuo avvocato"):"Parla col difensore d'ufficio",
     d:privato
       ?"30 min · il tuo legale prova il ricorso · esito affidabile"
       :"30 min · gratuito · può tentare un riesame, ma senza garanzie",
     disabled:pending||!!c.ricorsoUsato||legaleFine||rem<30,
     reason:pending?"Decisione in sospeso":c.ricorsoUsato?"Ricorso già usato in questa detenzione":legaleFine?"Ti resta solo 1 settimana":rem<30?"Troppo tardi oggi":""}
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
    const presenti=carcerePersone();
    let p=presenti.find(x=>Number(carcerePersonaMeta(x).rapporto||0)>=0)||null;
    if(!p) p=carcerePersonaProfilo("giro",true);
    if(p){
      const profilo=carcerePersonaMeta(p).profilo||"giro";
      carcereModificaRapporto(profilo,2,"azione-giro");
    }
    s.rep=clamp((s.rep||0)+.5,0,100);G.wellbeing=clamp(G.wellbeing-1,0,100);
    const t=(p?p.n+" — ":"")+"Due parole nel cortile. Il nome gira un po', ma soprattutto il rapporto resta. Reputazione +0,5, benessere -1.";
    carcereRegistra("azione_giro","Parla con il giro",t,"azione");
    carcereChanged();if(typeof save==="function")save();return {ok:true,t:t,c:""};
  }
  if(id==="avvocato"){
    if(c.ricorsoUsato)return {ok:false,t:"Hai già usato il ricorso in questa detenzione."};
    if((Number(a.settimane)||0)<=1)return {ok:false,t:"Con una sola settimana residua non c'è più margine per il ricorso."};
    const tempo=carcereTempo(30,id);if(!tempo.ok)return tempo;
    const privato=stradaHaAvvocatoPrivato(),avvSt=stradaAvvocatoStato();
    const accolto=privato || Math.random()<.35;
    c.ricorsoUsato=true;
    if(accolto){
      a.settimane=Math.max(1,(Number(a.settimane)||1)-1);carcereLuc(privato?2:1);
      const t=privato
        ? (avvSt.name||"Il tuo avvocato")+" ottiene una revisione: 1 settimana in meno sulla pena residua. Lucidità +2."
        : "Il difensore d'ufficio riesce a ottenere il riesame: 1 settimana in meno. Lucidità +1.";
      carcereRegistra("azione_avvocato",privato?"Avvocato privato":"Difensore d'ufficio",t,"azione");
      if(typeof pushLog==="function")pushLog("<b>Dal carcere: ricorso accolto.</b> Una settimana in meno.","good");
      carcereChanged();if(typeof save==="function")save();return {ok:true,t:t,c:"good"};
    }
    carcereLuc(-1);
    const t="Il difensore d'ufficio presenta il riesame, ma viene respinto. La pena non cambia. Lucidità -1.";
    carcereRegistra("azione_avvocato","Difensore d'ufficio",t,"azione");
    carcereChanged();if(typeof save==="function")save();return {ok:true,t:t,c:"bad"};
  }
  return {ok:false,t:"Azione carcere sconosciuta."};
}
function carcereVista(){
  const c=carcereStato();if(!c)return {detenuto:false,azioni:[],eventi:[],persone:[],pendingHigh:null};
  return {
    detenuto:true,
    azioni:carcereAzioni(),
    eventi:c.eventi.slice(0,10),
    persone:carcerePersone().map(p=>({
      id:p.id,n:p.n,rapporto:Number(carcerePersonaMeta(p).rapporto||0),
      stato:carcereRelazioneEtichetta(p)
    })),
    pendingHigh:c.pendingHigh||null
  };
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
function stradaAttivitaProblemaDef(id){
  return STRADA_ATTIVITA_PROBLEMI.find(x=>x.id===id)||null;
}

function stradaAttivitaChiudiSettimana(a,roll,variantRoll){
  if(!a || !G.strada.attivita[a.id]) return {income:0,issue:null,paused:false};
  const st=stradaAttivitaStato(a.id,true);
  const settimana=stradaAttivitaWeekIndex();

  if(!stradaAttivitaOperativa(a.id)){
    st.pressione=Math.max(0,Number(st.pressione||0)-18);
    st.history.push({type:"paused-week",week:settimana});
    if(st.history.length>24) st.history.shift();
    return {income:0,issue:st.issue||null,paused:true};
  }

  const factor=st.issue?.id ? .65 : 1;
  const income=Math.round((Number(a.ricavoPulito||0)-Number(a.gestione||0))*factor);
  const used=stradaLavaggioUsatoCanale(a.id);
  const cap=Math.max(1,Number(a.capienza||a.resa||1));
  const load=Math.max(0,Math.min(1.5,used/cap));
  const risk=Math.min(.38,Number(a.rischio||.05)+load*.12+Number(st.pressione||0)/500);
  let issue=null;

  if(!st.issue && Number(st.lastIssueWeek)!==settimana){
    const r=Number.isFinite(Number(roll))?Number(roll):Math.random();
    st.lastIssueWeek=settimana;
    if(r<risk){
      const rv=Number.isFinite(Number(variantRoll))?Math.max(0,Math.min(.999999,Number(variantRoll))):Math.random();
      const def=STRADA_ATTIVITA_PROBLEMI[Math.floor(rv*STRADA_ATTIVITA_PROBLEMI.length)]||STRADA_ATTIVITA_PROBLEMI[0];
      st.issue={id:def.id,openedWeek:settimana};
      issue=def;
      st.history.push({type:"issue-opened",issueId:def.id,week:settimana,load:Number(load.toFixed(3))});
      const persone=stradaAttivitaPersone(a.id);
      const voce=def.tipo==="dipendente"?(persone.employee||persone.partner):(persone.partner||persone.employee);
      if(typeof pushLog==="function")
        pushLog("<b>"+a.n+": "+def.n+".</b> "+(voce?voce.n+" ti chiama: ":"")+def.testo,"bad");
      if(voce&&typeof postoRegistraConseguenzaMondo==="function")
        postoRegistraConseguenzaMondo(voce,"business-issue-opened",0,{
          source:"attivita",reason:def.id,context:a.id
        });
    }
  }

  st.pressione=Math.max(0,Math.min(100,Number(st.pressione||0)-10));
  st.history.push({type:"week-close",week:settimana,income,used,pressure:Number(st.pressione||0)});
  if(st.history.length>24) st.history.shift();
  return {income,issue:issue||st.issue||null,paused:false,load,risk};
}

function stradaAttivitaRisolviProblema(id,scelta){
  const a=stradaAttivitaDef(id),st=stradaAttivitaStato(id,true);
  if(!a||!st||!st.issue) return "Non c'è più nessun problema aperto.";
  const def=stradaAttivitaProblemaDef(st.issue.id);
  if(!def) { st.issue=null; return "Problema chiuso."; }
  const persone=stradaAttivitaPersone(id);
  const persona=def.tipo==="dipendente"?(persone.employee||persone.partner):(persone.partner||persone.employee);
  const settimana=stradaAttivitaWeekIndex();

  if(scelta==="sistema"){
    if(Number(G.money||0)<Number(def.costo||0))
      return "Non hai "+fmt(def.costo)+" € per sistemare la cosa adesso.";
    G.money-=Number(def.costo||0);
    st.pressione=Math.max(0,Number(st.pressione||0)-22);
    if(persona&&typeof postoRegistraConseguenzaMondo==="function")
      postoRegistraConseguenzaMondo(persona,"business-issue-resolved",1,{
        source:"attivita",reason:def.id,context:id
      });
    st.history.push({type:"issue-resolved",issueId:def.id,choice:"sistema",week:settimana});
  }else if(scelta==="pausa"){
    st.blockedUntilAbsoluteDay=stradaAbsDay()+7;
    st.pressione=Math.max(0,Number(st.pressione||0)-32);
    if(persona&&typeof postoRegistraConseguenzaMondo==="function")
      postoRegistraConseguenzaMondo(persona,"business-paused-cleanup",1,{
        source:"attivita",reason:def.id,context:id
      });
    st.history.push({type:"issue-resolved",issueId:def.id,choice:"pausa",week:settimana});
  }else{
    G.strada.heat=clamp(Number(G.strada.heat||0)+Number(def.heatIgnora||1),0,100);
    st.pressione=Math.min(100,Number(st.pressione||0)+18);
    if(persona&&typeof postoRegistraConseguenzaMondo==="function")
      postoRegistraConseguenzaMondo(persona,"business-issue-ignored",-1,{
        source:"attivita",reason:def.id,context:id
      });
    st.history.push({type:"issue-resolved",issueId:def.id,choice:"ignora",week:settimana});
  }
  if(st.history.length>24) st.history.shift();
  st.issue=null;
  if(typeof save==="function") save();
  renderStrada();renderGioco();
  return scelta==="sistema"?"Hai sistemato il problema senza fermare l'attività."
    :scelta==="pausa"?"Hai fermato l'attività per una settimana per rimetterla in ordine."
    :"Hai tirato dritto: il problema è chiuso, ma l'attenzione sale.";
}

function stScenaProblemaAttivita(id){
  const a=stradaAttivitaDef(id),st=stradaAttivitaStato(id,true);
  const def=st&&st.issue?stradaAttivitaProblemaDef(st.issue.id):null;
  if(!a||!def) return stScenaAttivita(id);
  return {
    k:"Attività",titolo:def.n,
    testo:"<b>"+a.n+"</b> · "+def.testo,
    opts:[
      {n:"Sistemala",d:"−"+fmt(def.costo)+" € · abbassi la pressione",
        no:Number(G.money||0)<Number(def.costo||0),
        run(){const t=stradaAttivitaRisolviProblema(id,"sistema");STRADA_SCENA=stScenaAttivita(id);renderStScheda();stToast(t);}},
      {n:"Fermati una settimana",d:"Niente ricavi e niente riciclaggio: ripulisci l'attività, non i soldi",
        run(){const t=stradaAttivitaRisolviProblema(id,"pausa");STRADA_SCENA=stScenaAttivita(id);renderStScheda();stToast(t);}},
      {n:"Tira dritto",d:"Non spendi ora · aumenta attenzione e tensione con chi ci lavora",hot:true,
        run(){const t=stradaAttivitaRisolviProblema(id,"ignora");STRADA_SCENA=stScenaAttivita(id);renderStScheda();stToast(t);}},
      {n:"Torna indietro",d:"Non decidi adesso",run(){STRADA_SCENA=stScenaAttivita(id);renderStScheda();}}
    ]
  };
}

function stradaAttivitaContattoIncontro(id){
  if(typeof stradaContattiAttivi!=="function") return null;
  const persone=stradaAttivitaPersone(id);
  const esclusi=new Set([persone.partner&&persone.partner.id,persone.employee&&persone.employee.id].filter(Boolean));
  return stradaContattiAttivi().filter(p=>p&&!esclusi.has(p.id)&&!stradaHeatPersonaCauta(p))
    .sort((a,b)=>stradaFiduciaValore(b)-stradaFiduciaValore(a))[0]||null;
}

function stradaAttivitaIncontro(id){
  if(!stradaPartecipazioneAttiva())return "Hai mollato il giro: l'attività resta un'impresa, non un punto d'incontro criminale.";
  const st=stradaAttivitaStato(id,true),persone=stradaAttivitaPersone(id);
  const contatto=stradaAttivitaContattoIncontro(id);
  const week=stradaAttivitaWeekIndex();
  if(!st||!contatto){
    const prudenti=stradaContattiAttivi().filter(stradaHeatPersonaCauta);
    if(prudenti.length)
      return "Con l'attenzione così alta, i contatti che potresti portare qui non vogliono farsi vedere con te.";
    return "Non hai ancora un contatto con cui abbia senso fissare qui un incontro.";
  }
  if(Number(st.lastMeetingWeek)===week) return "Questa settimana hai già usato l'attività come punto d'incontro.";
  if(!stradaAttivitaOperativa(id)) return "L'attività è ferma: non è il momento di portarci gente.";
  if(typeof GAME_TIME!=="undefined"&&typeof GAME_TIME.spend==="function"){
    const tx=GAME_TIME.spend(45,"crime:business-meeting",{detail:{activityId:id,personId:contatto.id}});
    if(tx&&tx.blocked) return "Non hai abbastanza tempo o c'è una situazione da chiudere prima.";
  }
  st.lastMeetingWeek=week;
  st.pressione=Math.min(100,Number(st.pressione||0)+3);
  stradaModificaFiducia(contatto,2,"incontro-attivita-"+id);
  if(persone.partner&&typeof postoCollegaPersone==="function")
    postoCollegaPersone(persone.partner,contatto,"attivita-incontro");
  if(persone.partner&&typeof postoRegistraConseguenzaMondo==="function")
    postoRegistraConseguenzaMondo(persone.partner,"business-meeting",1,{
      source:"attivita",reason:"incontro",context:id,
      relatedPersonId:contatto.id,relatedPersonName:contatto.n
    });
  st.history.push({type:"meeting",week,personId:contatto.id});
  if(st.history.length>24) st.history.shift();
  save();renderStrada();renderGioco();
  return "Hai fatto incontrare "+contatto.n+" qui. La relazione si muove anche fuori dalla Strada.";
}

function stScenaAttivita(id){
  const a=stradaAttivitaDef(id),st=stradaAttivitaStato(id,true);
  if(!a||!st) return {k:"Attività",titolo:"Non disponibile",testo:"",opts:[{n:"Chiudi",run(){STRADA_SCENA=null;}}]};
  const persone=stradaAttivitaPersone(id);
  const usato=stradaLavaggioUsatoCanale(id),residuo=stradaLavaggioResiduoCanale(id);
  const contatto=stradaAttivitaContattoIncontro(id);
  const week=stradaAttivitaWeekIndex();
  const fermata=!stradaAttivitaOperativa(id);
  const rischio=a.rischio<.07?"basso":a.rischio<.1?"medio":"alto";
  const opts=[];
  if(st.issue) opts.push({n:"Problema aperto",d:(stradaAttivitaProblemaDef(st.issue.id)||{}).n||"Da gestire",
    hot:true,run(){STRADA_SCENA=stScenaProblemaAttivita(id);renderStScheda();}});
  if(!fermata&&Number(G.strada.sporchi||0)>0&&residuo>0)
    opts.push({n:"Fai passare soldi",d:"Residuo "+fmt(residuo)+" € · scegli tu l'importo",
      run(){STRADA_SCENA=stScenaLavaggioCanale(id);renderStScheda();}});
  if(!fermata&&contatto&&Number(st.lastMeetingWeek)!==week)
    opts.push({n:"Fissa un incontro con "+contatto.n,d:"45 min · usa l'attività come luogo reale della rete",
      run(){const t=stradaAttivitaIncontro(id);STRADA_SCENA=stScenaAttivita(id);renderStScheda();stToast(t);}});
  opts.push({n:"Chiudi",d:"Torna alle attività",run(){STRADA_SCENA=null;}});

  return {
    k:"Attività di copertura",titolo:a.n,
    testo:(fermata?"<b>FERMA questa settimana.</b> ":"")+
      "Ricavi normali "+fmt(a.ricavoPulito)+" € − "+fmt(a.gestione)+" € di gestione. "+
      "Capienza "+fmt(a.capienza)+" €, rischio "+rischio+". "+
      (persone.partner?"Responsabile: <b>"+persone.partner.n+"</b>. ":"")+
      (persone.employee?"Dipendente: <b>"+persone.employee.n+"</b>.":""),
    stats:[
      {t:"passati "+fmt(usato)+" €"},
      {t:"pressione "+Math.round(Number(st.pressione||0))+"/100"},
      {t:st.issue?"problema aperto":"operativa"}
    ],
    opts
  };
}

function stradaSettimana(){
  const s = G.strada;

  /* Un accordo di protezione ancora attivo è una relazione viva: il pagamento
     settimanale conta come contatto e non deve far "sparire" il provider per
     semplice trascorrere del tempo. */
  const protRel=stradaProtezioneStato();
  if(Number(s.prot||0)>0 && protRel.providerPersonId){
    const providerRel=stradaPersonaDaId(protRel.providerPersonId);
    if(providerRel) stradaRegistraInterazione(providerRel,"protezione-attiva");
  }
  stradaAggiornaRelazioniCriminali(false);

  if(s.arresto){
    s.arresto.settimane--;
    const persi = Math.round(G.fans * rnd(.06, .13));
    if(persi > 0){ G.fans = Math.max(0, G.fans - persi); pushLog(fmt(persi) + " fan spariti mentre eri dentro.", "bad"); }
    G.hype = clamp(G.hype * .72, 0, (typeof hypeCap==="function"?hypeCap():100));
    /* Il legale privato resta un incarico vero anche mentre sei dentro.
       La protezione esterna resta invece sospesa come prima. */
    const avvStDentro=stradaAvvocatoStato();
    if(avvStDentro.retained){
      if(avvStDentro.prepaidWeekKey===stradaWeekKey()){
        avvStDentro.prepaidWeekKey=null;
      }else if(Number(G.money||0)>=STRADA_AVVOCATO_COSTO){
        G.money-=STRADA_AVVOCATO_COSTO;
      }else{
        const legale=avvStDentro.personId?(G.gente||[]).find(p=>p&&p.id===avvStDentro.personId&&!p.via):null;
        if(legale) legale.rel=Math.max(0,Number(legale.rel||0)-1);
        s.avvocato=false;avvStDentro.retained=false;avvStDentro.prepaidWeekKey=null;
        avvStDentro.history.push({status:"unpaid-in-jail",personId:avvStDentro.personId||null,
          name:avvStDentro.name||null,absoluteDay:stradaAbsDay()});
        if(avvStDentro.history.length>12)avvStDentro.history.shift();
        pushLog("<b>Il legale privato ha lasciato l'incarico.</b> Da ora ti segue il difensore d'ufficio.", "bad");
      }
    }

    /* Dentro si paga comunque di più per pacchi, telefonate e gestione della
       vita fuori; il legale privato è contabilizzato separatamente sopra. */
    const dentro = Math.round(weeklyCosts() * .6);
    G.money -= dentro;
    pushLog("Da dentro costa: <b>−" + fmt(dentro) + " €</b> fra pacchi, telefonate e spese extra, oltre alle spese di fuori.", "bad");
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
      const relazioniUscita=carcereScarcerazioneRelazioni(jailFx);
      s.arresto = null;
      s.rep = clamp(s.rep + 12 + (Number(jailFx.releaseRepBonus)||0), 0, 100);
      s.heat = clamp(s.heat + (Number(jailFx.releaseHeatBonus)||0), 0, 100);
      if(jailFx.releaseRepBonus || jailFx.releaseHeatBonus)
        pushLog("<b>Quello che hai deciso dentro ti aspetta fuori.</b> Il giro e l'attenzione ripartono da dove li avevi lasciati.", "");
      if(relazioniUscita.contatti.length)
        pushLog("<b>Non sei uscito da solo.</b> "+relazioniUscita.contatti.map(p=>p.n).join(", ")+
          (relazioniUscita.contatti.length===1?" resta un contatto costruito dentro.":" restano contatti costruiti dentro."),"good");
      if(relazioniUscita.rivali.length)
        pushLog("<b>Un conto ha passato il cancello con te.</b> "+relazioniUscita.rivali.map(p=>p.n).join(", ")+
          (relazioniUscita.rivali.length===1?" non ha dimenticato.":" non hanno dimenticato."),"bad");
      showEvent({k:"Sei uscito", t:"Fuori", d:"La storia di «" + colpoFatto + "» ti ha seguito fin qui."+
        (relazioniUscita.contatti.length?" Anche "+relazioniUscita.contatti.map(p=>p.n).join(", ")+" fa parte di quello che ti porti fuori.":"")+
        (relazioniUscita.rivali.length?" C'è però un conto aperto con "+relazioniUscita.rivali.map(p=>p.n).join(", ")+".":""),
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

  /* Punto Strada 17: l'impresa produce reddito normale, non denaro sporco
     dal nulla. Il denaro sporco entra solo quando il giocatore decide di farlo
     passare; il volume di quella scelta alimenta rischio e problemi operativi. */
  let attive=0,redditoAttivita=0;
  for(const a of STRADA_ATTIVITA){
    if(!s.attivita[a.id]) continue;
    attive++;
    const esito=stradaAttivitaChiudiSettimana(a);
    redditoAttivita+=Number(esito.income||0);
  }
  if(redditoAttivita){
    G.money+=redditoAttivita;
    if(typeof lifestyleRegistraEntrata==="function")
      lifestyleRegistraEntrata(redditoAttivita,"attivita");
    else G._entratePulite=Number(G._entratePulite||0)+redditoAttivita;
    pushLog("<b>Attività di copertura:</b> "+fmt(redditoAttivita)+" € netti da ricavi normali.","good");
  }

  if(!stradaPartecipazioneAttiva()){
    /* Le attività continuano a essere imprese reali, ma il lato criminale è
       chiuso. Heat e reputazione si raffreddano più rapidamente; il passato
       può ancora riemergere finché la memoria residua non scade. */
    s.heat=clamp(Number(s.heat||0)*.85,0,100);
    s.rep=clamp(Number(s.rep||0)-1.2,0,100);
    stradaHeatSincronizzaPersone();
    stradaPassatoSettimana(Math.random(),Math.random());
    return;
  }

  /* Punto 6: protezione e avvocato sono accordi con persone reali.
     La prima settimana viene pagata al momento dell'accordo e non viene
     addebitata due volte alla chiusura della stessa settimana. */
  const protSt=stradaProtezioneStato();
  if(s.prot>0){
    const provider=protSt.providerPersonId?stradaPersonaDaId(protSt.providerPersonId):null;
    const legacy=protSt.source==="legacy";
    if(!legacy && (!provider || provider.via)){
      protSt.history.push({status:"provider-lost",level:Number(s.prot||0),absoluteDay:stradaAbsDay()});
      if(protSt.history.length>12)protSt.history.shift();
      s.prot=0;protSt.level=0;protSt.providerPersonId=null;protSt.providerName=null;protSt.source=null;protSt.prepaidWeekKey=null;
      pushLog("<b>Protezione saltata.</b> La persona che garantiva per te non c'è più.", "bad");
    }else if(protSt.prepaidWeekKey===stradaWeekKey()){
      protSt.prepaidWeekKey=null;
    }else{
      const costoProt=Number(STRADA_PROT[s.prot].costo||0);
      if(Number(G.money||0)>=costoProt){
        G.money-=costoProt;
        if(provider) stradaRegistraInterazione(provider,"protezione-pagata");
      }else{
        if(provider) stradaModificaFiducia(provider,-5,"protezione-non-pagata");
        protSt.history.push({status:"unpaid",level:Number(s.prot||0),providerPersonId:protSt.providerPersonId||null,
          providerName:protSt.providerName||null,absoluteDay:stradaAbsDay()});
        if(protSt.history.length>12)protSt.history.shift();
        s.prot=0;protSt.level=0;protSt.providerPersonId=null;protSt.providerName=null;protSt.source=null;protSt.prepaidWeekKey=null;
        pushLog("<b>Protezione saltata.</b> Non avevi abbastanza per pagarla questa settimana.", "bad");
      }
    }
  }

  const avvSt=stradaAvvocatoStato();
  if(avvSt.retained){
    const legale=avvSt.personId?(G.gente||[]).find(p=>p&&p.id===avvSt.personId&&!p.via):null;
    const legacy=avvSt.source==="legacy";
    if(!legacy && !legale){
      s.avvocato=false;avvSt.retained=false;avvSt.prepaidWeekKey=null;
      avvSt.history.push({status:"lost-contact",personId:avvSt.personId||null,name:avvSt.name||null,absoluteDay:stradaAbsDay()});
      if(avvSt.history.length>12)avvSt.history.shift();
      pushLog("<b>Il tuo avvocato non è più disponibile.</b> In caso di arresto torni alla difesa d'ufficio.", "bad");
    }else if(avvSt.prepaidWeekKey===stradaWeekKey()){
      avvSt.prepaidWeekKey=null;
    }else if(Number(G.money||0)>=STRADA_AVVOCATO_COSTO){
      G.money-=STRADA_AVVOCATO_COSTO;
    }else{
      s.avvocato=false;avvSt.retained=false;avvSt.prepaidWeekKey=null;
      if(legale) legale.rel=Math.max(0,Number(legale.rel||0)-1);
      avvSt.history.push({status:"unpaid",personId:avvSt.personId||null,name:avvSt.name||null,absoluteDay:stradaAbsDay()});
      if(avvSt.history.length>12)avvSt.history.shift();
      pushLog("<b>L'avvocato si è tirato indietro.</b> La parcella non era coperta.", "bad");
    }
  }

  /* attenzione: scende ~6% a settimana, ~12% con un avvocato privato */
  s.heat = clamp(s.heat * (1 - (stradaHaAvvocatoPrivato() ? .12 : .06)), 0, 100);
  /* la reputazione si sgonfia un po' se non ti fai vedere */
  s.rep = clamp(s.rep - .6, 0, 100);

  /* Punto 19: dopo il raffreddamento naturale, il valore rimasto modifica
     persone, porte aperte e richieste del giro. */
  stradaHeatMuoviMondo(Math.random(),false);

  /* Punto 18: il rischio lifestyle si chiude in advanceWeek(), dopo che
     tutte le fonti giustificabili della settimana sono state registrate. */

  /* Punto 5: possedere il ferro è già un rischio. Senza ferro i controlli
     seri restano legati a heat > 50; col ferro possono partire prima e la
     probabilità cresce con attenzione e precedenti. */
  const rischioControllo=stradaHeatRischioControllo();
  if(rischioControllo>0 && Math.random()<rischioControllo){
    if(s.ferro){
      const ferroSt=stradaFerroStato();
      s.ferro=false;
      ferroSt.history.push({
        status:"seized",
        sourcePersonId:ferroSt.sourcePersonId||null,
        sourceName:ferroSt.sourceName||null,
        closedAbsoluteDay:stradaAbsDay()
      });
      if(ferroSt.history.length>12) ferroSt.history.shift();
      ferroSt.nextOfferAbsoluteDay=stradaAbsDay()+30;
      const settimane = Math.max(1, Math.round(2 * (1 + s.precedenti * .35) *
        stradaHeatPenaMoltiplicatore() * (stradaHaAvvocatoPrivato() ? .55 : 1)));
      s.precedenti++; s.arresto = {settimane:settimane, colpo:"perquisizione"};
      pushLog("<b>Controllo alle sei del mattino.</b> Trovano il ferro: viene sequestrato e la situazione diventa penale.", "bad");
    }else{
      const hm=stradaHeatMondoStato(), prof=stradaHeatProfilo();
      hm.history.push({type:"control",absoluteDay:stradaAbsDay(),heat:Number(s.heat||0),heatBand:prof.id,found:false});
      if(hm.history.length>30) hm.history.shift();
      pushLog(prof.id==="critico"
        ? "<b>Controllo alle sei del mattino.</b> Non trovano niente, ma ormai basta il tuo nome per farli tornare."
        : "Controllo alle sei del mattino. Non hanno trovato niente, ma l'hanno fatto girare in paese.",
        prof.id==="critico"?"bad":"");
    }
  }

  /* Gli Opp criminali non possono nascere dal nulla su una carriera pulita. */
  const giroAvviato=stradaGiroAvviato();
  const probOpp = clamp(.018 + s.heat/100 * .05 + s.rep/100 * .04 + attive * .008 - s.prot * .015, .01, .3);
  if(giroAvviato && !s.arresto && Math.random() < probOpp) stradaOpp();
}

function stradaOpp(){
  if(!stradaPartecipazioneAttiva())return false;
  const s = G.strada;
  const fidati=stradaPersoneSquadra();
  const chiamabile=fidati[0]||null;
  showEvent({k:"Fuori programma", t:"Ti aspettano", d:"Non te l'aspettavi: qualcuno ti sta aspettando sotto casa.",
    annulla(){},
    opts:[
      {n:"Scappi", d:"Ti prendono il contante che hai addosso", run(){
        const perso = Math.round(G.money * .15);
        G.money -= perso;
        return {t:"Sei scappato. Ti hanno preso " + fmt(perso) + " €, e in giro si è visto.", c:"bad"};
      }},
      {n:"Li affronti", d:"Rischi, ma se vinci sali", run(){
        const vinci = Math.random() < clamp(.4 + s.rep/200, .15, .85);
        if(vinci){ s.rep = clamp(s.rep + 6, 0, 100); G.hype = clamp(G.hype + 4, 0, (typeof hypeCap==="function"?hypeCap():100));
          return {t:"Li hai affrontati e hai vinto. La cosa gira.", c:"good"}; }
        G.wellbeing = clamp(G.wellbeing - 15, 0, 100);
        return {t:"Li hai affrontati e sei rimasto male. Settimana da dimenticare.", c:"bad"};
      }},
      {n:chiamabile ? "Chiami "+chiamabile.n : "Chiami qualcuno",
       d:chiamabile ? "Fiducia: "+stradaFiduciaEtichetta(chiamabile) : "Nessuno si fida abbastanza da arrivare per te",
       run(){
        if(!chiamabile) return {t:"Non avevi nessuno che si fidasse abbastanza da arrivare per te.", c:"bad"};
        const chance=clamp(.55+stradaFiduciaValore(chiamabile)/250,.55,.90);
        if(Math.random()<chance){
          stradaModificaFiducia(chiamabile,3,"opp-aiuto-success");
          return {t:"<b>"+chiamabile.n+"</b> arriva in tempo. Stavolta ne uscite puliti.", c:"good"};
        }
        stradaModificaFiducia(chiamabile,-6,"opp-aiuto-failure");
        G.wellbeing = clamp(G.wellbeing - 10, 0, 100);
        return {t:"<b>"+chiamabile.n+"</b> prova a coprirti, ma la situazione si mette male per entrambi.", c:"bad"};
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
  {id:"provincia", n:"Provincia", d:"4 offerte oggi", req:null},
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
function stradaRischioValore(colpo){
  const eff=stradaEffettiCategoria(colpo);
  return clamp(Number(colpo.difficolta||0)-eff.chance*.55+(eff.heat-1)*.32,0,1);
}
function stRischio(colpo){
  const r=stradaRischioValore(colpo);
  return r <= .2 ? "Basso" : r <= .45 ? "Medio" : "Alto";
}
function stClasseRischio(colpo){
  const r=stradaRischioValore(colpo);
  return r <= .2 ? "risk-low" : r <= .45 ? "risk-mid" : "risk-high";
}
function stOcchiAddosso(){
  return stradaHeatProfilo().occhi;
}
function stCopertura(){
  const s = G.strada;
  /* Gli uomini numerici sono solo compatibilità legacy e non costano più.
     Qui mostriamo solo gli accordi realmente attivi. */
  return STRADA_PROT[s.prot].costo + (stradaHaAvvocatoPrivato() ? STRADA_AVVOCATO_COSTO : 0);
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
  const partecipa=stradaPartecipazioneAttiva();
  rip.textContent = s.arresto ? "In carcere: nessuna ripulitura"
    : !partecipa ? "Fuori dal giro: riciclaggio chiuso"
    : ripCap <= 0 ? "Limite settimanale raggiunto"
    : "Ripulisci fino a " + fmt(ripCap) + " € · " + ripDur;
  rip.classList.toggle("no", s.sporchi <= 0 || !!s.arresto || !partecipa || ripCap <= 0);
  rip.disabled = !!s.arresto || !partecipa || s.sporchi <= 0 || ripCap <= 0;

  $("st-repn").textContent = Math.round(stradaReputazioneGlobale());
  $("st-repbar").style.width = stradaReputazioneGlobale() + "%";
  $("st-heatn").textContent = Math.round(s.heat);
  $("st-heatbar").style.width = clamp(s.heat, 0, 100) + "%";
  $("st-energia").textContent = G.energy + " / " + G.maxEnergy;
  $("st-puliti").textContent = fmt(G.money) + " €";
  $("st-precedenti").textContent = s.precedenti;
  const occhi = $("st-occhi");
  occhi.textContent = stOcchiAddosso();
  occhi.classList.toggle("hot", s.heat >= 50);

  const molla=$("st-molla");
  if(molla){
    molla.textContent=partecipa?"Molla il giro":"Fuori dal giro";
    molla.disabled=!partecipa||!!s.arresto;
    molla.classList.toggle("no",!partecipa||!!s.arresto);
  }
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

  if(!stradaPartecipazioneAttiva()){
    const u=stradaUscitaStato();
    const giorni=Math.max(0,Number(u.memoryUntilAbsoluteDay||0)-stradaAbsDay());
    centro.classList.remove("locked");
    griglia.className="dentro";
    griglia.innerHTML="<b>Hai mollato il giro</b><p>Non accetti più colpi e non ricicli denaro. "+
      (giorni>0
        ? "Il passato però è ancora vicino: può tornare a bussare per circa "+giorni+" giorni."
        : "Il giro ha smesso di cercarti, ma persone, precedenti e storia restano nel personaggio.")+
      "</p>";
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
  const offerte = stradaColpiDisponibili();
  const leadIncontro = stradaOpportunitaAttiva();
  const leadLavoro = window.ADF_WORK_EVENTS &&
    typeof ADF_WORK_EVENTS.crimeLeadActive === "function"
      ? ADF_WORK_EVENTS.crimeLeadActive()
      : null;
  griglia.innerHTML = offerte.map((c, i) => {
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
        '<span class="stchip">' + stradaCategoria(c).n + '</span>' +
        '<span class="stchip money">' + fmt(c.min) + '–' + fmt(c.max) + ' €</span>' +
        '<span class="stchip">' + c.energia + ' energia</span>' +
        '<span class="stchip">' + stradaDurataColpoLabel(c) + '</span>' +
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
  stradaAggiornaRelazioniCriminali(true);
  const prot = STRADA_PROT[s.prot];
  const protSt=stradaProtezioneStato();
  const avvSt=stradaAvvocatoStato();
  const tuttiContatti=(G.gente||[]).filter(p=>p&&p.strada&&p.strada.known&&!p.via);
  const rivali=tuttiContatti.filter(stradaRivalitaAttiva);
  stradaHeatSincronizzaPersone();
  const contatti=tuttiContatti.filter(stradaRelazioneDisponibile)
    .sort((a,b)=>stradaFiduciaValore(b)-stradaFiduciaValore(a));
  const prudenti=contatti.filter(stradaHeatPersonaCauta);
  const operativi=contatti.filter(p=>!stradaHeatPersonaCauta(p));
  const dormienti=tuttiContatti.filter(p=>!stradaRelazioneDisponibile(p) && !stradaRivalitaAttiva(p));
  const fidati=operativi.filter(p=>stradaFiduciaValore(p)>=STRADA_FIDUCIA_SQUADRA);
  const heatMondo=stradaHeatProfilo();
  const avvConosciuti=stradaAvvocatiConosciuti();
  const tenore=typeof lifestyleRiepilogoRischio==="function"
    ? lifestyleRiepilogoRischio()
    : {id:"coerente",label:"Coerente",entrate:Number(G._entratePulite||0),visibile:typeof lifeCost==="function"?lifeCost():0,
       testo:"Il tuo tenore di vita è compatibile con quello che puoi giustificare."};
  $("st-tab-copre").innerHTML =
    '<div class="cover-row"><div class="t"><strong>Persone del giro (' + contatti.length + ' attive)</strong>' +
      '<span>' + (fidati.length
        ? fidati.length + ' ' + (fidati.length===1?'si fida':'si fidano') + ' abbastanza da muoversi con te.'
        : 'Conosci gente, ma nessuno attivo si fida ancora abbastanza da venire a un colpo con te.') +
        (prudenti.length ? ' · ' + prudenti.length + ' ' +
          (prudenti.length===1?'contatto si tiene basso per l\'attenzione':'contatti si tengono bassi per l\'attenzione') + '.' : '') +
        (dormienti.length ? ' · ' + dormienti.length + ' ' +
          (dormienti.length===1?'contatto è fuori dal giro per ora':'contatti sono fuori dal giro per ora') + '.' : '') +
        (rivali.length ? ' · ' + rivali.length + ' ' +
          (rivali.length===1?'rapporto è diventato una rivalità':'rapporti sono diventati rivalità') + '.' : '') +
      '</span></div>' +
      '<div class="pills">' +
        (contatti.slice(0,3).map(p=>'<span class="pill' +
          (stradaHeatPersonaCauta(p)?' no':stradaFiduciaValore(p)>=STRADA_FIDUCIA_SQUADRA?' on':'') + '">' +
          p.n + ' · Fiducia: ' + stradaFiduciaEtichetta(p) +
          (stradaHeatPersonaCauta(p)?' · si tiene basso':'') +
          (stradaConseguenzePersona(p).debiti ? ' · Gli devi '+stradaConseguenzePersona(p).debiti+' favore/i' : '') +
          '</span>').join('') ||
          '<span class="pill no">Nessun contatto attivo</span>') +
        (dormienti.length ? '<span class="pill no">' + dormienti.length + ' non raggiungibili</span>' : '') +
        (rivali.slice(0,2).map(p=>'<span class="pill danger">'+p.n+' · Rivalità</span>').join('')) +
      '</div></div>' +

    '<div class="cover-row"><div class="t"><strong>Pressione sul giro</strong>' +
      '<span>'+heatMondo.mondo+'</span></div>' +
      '<div class="pills"><span class="pill'+(heatMondo.id==="basso"?' on':heatMondo.id==="medio"?'':' danger')+'">'+
        heatMondo.label+'</span></div></div>' +

    '<div class="cover-row"><div class="t"><strong>Protezione</strong>' +
      '<span>' + (s.prot>0
        ? (protSt.providerName ? protSt.providerName+' garantisce per te · ' : '') + fmt(prot.costo) + ' €/sett.'
        : 'Non si attiva da sola: serve qualcuno del giro disposto a metterci il proprio nome.') + '</span></div>' +
      '<div class="pills"><button class="pill' + (s.prot > 0 ? " on" : "") + '" data-stprot>' +
      (s.prot>0 ? prot.n : "Gestisci") + '</button></div></div>' +

    '<div class="cover-row"><div class="t"><strong>Il ferro</strong>' +
      '<span>' + (s.ferro
        ? 'Lo possiedi. Più riuscita, ma un controllo può diventare carcere.'
        : 'Non si compra qui: serve un contatto molto fidato che si prenda il rischio di procurartelo.') + '</span></div>' +
      '<div class="pills"><button class="pill danger' + (s.ferro ? " on" : "") + '" data-stferro>' +
      (s.ferro ? "Ce l\'hai" : "Serve un contatto") + '</button></div></div>' +

    '<div class="cover-row"><div class="t"><strong>Avvocato</strong>' +
      '<span>' + (avvSt.retained
        ? (avvSt.name||"Avvocato privato") + ' · ' + fmt(STRADA_AVVOCATO_COSTO) + ' €/sett.'
        : avvConosciuti.length
          ? 'Conosci un legale abbastanza bene da potergli affidare l\'incarico.'
          : 'Di base hai solo la difesa d\'ufficio. Un legale privato va prima conosciuto nel mondo.') + '</span></div>' +
      '<div class="pills"><button class="pill' + (avvSt.retained ? " on" : "") + '" data-stavvocato>' +
      (avvSt.retained ? "Gestisci" : avvConosciuti.length ? "Incarica" : "Serve un contatto") + '</button></div></div>' +

    '<div class="cover-row"><div class="t"><strong>Costo copertura</strong>' +
      '<span>Quello che ti esce di tasca ogni settimana per gli accordi attivi.</span></div>' +
      '<div class="pills"><span class="pill on">' + fmt(stCopertura()) + ' €/sett.</span></div></div>' +

    '<div class="cover-row"><div class="t"><strong>Tenore di vita</strong>' +
      '<span>'+tenore.testo+' · circa '+fmt(tenore.entrate)+' €/sett. giustificabili contro '+
        fmt(tenore.visibile)+' €/sett. visibili.</span></div>' +
      '<div class="pills"><span class="pill'+(tenore.id==="coerente"?' on':tenore.id==="tirato"?'':' danger')+'">'+
        tenore.label+'</span></div></div>' +

    '<div class="street-note">Nel giro non compri sicurezza. Compri relazioni, favori e persone disposte a esporsi per te.</div>';
}

function renderStAttivita(){
  const s = G.strada;
  $("st-tab-attivita").innerHTML =
    STRADA_ATTIVITA.map(a => {
      const tua=!!s.attivita[a.id];
      if(!tua){
        const rischio=a.rischio<.07?"basso":a.rischio<.1?"medio":"alto";
        return '<div class="activity">' +
          '<div class="a-top"><strong>'+a.n+'</strong><span class="price">'+fmt(a.costo)+' €</span></div>' +
          '<p>Ricavi normali '+fmt(a.ricavoPulito)+' €/sett. · −'+fmt(a.gestione)+' € gestione · '+
            'capienza '+fmt(a.capienza)+' € · rischio '+rischio+'.</p>' +
          '<button class="pill'+(G.money<a.costo?" no":"")+'" data-stattivita="'+a.id+'">Rileva</button>' +
          '</div>';
      }

      const st=stradaAttivitaStato(a.id,true),persone=stradaAttivitaPersone(a.id);
      const fermata=!stradaAttivitaOperativa(a.id);
      const stato=fermata?"FERMA":st.issue?"PROBLEMA":"OPERATIVA";
      const residuo=stradaLavaggioResiduoCanale(a.id);
      return '<div class="activity owned">' +
        '<div class="a-top"><strong>'+a.n+'</strong><span class="price">'+stato+'</span></div>' +
        '<p>'+(persone.partner?persone.partner.n+' · ':'')+
          'netto normale '+fmt(Math.max(0,a.ricavoPulito-a.gestione))+' €/sett. · '+
          'riciclaggio residuo '+fmt(residuo)+' € · pressione '+Math.round(Number(st.pressione||0))+'/100'+
          (st.issue?' · <b>'+(stradaAttivitaProblemaDef(st.issue.id)||{}).n+'</b>':'')+'.</p>' +
        '<button class="pill'+(st.issue?" danger":"")+'" data-stgestione="'+a.id+'">Gestisci</button>' +
        '</div>';
    }).join("") +
    '<div class="business-foot">Sono imprese vere: producono reddito pulito, hanno persone e problemi. Il denaro sporco passa solo quando decidi tu quanto esporle.</div>';
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
  if(Number(G.strada.sporchi||0)<=0){ stToast("Non hai soldi sporchi da ripulire."); return; }
  if(stradaCapienza()<=0){ stToast("Hai già usato tutta la capacità di questa settimana."); return; }
  STRADA_SCENA=stScenaRiciclaggio();
  renderStScheda();
};

$("st-tab-copre").addEventListener("click", ev => {
  const uomo = ev.target.closest("[data-stuomo]");
  if(uomo){ hubTap(); stToast(uomo.dataset.stuomo === "piu" ? stAssumiUomo() : stLicenziaUomo()); return; }
  if(ev.target.closest("[data-stprot]")){
    hubTap(); STRADA_SCENA=stScenaProtezione(); renderStScheda(); return;
  }
  if(ev.target.closest("[data-stferro]")){ hubTap(); stToast(stCompraFerro()); return; }
  if(ev.target.closest("[data-stavvocato]")){
    hubTap(); STRADA_SCENA=stScenaAvvocato(); renderStScheda(); return;
  }
});

$("st-tab-attivita").addEventListener("click", ev => {
  const gestisci=ev.target.closest("[data-stgestione]");
  if(gestisci){
    hubTap();
    STRADA_SCENA=stScenaAttivita(gestisci.dataset.stgestione);
    renderStScheda();
    return;
  }
  const a=ev.target.closest("[data-stattivita]");
  if(!a) return;
  hubTap();stToast(stCompraAttivita(a.dataset.stattivita));
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
  if(!stradaPartecipazioneAttiva()){ stToast("Hai già mollato il giro."); return; }
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
