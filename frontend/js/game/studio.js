/* LO STUDIO — punti 10, 11 e 12 di `implementazioni.md`.

   «Tantissimo del gameplay vogliamo che si sviluppi in STUDIO, essendo un
   simulatore della vita da rapper. Dobbiamo sviluppare un'altra interfaccia e
   dei veri scenari dentro allo studio, dalla sezione in cui creiamo rapporto
   coi beatmaker alla parte in cui mixiamo i pezzi.»

   Quattro stanze, che sono i quattro momenti veri di un pezzo:

     IL BEAT     da chi te lo fa — e con chi lo fai cambia com'è (punto 11)
     LA CABINA   la strofa e il beat diventano una traccia
     IL BANCO    il fonico la mixa
     FUORI       esce, e da lì corre da sola

   **Qui non si rifà l'economia del gioco.** I numeri stanno tutti in
   `actions.js` e ci restano: lo Studio chiama le stesse azioni della
   settimana. Quello che aggiunge — ed è il punto — è **chi c'è dentro**. Il
   beat non è più una voce di listino: te lo fa qualcuno che hai conosciuto
   alla Sala, e più siete in confidenza meglio te lo fa e meno te lo fa pagare.
   Il mix non è più un +6 fisso: dietro al banco c'è un fonico con un nome, e
   quanto ti migliora il pezzo dipende da dove siete arrivati voi due.

   La gente è la stessa di `posto.js` (`G.gente`): la Sala resta il posto dove
   la conosci, lo Studio è dove ci lavori insieme. È il loop del gioco scritto
   nella ROADMAP — cerco, mi muovo, conosco, creo rapporti, ottengo occasioni —
   chiuso su se stesso invece che interrotto a metà. */
"use strict";

const STUDIO_SEZIONI = [
  {id:"beat",   n:"Il beat",   sc:"beat",
   d:"Chi te lo fa, e a che condizioni."},
  {id:"cabina", n:"La cabina", sc:"registra",
   d:"La strofa più il beat. Esce una traccia."},
  {id:"banco",  n:"Il banco",  sc:"mixa",
   d:"Livelli e spazio: qui il provino diventa pezzo."},
  {id:"fuori",  n:"Fuori",     sc:"pubblica",
   d:"Lo metti in giro. Da qui in poi corre da solo."}
];

let STUDIO_SEZ = "beat";

/* ==================== LA GENTE CHE CI LAVORA ====================
   Solo chi è ancora in giro: chi ha mollato la scena (`via`) non è più dietro
   a nessun banco. Ordinati per quanto siete in confidenza — chi ti conosce
   meglio sta in cima, che è come funziona chiedere un favore. */
function studioGente(ruolo){
  return (G.gente || [])
    .filter(p => p.ruolo === ruolo && !p.via)
    .sort((a, b) => (b.rel - a.rel) || (b.fama - a.fama));
}

/* Il fonico che hai scelto di tenere dietro al vetro. Si sceglie una volta e
   resta finché non lo cambi: è la persona con cui lavori, non un'opzione da
   rimettere ogni volta. Se se ne va dalla scena, torna `null` da solo. */
function studioFonico(){
  if(!G.studio || !G.studio.fonico) return null;
  const p = (G.gente || []).find(x => x.id === G.studio.fonico);
  return (p && !p.via) ? p : null;
}

/* Quanto ti migliora il lavoro chi hai accanto. Zero da solo, e sale col
   rapporto: da «conoscenza» a «partner» sono dieci punti di qualità, che su
   un pezzo si sentono. Non è una statistica nascosta — è scritto in chiaro
   dentro alla sezione, perché è il motivo per cui vale la pena tornare alla
   Sala invece di comprare e basta. */
function studioAiuto(p){
  return p ? Math.round(p.rel * 2) : 0;
}
/* La versione che serve ad `actions.js`, che non sa niente di persone. */
function studioAiutoFonico(){
  return studioAiuto(studioFonico());
}

/* ==================== IL BEAT SU MISURA (punto 11) ====================
   Il giro dei produttori (`offriBeat`) resta: tre beat sul banco, si comprano
   dal Catalogo, ed è quello che fa chi non conosce nessuno. Questo è l'altra
   strada: **te lo fa una persona**. Costa meno, è più tuo, e il beat non
   passa dal mercato — ti finisce direttamente in cartella, perché non l'hai
   comprato, te l'ha fatto uno che ti conosce.

   Un beat a testa per settimana: un beatmaker non è un distributore. */
const STUDIO_BEAT_ENERGIA = 20;

const STUDIO_BEAT_MINUTI = 120;

function studioBeatTempoGate(){
  if(typeof GAME_TIME==="undefined" ||
     typeof GAME_TIME.canSpend!=="function"){
    return {
      ok:true,
      reason:null,
      minutes:STUDIO_BEAT_MINUTI,
      remaining:Infinity
    };
  }

  return GAME_TIME.canSpend(STUDIO_BEAT_MINUTI);
}

function studioBeatTempoTesto(){
  if(typeof GAME_TIME!=="undefined" &&
     typeof GAME_TIME.formatDuration==="function")
    return GAME_TIME.formatDuration(STUDIO_BEAT_MINUTI);

  return STUDIO_BEAT_MINUTI+" min";
}

function studioBeatTempoPerche(g){
  if(g && g.reason==="day-end"){
    const rim = typeof GAME_TIME!=="undefined" &&
      typeof GAME_TIME.formatDuration==="function"
        ? GAME_TIME.formatDuration(g.remaining)
        : g.remaining+" min";

    return "Troppo tardi: restano "+rim+" prima delle 04:00";
  }

  return "Prima risolvi quello che hai in sospeso";
}

function studioBeatTempoAvanza(){
  if(typeof GAME_TIME==="undefined" ||
     typeof GAME_TIME.spend!=="function")
    return true;

  const out=GAME_TIME.spend(
    STUDIO_BEAT_MINUTI,
    "studio-beat-custom"
  );

  return !(out && out.blocked);
}


function studioBeatFatto(p){
  const sett = typeof totalWeeks === "function" ? totalWeeks() : G.week;
  return p.beatSett === sett;
}
/* Il perché sta in una frase, non in un numero secco: «35 €» su un bottone
   spento non dice se te ne mancano trenta o se costa e basta. */
function studioBeatPronto(p){
  if(p.rel < 1) return {ok:false, perche:"Prima diventate contatti, alla Sala"};
  if(studioBeatFatto(p)) return {ok:false, perche:"Ci ha già lavorato questa settimana"};
  if(G.energy < STUDIO_BEAT_ENERGIA)
    return {ok:false, perche:"Ti serve energia: " + STUDIO_BEAT_ENERGIA + ", ne hai " + Math.round(G.energy)};
  const c = studioBeatPrezzo(p);
  if(G.money < c) return {ok:false, perche:"Ti servono " + fmt(c) + " €, ne hai " + fmt(G.money)};

  const tempo=studioBeatTempoGate();
  if(!tempo.ok)
    return {ok:false, perche:studioBeatTempoPerche(tempo)};
  return {ok:true, perche:""};
}
/* Il prezzo cala col rapporto e sparisce da «fidato» in su: a un certo punto
   non ti fa più pagare, e quello è il senso di averci lavorato per mesi. */
function studioBeatPrezzo(p){
  if(p.rel >= 4) return 0;
  return Math.max(20, Math.round((60 + p.fama * 2.2) * (1 - p.rel * 0.22) / 5) * 5);
}
/* Quanto viene buono: la sua fama dice quanto è bravo, il vostro rapporto
   quanto ci mette del suo, e la tua rete quanto sai chiedere. */
function studioBeatQualita(p){
  return clamp(Math.round(20 + p.fama * 0.55 + p.rel * 7 + (G.skills.rete || 0) * 0.4 + rnd(-4, 7)), 5, 100);
}

function studioFattiUnBeat(id){
  const p = (G.gente || []).find(x => x.id === id);
  if(!p) return;
  const st = studioBeatPronto(p);
  if(!st.ok){ toast(st.perche, "bad", "!", ["#3A3F49", "#22262E"]); return; }

  const costo = studioBeatPrezzo(p);
  G.energy -= STUDIO_BEAT_ENERGIA;
  G.money -= costo;
  const sett = typeof totalWeeks === "function" ? totalWeeks() : G.week;
  p.beatSett = sett;

  const presi = G.market.map(b => b.n).concat(G.beats.map(b => b.n));
  const b = creaBeat(p.gen || mioGenere(), studioBeatQualita(p), presi);
  b.da = p.n;                    /* chi l'ha fatto resta scritto sul beat */
  G.beats.push(b);

  /* lavorare insieme avvicina, come parlarsi: un punto, non di più —
     l'amicizia si fa alla Sala, qui si fa il pezzo */
  p.pt += 1;
  while(p.pt >= relSoglia(p) && p.rel < 5){ p.pt -= relSoglia(p); p.rel++; }
  gain("rete", 0.4);
  studioBeatTempoAvanza();

  pushLog("<b>" + p.n + "</b> ti ha fatto «" + b.n + "» — qualità " + b.q +
    (costo ? ", " + fmt(costo) + " €." : ", e non ha voluto niente."), "good");
  toast(p.n + ": «" + b.n + "» (q" + b.q + ")", "good", "♪", TINTA_SUONO);
  SFX.tap(); save(); renderStudio(); renderGioco();
}

/* ==================== IL FONICO DIETRO AL VETRO ==================== */
function studioScegliFonico(id){
  if(!G.studio) G.studio = {};
  G.studio.fonico = (G.studio.fonico === id) ? null : id;
  SFX.tap(); save(); renderStudio();
}

/* ==================== IL DISEGNO ==================== */
function studioEsc(s){
  return String(s == null ? "" : s).replace(/[&<>"]/g, ch =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

/* la scheda di una persona: la stessa faccia della Sala, così è chiaro che è
   la stessa gente e non un altro elenco */
function studioPersona(p, dentro, scelto){
  return '<div class="stperso' + (scelto ? " scelta" : "") + '" style="--k:' + p.col + '">' +
    '<span class="stav">' + faccia(p, 46) + '</span>' +
    '<span class="stchi"><b>' + studioEsc(p.n) + '</b><span>' +
      relNome(p) + ' · fama ' + p.fama +
      (p.scoperto ? ' · ' + studioEsc(p.car) : '') +
      (p.gen ? ' · ' + studioEsc(genBeat(p.gen).n.toLowerCase()) : '') +
    '</span></span>' +
    '<span class="stfa">' + dentro + '</span></div>';
}

function studioVuoto(t){
  return '<div class="stvuoto">' + t + '</div>';
}

function studioSezBeat(){
  const gente = studioGente("beatmaker");
  const righe = gente.map(p => {
    const st = studioBeatPronto(p);
    const costo = studioBeatPrezzo(p);
    /* Il bottone dice sempre cosa fa; **sotto** c'è o il prezzo o il motivo
       per cui adesso non si può. Prima il motivo finiva sul bottone al posto
       del verbo, e chi guardava vedeva un tasto grigio con scritto «35 €»
       senza capire se era il prezzo o un errore. */
    return studioPersona(p,
      '<button class="stgo" data-beat="' + studioEsc(p.id) + '"' + (st.ok ? "" : " disabled") + '>' +
        'Fattelo fare</button>' +
        '<span class="stsub' + (st.ok ? "" : " no") + '">' + (st.ok
          ? (costo ? fmt(costo) + " € · " : "gratis · ") + STUDIO_BEAT_ENERGIA + " energia \\u00b7 " + studioBeatTempoTesto() + " \\u00b7 q~" +
            Math.round(20 + p.fama * 0.55 + p.rel * 7 + (G.skills.rete || 0) * 0.4)
          : studioEsc(st.perche)) + '</span>', false);
  }).join("");

  return '<p class="stdice">Un beat comprato è un beat di chiunque. Uno che ti fa una ' +
    'persona che ti conosce è tuo — e più siete in confidenza, meglio viene e meno costa. ' +
    'I beatmaker si conoscono <b>alla Sala</b>.</p>' +
    (righe || studioVuoto("Non conosci ancora nessun beatmaker. Passa dalla Sala: è lì che si trovano.")) +
    '<div class="stoppure"><span>oppure</span></div>' +
    '<button class="stazione" data-az="beat">' +
      '<b>Gira a cercare beat</b>' +
      '<span>Tre beat sul banco, da comprare al Catalogo. Non serve conoscere nessuno.</span>' +
    '</button>';
}

function studioSezCabina(){
  const b = bestBar(), bt = bestBeat();
  const fon = studioFonico();
  const aiuto = studioAiuto(fon);
  const q = (b && bt) ? Math.round(songQ(b, bt)) + aiuto : null;

  const gente = studioGente("fonico");
  const righe = gente.map(p => studioPersona(p,
    '<button class="stgo' + (studioFonico() === p ? " on" : "") + '" data-fonico="' + studioEsc(p.id) + '">' +
      (studioFonico() === p ? "È lui" : "Chiamalo") + '</button>' +
      '<span class="stsub">' + (studioAiuto(p) ? "+" + studioAiuto(p) + " qualità" : "ancora niente") + '</span>',
    studioFonico() === p)).join("");

  return '<p class="stdice">Dietro al vetro ci può stare qualcuno. Un fonico che ti ' +
    'conosce sa dove metterti la voce prima che glielo chiedi: <b>vale qualità</b>, ' +
    'in cabina e al banco, e cresce con quanto avete lavorato insieme.</p>' +
    (righe || studioVuoto("Non conosci ancora nessun fonico. Alla Sala ce ne gira più di uno.")) +
    '<div class="stoppure"><span>e poi</span></div>' +
    (b && bt
      ? '<button class="stazione" data-az="registra">' +
          '<b>Registra il pezzo</b>' +
          '<span>«' + studioEsc(b.tema || "la strofa") + '» su «' + studioEsc(bt.n) + '» · ' +
          'qualità ~' + q + (fon ? ' · con ' + studioEsc(fon.n) + ' (+' + aiuto + ')' : ' · da solo') +
          '</span></button>'
      /* senza strofa la cabina non è un vicolo cieco: scrivere è la prima cosa
         che si fa in studio, e da qui ci si arriva invece di andarla a cercare */
      : !b
        ? '<button class="stazione" data-az="scrivi">' +
            '<b>Scrivi le barre</b>' +
            '<span>Senza una strofa non c\'è niente da registrare. Si comincia dal foglio.</span>' +
          '</button>' +
          (!bt ? studioVuoto("E serve anche un beat: te lo fai fare al Beat.") : "")
        : studioVuoto("Hai la strofa, manca il beat. Te lo fai fare al Beat, " +
            "o lo compri al Catalogo."));
}

function studioSezBanco(){
  const da = unmixed().sort((a, b) => b.q - a.q)[0];
  const fon = studioFonico();
  return '<p class="stdice">Il mix è dove un provino diventa un pezzo. Da solo fai ' +
    'quello che sai fare; con un fonico dietro, quello che sa fare lui.</p>' +
    (fon
      ? studioPersona(fon, '<span class="stsub">al banco · +' + studioAiuto(fon) + ' qualità</span>', true)
      : studioVuoto("Nessuno al banco: il mix lo fai tu. Un fonico si chiama dalla Cabina.")) +
    '<div class="stoppure"><span>e poi</span></div>' +
    (da
      ? '<button class="stazione" data-az="mixa">' +
          '<b>Mixa «' + studioEsc(da.t) + '»</b>' +
          '<span>qualità ' + da.q + ' → ' + clamp(da.q + mixGain(), 5, 100) +
          ' · +' + mixGain() + (fon ? ', di cui ' + studioAiuto(fon) + ' suoi' : '') +
          '</span></button>'
      : studioVuoto("Non c'è niente da mixare. Prima si registra."));
}

function studioSezFuori(){
  const pronti = ready().sort((a, b) => b.q - a.q);
  const s = pronti[0];
  return '<p class="stdice">Quello che è finito e aspetta solo di uscire. Un pezzo non ' +
    'mixato esce lo stesso, ma ci perde otto punti: la fretta si sente.</p>' +
    (pronti.length
      ? pronti.map(x =>
          '<div class="stpezzo' + (x.mixed ? " ok" : "") + '">' +
            '<span class="stcov">' + cover(x.seed || 7, x.t, (window.ARTIST || {}).name || "", x.img) + '</span>' +
            '<span class="stchi"><b>' + studioEsc(x.t) + '</b><span>qualità ' + x.q +
              (x.mixed ? " · mixato" : " · non mixato, −8 se esce così") + '</span></span>' +
          '</div>').join("")
      : studioVuoto("Non hai niente di pronto. Si comincia dal beat.")) +
    (s
      ? '<div class="stoppure"><span>e poi</span></div>' +
        '<button class="stazione" data-az="pubblica">' +
          '<b>Pubblica «' + studioEsc(s.t) + '»</b>' +
          '<span>esce con qualità ' + (s.mixed ? s.q : clamp(s.q - 8, 5, 100)) + '</span>' +
        '</button>'
      : "");
}

function renderStudio(){
  const root = $("studio");
  if(!root || !root.classList.contains("on")) return;

  const sez = STUDIO_SEZIONI.find(x => x.id === STUDIO_SEZ) || STUDIO_SEZIONI[0];
  const art = (typeof SC !== "undefined" && SC[sez.sc]) || ["#8B5CF6", "#1D1030", ""];

  $("st-tabs").innerHTML = STUDIO_SEZIONI.map(x =>
    '<button class="sttab' + (x.id === sez.id ? " on" : "") + '" data-sez="' + x.id + '">' +
    x.n + '</button>').join("");

  $("st-scena").innerHTML = art[2]
    /* `YMin` e non `YMid`: la fascia ritaglia, e quello che conta in queste
       scenette sta in alto — centrando si tagliava la testa a chi c'è dentro. */
    ? '<svg viewBox="0 0 200 128" preserveAspectRatio="xMidYMin slice" xmlns="http://www.w3.org/2000/svg">' +
      art[2] + '</svg>'
    : "";
  $("st-scena").style.setProperty("--k", art[0]);
  $("st-dove").innerHTML = '<b>' + sez.n + '</b> — ' + sez.d;

  $("st-risorse").innerHTML =
    '<span><i>energia</i>' + Math.round(G.energy) + '</span>' +
    '<span><i>soldi</i>' + fmt(G.money) + ' €</span>' +
    '<span><i>lucidità</i>' + Math.round(typeof luc === "function" ? luc() : 0) + '</span>';

  $("st-corpo").innerHTML =
    (sez.id === "beat" ? studioSezBeat() :
     sez.id === "cabina" ? studioSezCabina() :
     sez.id === "banco" ? studioSezBanco() :
     studioSezFuori()) +
    /* Lo Studio è quattro stanze, non tutta la settimana: promo, palco,
       turni e piazza stanno fuori di qui. Prima del punto 12 il cartello
       «Studio» sulla mappa portava dritto all'elenco delle mosse, ed è da lì
       che ci si passava: quella porta resta, in fondo, dove non dà fastidio. */
    '<button class="stmosse" data-mosse="1">Tutte le mosse della settimana →</button>';
}

/* ==================== APRI E CHIUDI ====================
   Punto 10: nessun orario, lo studio è sempre aperto. Ci si entra dai due
   cartelli della mappa — «Studio» e «Beat Maker», che è la sua sezione dei
   beat (punto 11) e non un edificio a parte. */
function apriStudio(sezione){
  if(typeof G === "undefined" || !G) return;
  if(!G.studio) G.studio = {};
  if(sezione) STUDIO_SEZ = sezione;
  if(typeof sistemaGente === "function") sistemaGente();
  $("studio").classList.add("on");
  renderStudio();
}
function chiudiStudio(){ $("studio").classList.remove("on"); }

/* Le mosse vere le fa `actions.js`, come dalla plancia: lo Studio è la stanza,
   non un secondo motore. Si chiude, parte la mossa, e quello che succede lo
   racconta la scena di sempre. */
function studioAzione(id){
  const st = hubPronta(id);
  if(!st.ok){ toast(st.perche, "bad", "!", ["#3A3F49", "#22262E"]); return; }
  chiudiStudio();
  hubAzione(id);
}

if($("studio")){
  $("st-x").onclick = () => chiudiStudio();
  $("studio").addEventListener("click", e => {
    if(e.target.id === "studio"){ chiudiStudio(); return; }
    const t = e.target.closest("[data-sez]");
    if(t){ STUDIO_SEZ = t.dataset.sez; SFX.tap(); renderStudio(); return; }
    const b = e.target.closest("[data-beat]");
    if(b){ studioFattiUnBeat(b.dataset.beat); return; }
    const f = e.target.closest("[data-fonico]");
    if(f){ studioScegliFonico(f.dataset.fonico); return; }
    const a = e.target.closest("[data-az]");
    if(a){ studioAzione(a.dataset.az); return; }
    if(e.target.closest("[data-mosse]")){ chiudiStudio(); hubGioco("settimana"); return; }
  });
  document.addEventListener("keydown", e => {
    if(e.key === "Escape" && $("studio").classList.contains("on")) chiudiStudio();
  });
}
