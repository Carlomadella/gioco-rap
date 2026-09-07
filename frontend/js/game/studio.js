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
  beat:   {f:"studio_beat.png",   pos:"center 42%"},
  testo:  {f:"studio_testo.png",  pos:"center 55%"},
  cabina: {f:"studio_cabina.png", pos:"center 44%"},
  banco:  {f:"studio_mix.png",    pos:"center 40%"}
};

const STUDIO_SEZIONI = [
  {id:"beat",   n:"Beat",      sc:"beat",
   d:"Chi te lo fa, e a che condizioni."},
  {id:"testo",  n:"Testo",     sc:"scrivi",
   d:"Le barre. Prima di tutto il resto c'è un foglio."},
  {id:"cabina", n:"Cabina",    sc:"registra",
   d:"La strofa più il beat. Esce una traccia."},
  {id:"banco",  n:"Mix",       sc:"mixa",
   d:"Livelli e spazio: qui il provino diventa pezzo."},
  {id:"cover",  n:"Cover",     sc:"pubblica",
   d:"La faccia del pezzo. È la prima cosa che si vede di te."},
  {id:"feat",   n:"Feat",      sc:"registra",
   d:"Con chi lo fai. Non è obbligatorio, ma si sente."},
  {id:"promo",  n:"Marketing", sc:"promo",
   d:"Farlo sapere. Un pezzo che non gira non esiste."},
  {id:"fuori",  n:"Timing",    sc:"pubblica",
   d:"Quale esce, e quando. Da qui in poi corre da solo."}
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
function studioDaPubblicare(){ return studioSceltoTra(ready(), "esce"); }

/* ==================== IL BEAT SU MISURA (punto 11) ====================
   Il giro dei produttori (`offriBeat`) resta: tre beat sul banco, si comprano
   dallo Shop, ed è quello che fa chi non conosce nessuno. Questo è l'altra
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

function studioOppure(t){
  return '<div class="stoppure"><span>' + t + '</span></div>';
}

/* la riga di un pezzo che si può scegliere: copertina, titolo, e il perché */
function studioRigaPezzo(s, scelto, sotto, attr){
  return '<div class="stpezzo' + (scelto ? " scelto" : "") + (s.mixed ? " ok" : "") + '"' +
      (attr || "") + '>' +
    '<span class="stcov">' + cover(s.seed || 7, s.t, (window.ARTIST || {}).name || "", s.img) + '</span>' +
    '<span class="stchi"><b>' + studioEsc(s.t) + '</b><span>' + sotto + '</span></span>' +
    (scelto ? '<span class="stspunta">✓</span>' : '') +
    '</div>';
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
          /* i due separatori qui in mezzo erano scritti con una barra di
             troppo e finivano a schermo come lettere: «20 energia · 2h». */
          ? (costo ? fmt(costo) + " € · " : "gratis · ") + STUDIO_BEAT_ENERGIA + " energia · " + studioBeatTempoTesto() + " · q~" +
            Math.round(20 + p.fama * 0.55 + p.rel * 7 + (G.skills.rete || 0) * 0.4)
          : studioEsc(st.perche)) + '</span>', false);
  }).join("");

  return '<p class="stdice">Un beat comprato è un beat di chiunque. Uno che ti fa una ' +
    'persona che ti conosce è tuo — e più siete in confidenza, meglio viene e meno costa. ' +
    'I beatmaker si conoscono <b>alla Sala</b>.</p>' +
    (righe || studioVuoto("Non conosci ancora nessun beatmaker. Passa dalla Sala: è lì che si trovano.")) +
    studioOppure("oppure") +
    '<button class="stazione" data-az="beat">' +
      '<b>Gira a cercare beat</b>' +
      '<span>Tre beat sul banco dello Shop, da comprare. Non serve conoscere nessuno, ' +
      'e non costa energia: ci vogliono solo due ore.</span>' +
    '</button>';
}

/* ---- TESTO: le barre. Prima stava dentro alla Cabina come ripiego, quando
   non avevi niente da incidere. Ma il testo è uno dei sette elementi del
   punto 4, non il messaggio d'errore di un altro: qui ha la sua stanza, e si
   vede quello che hai scritto invece di sapere solo che «c'è una strofa». */
function studioSezTesto(){
  const barre = (G.bars || []).slice().sort((a, b) => b.q - a.q);
  const righe = barre.map((b, i) =>
    '<div class="stbarra' + (i === 0 ? " top" : "") + '">' +
      '<span class="stq">' + b.q + '</span>' +
      '<span class="stchi"><b>' + studioEsc(b.tema || "strofa senza tema") + '</b>' +
      '<span>' + (i === 0 ? "la prossima che entra in cabina" : "in cartella") + '</span></span>' +
    '</div>').join("");

  return '<p class="stdice">Il beat lo puoi comprare, il testo no. È l\'unica parte del ' +
    'pezzo che non può farti nessun altro — e nella qualità finale <b>pesa più di tutto ' +
    'il resto</b>. In cabina ci entra la migliore che hai.</p>' +
    (righe || studioVuoto("Non hai barre scritte. Finché il foglio è bianco, in cabina non si entra.")) +
    studioOppure("e poi") +
    '<button class="stazione" data-az="scrivi">' +
      '<b>Scrivi le barre</b>' +
      '<span>Ti siedi e ci lavori. Quanto viene buona dipende da scrittura, ' +
      'benessere e da quanto sei lucido.</span>' +
    '</button>';
}

function studioSezCabina(){
  const b = bestBar(), bt = bestBeat();
  const fon = studioFonico();
  const ft = studioFeat();
  const aiuto = studioAiuto(fon);
  const aiutoFt = studioAiutoFeat(ft);
  const q = (b && bt) ? Math.round(songQ(b, bt)) + aiuto + aiutoFt : null;

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
    studioOppure("e poi") +
    (b && bt
      ? '<button class="stazione" data-az="registra">' +
          '<b>Registra il pezzo</b>' +
          '<span>«' + studioEsc(b.tema || "la strofa") + '» su «' + studioEsc(bt.n) + '» · ' +
          'qualità ~' + q + (fon ? ' · con ' + studioEsc(fon.n) + ' (+' + aiuto + ')' : ' · da solo') +
          (ft ? ' · feat ' + studioEsc(ft.n) + ' (+' + aiutoFt + ')' : '') +
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
            "o lo compri allo Shop."));
}

function studioSezBanco(){
  const da = unmixed().sort((a, b) => b.q - a.q);
  const scelto = studioDaMixare() || da[0];
  const fon = studioFonico();
  const lista = da.map(s => studioRigaPezzo(s, scelto === s,
    'qualità ' + s.q + ' → ' + clamp(s.q + mixGain(), 5, 100) + ' se lo mixi',
    ' data-mixa="' + s.seed + '"')).join("");

  return '<p class="stdice">Il mix è dove un provino diventa un pezzo. Da solo fai ' +
    'quello che sai fare; con un fonico dietro, quello che sa fare lui. ' +
    'Il provino <b>lo scegli tu</b>: non è detto che convenga sempre il migliore.</p>' +
    (fon
      ? studioPersona(fon, '<span class="stsub">al banco · +' + studioAiuto(fon) + ' qualità</span>', true)
      : studioVuoto("Nessuno al banco: il mix lo fai tu. Un fonico si chiama dalla Cabina.")) +
    (lista ? studioOppure("da mixare") + lista : "") +
    studioOppure("e poi") +
    (scelto
      ? '<button class="stazione" data-az="mixa">' +
          '<b>Mixa «' + studioEsc(scelto.t) + '»</b>' +
          '<span>qualità ' + scelto.q + ' → ' + clamp(scelto.q + mixGain(), 5, 100) +
          ' · +' + mixGain() + (fon ? ', di cui ' + studioAiuto(fon) + ' suoi' : '') +
          '</span></button>'
      : studioVuoto("Non c'è niente da mixare. Prima si registra."));
}

function studioSezCover(){
  const pronti = ready();
  const s = studioPezzoCover();
  const lista = pronti.map(x => studioRigaPezzo(x, s === x,
    'qualità ' + x.q + (x.img ? " · copertina tua" : " · copertina generata"),
    ' data-cover="' + x.seed + '"')).join("");

  return '<p class="stdice">Sulla qualità <b>pesa poco</b>, su chi ti clicca pesa tutto: ' +
    'la copertina è la prima cosa che si vede di un pezzo, spesso l\'unica. ' +
    'Puoi tenere quella che genera il gioco o metterci una foto tua.</p>' +
    (lista || studioVuoto("Non hai pezzi a cui cambiare la copertina. Si comincia dalla Cabina.")) +
    (s
      ? studioOppure("su «" + studioEsc(s.t) + "»") +
        '<div class="stcopgrande">' +
          '<span class="stcopbig">' + cover(s.seed || 7, s.t, (window.ARTIST || {}).name || "", s.img) + '</span>' +
          '<div class="stcopaz">' +
            '<button class="stgo" data-cov="carica">Carica una foto</button>' +
            (s.img
              ? '<button class="stgo" data-cov="togli">Togli la foto</button>'
              : '<button class="stgo" data-cov="altra">Generane un\'altra</button>') +
            '<span class="stsub">JPG o PNG. La ritaglio quadrata io, a 360×360.</span>' +
          '</div>' +
        '</div>' +
        studioVuoto("La terza strada — costruirtela a livelli, stile emblema di Black Ops 2 — " +
          "non c'è ancora: è una pagina a parte, non un bottone.")
      : "");
}

function studioSezFeat(){
  const gente = studioGente("rapper");
  const ft = studioFeat();
  const righe = gente.map(p => studioPersona(p,
    '<button class="stgo' + (ft === p ? " on" : "") + '" data-feat="' + studioEsc(p.id) + '">' +
      (ft === p ? "È dei nostri" : "Chiamalo") + '</button>' +
      '<span class="stsub">' + (studioAiutoFeat(p) ? "+" + studioAiutoFeat(p) + " qualità" : "ancora niente") +
      '</span>', ft === p)).join("");

  return '<p class="stdice">Un feat non è obbligatorio. Ma se il pezzo lo fate <b>insieme, ' +
    'in sessione</b>, si sente — quanto vale dipende da quanto è grosso lui e da quanto ' +
    'vi conoscete. Vale per <b>un pezzo solo</b>: chi viene in studio ci viene per quello, ' +
    'poi torna a fare il suo.</p>' +
    (righe || studioVuoto("Non conosci ancora nessun altro rapper. Si incontrano alla Sala — " +
      "e non tutti hanno voglia di dividere un pezzo.")) +
    (ft
      ? studioOppure("in sessione") +
        studioVuoto("<b>" + studioEsc(ft.n) + "</b> è sul prossimo pezzo che registri: " +
          "+" + studioAiutoFeat(ft) + " di qualità. Poi il posto torna libero.")
      : "");
}

function studioSezMarketing(){
  const fuori = (G.songs || []).filter(x => x.released);
  const ultimo = fuori.slice().sort((a, b) => (b.week || 0) - (a.week || 0))[0];

  return '<p class="stdice">Il pezzo è uscito: adesso qualcuno lo deve sapere. ' +
    'Questa è la promo che parte <b>da qui, dallo studio</b> — clip, provocazioni, ' +
    'quello che si fa col telefono in mano appena finita la sessione.</p>' +
    (ultimo
      ? studioRigaPezzo(ultimo, false, 'l\'ultimo uscito · qualità ' + ultimo.q +
          ' · ' + fmt(ultimo.streams || 0) + ' stream')
      : studioVuoto("Niente da spingere: la promo accende un pezzo già uscito.")) +
    studioOppure("e poi") +
    /* Come al banco: se la mossa non si può fare, non si mette un bottone che
       sembra vivo e poi risponde di no. */
    (fuori.length
      ? '<button class="stazione" data-az="promo">' +
          '<b>Promo sui social</b>' +
          '<span>Clip e provocazioni. Accende quello che hai già fuori.</span>' +
        '</button>'
      : studioVuoto("Prima esce un pezzo, poi lo si spinge. Si passa dal Timing.")) +
    studioVuoto("Le altre due strade del marketing — la campagna dall\'app <b>Discografia</b> " +
      "sul telefono, e il giro dei giornalisti — non sono ancora collegate qui.");
}

/* ---- TIMING: quale esce, e quando. Prima si chiamava «Fuori» e usciva
   sempre il pezzo migliore, deciso da `sort()[0]`. Il punto 4 mette il timing
   fra gli elementi che decidono come va un pezzo: la prima metà di quella
   decisione — **quale** — è qui e funziona. La seconda — **quando**, cioè
   programmare l'uscita al venerdì — vuole un gancio nell'orologio e sta
   scritta nel progetto delle pagine, non qui. */
function studioSezFuori(){
  const pronti = ready().sort((a, b) => b.q - a.q);
  const s = studioDaPubblicare() || pronti[0];
  const usciti = (G.songs || []).filter(x => x.released);
  const ultimo = usciti.slice().sort((a, b) => (b.week || 0) - (a.week || 0))[0];
  const da = ultimo && typeof totalWeeks === "function"
    ? Math.max(0, totalWeeks() - (ultimo.week || 0)) : null;

  return '<p class="stdice">Quello che è finito e aspetta solo di uscire. Un pezzo non ' +
    'mixato esce lo stesso, ma ci perde otto punti: la fretta si sente. ' +
    (da == null
      ? 'Non hai ancora fatto uscire niente: il primo pezzo è quello che dice chi sei.'
      : da === 0
        ? '<b>Sei uscito questa settimana</b>: due pezzi ravvicinati si rubano l\'ascolto.'
        : 'Sono passate <b>' + da + (da === 1 ? ' settimana' : ' settimane') +
          '</b> dall\'ultima uscita.') + '</p>' +
    (pronti.length
      ? pronti.map(x => studioRigaPezzo(x, s === x,
          'qualità ' + x.q + (x.mixed ? " · mixato" : " · non mixato, −8 se esce così"),
          ' data-esce="' + x.seed + '"')).join("")
      : studioVuoto("Non hai niente di pronto. Si comincia dal beat.")) +
    (s
      ? studioOppure("e poi") +
        '<button class="stazione" data-az="pubblica">' +
          '<b>Manda fuori «' + studioEsc(s.t) + '»</b>' +
          '<span>esce con qualità ' + (s.mixed ? s.q : clamp(s.q - 8, 5, 100)) +
          '. Da qui in poi corre da solo: quello che succede dopo lo racconta la ' +
          'Discografia.</span>' +
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

  /* La foto se c'è, il disegno se no. Non tutte e due: sovrapporre una
     scenetta a una fotografia le fa sembrare entrambe finte. */
  const foto = STUDIO_FOTO[sez.id];
  const scena = $("st-scena");
  scena.classList.toggle("foto", !!foto);
  scena.style.backgroundImage = foto ? 'url("' + STUDIO_FOTO_DIR + foto.f + '")' : "";
  scena.style.backgroundPosition = foto ? foto.pos : "";
  scena.innerHTML = (!foto && art[2])
    /* `YMin` e non `YMid`: la fascia ritaglia, e quello che conta in queste
       scenette sta in alto — centrando si tagliava la testa a chi c'è dentro. */
    ? '<svg viewBox="0 0 200 128" preserveAspectRatio="xMidYMin slice" xmlns="http://www.w3.org/2000/svg">' +
      art[2] + '</svg>'
    : "";
  scena.style.setProperty("--k", art[0]);
  $("st-dove").innerHTML = '<b>' + sez.n + '</b> — ' + sez.d;

  $("st-risorse").innerHTML =
    '<span><i>energia</i>' + Math.round(G.energy) + '</span>' +
    '<span><i>soldi</i>' + fmt(G.money) + ' €</span>' +
    '<span><i>lucidità</i>' + Math.round(typeof luc === "function" ? luc() : 0) + '</span>';

  $("st-corpo").innerHTML =
    (sez.id === "beat"   ? studioSezBeat() :
     sez.id === "testo"  ? studioSezTesto() :
     sez.id === "cabina" ? studioSezCabina() :
     sez.id === "banco"  ? studioSezBanco() :
     sez.id === "cover"  ? studioSezCover() :
     sez.id === "feat"   ? studioSezFeat() :
     sez.id === "promo"  ? studioSezMarketing() :
     studioSezFuori());
    /* Qui in fondo c'era «Tutte le mosse della settimana →», la porta verso
       l'elenco. Quell'elenco non è più una schermata: il palco sta al Live
       Club, il turno in Pizzeria o in Fabbrica, staccare la spina a Casa,
       pesi e cardio in Palestra, il lavoro al Centro per l'impiego. E la
       promo è entrata qui sopra, in «Marketing». Non resta niente da linkare. */
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

/* Si esce dallo Studio solo dal bottone globale «Torna alla mappa» (punto 1):
   niente X in testata, niente chiusura cliccando sul fondo. chiudiStudio()
   resta esposta — la chiama menu-sistema.js quando premi quel bottone. */
if($("studio")){
  $("studio").addEventListener("click", e => {
    const t = e.target.closest("[data-sez]");
    if(t){ STUDIO_SEZ = t.dataset.sez; SFX.tap(); renderStudio(); return; }
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
    const a = e.target.closest("[data-az]");
    if(a){ studioAzione(a.dataset.az); return; }
    /* la porta verso l'elenco delle mosse non c'è più: non c'è più l'elenco */
  });
}
if($("st-file")){
  $("st-file").addEventListener("change", e => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if(f) studioCoverCarica(f);
  });
}
