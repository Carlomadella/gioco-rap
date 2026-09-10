/* LO STUDIO — punti 10, 11, 12 e il punto 4 di CARLO in `implementazioni.md`.

   «Tantissimo del gameplay vogliamo che si sviluppi in STUDIO, essendo un
   simulatore della vita da rapper. Dobbiamo sviluppare un'altra interfaccia e
   dei veri scenari dentro allo studio, dalla sezione in cui creiamo rapporto
   coi beatmaker alla parte in cui mixiamo i pezzi.»

   E poi il punto 4, che è quello che ha rifatto questa pagina:

     «Non è più "faccio un pezzo → +10 fama". TRACK luogo: STUDIO —
      Beat/Producer, Mix, Testo, Cover, Featuring, Marketing, Timing.
      E ogni elemento influenza il risultato.»

   Quelle sette sono adesso le **sezioni** dello Studio, più la Cabina che le
   tiene insieme: le sette sono gli ingredienti di un pezzo, ma da qualche
   parte il pezzo va anche inciso, e quel posto qui esisteva già. Otto
   linguette, **in basso**, dove sta il pollice quando il telefono è in mano:

     BEAT       da chi te lo fai — e con chi lo fai cambia com'è (punto 11)
     TESTO      le barre. Senza queste non c'è niente da incidere
     CABINA     la strofa e il beat diventano una traccia
     MIX        il fonico la mixa — e scegli tu quale provino
     COVER      la faccia del pezzo: generata, o una foto tua
     FEAT       con chi lo fai. Non è obbligatorio, ma si sente
     MARKETING  farlo sapere. Un pezzo che non gira non esiste
     TIMING     quale esce, e quando

   **Qui non si rifà l'economia del gioco.** I numeri stanno tutti in
   `actions.js` e ci restano: lo Studio chiama le stesse azioni della
   settimana. Quello che aggiunge — ed è il punto — è **chi c'è dentro** e
   **cosa scegli tu**. Il beat non è più una voce di listino: te lo fa
   qualcuno che hai conosciuto alla Sala. Il mix non è più un +6 fisso:
   dietro al banco c'è un fonico con un nome. E il provino da mixare e il
   pezzo che esce non li sceglie più `sort()[0]`: li scegli qui, e
   `actions.js` li esegue. Lo Studio decide, le azioni fanno.

   La gente è la stessa di `posto.js` (`G.gente`): la Sala resta il posto dove
   la conosci, lo Studio è dove ci lavori insieme. È il loop del gioco scritto
   nella ROADMAP — cerco, mi muovo, conosco, creo rapporti, ottengo occasioni —
   chiuso su se stesso invece che interrotto a metà. */
"use strict";

/* ==================== LE FOTO DELLE STANZE ====================
   Il secondo punto 4 di CARLO: «aggiungi le foto di background dei posti
   senza HTML, poi ricrea la schermata identica alle foto con elementi HTML».
   Quattro delle dieci foto senza interfaccia sono stanze di questo studio, e
   da qui in poi sono il fondale vero della sezione — non un disegno che le
   imita. Le altre quattro sezioni (Cover, Feat, Marketing, Timing) la foto
   non ce l'hanno ancora: lì resta la scenetta disegnata di `scene-art.js`,
   che è il ripiego, non la scelta. Il giorno che arrivano, si aggiunge una
   riga qui e basta. */
const STUDIO_FOTO_DIR = "media/photo/schermate_luoghi/schermate luoghi_senza_HTML/";
const STUDIO_FOTO = {
  beat:   {f:"studio_beat.png",   pos:"center 45%"},
  testo:  {f:"studio_testo.png",  pos:"center 58%"},
  cabina: {f:"studio_cabina.png", pos:"center 46%"},
  banco:  {f:"studio_mix.png",    pos:"center 44%"},
  /* Queste due le ho ritrovate confrontando le foto senza interfaccia con i
     riferimenti: lo sfondo di `studio_uscita_pezzo` è la strada bagnata, e
     quello di `studio_promo_su_lafamegram` è la scrivania di notte. Erano
     nella pila delle «in attesa» perché nessuno le aveva mai guardate. */
  fuori:  {f:"studio_uscita.png", pos:"center 55%"},
  promo:  {f:"studio_promo.png",  pos:"center 50%"},
  /* Cover e Feat una foto loro non ce l'hanno, né con né senza interfaccia.
     Si tengono quella della stanza più vicina — il banco per la copertina,
     la cabina per il feat — perché un fondo nero in mezzo a sei fotografie
     si vede molto più di una stanza presa in prestito. Vanno sostituite. */
  cover:  {f:"studio_mix.png",    pos:"center 30%"},
  feat:   {f:"studio_cabina.png", pos:"center 38%"}
};

/* `n` è il nome corto, quello della linguetta in basso — le sette voci del
   punto 4 più la cabina. `bar` è come si legge nella fascia in alto, con
   l'articolo: nei riferimenti c'è scritto «IL BEAT», «LA CABINA», «IL BANCO»,
   «FUORI», e quello è il tono della pagina. `d` è il sottotitolo in corsivo
   che segue il puntino. */
const STUDIO_SEZIONI = [
  {id:"beat",   n:"Beat",      bar:"Il beat",      sc:"beat",
   d:"da chi te lo fa"},
  {id:"testo",  n:"Testo",     bar:"Il foglio",    sc:"scrivi",
   d:"prima di tutto il resto"},
  {id:"cabina", n:"Cabina",    bar:"La cabina",    sc:"registra",
   d:"dove si incide"},
  {id:"banco",  n:"Mix",       bar:"Il banco",     sc:"mixa",
   d:"dove il provino diventa pezzo"},
  {id:"cover",  n:"Cover",     bar:"La copertina", sc:"pubblica",
   d:"la faccia del pezzo"},
  {id:"feat",   n:"Feat",      bar:"Il feat",      sc:"registra",
   d:"con chi lo fai"},
  {id:"promo",  n:"Marketing", bar:"Il marketing", sc:"promo",
   d:"farlo sapere"},
  {id:"fuori",  n:"Timing",    bar:"Fuori",        sc:"pubblica",
   d:"da qui in poi corre da solo"}
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

/* La scheda dello Studio dentro al salvataggio. Una sola, creata al volo:
   una partita cominciata prima che queste sezioni esistessero non deve
   accorgersi di niente. */
function studioDati(){
  if(!G.studio) G.studio = {};
  return G.studio;
}

/* Il beatmaker scelto nella colonna a sinistra resta quello con cui stai
   lavorando finche' non ne tocchi un altro, come il fonico e il featuring. */
function studioScegliBeatmaker(id){
  studioDati().bm = id;
  SFX.tap(); save(); renderStudio();
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

/* ==================== IL FEAT (punto 4) ====================
   «Può esserci come no. Non è obbligatorio che il feat venga alla sessione,
   ovviamente se svolge la sessione con noi molto probabilmente il pezzo avrà
   più qualità.» Quindi: il feat si sceglie **prima** di registrare, ed è il
   fatto di averlo in sessione che vale — non il nome sulla copertina. Vale
   meno del fonico, che sta lì tutto il giorno tutti i giorni, e vale di più
   quanto più il rapper è grosso: un feat serve anche a farsi tirare su.
   Si consuma con la registrazione: uno che viene in studio ci viene per un
   pezzo, non per sempre. */
function studioFeat(){
  if(!G.studio || !G.studio.feat) return null;
  const p = (G.gente || []).find(x => x.id === G.studio.feat);
  return (p && !p.via) ? p : null;
}
function studioAiutoFeat(p){
  const q = p || studioFeat();
  return q ? Math.round(q.rel * 1.2 + q.fama * 0.12) : 0;
}
/* Chiamata da `actions.js` quando la traccia esce dalla cabina: il nome resta
   attaccato al pezzo, e il feat torna libero. */
function studioConsumaFeat(){
  const p = studioFeat();
  if(!p) return "";
  p.pt += 1;
  while(p.pt >= relSoglia(p) && p.rel < 5){ p.pt -= relSoglia(p); p.rel++; }
  studioDati().feat = null;
  return p.n;
}
function studioScegliFeat(id){
  const d = studioDati();
  d.feat = (d.feat === id) ? null : id;
  SFX.tap(); save(); renderStudio();
}

/* ==================== QUALE PROVINO, QUALE PEZZO ====================
   Il disegno del punto 4 dice che ogni elemento è una scelta. Fin qui il
   provino da mixare e il pezzo che usciva li decideva `sort()[0]`: il
   migliore, sempre, senza chiedere. Adesso li scegli qui — `actions.js`
   guarda queste due caselle prima di ripiegare sul suo ordinamento, così la
   scelta è vera ma l'economia resta una sola. Il pezzo si segna col `seed`,
   che è l'unica cosa che un pezzo ha di suo e non cambia mai. */
function studioSegna(campo, seed){
  /* un pezzo di un salvataggio vecchio può non avere il seed: senza quello
     non c'è niente da segnare, e si lascia decidere `actions.js` come prima */
  if(!Number.isFinite(seed)) return;
  const d = studioDati();
  d[campo] = (d[campo] === seed) ? null : seed;
  SFX.tap(); save(); renderStudio();
}
/* Le due letture per `actions.js`: il pezzo scelto se c'è ancora ed è ancora
   buono, se no `null` e decide lei come ha sempre fatto. */
function studioSceltoTra(lista, campo){
  const s = (G.studio || {})[campo];
  if(s == null) return null;
  return lista.find(x => x.seed === s) || null;
}
function studioDaMixare(){ return studioSceltoTra(unmixed(), "mixa"); }
/* Fuori vanno solo i pezzi che non stanno in cassaforte: un pezzo messo da
   parte non deve uscire per sbaglio dalla plancia, che è l'unico modo in cui
   «tenerlo nel cassetto» sarebbe una promessa non mantenuta. Se non hai
   scelto niente si prende il primo dei liberi — `studioPronti()` sta in
   `studio-elementi.js` insieme alla cassaforte che lo riempie. */
function studioDaPubblicare(){
  const liberi = (typeof studioPronti === "function" ? studioPronti() : ready())
    .slice().sort((a, b) => b.q - a.q);
  return studioSceltoTra(liberi, "esce") || liberi[0] || null;
}

/* ==================== IL BEAT SU MISURA (punto 11) ====================
   Il giro dei produttori (`offriBeat`) resta: tre beat sul banco, si comprano
   dallo Shop, ed è quello che fa chi non conosce nessuno. Questo è l'altra
   strada: **te lo fa una persona**. Costa meno, è più tuo, e il beat non
   passa dal mercato — ti finisce direttamente in cartella, perché non l'hai
   comprato, te l'ha fatto uno che ti conosce.

   Un beat a testa per settimana: un beatmaker non è un distributore. */
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

/* ==================== LA COPERTINA (punto 4) ====================
   «Cover: influenza meno, ma ha 3 opzioni — caricamento file da telefono o
   computer, assets preimpostati, e personalizzazione stile emblema Black Ops
   2.» Le prime due ci sono già e le fa `copertine.js`/`covers.js`: qui si
   cambia la copertina di un pezzo **dopo** averlo registrato, che prima non
   si poteva — la sceglievi al volo mentre davi il titolo e poi era quella per
   sempre. La terza, l'editor a livelli, non c'è: è una pagina a parte. */
function studioPezzoCover(){
  const l = ready();
  const s = (G.studio || {}).cover;
  return l.find(x => x.seed === s) || l[0] || null;
}
function studioCoverAltra(){
  const s = studioPezzoCover();
  if(!s) return;
  s.seed = Math.floor(Math.random() * 1e9);
  s.img = "";
  studioDati().cover = s.seed;
  SFX.tap(); save(); renderStudio();
}
function studioCoverTogli(){
  const s = studioPezzoCover();
  if(!s || !s.img) return;
  s.img = "";
  SFX.tap(); save(); renderStudio();
}
function studioCoverCarica(file){
  const s = studioPezzoCover();
  if(!s || !file) return;
  caricaCopertina(file,
    dataUrl => {
      s.img = dataUrl;
      toast("Copertina tua su «" + s.t + "»", "good", "★", TINTA_SUONO);
      SFX.publish(); save(); renderStudio();
    },
    err => { toast(err, "bad", "!", ["#3A3F49", "#22262E"]); SFX.fail(); });
}
/* ==================== IL DISEGNO ====================
   La forma della pagina è quella dei riferimenti in
   `media/photo/schermate_luoghi/schermate_luoghi_con_elementi_HTML/`: la foto
   riempie lo schermo, e sopra ci stanno **tre colonne** — a sinistra chi c'è
   o cosa hai, in mezzo la cosa che stai facendo, a destra quello che ti
   aspetta. Ogni sezione riempie le tre colonne e basta: il telaio, i colori e
   i tasti sono gli stessi per tutte e otto, e stanno tutti in `studio.css`.

   Una colonna laterale che torna vuota sparisce da sola (`.stcol:empty`):
   non tutte le sezioni hanno tre cose da dire, e un pannello vuoto è peggio
   di un pannello che non c'è. */
function studioEsc(s){
  return String(s == null ? "" : s).replace(/[&<>"]/g, ch =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

/* Le iconcine: disegnate qui, poche righe l'una, perché una libreria intera
   per otto simboli non si porta dietro nessuno. Stesse forme dei riferimenti. */
const STUDIO_ICONE = {
  cartella:"M2 5.5A1.5 1.5 0 0 1 3.5 4h4.2l1.6 2h7.2A1.5 1.5 0 0 1 18 7.5v9A1.5 1.5 0 0 1 16.5 18h-13A1.5 1.5 0 0 1 2 16.5z",
  invio:"M2 10 18 3l-4 15-4-5.4L15 6l-8 5z",
  spunta:"M7.6 14.2 3.8 10.4l1.4-1.4 2.4 2.4 7-7 1.4 1.4z",
  carrello:"M3 3h2.2l2.1 9.2h8.4l1.9-6.6H7.1M8.4 16.6a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6m7 0a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6",
  matita:"M3 14.2 13.1 4.1l2.8 2.8L5.8 17H3zM14.3 2.9l1.5-1.5 2.8 2.8-1.5 1.5z",
  foto:"M2.5 4h15A1.5 1.5 0 0 1 19 5.5v9A1.5 1.5 0 0 1 17.5 16h-15A1.5 1.5 0 0 1 1 14.5v-9A1.5 1.5 0 0 1 2.5 4m2 8.5 3-3.6 2.3 2.7 3-3.8 3.7 4.7z",
  rinnova:"M10 3a7 7 0 0 1 6.7 5h-2.2A4.9 4.9 0 0 0 10 5.1 4.9 4.9 0 0 0 5.1 10H8l-3.5 4L1 10h2.1A6.9 6.9 0 0 1 10 3m0 14a7 7 0 0 1-6.7-5h2.2A4.9 4.9 0 0 0 10 14.9 4.9 4.9 0 0 0 14.9 10H12l3.5-4L19 10h-2.1A6.9 6.9 0 0 1 10 17",
  bolla:"M3.5 3h13A1.5 1.5 0 0 1 18 4.5v8a1.5 1.5 0 0 1-1.5 1.5H8l-4 3.4V14h-.5A1.5 1.5 0 0 1 2 12.5v-8A1.5 1.5 0 0 1 3.5 3m2.9 5.6a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2m3.6 0a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2m3.6 0a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2",
  mic:"M10 2a2.6 2.6 0 0 1 2.6 2.6v5A2.6 2.6 0 0 1 10 12.2 2.6 2.6 0 0 1 7.4 9.6v-5A2.6 2.6 0 0 1 10 2M5 9.2h1.7A3.4 3.4 0 0 0 10 12.5a3.4 3.4 0 0 0 3.3-3.3H15A5 5 0 0 1 10.8 14v2.4h2.4V18H6.8v-1.6h2.4V14A5 5 0 0 1 5 9.2",
  cursori:"M3 5h8.2a2.4 2.4 0 0 1 4.6 0H17v1.6h-1.2a2.4 2.4 0 0 1-4.6 0H3zm0 8.4h4.2a2.4 2.4 0 0 1 4.6 0H17V15h-5.2a2.4 2.4 0 0 1-4.6 0H3z",
  fulmine:"M11.4 1 3 11.6h5L8.2 19 17 8.2h-5.4z",
  soldi:"M2.5 5h15A1.5 1.5 0 0 1 19 6.5v7A1.5 1.5 0 0 1 17.5 15h-15A1.5 1.5 0 0 1 1 13.5v-7A1.5 1.5 0 0 1 2.5 5M10 7.4A2.6 2.6 0 1 0 10 12.6 2.6 2.6 0 0 0 10 7.4",
  avanti:"M7.4 3.6 13.8 10l-6.4 6.4-1.5-1.5L10.8 10 5.9 5.1z",
  /* la sagoma di «da solo»: nei riferimenti anche quella riga ha la sua
     casella, scura, con dentro una figura appena accennata */
  sagoma:"M10 4.2a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4m0 7.6c3.6 0 6.4 1.8 6.4 4v1.4H3.6v-1.4c0-2.2 2.8-4 6.4-4",
  orologio:"M10 1.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8m.9 4.2v4.4l3.4 2-.9 1.5-4.2-2.5V5.8z",
  /* Le quattro del banco e della schermata di Fuori (js/game/studio-elementi.js):
     la cassa dei bassi, la linea del battito per l'aria, il triangolo del
     «troppo caro» e l'istogramma della stima degli stream. Stanno qui e non
     là perché questo è l'elenco delle icone dello Studio, e averne due
     sarebbe il modo migliore per disegnare due volte la stessa cosa. */
  casse:"M10 1.8a8.2 8.2 0 1 0 0 16.4 8.2 8.2 0 0 0 0-16.4m0 2.1a6.1 6.1 0 1 1 0 12.2 6.1 6.1 0 0 1 0-12.2m0 2.6a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7",
  polso:"M1.4 9.2h3.1l2-5.3 3.3 12L13 6.6l1.4 2.6h4.2v1.8h-5.3l-.8-1.5-3.3 8.2L5.7 7.3l-.9 2.5H1.4z",
  allarme:"M10 1.9 19.2 18H.8zm-.95 5.4v5.1h1.9V7.3zm0 6.5v1.9h1.9v-1.9z",
  barre:"M2.4 12h3v6h-3zm5.6-4.6h3V18h-3zM13.6 3h3v15h-3z",
  /* il triangolo dell'ascolto: sul tasto «Ascolta» del banco ci va quello,
     non la freccina dell'«avanti» — nel riferimento e' un play */
  play:"M5.4 3.4 16.6 10 5.4 16.6z"
};
function stIco(nome, cls){
  const d = STUDIO_ICONE[nome];
  if(!d) return "";
  return '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"' +
    (cls ? ' class="' + cls + '"' : '') + ' aria-hidden="true"><path d="' + d + '"/></svg>';
}

/* Un pannello: il mattone di tutte e tre le colonne. */
function stPan(titolo, corpo, icona, piede){
  return '<section class="stpan">' +
    (titolo
      ? '<h3 class="stpank">' + (icona ? stIco(icona) : "") + studioEsc(titolo) + '</h3>'
      : "") +
    corpo +
    /* Il conteggio sta **sotto** alla lista, come nel riferimento («2 beat
       nella cartella»). Accanto al titolo rubava la larghezza e mandava a
       capo «QUELLO CHE HAI IN CARTELLA», che è il titolo più lungo che c'è. */
    (piede ? '<p class="stpiede">' + studioEsc(piede) + '</p>' : "") +
    '</section>';
}

/* Una riga da scegliere: pallino, miniatura, nome, e a destra quanto vale.
   `attr` è quello che la rende cliccabile; senza, è una riga da leggere e
   basta e allora non si accende sotto al dito (`.muta`). */
function stScelta(o){
  const tag = o.attr ? "button" : "div";
  return '<' + tag + ' class="stscelta' + (o.on ? " on" : "") + (o.attr ? "" : " muta") +
      '"' + (o.attr || "") + (o.attr ? ' type="button"' : "") + '>' +
    (o.senzaPallino ? "" : '<span class="stdot"></span>') +
    (o.mini ? '<span class="stmini">' + o.mini + '</span>' : "") +
    '<span class="stchi"><b>' + studioEsc(o.n) + '</b>' +
      (o.d ? '<span>' + o.d + '</span>' : "") + '</span>' +
    (o.v ? '<span class="stval' + (o.vCls ? " " + o.vCls : "") + '">' + o.v + '</span>' : "") +
    '</' + tag + '>';
}

/* Il capo del pannello centrale, la riga che nei riferimenti dice cosa stai
   facendo: «MIXI: "Sottopasso" · q71». Verbo in stampatello, la cosa fra
   virgolette in bianco, il numero in azzurro dopo il puntino. */
function stCapo(verbo, cosa, valore){
  return '<p class="stcapo"><span class="v">' + studioEsc(verbo) + ':</span> ' +
    '<span class="c">«' + studioEsc(cosa) + '»</span>' +
    (valore ? ' <span class="q">· ' + studioEsc(valore) + '</span>' : "") + '</p>';
}
/* Il riquadro del risultato, quello che nei riferimenti sta sopra ai tasti:
   «→ q78 · carattere: SECCO». Un bordo, il fondo appena più chiaro, e dentro
   solo il numero che conta. */
function stEsito(html){
  return '<div class="stesito">' + html + '</div>';
}
/* la freccina del risultato */
function stFreccia(){ return '<span class="strec">→</span>'; }
/* i sottotitoli della colonna di destra: STROFA, BEAT */
function stSotto(t){
  return '<h4 class="stsottotit">' + studioEsc(t) + '</h4>';
}

function studioVuoto(t){
  return '<div class="stvuoto">' + t + '</div>';
}

/* I due tasti. Uno solo per schermata è d'oro, ed è quello che fa succedere
   la cosa: nei riferimenti è sempre così. */
function stPrimo(attr, testo, icona, spento){
  return '<button type="button" class="stprimo"' + attr + (spento ? " disabled" : "") + '>' +
    (icona ? stIco(icona) : "") + studioEsc(testo) + '</button>';
}
function stSecondo(attr, testo, icona, spento){
  return '<button type="button" class="stsecondo"' + attr + (spento ? " disabled" : "") + '>' +
    (icona ? stIco(icona) : "") + studioEsc(testo) + '</button>';
}
function stAzioni(){
  const b = [].slice.call(arguments).filter(Boolean);
  return b.length ? '<div class="stazioni">' + b.join("") + '</div>' : "";
}

/* la testa del pannello centrale: il titolo grosso e la riga sotto */
function stTitolo(t, sotto){
  return '<h2 class="sttitolone">' + studioEsc(t) + '</h2>' +
    (sotto ? '<p class="stsottotitolo">' + sotto + '</p>' : "");
}

const stNum = v => '<span class="num">' + v + '</span>';
const stOro = v => '<span class="oro">' + v + '</span>';

/* «da solo»: la casella c'è lo stesso, con dentro una sagoma spenta. Una
   riga senza miniatura in mezzo a righe che ce l'hanno sembra un pezzo che
   manca, non una scelta diversa. */
function stSagoma(){
  return '<span class="stsolo">' + stIco("sagoma") + '</span>';
}

/* la copertina di un pezzo, per le miniature e per il centro */
function stCover(s){
  return cover(s.seed || 7, s.t, (window.ARTIST || {}).name || "", s.img);
}

/* ==================== LE OTTO SEZIONI ====================
   Ognuna torna tre pezzi: `sx`, `mid`, `dx`. Chi non ha niente da mettere in
   una colonna torna stringa vuota, e quella colonna sparisce.

   Il pannello centrale ha sempre la stessa forma, che è quella dei
   riferimenti: un **capo** breve in cima («MIXI: "Sottopasso" · q71»), la
   spiegazione, il **riquadro del risultato** («→ q78 · carattere: SECCO») e
   in fondo i tasti. Il titolone grosso lo usano solo Copertina e Fuori,
   perché lì il pezzo ha una faccia e un nome e sono loro la schermata. */

/* ---- BEAT — «da chi te lo fa» ---- */
function studioSezBeat(){
  const gente = studioGente("beatmaker");
  const scelto = gente.find(p => p.id === (G.studio || {}).bm) || gente[0] || null;

  const sx = stPan("Chi te li fa",
    gente.length
      ? gente.map(p => {
          /* A destra della riga, come nel riferimento, sta **lo sconto** e
             non il prezzo: «−20%» a un amico, «gratis» a un partner. Il
             prezzo è uno solo e sta sotto, nel riquadro del risultato; qui
             serve la cosa che cambia da una persona all'altra, che è quanto
             ti fa pagare in meno perché ti conosce. */
          const sc = p.rel >= 4 ? "gratis" : p.rel >= 1 ? "−" + Math.round(p.rel * 22) + "%" : "—";
          return stScelta({
            attr:' data-bm="' + studioEsc(p.id) + '"',
            on: scelto === p,
            mini: faccia(p, 40),
            n: p.n,
            /* solo il rapporto, come nel riferimento: col genere in coda la
               riga si troncava a metà parola dentro a una colonna da 300 */
            d: relNome(p),
            v: sc,
            vCls: p.rel >= 1 ? "" : "calmo"
          });
        }).join("")
      : studioVuoto("Non conosci ancora nessun beatmaker. Passa <b>dalla Sala</b>: è lì che si trovano."));

  /* Il centro è quello del riferimento `studio_creazione_beat`: **le schede
     dei tre beat sul banco**, non una riga di testo. Copertina, genere, bpm,
     il tasto per ascoltarli con l'onda di fianco e il prezzo grosso in
     fondo. Le disegna `studio-elementi.js`; qui si dice solo cosa ci va
     sopra e cosa ci va sotto.

     I tre tasti sotto sono i tre del riferimento, ma con le mosse che il
     gioco ha davvero: comprare quello scelto, farsene fare uno su misura da
     chi hai a sinistra, e rifare il giro. Tirare sul prezzo e chiedere di
     rifarlo sono due mercanteggiamenti che qui non esistono, e inventarli
     vorrebbe dire rifare l'economia — che in questa pagina non si fa. */
  const banco = (G.market || []).length ? studioBeatBanco() : "";
  const scheda = studioBeatScelto();

  let mid;
  if(scelto){
    const st = studioBeatPronto(scelto);
    const c = studioBeatPrezzo(scelto);
    const q = Math.round(20 + scelto.fama * 0.55 + scelto.rel * 7 + (G.skills.rete || 0) * 0.4);
    mid = stPan("",
      stCapo("Te lo fa", scelto.n, "q~" + q) +
      '<p class="stnota">Un beat comprato è un beat di chiunque. Uno che ti fa una persona che ' +
        'ti conosce è <b>tuo</b> — e più siete in confidenza, meglio viene e meno costa.</p>' +
      banco +
      stEsito((c ? fmt(c) + " €" : "gratis") + ' · ' +
        stNum(studioBeatTempoTesto()) + ' · te lo mette in cartella lui') +
      stAzioni(
        /* Uno solo d'oro per schermata, come in tutti i riferimenti: qui è
           «Compralo», perché è la scheda che stai guardando in mezzo allo
           schermo. Farselo fare è l'altra strada e resta un contorno — d'oro
           tutti e due, non si capiva più dove premere. */
        scheda
          ? stPrimo(' data-stcompra="1"', "Compralo", "carrello", G.money < scheda.price)
          : "",
        stSecondo(' data-beat="' + studioEsc(scelto.id) + '"', "Fattelo fare", "spunta", !st.ok),
        stSecondo(' data-az="beat"', "Gira a cercare beat", "rinnova")) +
      (st.ok ? "" : '<p class="stperche">' + studioEsc(st.perche) + '</p>'));
  } else {
    mid = stPan("",
      stCapo("Il beat", banco ? "tre sul banco" : "non te lo fa nessuno", "") +
      '<p class="stnota">Senza qualcuno che te lo faccia resta lo Shop: tre beat sul banco, ' +
      'da comprare. Non serve conoscere nessuno, e non costa energia — ci vogliono due ore.</p>' +
      banco +
      stAzioni(
        scheda
          ? stPrimo(' data-stcompra="1"', "Compralo", "carrello", G.money < scheda.price)
          : "",
        stSecondo(' data-az="beat"', "Gira a cercare beat", "rinnova")));
  }

  /* A destra la cartella, e con la faccia che ha nel riferimento: ogni beat
     con la sua copertina e il suo tasto per riascoltarlo. Un elenco di soli
     nomi era l'unica colonna della pagina senza una miniatura, e si vedeva. */
  const dx = stPan("Quello che hai in cartella",
    (G.beats || []).length
      ? (G.beats || []).map(b => stScelta({
          senzaPallino:true, n:b.n,
          mini:cover(beatSeed(b), "", "", ""),
          d:"q" + b.q + (b.gen ? " · " + studioEsc(genBeat(b.gen).n.toLowerCase()) : "") +
            (b.da ? " · " + studioEsc(b.da) : ""),
          v:stPlay(' data-bplay="' + beatSeed(b) + '"', "Ascolta «" + b.n + "»")
        })).join("")
      : studioVuoto("Cartella vuota."),
    "cartella", (G.beats || []).length
      ? (G.beats.length + (G.beats.length === 1 ? " beat nella cartella" : " beat nella cartella"))
      : "");

  return {sx, mid, dx};
}

/* ---- TESTO — le barre ---- */
function studioSezTesto(){
  const barre = (G.bars || []).slice().sort((a, b) => b.q - a.q);
  const tema = studioTemaScelto();
  const isp = studioIspirazione();

  /* A sinistra il TEMA, come in `scrittura_barre`: «scegli da dove partire».
     I temi sono quelli di `writer.js`, che il gioco tirava a caso e chiamava
     «della settimana»; da qui si scelgono, e il foglio si apre su quello. */
  const sx = stPan("Tema",
    '<p class="stnota">Scegli da dove partire. Le parole del tema, dentro alla strofa, ' +
      '<b>contano nel voto</b>.</p>' +
    (typeof TEMI !== "undefined" ? TEMI : []).map(t => stScelta({
      attr:' data-tema="' + studioEsc(t.t) + '"', on:tema === t,
      n:t.t,
      /* tre parole, non la frase intera: la riga è una sola e non va a capo,
         e la descrizione dei temi si troncava a metà parola. Nel riferimento
         sotto al titolo ci sono proprio tre parole — «strade, silenzi,
         pensieri» — e sono le parole che poi contano nel voto. */
      d:studioEsc(t.k.slice(0, 3).join(", "))
    })).join(""));

  const mid = stPan("",
    stCapo("Scrivi", tema ? tema.t : "da dove ti pare", tema ? "" : "nessun tema scelto") +
    '<p class="stnota">Il beat lo puoi comprare, il testo no. È l\'unica parte del pezzo che non ' +
      'può farti nessun altro — e nella qualità finale <b>pesa più di tutto il resto</b>.</p>' +
    /* la barra del riferimento: quanto ti viene bene oggi, per davvero */
    stBarraLunga("fulmine", "Ispirazione", isp, 100, studioIspirazioneFrase(isp)) +
    stEsito('veloce esce a ' + stNum("q~" + isp) + ' · scritta da te vale ' + stOro("×1,5") +
      ' · dipende da ' + stNum("scrittura") + ' · ' + stNum("benessere")) +
    stAzioni(stPrimo(' data-az="scrivi"', "Scrivi le barre", "matita")) +
    (tema ? "" : '<p class="stperche">Senza tema scelto il foglio ne tira uno a caso, ' +
      'come faceva prima.</p>'));

  /* A destra le parole del tema — sono quelle che `analizza()` va a cercare
     nella strofa una per una — e sotto le strofe che hai già in cartella. */
  const dx = stPan("Parole e cartella",
    (tema
      ? '<div class="stparole">' +
          tema.k.map(k => '<span>' + studioEsc(k) + '</span>').join("") + '</div>'
      : studioVuoto("Scegli un tema e qui trovi le sue parole.")) +
    stSotto("Le tue barre") +
    (barre.length
      ? barre.map((b, i) => stScelta({
          senzaPallino:true, n:b.tema || "strofa senza tema",
          d:i === 0 ? "la migliore che hai" : "in cartella",
          v:"q" + b.q
        })).join("")
      : studioVuoto("Il foglio è bianco.")),
    "cartella", barre.length
      ? (barre.length + (barre.length === 1 ? " strofa in cartella" : " strofe in cartella"))
      : "");

  return {sx, mid, dx};
}

/* ---- CABINA — dove si incide ---- */
function studioSezCabina(){
  /* La strofa e il beat non sono piu' i migliori d'ufficio: nel riferimento
     `registrazione_pezzo` la colonna di destra ha i pallini, e si sceglie.
     Li tiene `studio-elementi.js`, e `actions.js` incide quelli. */
  const b = studioStrofa(), bt = studioBeatSuCui();
  const fon = studioFonico();
  const ft = studioFeat();
  const aiuto = studioAiuto(fon), aiutoFt = studioAiutoFeat(ft);
  const q = (b && bt) ? Math.round(songQ(b, bt)) + aiuto + aiutoFt : null;
  const gente = studioGente("fonico");

  const sx = stPan("Dietro al vetro",
    gente.map(p => stScelta({
      attr:' data-fonico="' + studioEsc(p.id) + '"',
      on:fon === p, mini:faccia(p, 40),
      n:p.n, d:relNome(p),
      v:studioAiuto(p) ? "+" + studioAiuto(p) + " qual." : "—",
      vCls:studioAiuto(p) ? "" : "calmo"
    })).join("") +
    stScelta({on:!fon, mini:stSagoma(), n:"da solo", d:"quello che sai fare tu",
      v:"+0", vCls:"calmo"}) +
    (gente.length ? "" : studioVuoto("Non conosci ancora nessun fonico. <b>Alla Sala</b> ce ne gira più di uno.")));

  let mid;
  if(b && bt){
    /* Il centro è quello di `registrazione_pezzo`: **l'elenco delle take**,
       con la barra a tacche e la migliore segnata. La prima è il tiro di
       dado che `registra` faceva da solo e non ti faceva vedere; le altre le
       chiedi tu e le paghi in energia. Sotto, i due tasti del riferimento:
       un'altra take, oppure ti tieni questa e si chiude. */
    const t = studioTake();
    const scelta = t ? studioTakeQ(t.l[t.s]) : q;
    mid = stPan("",
      stCapo("Incidi", (b.tema || "la strofa") + "» su «" + bt.n, "q~" + q) +
      '<p class="stnota">Un fonico che ti conosce sa dove metterti la voce prima che glielo ' +
        'chiedi: <b>vale qualità</b>, in cabina e al banco.</p>' +
      studioTakeElenco() +
      stEsito(
        (fon ? '<b>' + studioEsc(fon.n) + '</b> dietro al vetro ' + stNum("+" + aiuto)
             : 'da solo, nessuno dietro al vetro') +
        (ft ? ' · <b>' + studioEsc(ft.n) + '</b> in sessione ' + stNum("+" + aiutoFt) : '') +
        (t ? ' · ' + stFreccia() + ' esce con ' + stOro("q" + scelta) : '')) +
      stAzioni(
        stPrimo(' data-ancora="1"',
          "Un'altra take · " + STUDIO_TAKE_ENERGIA + " energia", "mic",
          G.energy < STUDIO_TAKE_ENERGIA || (t && t.l.length >= STUDIO_TAKE_MAX)),
        stSecondo(' data-az="registra"', "Tieni questa e chiudi", "spunta")) +
      (G.energy < STUDIO_TAKE_ENERGIA
        ? '<p class="stperche">Per un\'altra take servono ' + STUDIO_TAKE_ENERGIA +
          ' di energia, ne hai ' + Math.round(G.energy) + '.</p>'
        : ""));
  } else if(!b){
    mid = stPan("",
      stCapo("Incidi", "manca la strofa", "") +
      '<p class="stnota">Non c\'è niente da registrare. Si comincia dal foglio, ' +
        'e il foglio sta nel <b>Testo</b>.</p>' +
      stAzioni(stPrimo(' data-az="scrivi"', "Scrivi le barre", "matita")) +
      (!bt ? studioVuoto("E serve anche un beat: te lo fai fare al <b>Beat</b>.") : ""));
  } else {
    mid = stPan("",
      stCapo("Incidi", "manca il beat", "") +
      '<p class="stnota">Hai la strofa, non su cosa metterla. Te lo fai fare al <b>Beat</b>, ' +
        'da uno che conosci, oppure lo compri allo Shop.</p>');
  }

  /* «CHE COSA INCIDI»: le strofe sotto al loro sottotitolo, i beat sotto al
     loro, ognuno con la sua miniatura e il suo pallino — e si sceglie, come
     nel riferimento. Prima era un promemoria di due righe che diceva quello
     che avresti inciso comunque. */
  const strofe = (G.bars || []).slice().sort((x, y) => y.q - x.q);
  const cartella = (G.beats || []).slice().sort((x, y) => y.q - x.q);
  const dx = stPan("Che cosa incidi",
    stSotto("Strofa") +
    (strofe.length
      ? strofe.map(x => stScelta({
          attr:' data-strofa="' + studioBarraSeme(x) + '"', on:b === x,
          n:x.tema || "strofa senza tema", d:"scritta da te", v:"q" + x.q
        })).join("")
      : studioVuoto("Nessuna.")) +
    stSotto("Beat") +
    (cartella.length
      ? cartella.map(x => stScelta({
          attr:' data-incide="' + beatSeed(x) + '"', on:bt === x,
          mini:cover(beatSeed(x), "", "", ""), n:x.n,
          d:(x.gen ? studioEsc(genBeat(x.gen).n.toLowerCase()) + " · " : "") + "q" + x.q +
            (x.da ? " · " + studioEsc(x.da) : "")
        })).join("")
      : studioVuoto("Nessuno.")),
    "cartella");

  return {sx, mid, dx};
}

/* ---- IL BANCO — dove il provino diventa pezzo ---- */
function studioSezBanco(){
  const da = unmixed().sort((a, b) => b.q - a.q);
  const scelto = studioDaMixare() || da[0];
  const fon = studioFonico();
  const g = mixGain();

  const sx = stPan("Al banco",
    (fon
      ? stScelta({on:true, mini:faccia(fon, 40), n:fon.n, d:relNome(fon),
          v:"+" + studioAiuto(fon) + " qual."})
      : "") +
    stScelta({on:!fon, mini:stSagoma(), n:"da solo", d:"il mix lo fai tu",
      v:"+0", vCls:"calmo"}) +
    (fon ? "" : studioVuoto("Nessuno al banco. Un fonico si chiama <b>dalla Cabina</b>.")));

  let mid;
  if(scelto){
    /* Il centro e' quello di `studio_mixaggio`: **i tre cursori**, con le
       tacche, i due capi scritti sotto e una frase per ognuno. Sotto, il
       riquadro del risultato con il carattere che ne esce — «→ q78 ·
       carattere: SECCO» — e i due tasti del riferimento. Al centro i
       cursori valgono zero: chi non li tocca mixa come si mixava prima. */
    const car = studioBancoCarattere();
    mid = stPan("",
      stCapo("Mixi", scelto.t, "q" + scelto.q) +
      studioBancoCursori() +
      stEsito(stFreccia() + ' ' + stOro("q" + clamp(scelto.q + g, 5, 100)) +
        ' · carattere: ' + stOro(car.n) + ' · ' +
        stNum("+" + g) + (fon ? ', di cui ' + stNum(studioAiuto(fon)) + ' suoi' : '')) +
      stAzioni(
        stPrimo(' data-ascolta="1"', "Ascolta", "play"),
        stSecondo(' data-az="mixa"', "Chiudi il mix", "spunta")));
  } else {
    mid = stPan("",
      stCapo("Mixi", "niente, il banco è spento", "") +
      '<p class="stnota">Prima si registra. Il provino arriva <b>dalla Cabina</b>.</p>');
  }

  const dx = stPan("Da mixare",
    da.length
      ? da.map(s => stScelta({
          attr:' data-mixa="' + s.seed + '"', on:scelto === s,
          mini:stCover(s), n:s.t, d:"q" + s.q + " · grezzo",
          v:"→ " + clamp(s.q + g, 5, 100)
        })).join("")
      : studioVuoto("Nessun provino."),
    "cartella", da.length
      ? (da.length + (da.length === 1 ? " provino da mixare" : " provini da mixare"))
      : "");

  return {sx, mid, dx};
}

/* ---- LA COPERTINA — la faccia del pezzo ---- */
function studioSezCover(){
  const pronti = ready();
  const s = studioPezzoCover();

  const sx = stPan("I tuoi pezzi",
    pronti.length
      ? pronti.map(x => stScelta({
          attr:' data-cover="' + x.seed + '"', on:s === x,
          mini:stCover(x), n:x.t,
          d:"q" + x.q + (x.img ? " · copertina tua" : " · generata")
        })).join("")
      : studioVuoto("Non hai pezzi a cui cambiare la copertina."),
    "cartella");

  const mid = s
    ? stPan("",
        '<div class="stfianco">' +
          '<span class="stcopertina">' + stCover(s) + '</span>' +
          '<div>' +
            stTitolo(s.t, 'q' + s.q + ' · ' + (s.mixed ? "mixato" : "grezzo")) +
            '<p class="stnota">Sulla qualità <b>pesa poco</b>, su chi ti clicca pesa tutto: ' +
              'è la prima cosa che si vede di un pezzo, spesso l\'unica.</p>' +
            stAzioni(
              stPrimo(' data-cov="carica"', "Carica una foto", "foto"),
              s.img
                ? stSecondo(' data-cov="togli"', "Togli la foto", "rinnova")
                : stSecondo(' data-cov="altra"', "Generane un'altra", "rinnova")) +
          '</div>' +
        '</div>' +
        stEsito('JPG o PNG · la ritaglio quadrata io a ' + stNum("360×360")) +
        '<p class="stnota" style="margin:12px 0 0">La terza strada del punto 4 — costruirtela a ' +
          'livelli, stile emblema di Black Ops 2 — non c\'è ancora: è una pagina a parte, ' +
          'non un bottone.</p>')
    : stPan("",
        stCapo("Copertina", "nessun pezzo da vestire", "") +
        '<p class="stnota">La copertina si mette a un pezzo registrato. Si comincia ' +
          'dalla <b>Cabina</b>.</p>');

  return {sx, mid, dx:""};
}

/* ---- IL FEAT — con chi lo fai ---- */
function studioSezFeat(){
  const gente = studioGente("rapper");
  const ft = studioFeat();

  const sx = stPan("Chi può entrarci",
    gente.length
      ? gente.map(p => stScelta({
          attr:' data-feat="' + studioEsc(p.id) + '"', on:ft === p,
          mini:faccia(p, 40), n:p.n,
          d:relNome(p) + " · fama " + p.fama,
          v:studioAiutoFeat(p) ? "+" + studioAiutoFeat(p) + " qual." : "—",
          vCls:studioAiutoFeat(p) ? "" : "calmo"
        })).join("")
      : studioVuoto("Non conosci ancora nessun altro rapper. Si incontrano <b>alla Sala</b> — " +
          "e non tutti hanno voglia di dividere un pezzo."));

  const mid = ft
    ? stPan("",
        stCapo("In sessione", ft.n, "+" + studioAiutoFeat(ft)) +
        '<p class="stnota">Un feat non è obbligatorio. Ma se il pezzo lo fate <b>insieme, in ' +
          'sessione</b>, si sente — quanto vale dipende da quanto è grosso lui e da quanto vi ' +
          'conoscete.</p>' +
        stEsito(stFreccia() + ' ' + stOro("+" + studioAiutoFeat(ft)) +
          ' sulla prossima traccia · poi il posto torna libero') +
        stAzioni(stSecondo(' data-feat="' + studioEsc(ft.id) + '"', "Lascia perdere", "rinnova")))
    : stPan("",
        stCapo("In sessione", "nessuno", "") +
        '<p class="stnota">Va benissimo così: il feat è una scelta, non un passaggio. ' +
          'Se ne chiami uno, la traccia che registri dopo vale di più.</p>');

  return {sx, mid, dx:""};
}

/* ---- IL MARKETING — farlo sapere ---- */
function studioSezMarketing(){
  const fuori = (G.songs || []).filter(x => x.released)
    .sort((a, b) => (b.week || 0) - (a.week || 0));
  const ultimo = fuori[0];

  const sx = stPan("Cosa spingi",
    fuori.length
      ? fuori.slice(0, 6).map((x, i) => stScelta({
          on:i === 0, mini:stCover(x), n:x.t,
          d:"q" + x.q + " · " + fmt(x.streams || 0) + " stream"
        })).join("")
      : studioVuoto("Non hai ancora fatto uscire niente."),
    "cartella");

  /* Il riferimento `studio_promo_su_lafamegram` ha in cima «TELEFONO ·
     LAFAMEGRAM», non «STUDIO»: quella schermata — il telefono in mano, i tre
     tipi di post, «CHE POST FAI?» — è una pagina del telefono, e sta a
     `telefono.js`. Quello che si prende da lì e vale anche qui è il riquadro
     giallo della saturazione: postare si può sempre, ma dalla seconda volta
     in un giorno rende meno, e prima non lo diceva nessuno. */
  const oggi = typeof adfOggi === "function" ? adfOggi("promo") : 0;
  const mult = typeof promoDailyMult === "function" ? promoDailyMult() : 1;

  const mid = stPan("",
    stCapo("Spingi", ultimo ? ultimo.t : "niente, non hai pezzi fuori",
      ultimo ? "q" + ultimo.q : "") +
    '<p class="stnota">Il pezzo è uscito: adesso qualcuno lo deve sapere. Questa è la promo che ' +
      'parte <b>da qui, dallo studio</b> — quello che si fa col telefono in mano appena finita ' +
      'la sessione.</p>' +
    (oggi > 0 && mult < 1
      ? stAvviso("Hai già postato <b>" + oggi + (oggi === 1 ? " volta" : " volte") +
          "</b> oggi: la gente comincia a scorrere oltre, e quello che spingi rende il <b>" +
          Math.round(mult * 100) + "%</b>.")
      : "") +
    stEsito('le altre due strade — l\'app <b>Discografia</b> e il giro dei giornalisti — ' +
      'non sono ancora collegate qui') +
    (ultimo
      ? stAzioni(stPrimo(' data-az="promo"', "Posta", "invio"))
      : stAzioni(stPrimo(' data-az="promo"', "Posta", "invio", true)) +
        '<p class="stperche">Prima esce un pezzo, poi lo si spinge. Si passa da Fuori.</p>'));

  return {sx, mid, dx:""};
}

/* ---- FUORI — quale esce, e quando ---- */
function studioSezFuori(){
  const pronti = studioPronti().sort((a, b) => b.q - a.q);
  const s = studioDaPubblicare() || pronti[0];
  const usciti = (G.songs || []).filter(x => x.released);
  const ultimo = usciti.slice().sort((a, b) => (b.week || 0) - (a.week || 0))[0];
  const da = ultimo && typeof totalWeeks === "function"
    ? Math.max(0, totalWeeks() - (ultimo.week || 0)) : null;
  const qFinale = s ? (s.mixed ? s.q : clamp(s.q - 8, 5, 100)) : 0;
  const quando = studioQuando();
  const gVen = studioGiorniAVenerdi();
  const tenuti = studioTenuti();

  /* «QUANDO», le tre righe del riferimento `studio_uscita_pezzo`. Adesso
     sono tutte e tre vere: stanotte passa dall'azione di sempre, venerdì
     mette il pezzo in coda e lo fa uscire da solo quando arriva il giorno
     (`studioUscitePronte()`, chiamata da `avanzaGiorno()`), e il cassetto lo
     toglie dalla coda e lo mette in cassaforte finché non lo ritiri. */
  const sx = stPan("Quando",
    STUDIO_QUANDO.map(o => stScelta({
      attr:' data-quando="' + o.id + '"', on:quando === o.id,
      n:o.n,
      d:o.id === "venerdi" ? studioVenerdiTesto() : o.d,
      v:o.id === "venerdi" ? "+hype" : ""
    })).join(""));

  let mid;
  if(s){
    const st = studioStreamStima(s);
    mid = stPan("",
      '<div class="stfianco">' +
        '<span class="stcopertina">' + stCover(s) + '</span>' +
        '<div>' +
          stTitolo(s.t, 'q' + qFinale + ' · ' + (s.mixed ? "mixato" : "<b>non mixato</b>") +
            (s.car ? ' · ' + studioEsc(s.car.toLowerCase()) : "")) +
          /* «cambia copertina», come nel riferimento: porta alla sezione
             della copertina con questo pezzo già scelto */
          '<p class="stazlink"><button type="button" class="stlink" data-vesti="' + studioPezzoSeme(s) + '">' +
            stIco("foto") + 'cambia copertina</button></p>' +
          '<p class="stnota">' +
            (quando === "venerdi"
              ? (gVen === 0
                  ? 'Oggi <b>è venerdì</b>: esce stanotte, nel giorno che rende di più. '
                  : 'Esce <b>venerdì</b>, ' + studioVenerdiTesto() + '. ')
              : quando === "cassetto"
                ? 'Resta tuo e non esce: lo ritrovi <b>in cassaforte</b>, e da lì torna in coda quando vuoi. '
                : '') +
            (da == null
              ? 'Non hai ancora fatto uscire niente: il primo pezzo è quello che dice chi sei.'
              : da === 0
                ? '<b>Sei uscito questa settimana</b>: due pezzi ravvicinati si rubano l\'ascolto.'
                : da === 1
                  ? 'È passata <b>una settimana</b> dall\'ultima uscita.'
                  : 'Sono passate <b>' + da + ' settimane</b> dall\'ultima uscita.') +
          '</p>' +
          /* la stima degli stream della prima settimana: non è un numero di
             riempimento, è `songWeekly()` di sim.js presa ai due capi dei
             suoi tiri di dado */
          (st && quando !== "cassetto"
            ? '<p class="ststream">' + stIco("barre") + '~ <b>' + fmt(st.min) + ' – ' +
              fmt(st.max) + '</b> stream</p>'
            : "") +
          stAzioni(stPrimo(' data-manda="1"',
            quando === "cassetto" ? "Tienilo da parte" : "Mandalo fuori",
            quando === "cassetto" ? "cartella" : "invio")) +
        '</div>' +
      '</div>' +
      stEsito(stFreccia() + ' esce con ' + stOro("q" + qFinale) + ' · ' +
        (quando === "venerdi"
          ? 'venerdì vale ' + stNum("+" + STUDIO_VENERDI_HYPE) + ' hype · '
          : '') +
        (s.mixed
          ? 'da qui in poi corre da solo'
          : 'non è mixato, ci perde ' + stNum("8 punti"))));
  } else {
    mid = stPan("",
      stCapo("Fuori", tenuti.length ? "tutto in cassaforte" : "niente di pronto", "") +
      '<p class="stnota">' +
        (tenuti.length
          ? 'Quello che hai lo stai tenendo da parte. Ne <b>ritiri uno</b> dalla cassaforte, ' +
            'qui a destra, e torna in coda.'
          : 'Si comincia dal <b>Beat</b>, poi il <b>Testo</b>, poi la <b>Cabina</b>.') +
      '</p>');
  }

  const dx = stPan("Pronti",
    (pronti.length
      ? pronti.map(x => stScelta({
          attr:' data-esce="' + x.seed + '"', on:s === x,
          mini:stCover(x), n:x.t,
          d:"q" + x.q + (x.mixed
            ? " · mixato"
            : ' · grezzo · <span class="ros">−8 se esce così</span>') +
            (x.esce != null ? ' · <span class="oro">in coda</span>' : "")
        })).join("")
      : studioVuoto("Niente in coda.")) +
    /* «IN CASSAFORTE»: il secondo blocco della colonna di destra nel
       riferimento. Un pezzo tenuto da parte non sparisce e non esce per
       sbaglio — si ritira da qui, ed è la seconda metà della scelta. */
    (tenuti.length
      ? stSotto("In cassaforte") +
        tenuti.map(x => stScelta({
          attr:' data-riprendi="' + studioPezzoSeme(x) + '"', senzaPallino:true,
          mini:stCover(x), n:x.t, d:"q" + x.q + " · tenuto",
          v:"ritira", vCls:"calmo"
        })).join("")
      : ""),
    "cartella", pronti.length
      ? (pronti.length + (pronti.length === 1 ? " pezzo pronto" : " pezzi pronti"))
      : "");

  return {sx, mid, dx};
}

/* ==================== LA PAGINA ==================== */
/* energia · soldi · ora, come nella fascia dei riferimenti */
function studioRisorse(){
  const ora = (typeof GAME_TIME !== "undefined" && typeof GAME_TIME.text === "function")
    ? GAME_TIME.text() : "";
  /* Nei riferimenti l'etichetta è azzurra, il numero bianco, e i soldi sono
     l'unica cosa d'oro: l'oro nella fascia lo prende solo quello che si
     spende. In mezzo pallini azzurri, non trattini. */
  const punto = '<span class="stpunto" aria-hidden="true"></span>';
  return '<span>' + stIco("fulmine") + '<i>energia</i><b>' + Math.round(G.energy) + '</b></span>' +
    punto +
    '<span>' + stIco("soldi") + '<b class="oro">' + fmt(G.money) + ' €</b></span>' +
    (ora ? punto + '<span>' + stIco("orologio") + '<b>' + studioEsc(ora) + '</b></span>' : "");
}

/* La riga in basso: se il diario di bordo ha qualcosa da dire lo dice lui —
   è la voce che nei riferimenti racconta com'è andata l'ultima cosa. Quando
   tace, parla la sezione. */
/* Quale riga del diario si sta leggendo. La freccia in fondo alla riga fa
   scorrere indietro nel tempo — è l'unica cosa che quel tasto può fare qui e
   sia vera: sotto c'è un diario di ottanta righe, non un messaggio solo. */
let STUDIO_DIARIO = 0;
function studioScorriDiario(){
  const n = (G.log || []).length;
  if(n < 2) return;
  STUDIO_DIARIO = (STUDIO_DIARIO + 1) % n;
  SFX.tap(); renderStudio();
}

function studioBanda(sez){
  const diario = G.log || [];
  if(STUDIO_DIARIO >= diario.length) STUDIO_DIARIO = 0;
  const ultima = (diario[STUDIO_DIARIO] && diario[STUDIO_DIARIO].t) || "";
  return '<span class="stbolla">' + stIco("bolla") + '</span>' +
    '<span class="stdetto">' + (ultima || '<i>' + studioEsc(sez.d) + '</i>') + '</span>' +
    /* la freccia c'è in tutti i riferimenti, in fondo alla riga: da sola non
       fa niente — apre il diario di bordo, che è dove quella riga continua */
    '<button type="button" class="stavanti" data-diario="1"' +
    ((G.log || []).length < 2 ? " disabled" : "") +
    ' aria-label="La riga di diario precedente">' + stIco("avanti") + '</button>';
}

function renderStudio(){
  const root = $("studio");
  if(!root || !root.classList.contains("on")) return;

  const sez = STUDIO_SEZIONI.find(x => x.id === STUDIO_SEZ) || STUDIO_SEZIONI[0];

  const tabs = $("st-tabs");
  tabs.innerHTML = STUDIO_SEZIONI.map(x =>
    '<button class="sttab' + (x.id === sez.id ? " on" : "") + '" data-sez="' + x.id + '">' +
    x.n + '</button>').join("");
  /* Otto linguette non ci stanno in riga su un telefono: la striscia scorre.
     Due cose, se no le ultime due sezioni sono una caccia al tesoro — che è
     l'avvertimento scritto nel progetto delle pagine. Primo: quella accesa si
     porta sempre in vista, così sai dove sei anche se ci sei arrivato da
     un'altra parte. Secondo: quando c'è altro a destra si accende una
     sfumatura sul bordo, che è l'unico modo di dire «continua» senza rubare
     spazio ai tasti. */
  const acceso = tabs.querySelector(".sttab.on");
  if(acceso && typeof acceso.scrollIntoView === "function")
    acceso.scrollIntoView({block:"nearest", inline:"nearest"});
  studioOltre();

  /* la foto della stanza, a schermo intero */
  const foto = STUDIO_FOTO[sez.id] || null;
  const scena = $("st-scena");
  scena.style.backgroundImage = foto ? 'url("' + STUDIO_FOTO_DIR + foto.f + '")' : "";
  scena.style.backgroundPosition = foto ? foto.pos : "center";

  $("st-nome").innerHTML = studioEsc(sez.bar) +
    '<i><span class="stpunto"></span>' + studioEsc(sez.d) + '</i>';
  $("st-risorse").innerHTML = studioRisorse();
  $("st-banda").innerHTML = studioBanda(sez);
  $("st-banda").hidden = false;

  const parti =
    (sez.id === "beat"   ? studioSezBeat() :
     sez.id === "testo"  ? studioSezTesto() :
     sez.id === "cabina" ? studioSezCabina() :
     sez.id === "banco"  ? studioSezBanco() :
     sez.id === "cover"  ? studioSezCover() :
     sez.id === "feat"   ? studioSezFeat() :
     sez.id === "promo"  ? studioSezMarketing() :
     studioSezFuori());

  $("st-sx").innerHTML = parti.sx || "";
  $("st-corpo").innerHTML = parti.mid || "";
  $("st-dx").innerHTML = parti.dx || "";
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
   non un secondo motore. Punto 14: non si chiude più prima — si resta dentro,
   e quello che succede (toast, foglio, titolo del pezzo, scena) si racconta
   sopra allo Studio, che aspetta già disegnato dietro. */
function studioAzione(id){
  const st = hubPronta(id);
  if(!st.ok){ toast(st.perche, "bad", "!", ["#3A3F49", "#22262E"]); return; }
  hubAzione(id);
  renderStudio();
}

/* Si esce dallo Studio solo dal bottone globale «Torna alla mappa» (punto 1):
   niente X in testata, niente chiusura cliccando sul fondo. chiudiStudio()
   resta esposta — la chiama menu-sistema.js quando premi quel bottone. */
if($("studio")){
  $("studio").addEventListener("click", e => {
    const t = e.target.closest("[data-sez]");
    if(t){ STUDIO_SEZ = t.dataset.sez; STUDIO_DIARIO = 0; SFX.tap(); renderStudio(); return; }
    const bm = e.target.closest("[data-bm]");
    if(bm){ studioScegliBeatmaker(bm.dataset.bm); return; }
    const b = e.target.closest("[data-beat]");
    if(b){ studioFattiUnBeat(b.dataset.beat); return; }
    const f = e.target.closest("[data-fonico]");
    if(f){ studioScegliFonico(f.dataset.fonico); return; }
    const ft = e.target.closest("[data-feat]");
    if(ft){ studioScegliFeat(ft.dataset.feat); return; }
    const m = e.target.closest("[data-mixa]");
    if(m){ studioSegna("mixa", Number(m.dataset.mixa)); return; }
    const u = e.target.closest("[data-esce]");
    if(u){ studioSegna("esce", Number(u.dataset.esce)); return; }
    const c = e.target.closest("[data-cover]");
    if(c){ studioSegna("cover", Number(c.dataset.cover)); return; }
    const cv = e.target.closest("[data-cov]");
    if(cv){
      if(cv.dataset.cov === "altra") studioCoverAltra();
      else if(cv.dataset.cov === "togli") studioCoverTogli();
      else if(cv.dataset.cov === "carica" && $("st-file")) $("st-file").click();
      return;
    }
    if(e.target.closest("[data-diario]")){ studioScorriDiario(); return; }
    const a = e.target.closest("[data-az]");
    if(a){ studioAzione(a.dataset.az); return; }
    /* la porta verso l'elenco delle mosse non c'è più: non c'è più l'elenco */
  });
}
/* La sfumatura guarda **dove sei arrivato**, non solo quanto e' larga la
   striscia: se sei gia' in fondo non c'e' piu' niente a destra e dirlo
   sarebbe una bugia. Serve al disegno e a chi scorre a dito, quindi la stessa
   riga risponde a tutti e due. */
function studioOltre(){
  const t = $("st-tabs"), o = $("st-oltre");
  if(!t || !o) return;
  o.hidden = t.scrollLeft + t.clientWidth >= t.scrollWidth - 1;
}
if($("st-tabs")) $("st-tabs").addEventListener("scroll", studioOltre);
if($("st-file")){
  $("st-file").addEventListener("change", e => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if(f) studioCoverCarica(f);
  });
}
