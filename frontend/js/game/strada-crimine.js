/* La Strada (punto 21): la professione del criminale in provincia.

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

/* ==================== LA SCENA IN CORSO ====================
   Come modal.js, ma tutta dentro al pannello: showEvent (z-index 60) finirebbe
   sotto ai pannelli come questo (z-index 93, stessa famiglia di posto/negozio),
   quindi qui le scelte del colpo si disegnano nel pannello stesso, non sopra. */
let STRADA_SCENA = null; /* {titolo, testo, opts:[{n,d,run()}]} */

function stScenaAvviso(colpo, msg){
  return {titolo:"Non si può", testo:msg,
    opts:[
      {n:"Torna alle scelte", d:"", run(){ STRADA_SCENA = stScenaApproccio(colpo); }},
      {n:"Lascia stare", d:"", run(){ STRADA_SCENA = null; }}
    ]};
}

function stScenaApproccio(colpo){
  return {titolo:colpo.n, testo:colpo.d + "<br><br>Guadagno stimato: " + fmt(colpo.min) + "–" + fmt(colpo.max) +
      " €. Energia: " + colpo.energia + ".",
    opts:STRADA_APPROCCI.map(a => ({
      n:a.n, d:a.d,
      run(){ stradaTenta(colpo.id, a.id); }
    })).concat([{n:"Lascia stare", d:"Torni alla strada", run(){ STRADA_SCENA = null; }}])};
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
    STRADA_SCENA = {titolo:"Andata bene", testo:"<b>" + colpo.n + "</b>: " + fmt(pulito) + " € in tasca, " +
        fmt(sporco) + " € sporchi da ripulire. In giro si comincia a parlarne.",
      opts:[{n:"Continua", d:"Torni alla strada", run(){ STRADA_SCENA = null; }}]};
  }else{
    s.heat = clamp(s.heat + rumore, 0, 100);
    if(approccio.id === "squadra" && s.uomini > 0 && Math.random() < .5){
      s.uomini--;
      STRADA_SCENA = {titolo:"È andata male", testo:"<b>" + colpo.n + "</b> è saltato. Uno dei tuoi ci è rimasto sotto: " +
          "tu sei rientrato pulito, lui no. Un uomo in meno.",
        opts:[{n:"Continua", d:"Torni alla strada", run(){ STRADA_SCENA = null; }}]};
    }else{
      const primaVolta = s.precedenti === 0 && approccio.id !== "ferro" && colpo.difficolta <= .3;
      if(primaVolta && Math.random() < .6){
        const multa = Math.round(colpo.min * .8);
        G.money = Math.max(0, G.money - multa);
        STRADA_SCENA = {titolo:"Denuncia", testo:"<b>" + colpo.n + "</b> è saltato, ma te la cavi con una denuncia e " +
            fmt(multa) + " € di multa. Stavolta è andata.",
          opts:[{n:"Continua", d:"Torni alla strada", run(){ STRADA_SCENA = null; }}]};
      }else{
        const settimane = Math.max(1, Math.round(colpo.pena * approccio.pena *
          (1 + s.precedenti * .35) * (s.avvocato ? .55 : 1)));
        s.precedenti++;
        s.arresto = {settimane:settimane, colpo:colpo.n};
        STRADA_SCENA = {titolo:"Arrestato", testo:"<b>" + colpo.n + "</b> è saltato, e stavolta non te la cavi: " +
            settimane + (settimane === 1 ? " settimana dentro" : " settimane dentro") +
            ". Niente musica, niente strada: solo il tempo che passa.",
          opts:[{n:"Continua", d:"", run(){ STRADA_SCENA = null; }}]};
      }
    }
  }
  save(); renderStrada(); renderGioco();
}

/* ==================== SOLDI SPORCHI ==================== */
function stradaCapienza(){
  let cap = 400;
  for(const a of STRADA_ATTIVITA) if(G.strada.attivita[a.id]) cap += a.resa;
  return cap;
}
function stradaRipulisci(){
  const s = G.strada;
  if(s.sporchi <= 0) return;
  const importo = Math.min(s.sporchi, stradaCapienza());
  const soglia = 400;
  const bassa = Math.min(importo, soglia), alta = Math.max(0, importo - soglia);
  const pulito = Math.round(bassa * .58 + alta * .86);
  s.sporchi -= importo;
  G.money += pulito;
  s.heat = clamp(s.heat + 2, 0, 100);
  pushLog("Ripuliti " + fmt(importo) + " € sporchi: in tasca ne restano " + fmt(pulito) + " €.", "");
  save(); renderStrada(); renderGioco();
}

/* ==================== CHI TI COPRE ==================== */
function stAssumiUomo(){
  const s = G.strada;
  if(s.uomini >= STRADA_UOMO_MAX || G.money < STRADA_UOMO_COSTO) return;
  G.money -= STRADA_UOMO_COSTO; s.uomini++;
  pushLog("Hai preso un uomo in più: ora sono " + s.uomini + ".", "");
  save(); renderStrada(); renderGioco();
}
function stLicenziaUomo(){
  const s = G.strada;
  if(s.uomini <= 0) return;
  s.uomini--;
  save(); renderStrada(); renderGioco();
}
function stImpostaProtezione(livello){
  G.strada.prot = clamp(livello, 0, STRADA_PROT.length - 1);
  save(); renderStrada(); renderGioco();
}
function stCompraFerro(){
  const s = G.strada;
  if(s.ferro || G.money < STRADA_FERRO_COSTO) return;
  G.money -= STRADA_FERRO_COSTO; s.ferro = true;
  pushLog("Hai preso il ferro. Cambia i conti, in bene e in male.", "");
  save(); renderStrada(); renderGioco();
}
function stToggleAvvocato(){
  G.strada.avvocato = !G.strada.avvocato;
  save(); renderStrada(); renderGioco();
}
function stCompraAttivita(id){
  const a = STRADA_ATTIVITA.find(x => x.id === id);
  if(!a || G.strada.attivita[id] || G.money < a.costo) return;
  G.money -= a.costo; G.strada.attivita[id] = true;
  pushLog("Hai rilevato: <b>" + a.n + "</b>.", "good");
  save(); renderStrada(); renderGioco();
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

/* ==================== IL PANNELLO ==================== */
function apriStrada(){
  hubTap();
  STRADA_SCENA = null;
  renderStrada();
  $("strada").classList.add("on");
}
function chiudiStrada(){ $("strada").classList.remove("on"); }

function renderStBarre(){
  const s = G.strada;
  const riga = (label, val, cls) => '<div class="stbarrow"><span>' + label + '</span>' +
    '<div class="stbar"><i class="' + cls + '" style="width:' + clamp(val,0,100) + '%"></i></div>' +
    '<b>' + Math.round(val) + '</b></div>';
  return '<div class="stbars">' + riga("Reputazione di strada", s.rep, "rep") + riga("Attenzione", s.heat, "heat") + '</div>' +
    '<div class="stsoldi"><span>Soldi sporchi</span><b>' + fmt(s.sporchi) + ' €</b>' +
    '<button class="stbtn' + (s.sporchi <= 0 ? " no" : "") + '" data-ripulisci>Ripulisci (fino a ' + fmt(stradaCapienza()) + ' €)</button></div>';
}

function renderStArresto(){
  const a = G.strada.arresto;
  return '<div class="starresto"><b>Sei dentro.</b><p>«' + a.colpo + '»: ancora ' + a.settimane +
    (a.settimane === 1 ? ' settimana' : ' settimane') + '. Niente colpi finché non esci.</p></div>';
}

function renderStMain(){
  const s = G.strada;
  let h = '<div class="stsez"><h3>I colpi — Provincia</h3><div class="stgrid">' +
    STRADA_COLPI.map(c => '<div class="stcard"><b class="n">' + c.n + '</b><p class="d">' + c.d + '</p>' +
      '<div class="meta">' + fmt(c.min) + '–' + fmt(c.max) + ' € · ' + c.energia + ' energia</div>' +
      '<button class="stbtn' + (G.energy < c.energia ? " no" : "") + '" data-colpo="' + c.id + '">Tenta il colpo</button></div>'
    ).join("") + '</div></div>';

  h += '<div class="stsez"><h3>Milano <i>· livello 10 · fama 50 · hype 40</i></h3><div class="stgrid">' +
    STRADA_COLPI_MILANO.map(c => '<div class="stcard stlock"><b class="n">' + c.n + '</b>' +
      (c.nota ? '<p class="d">' + c.nota + '</p>' : '') + '<div class="meta">Si apre a Milano</div></div>').join("") + '</div></div>';
  h += '<div class="stsez"><h3>Los Angeles <i>· da GOAT</i></h3><div class="stgrid">' +
    STRADA_COLPI_LA.map(c => '<div class="stcard stlock"><b class="n">' + c.n + '</b>' +
      (c.nota ? '<p class="d">' + c.nota + '</p>' : '') + '<div class="meta">Si apre a Los Angeles</div></div>').join("") + '</div></div>';

  h += '<div class="stsez"><h3>Chi ti copre</h3><div class="stcop">' +
    '<div class="stcopriga"><span>Uomini (' + s.uomini + '/' + STRADA_UOMO_MAX + ')</span>' +
    '<button class="stmini' + (s.uomini >= STRADA_UOMO_MAX || G.money < STRADA_UOMO_COSTO ? " no" : "") + '" data-uomo-assumi>' +
      '+ Prendi (' + fmt(STRADA_UOMO_COSTO) + ' €, poi ' + fmt(STRADA_UOMO_UPKEEP) + ' €/sett.)</button>' +
    (s.uomini > 0 ? '<button class="stmini" data-uomo-licenzia>Manda via uno</button>' : '') + '</div>' +
    '<div class="stcopriga"><span>Protezione</span>' +
    STRADA_PROT.map((p,i) => '<button class="stmini' + (s.prot === i ? " on" : "") + '" data-prot="' + i + '">' +
      p.n + (p.costo ? ' (' + fmt(p.costo) + ' €/sett.)' : '') + '</button>').join("") + '</div>' +
    '<div class="stcopriga"><span>Il ferro</span>' + (s.ferro ? '<b class="stok">Ce l’hai</b>' :
      '<button class="stmini' + (G.money < STRADA_FERRO_COSTO ? " no" : "") + '" data-ferro>Prendilo (' + fmt(STRADA_FERRO_COSTO) + ' €)</button>') + '</div>' +
    '<div class="stcopriga"><span>Avvocato (' + fmt(STRADA_AVVOCATO_COSTO) + ' €/sett.)</span>' +
    '<button class="stmini' + (s.avvocato ? " on" : "") + '" data-avvocato>' + (s.avvocato ? 'Ce l’hai' : 'Prendilo') + '</button></div>' +
    '</div></div>';

  h += '<div class="stsez"><h3>Attività</h3><div class="stgrid">' +
    STRADA_ATTIVITA.map(a => '<div class="stcard">' + '<b class="n">' + a.n + '</b>' +
      (s.attivita[a.id]
        ? '<p class="d">Resa: ' + fmt(a.resa) + ' €/sett. (45% pulito, 55% sporco) − ' + fmt(a.gestione) + ' € gestione</p><b class="stok">Tua</b>'
        : '<p class="d">Costo: ' + fmt(a.costo) + ' € · resa ' + fmt(a.resa) + ' €/sett.</p>' +
          '<button class="stbtn' + (G.money < a.costo ? " no" : "") + '" data-attivita="' + a.id + '">Rileva</button>')
      + '</div>').join("") + '</div></div>';

  h += '<div class="stsez"><button class="stmolla" data-molla>Molla il giro</button>' +
    '<p class="stmollad">Costa il 30% dei soldi sporchi (minimo 1.500 €), abbassa la reputazione di strada, alza la lucidità.</p></div>';
  return h;
}

function renderStScena(sc){
  return '<div class="stscena"><b class="stst">' + sc.titolo + '</b><p class="stq">' + sc.testo + '</p>' +
    sc.opts.map((o,i) => '<button class="strisp" data-stopt="' + i + '"><b>' + o.n + '</b>' +
      (o.d ? '<span>' + o.d + '</span>' : '') + '</button>').join("") + '</div>';
}

function renderStrada(){
  const body = $("st-body");
  if(!body) return;
  if(STRADA_SCENA){ body.innerHTML = renderStScena(STRADA_SCENA); return; }
  const s = G.strada;
  body.innerHTML = renderStBarre() + (s.arresto ? renderStArresto() : renderStMain());
}

$("st-body").addEventListener("click", ev => {
  const stopt = ev.target.closest("[data-stopt]");
  if(stopt && STRADA_SCENA){
    hubTap();
    const o = STRADA_SCENA.opts[+stopt.dataset.stopt];
    if(o && typeof o.run === "function") o.run();
    save(); renderStrada(); renderGioco();
    return;
  }
  const colpo = ev.target.closest("[data-colpo]");
  if(colpo){ hubTap(); stAvviaColpo(colpo.dataset.colpo); return; }
  if(ev.target.closest("[data-ripulisci]")){ hubTap(); stradaRipulisci(); return; }
  if(ev.target.closest("[data-uomo-assumi]")){ hubTap(); stAssumiUomo(); return; }
  if(ev.target.closest("[data-uomo-licenzia]")){ hubTap(); stLicenziaUomo(); return; }
  const prot = ev.target.closest("[data-prot]");
  if(prot){ hubTap(); stImpostaProtezione(+prot.dataset.prot); return; }
  if(ev.target.closest("[data-ferro]")){ hubTap(); stCompraFerro(); return; }
  if(ev.target.closest("[data-avvocato]")){ hubTap(); stToggleAvvocato(); return; }
  const att = ev.target.closest("[data-attivita]");
  if(att){ hubTap(); stCompraAttivita(att.dataset.attivita); return; }
  if(ev.target.closest("[data-molla]")){ hubTap(); stMollaIlGiro(); return; }
});
$("st-x").onclick = () => { hubTap(); chiudiStrada(); };
