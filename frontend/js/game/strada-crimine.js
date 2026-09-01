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
   d:"Ãˆ arrivata da poco e scotta: va fatta sparire in fretta.",
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

function stradaTenta(colpoId, approccioId){
  const colpo = STRADA_COLPI.find(c => c.id === colpoId);
  const approccio = STRADA_APPROCCI.find(a => a.id === approccioId);
  if(!colpo || !approccio) return;
  const s = G.strada;

  if(G.energy < colpo.energia){ STRADA_SCENA = stScenaAvviso(colpo, "Non hai abbastanza energia per questo colpo (serve " + colpo.energia + ")."); return; }
  if(approccio.serveUomo && s.uomini <= 0){ STRADA_SCENA = stScenaAvviso(colpo, "Ti serve avere almeno un uomo con te."); return; }
  if(approccio.serveFerro && !s.ferro){ STRADA_SCENA = stScenaAvviso(colpo, "Ti serve il ferro, e non ce l'hai ancora."); return; }

  G.energy -= colpo.energia;
  const successo = Math.random() < stradaChance(colpo, approccio);
  const rumore = clamp((6 + colpo.difficolta * 10) * approccio.rumore, 2, 30);

  if(successo){
    const grezzo = rnd(colpo.min, colpo.max) * approccio.guadagno;
    const pulito = Math.round(grezzo * .4), sporco = Math.round(grezzo * .6);
    G.money += pulito; s.sporchi += sporco;
    s.rep = clamp(s.rep + 3 + colpo.difficolta * 6, 0, 100);
    s.heat = clamp(s.heat + rumore * .6, 0, 100);
    STRADA_SCENA = {k:"Com'è andata", titolo:"Andata bene", testo:"<b>" + colpo.n + "</b>: " + fmt(pulito) + " € in tasca, " +
        fmt(sporco) + " € sporchi da ripulire. In giro si comincia a parlarne.",
      opts:[{n:"Continua", d:"Torni alla strada", run(){ STRADA_SCENA = null; }}]};
  }else{
    s.heat = clamp(s.heat + rumore, 0, 100);
    if(approccio.id === "squadra" && s.uomini > 0 && Math.random() < .5){
      s.uomini--;
      STRADA_SCENA = {k:"Com'è andata", titolo:"Ãˆ andata male", testo:"<b>" + colpo.n + "</b> è saltato. Uno dei tuoi ci è rimasto sotto: " +
          "tu sei rientrato pulito, lui no. Un uomo in meno.",
        opts:[{n:"Continua", d:"Torni alla strada", run(){ STRADA_SCENA = null; }}]};
    }else{
      const primaVolta = s.precedenti === 0 && approccio.id !== "ferro" && colpo.difficolta <= .3;
      if(primaVolta && Math.random() < .6){
        const multa = Math.round(colpo.min * .8);
        G.money = Math.max(0, G.money - multa);
        STRADA_SCENA = {k:"Com'è andata", titolo:"Denuncia", testo:"<b>" + colpo.n + "</b> è saltato, ma te la cavi con una denuncia e " +
            fmt(multa) + " € di multa. Stavolta è andata.",
          opts:[{n:"Continua", d:"Torni alla strada", run(){ STRADA_SCENA = null; }}]};
      }else{
        const settimane = Math.max(1, Math.round(colpo.pena * approccio.pena *
          (1 + s.precedenti * .35) * (s.avvocato ? .55 : 1)));
        s.precedenti++;
        s.arresto = {settimane:settimane, colpo:colpo.n};
        STRADA_SCENA = {k:"Com'è andata", titolo:"Arrestato", testo:"<b>" + colpo.n + "</b> è saltato, e stavolta non te la cavi: " +
            settimane + (settimane === 1 ? " settimana dentro" : " settimane dentro") +
            ". Niente musica, niente strada: solo il tempo che passa.",
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
function stradaCapienza(){
  let cap = 400;
  for(const a of STRADA_ATTIVITA) if(G.strada.attivita[a.id]) cap += a.resa;
  return cap;
}
function stradaRipulisci(){
  const s = G.strada;
  if(s.sporchi <= 0) return "Non hai soldi sporchi da ripulire.";
  const importo = Math.min(s.sporchi, stradaCapienza());
  const soglia = 400;
  const bassa = Math.min(importo, soglia), alta = Math.max(0, importo - soglia);
  const pulito = Math.round(bassa * .58 + alta * .86);
  s.sporchi -= importo;
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
    G.hype = clamp(G.hype * .72, 0, 100);
    G.money -= Math.round(weeklyCosts() * .6);
    if(G.contract && Math.random() < .20){
      pushLog("<b>L'etichetta ha rescisso.</b> I giornali ci sono andati pesante.", "bad");
      G.contract = null;
    }
    if(s.arresto.settimane <= 0){
      const colpoFatto = s.arresto.colpo;
      s.arresto = null;
      s.rep = clamp(s.rep + 12, 0, 100);
      showEvent({k:"Sei uscito", t:"Fuori", d:"La storia di «" + colpoFatto + "» ti ha seguito fin qui.",
        annulla(){},
        opts:[
          {n:"Raccontala", d:"+lucidità, +hype: la trasformi in un pezzo",
           run(){ addLuc(25); G.hype = clamp(G.hype + 14, 0, 100); return {t:"L'hai raccontata. La gente ascolta.", c:"good"}; }},
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

  /* uomini: se non entra abbastanza per pagarli, se ne vanno */
  if(s.uomini > 0){
    const upkeep = s.uomini * STRADA_UOMO_UPKEEP;
    if(G.money < upkeep){ s.uomini = Math.max(0, s.uomini - 1); pushLog("Un uomo se n'è andato: non entrava abbastanza per tenerlo.", ""); }
    else G.money -= upkeep;
  }
  if(s.prot > 0) G.money -= STRADA_PROT[s.prot].costo;
  if(s.avvocato) G.money -= STRADA_AVVOCATO_COSTO;

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

  /* gli opp, quando non te lo aspetti */
  const probOpp = clamp(.018 + s.heat/100 * .05 + s.rep/100 * .04 + attive * .008 - s.prot * .015, .01, .3);
  if(!s.arresto && Math.random() < probOpp) stradaOpp();
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
        if(vinci){ s.rep = clamp(s.rep + 6, 0, 100); G.hype = clamp(G.hype + 4, 0, 100);
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
  "media/pagina-attivita-criminali/pagina-attivita-02",
  "media/pagina-attivita-criminali/pagina-attivita-03",
  "media/pagina-attivita-criminali/pagina-attivita-04",
  "media/pagina-attivita-criminali/pagina-attivita-05",
  "media/pagina-attivita-criminali/pagina-attivita-06",
  "media/pagina-attivita-criminali/pagina-attivita-07",
  "media/pagina-attivita-criminali/pagina-attivita-08",
  "media/pagina-attivita-criminali/pagina-attivita-09",
  "media/pagina-attivita-criminali/pagina-attivita-10",
  "media/pagina-attivita-criminali/pagina-attivita-11",
  "media/pagina-attivita-criminali/pagina-attivita-12",
  "media/pagina-attivita-criminali/pagina-attivita-13",
  "media/pagina-attivita-criminali/pagina-attivita-14",
  "media/pagina-attivita-criminali/pagina-attivita-15",
  "media/pagina-attivita-criminali/pagina-attivita-16",
  "media/pagina-attivita-criminali/pagina-attivita-17",
  "media/pagina-attivita-criminali/pagina-attivita-18",
  "media/pagina-attivita-criminali/pagina-attivita-19",
  "media/pagina-attivita-criminali/pagina-attivita-20",
  "media/pagina-attivita-criminali/pagina-attivita-21",
  "media/pagina-attivita-criminali/pagina-attivita-22",
  "media/pagina-attivita-criminali/pagina-attivita-23",
  "media/pagina-attivita-criminali/pagina-attivita-24",
  "media/pagina-attivita-criminali/pagina-attivita-25",
  "media/pagina-attivita-criminali/pagina-attivita-26",
  "media/pagina-attivita-criminali/pagina-attivita-27",
  "media/pagina-attivita-criminali/pagina-attivita-28",
  "media/pagina-attivita-criminali/pagina-attivita-29",
  "media/pagina-attivita-criminali/pagina-attivita-30",
  "media/pagina-attivita-criminali/pagina-attivita-31",
  "media/pagina-attivita-criminali/pagina-attivita-32",
  "media/pagina-attivita-criminali/pagina-attivita-33"
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
  $("st-dove").textContent = "Il giro // " + citta;
  $("st-citta").textContent = citta;
  $("st-sett").textContent = G.week;
  $("st-ora").textContent = typeof hubOra === "function" ? hubOra() : "";

  $("st-sporchi").textContent = fmt(s.sporchi) + " €";
  const rip = $("st-ripulisci");
  rip.textContent = "Ripulisci fino a " + fmt(stradaCapienza()) + " €";
  rip.classList.toggle("no", s.sporchi <= 0);

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
  griglia.innerHTML = STRADA_COLPI.map((c, i) => {
    const senzaEnergia = G.energy < c.energia;
    return '<button class="crime' + (senzaEnergia ? " no" : "") + '" data-stcolpo="' + c.id + '">' +
      '<span class="num">0' + (i + 1) + '</span><b>' + c.n + '</b><p>' + c.d + '</p>' +
      '<div class="stchips">' +
        '<span class="stchip money">' + fmt(c.min) + '–' + fmt(c.max) + ' €</span>' +
        '<span class="stchip">' + c.energia + ' energia</span>' +
        '<span class="stchip ' + stClasseRischio(c) + '">Rischio ' + stRischio(c).toLowerCase() + '</span>' +
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

$("st-ripulisci").onclick = () => { hubTap(); stToast(stradaRipulisci()); };

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

$("st-x").onclick = () => { hubTap(); chiudiStrada(); };
$("st-mappa").onclick = () => { hubTap(); chiudiStrada(); };

/* ESC: lo gestisce uscita.js per tutte le finestre, e chiama questa. Un passo
   alla volta — prima si chiude la scheda aperta, poi la schermata. */
function uscitaStrada(){
  if(STRADA_SCENA){ STRADA_SCENA = null; renderStScheda(); return true; }
  chiudiStrada();
  return true;
}

