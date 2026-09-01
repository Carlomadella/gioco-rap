/* La Sala: il posto fisico della provincia dove si conosce la gente.

   È la sala prove dietro al bar: ci passano beatmaker, rapper e fonici, e più
   avanti anche chi scrive di musica. Non è un negozio di beat — è il posto dove
   si costruisce la rete, e la rete è quello che poi ti apre le porte.

   La regola: ogni persona ha un carattere, e con ognuna si sale un gradino alla
   volta — conoscenza, contatto, amico, collaboratore, fidato, partner. Quello che
   puoi chiedere dipende da dove sei arrivato. Parlare costa energia come tutto il
   resto: qui non si farma gratis.

   In provincia c'è poca gente e pochi ruoli, di proposito: il giornalista si
   affaccia solo quando qualcuno comincia a sapere chi sei, e manager, promoter e
   uffici stampa non ci sono proprio. Quelli sono Milano. */
"use strict";

const POSTO_MAX = 8;                  /* quanta gente può girare in provincia */
const REL_NOMI = ["conoscenza", "contatto", "amico", "collaboratore", "fidato", "partner"];

/* Punto 39: energia a 100 al giorno. «Due parole» resta una mossa piccola,
   la sessione in studio e il feat restano le più grosse della Sala. */
const PO_COSTO = {parla:12, sessione:45, mix:20, feat:45, intervista:12, numero:4};

const POSTO_RUOLI = {
  beatmaker: {n:"Beatmaker", k:"#4ADE80",
    d:"Fa beat. Se ti prende in simpatia te li fa sentire prima degli altri."},
  rapper: {n:"Rapper", k:"#A855F7",
    d:"Uno come te. Può diventare un pezzo insieme o un problema."},
  fonico: {n:"Fonico", k:"#38BDF8",
    d:"Sta dietro al mixer. Un pezzo mixato bene è un altro pezzo."},
  giornalista: {n:"Giornalista", k:"#FBBF24",
    d:"Scrive di musica per il giro. Arriva quando cominci a esistere.",
    da:g => g.fans >= 2000}
};

const POSTO_NOMI = {
  beatmaker: ["Bit", "Cassa", "Tino Sale", "Otto", "Grillo", "Pino Beats", "Sonar", "Mimmo Loop"],
  rapper: null,                        /* i rapper prendono i nomi dei rivali */
  fonico: ["Andre", "Gigi", "Fede", "Nico", "Sara", "Pippo"],
  giornalista: ["Marta", "Dario", "Elisa", "Toni"]
};

const CARATTERI = [
  {id:"aperto", n:"aperto", d:"Parla con tutti, si fida in fretta."},
  {id:"diffidente", n:"diffidente", d:"Prima vuole capire chi sei."},
  {id:"gasato", n:"gasato", d:"Vuole sentirsi il più forte della stanza."},
  {id:"pratico", n:"pratico", d:"Chiacchiere poche, si parla di lavoro."}
];

/* ==================== I DIALOGHI ====================
   Punto 43: dodici situazioni per beatmaker/rapper/fonico, nove per il
   giornalista — non più tre a testa, che con `pick()` si ripetevano in
   fretta. Ogni risposta vale dei punti; quella giusta cambia in base al
   carattere, e il carattere si scopre parlando. */
const DIALOGHI = {
  beatmaker: [
    {t:"Sta caricando un progetto sul portatile. «Tu che roba fai?»",
     o:[["Gli dici il tuo genere e gli chiedi cosa gli piace fare a lui", 2, "diffidente"],
        ["Gli fai sentire una barra lì, a cappella", 2, "gasato"],
        ["Gli chiedi subito quanto costa un beat", 0, "pratico"]]},
    {t:"Ti mette in cuffia un giro che ha finito ieri notte.",
     o:[["Lo ascolti tutto e poi gli dici una cosa precisa che funziona", 2, "aperto"],
        ["Gli dici che è forte e basta", 1, null],
        ["Gli dici che sopra ci metteresti un'altra cassa", 1, "gasato"]]},
    {t:"«Qui nessuno paga i beat, lo sai vero?»",
     o:[["Gli dici che tu paghi, quando la roba vale", 2, "pratico"],
        ["Gli dici che gli porti gente che paga", 2, "aperto"],
        ["Gli dici che neanche tu paghi", 0, null]]},
    {t:"Ha le cuffie a metà, sta ancora rifinendo qualcosa che non ti fa sentire.",
     o:[["Aspetti senza dire niente finché non è pronto", 2, "diffidente"],
        ["Gli chiedi se puoi ascoltare comunque", 1, "aperto"],
        ["Gli dici di sbrigarsi", -1, null]]},
    {t:"«Ho fatto sto beat in venti minuti, dimmi se fa schifo.»",
     o:[["Gli dici cosa non ti convince, nel dettaglio", 2, "pratico"],
        ["Gli dici che è già pronto così", 1, "gasato"],
        ["Gli dici che ventiminuti si sentono", -1, null]]},
    {t:"Ti mostra il telefono: tremila ascolti su un suo beat strumentale.",
     o:[["Gli fai i complimenti veri, senza esagerare", 2, "aperto"],
        ["Gli dici che con le parole sopra farebbe il doppio", 1, "gasato"],
        ["Cambi discorso", 0, "diffidente"]]},
    {t:"«Sto pensando di cambiare genere, sono stufo del solito giro.»",
     o:[["Gli chiedi cosa vorrebbe provare", 2, "aperto"],
        ["Gli dici di non cambiare, gli riesce bene questo", 1, "pratico"],
        ["Gli dici che cambiare genere è una scusa per non lavorare", -1, "diffidente"]]},
    {t:"Confronta due schede audio, indeciso su quale comprare.",
     o:[["Gli dici di prendere quella più cara se se la può permettere", 1, "gasato"],
        ["Gli chiedi cosa usa davvero, non cosa costa di più", 2, "pratico"],
        ["Gli dici che non ne capisci e stai zitto", 0, null]]},
    {t:"«Con te che rapper ho fatto un pezzo bomba, te lo ricordi?» Non l'ha mai fatto con te.",
     o:[["Gli dici che si sbaglia, senza fartene un problema", 1, "diffidente"],
        ["Stai al gioco e lo lasci raccontare", 2, "aperto"],
        ["Gli dici in faccia che se lo inventa", -1, "gasato"]]},
    {t:"Butta giù un giro di basso lì davanti a te, per ammazzare il tempo.",
     o:[["Gli dici a tempo dove metteresti un cambio", 2, "pratico"],
        ["Batti il tempo con la testa e basta", 1, null],
        ["Gli dici di continuare, tu intanto guardi il telefono", -1, "diffidente"]]},
    {t:"«Il tuo genere non lo faccio più, mi ha rotto le scatole.»",
     o:[["Gli chiedi cosa fa adesso invece", 2, "aperto"],
        ["Gli offri di pagarlo comunque per uno", 1, "pratico"],
        ["Gli dici che allora non serve a niente parlarci", -1, null]]},
    {t:"Ti chiede un parere sincero su un ritornello cantato, storto, suo.",
     o:[["Gli dici la verità, con rispetto", 2, "diffidente"],
        ["Gli dici che va bene così per non ferirlo", 0, "aperto"],
        ["Ridi e non rispondi", -1, "gasato"]]}
  ],
  rapper: [
    {t:"Ti guarda dall'alto in basso. «Sei quello che scrive, no?»",
     o:[["Gli dici di sì e gli chiedi cosa sta scrivendo lui", 2, "gasato"],
        ["Gli dici che scrivi da prima che lui cominciasse", 1, null],
        ["Ti stringi nelle spalle e non dici niente", 0, "diffidente"]]},
    {t:"Racconta di una serata dove secondo lui l'hanno fregato.",
     o:[["Lo stai a sentire fino in fondo", 2, "aperto"],
        ["Gli dici come avresti fatto tu", 1, "gasato"],
        ["Gli dici che si lamenta e basta", -1, null]]},
    {t:"«Facciamo un pezzo insieme, prima o poi.»",
     o:[["Gli dici quando e dove, adesso", 2, "pratico"],
        ["Gli dici che prima vuoi sentire come scrive", 1, "diffidente"],
        ["Gli dici che tu lavori da solo", -1, null]]},
    {t:"«Ho letto che mi hai citato in un pezzo. Bene o male?»",
     o:[["Gli dici la verità, bene o male che fosse", 2, "diffidente"],
        ["Gli dici che era un complimento anche se non lo era", 1, "aperto"],
        ["Neghi di averlo mai citato", -1, null]]},
    {t:"Ti fa sentire un ritornello che ha già venduto a un'etichetta, orgoglioso.",
     o:[["Gli chiedi come si tratta con le etichette", 2, "pratico"],
        ["Gli fai i complimenti e basta", 1, "gasato"],
        ["Gli dici che vendersi un pezzo è una mossa da poco", -1, "diffidente"]]},
    {t:"«Diciamo la verità, chi tra noi due tira di più in giro?»",
     o:[["Gli dici che non è una gara", 1, "diffidente"],
        ["Stai al gioco e gli dici che è lui, per ora", 2, "gasato"],
        ["Gli dici che sei tu, senza girarci intorno", -1, null]]},
    {t:"Racconta di quando ha aperto un concerto per un nome grosso.",
     o:[["Gli fai domande su com'è stato davvero", 2, "aperto"],
        ["Gli chiedi quanto l'hanno pagato", 1, "pratico"],
        ["Gli dici che aprire per un altro non conta molto", -1, "gasato"]]},
    {t:"«Sto scrivendo un pezzo sulla mia città, dimmi una cosa vera di qui.»",
     o:[["Gli racconti una cosa vera, non una da cartolina", 2, "pratico"],
        ["Gli dici di inventarsela, tanto nessuno controlla", 0, null],
        ["Gli dici che le città sono tutte uguali", -1, "diffidente"]]},
    {t:"Ti chiede se puoi prestargli il tuo microfono per una session.",
     o:[["Glielo presti, tanto te lo riporta", 2, "aperto"],
        ["Gli dici che te lo tieni per te", 0, "diffidente"],
        ["Glielo presti in cambio di qualcosa", 1, "pratico"]]},
    {t:"«Il mio ultimo pezzo l'hanno stroncato tutti. Secondo te avevano ragione?»",
     o:[["Gli dici la tua onestamente", 2, "diffidente"],
        ["Gli dici che avevano torto, punto", 1, "gasato"],
        ["Cambi discorso per non metterti in mezzo", 0, "aperto"]]},
    {t:"Ha appena litigato con un altro rapper della zona, e te lo racconta caldo caldo.",
     o:[["Lo ascolti senza schierarti", 2, "aperto"],
        ["Gli dai ragione subito", 0, "gasato"],
        ["Gli dici di lasciar perdere, non conviene a nessuno", 1, "pratico"]]},
    {t:"«Se ti offrissi un feat gratis, lo faresti o vuoi essere pagato?»",
     o:[["Gli dici che dipende dal pezzo, non dai soldi", 2, "aperto"],
        ["Gli dici che vuoi essere pagato, sempre", 1, "pratico"],
        ["Gli dici che i feat gratis sono una perdita di tempo", -1, "diffidente"]]}
  ],
  fonico: [
    {t:"Sta sistemando un cavo che fa contatto. «Passami quello nero.»",
     o:[["Glielo passi e resti lì a guardare come fa", 2, "pratico"],
        ["Glielo passi e gli chiedi come si è messo a fare il fonico", 2, "aperto"],
        ["Gli dici che il cavo lo cambierebbe chiunque", -1, null]]},
    {t:"«Il tuo pezzo l'ho sentito. La voce è troppo avanti.»",
     o:[["Gli chiedi come lo sistemeresti", 2, "diffidente"],
        ["Gli dici che ti piace così", 1, "gasato"],
        ["Gli dici che di missaggio non capisce niente", -1, null]]},
    {t:"Ti fa vedere due versioni dello stesso ritornello.",
     o:[["Scegli e gli spieghi perché", 2, "pratico"],
        ["Gli chiedi quale sceglierebbe lui", 1, "aperto"],
        ["Gli dici che sono uguali", 0, null]]},
    {t:"Sta testando un microfono nuovo, te lo punta addosso senza preavviso: «Di' qualcosa.»",
     o:[["Improvvisi due barre lì per lì", 2, "gasato"],
        ["Dici solo «prova, prova» come tutti", 1, null],
        ["Gli chiedi perché non avvisa prima", 0, "diffidente"]]},
    {t:"«La tua ultima voce è arrivata compressa male. Che programma hai usato?»",
     o:[["Glielo dici, e gli chiedi come farla meglio", 2, "pratico"],
        ["Gli dici che va bene così", 0, "gasato"],
        ["Gli dici che non sapevi nemmeno cosa fosse la compressione", 1, "aperto"]]},
    {t:"Ti mostra un plugin nuovo che ha comprato, entusiasta.",
     o:[["Gli chiedi di farti sentire la differenza vera", 2, "pratico"],
        ["Fingi interesse e annuisci", 0, null],
        ["Gli dici che sono tutti uguali", -1, "diffidente"]]},
    {t:"«Se dovessi scegliere, il rap o il mix: cosa conta di più in un pezzo?»",
     o:[["Gli dici che senza un buon mix anche il pezzo migliore si perde", 2, "pratico"],
        ["Gli dici che senza il pezzo il mix non serve a niente", 1, "gasato"],
        ["Gli dici che non ci hai mai pensato", 0, "aperto"]]},
    {t:"Sta rifacendo il cablaggio della sala da solo, di sera tardi.",
     o:[["Ti fermi ad aiutarlo, anche solo a reggere i cavi", 2, "aperto"],
        ["Gli chiedi se ha bisogno o se te ne puoi andare", 1, "diffidente"],
        ["Lo saluti e vai, non è il tuo lavoro", -1, null]]},
    {t:"«Ho sentito il tuo primo pezzo, quello vecchio. Sei migliorato parecchio.»",
     o:[["Gli chiedi cosa si sente di preciso che è cambiato", 2, "diffidente"],
        ["Gli dici che quel pezzo era già forte", 1, "gasato"],
        ["Cambi discorso, imbarazzato", 0, "aperto"]]},
    {t:"Due tue tracce sono pronte, ma può mixarne solo una questa settimana: quale vuole sapere.",
     o:[["Gli dici quale e perché, con un motivo vero", 2, "pratico"],
        ["Gli dici che decida lui", 1, "aperto"],
        ["Gli dici di farle tutte e due comunque", -1, "gasato"]]},
    {t:"«La gente in sala fa troppo rumore, non riesco a lavorare bene.»",
     o:[["Fai silenzio e provi a far calmare gli altri", 2, "pratico"],
        ["Gli dici che è la Sala, è sempre stata così", 0, "diffidente"],
        ["Gli dici che è un problema suo", -1, null]]},
    {t:"Ti chiede se hai mai pensato di imparare a mixare da solo.",
     o:[["Gli dici che preferisci lasciarlo fare a chi lo sa fare", 2, "pratico"],
        ["Gli dici che magari un giorno ci proverai", 1, "aperto"],
        ["Gli dici che non serve, tanto ci sono i fonici", 0, "gasato"]]}
  ],
  giornalista: [
    {t:"«Se ti scrivo un pezzo, cosa ci metto dentro?»",
     o:[["Gli racconti da dove vieni, senza gonfiare niente", 2, "diffidente"],
        ["Gli dici i numeri che hai fatto", 1, "pratico"],
        ["Gli dici di scrivere che sei il più forte", 0, "gasato"]]},
    {t:"Ti chiede se conosci qualcun altro del giro.",
     o:[["Gli fai due nomi veri e glieli presenti", 2, "aperto"],
        ["Gli dici che conosci tutti", 0, "gasato"],
        ["Gli dici che preferisci parlare di musica", 1, "diffidente"]]},
    {t:"«Mi hanno detto che litighi spesso col giro. È vero?»",
     o:[["Gli dici la verità, senza nascondere niente", 2, "diffidente"],
        ["Neghi tutto", 0, "gasato"],
        ["Gli chiedi chi gliel'ha detto", 1, "aperto"]]},
    {t:"Sta scrivendo un pezzo su un altro rapper della zona e ti chiede un parere su di lui.",
     o:[["Dici qualcosa di vero, senza buttarlo giù per partito preso", 2, "aperto"],
        ["Ne parli malissimo", -1, "gasato"],
        ["Ti rifiuti di commentare", 1, "diffidente"]]},
    {t:"«Il pezzo che ho scritto su di te ha fatto pochi numeri. Peccato.»",
     o:[["Gli chiedi cosa ha funzionato meno, per capire", 2, "pratico"],
        ["Gli dici che non era colpa sua", 1, "aperto"],
        ["Gli dici che allora non serve scrivere più di te", -1, "diffidente"]]},
    {t:"Ti chiede se puoi presentarlo a qualcuno che conosci nel giro.",
     o:[["Gli fai un nome vero e lo aiuti", 2, "aperto"],
        ["Gli dici che ci pensi", 1, "diffidente"],
        ["Gli dici che i tuoi contatti restano tuoi", -1, "pratico"]]},
    {t:"«Scrivo meglio se mi dai qualcosa di vero, non le solite frasi da intervista.»",
     o:[["Gli racconti qualcosa di vero, anche scomodo", 2, "diffidente"],
        ["Gli dai comunque le solite frasi", -1, "gasato"],
        ["Gli chiedi cosa intende con «vero»", 1, "pratico"]]},
    {t:"Ha scritto un titolo esagerato su un tuo pezzo, per fare click.",
     o:[["Gliene parli con calma, senza montarla", 2, "pratico"],
        ["Ti arrabbi e glielo dici duro", 0, "gasato"],
        ["Lasci correre, tanto porta lettori", 1, "aperto"]]},
    {t:"«Cosa vuoi che scriva di te tra dieci anni?»",
     o:[["Gli rispondi con qualcosa di vero, non una frase fatta", 2, "diffidente"],
        ["Gli dici «il più grande di sempre»", 0, "gasato"],
        ["Gli dici che non ci hai pensato", 1, "aperto"]]}
  ]
};

/* ==================== LA GENTE ==================== */
function relNome(p){ return REL_NOMI[clamp(p.rel, 0, 5)]; }
function relSoglia(p){ return 3 + p.rel; }         /* più sali, più costa salire */

function nuovaPersona(ruolo){
  const usati = (G.gente || []).map(p => p.n);
  let pool = POSTO_NOMI[ruolo];
  if(!pool) pool = RIV_NOMI;                        /* i rapper: nomi da rivali */
  const liberi = pool.filter(n => usati.indexOf(n) < 0);
  /* punto 65: un'età vera, non un numero a caso — i fonici e i giornalisti
     sono il mestiere di chi ha già fatto qualche anno di gavetta, gli altri
     due partono dalla stessa fascia del giocatore */
  const etaMin = {fonico:26, giornalista:28}[ruolo] || 18;
  const etaMax = {fonico:52, giornalista:58}[ruolo] || 32;
  return {
    id: "p" + Math.floor(Math.random() * 1e9),
    ruolo: ruolo,
    n: liberi.length ? pick(liberi) : pick(pool) + " " + Math.floor(rnd(2, 9)),
    gen: (ruolo === "beatmaker" || ruolo === "rapper") ? pick(BEAT_IDS) : "",
    eta: Math.floor(rnd(etaMin, etaMax)),
    fama: Math.round(rnd(4, 46)),
    car: pick(CARATTERI).id,
    scoperto: false,                                /* il carattere si scopre parlando */
    rel: 0, pt: 0, ult: -1, feat: -99,
    skin: pick(RIV_SKIN), hair: Math.floor(rnd(0, 4)),
    col: pick(["#FF5A36", "#B026FF", "#FFC53D", "#3DC7FF", "#FF4D9D", "#57C98B", "#7A5CFF"])
  };
}

/* Quanta gente gira: all'inizio tre facce, poi ne arriva una ogni due settimane.
   Il giornalista compare solo quando qualcuno comincia a sapere chi sei. */
function sistemaGente(){
  if(!G.gente) G.gente = [];
  const sett = typeof totalWeeks === "function" ? totalWeeks() : G.week;
  const quante = clamp(3 + Math.floor(sett / 2), 3, POSTO_MAX);
  const ruoli = ["beatmaker", "rapper", "fonico", "beatmaker", "rapper", "beatmaker", "fonico", "rapper"];
  while(G.gente.length < quante){
    let r = ruoli[G.gente.length % ruoli.length];
    /* uno slot ogni tanto lo prende il giornalista, se è ora */
    if(G.gente.length >= 4 && POSTO_RUOLI.giornalista.da(G) &&
       !G.gente.some(p => p.ruolo === "giornalista")) r = "giornalista";
    G.gente.push(nuovaPersona(r));
  }
}

/* Chi c'è oggi: tre facce, sempre le stesse dentro la settimana. */
function presentiOggi(){
  sistemaGente();
  const sett = typeof totalWeeks === "function" ? totalWeeks() : G.week;
  const vivi = G.gente.filter(p => !p.via);
  const ord = vivi.slice().sort((a, b) => {
    const ka = (a.id.charCodeAt(1) * 31 + sett * 17) % 97;
    const kb = (b.id.charCodeAt(1) * 31 + sett * 17) % 97;
    /* chi conosci meglio è più facile trovarlo: il giro è quello */
    return (kb + b.rel * 12) - (ka + a.rel * 12);
  });
  return ord.slice(0, 3);
}

/* ==================== LA STANZA ==================== */
/* Una sagoma in piedi: non è il ritratto, è la figura di chi sta nella stanza. */
function poSagoma(p, x, terra, s){
  const c = p.col, cd = shade2(c, -0.45), sk = p.skin;
  return '<g transform="translate(' + x + ',' + terra + ') scale(' + s + ')">' +
    '<ellipse cx="0" cy="2" rx="15" ry="4" fill="#000" opacity=".4"/>' +
    '<path d="M-7,-36 L-9,-2 L-2.6,-2 L-1.4,-36 Z" fill="#15171E"/>' +
    '<path d="M7,-36 L9,-2 L2.6,-2 L1.4,-36 Z" fill="#15171E"/>' +
    '<path d="M-12,-34 C-13.6,-56 -12,-66 -7.6,-70 L7.6,-70 C12,-66 13.6,-56 12,-34 Z" fill="' + c + '"/>' +
    '<path d="M-12,-34 C-13,-52 -12,-63 -8,-68 L-3,-68 L-4,-34 Z" fill="' + cd + '" opacity=".6"/>' +
    '<circle cx="0" cy="-79" r="9.4" fill="' + sk + '"/>' +
    '<path d="M-9.4,-81 C-9.4,-88.6 -5.2,-91.6 0,-91.6 C5.2,-91.6 9.4,-88.6 9.4,-81 Z" fill="#14110F"/>' +
    '</g>';
}

function scenaSala(chi){
  window.__POSE = "fermo";
  const corpo = window.ARTIST_BODY ? window.ARTIST_BODY() : "";
  const col = (window.ARTIST && window.ARTIST.color) || "#FF5A36";
  let gente = "";
  /* stanno in piedi come te: stessa altezza d'uomo, un po' più indietro */
  const posti = [[420, 1.18], [516, 1.10], [318, 1.02]];
  chi.forEach((p, i) => { const [x, s] = posti[i % posti.length]; gente += poSagoma(p, x, 238, s); });

  return '<svg viewBox="0 0 640 260" xmlns="http://www.w3.org/2000/svg">' +
    '<defs>' +
      '<linearGradient id="sa-muro" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#221A2E"/><stop offset="1" stop-color="#14101C"/></linearGradient>' +
      '<linearGradient id="sa-terra" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#1A1622"/><stop offset="1" stop-color="#0E0C13"/></linearGradient>' +
      '<radialGradient id="sa-lamp" cx=".5" cy=".5" r=".5">' +
        '<stop offset="0" stop-color="#FFD98A" stop-opacity=".34"/>' +
        '<stop offset="1" stop-color="#FFD98A" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sa-alone" cx=".5" cy=".5" r=".5">' +
        '<stop offset="0" stop-color="' + col + '" stop-opacity=".45"/>' +
        '<stop offset="1" stop-color="' + col + '" stop-opacity="0"/></radialGradient>' +
    '</defs>' +
    '<rect width="640" height="260" fill="url(#sa-muro)"/>' +
    /* pannelli fonoassorbenti sul muro */
    '<g fill="#2C2338" opacity=".85">' +
      '<rect x="40" y="34" width="46" height="46" rx="4"/><rect x="96" y="34" width="46" height="46" rx="4"/>' +
      '<rect x="40" y="90" width="46" height="46" rx="4"/><rect x="96" y="90" width="46" height="46" rx="4"/>' +
      '<rect x="498" y="30" width="52" height="52" rx="4"/><rect x="560" y="30" width="52" height="52" rx="4"/>' +
    '</g>' +
    /* poster e luce al neon */
    '<rect x="230" y="28" width="86" height="62" rx="3" fill="#31213F"/>' +
    '<rect x="238" y="36" width="70" height="34" rx="2" fill="' + col + '" opacity=".55"/>' +
    '<rect x="238" y="76" width="44" height="5" rx="2" fill="#E8E3F5" opacity=".5"/>' +
    '<rect x="352" y="26" width="120" height="8" rx="4" fill="#FF7BD5" opacity=".8"/>' +
    '<ellipse cx="412" cy="52" rx="120" ry="46" fill="url(#sa-lamp)"/>' +
    /* pavimento e tappeto */
    '<rect y="188" width="640" height="72" fill="url(#sa-terra)"/>' +
    '<ellipse cx="300" cy="238" rx="240" ry="20" fill="#241C2E" opacity=".7"/>' +
    /* banco col mixer */
    '<g>' +
      '<rect x="30" y="150" width="176" height="12" rx="3" fill="#2A2233"/>' +
      '<rect x="42" y="162" width="10" height="74" fill="#1B1622"/>' +
      '<rect x="184" y="162" width="10" height="74" fill="#1B1622"/>' +
      '<rect x="52" y="132" width="132" height="20" rx="3" fill="#191420"/>' +
      '<g fill="#4B4160">' +
        '<rect x="60" y="138" width="4" height="9"/><rect x="70" y="138" width="4" height="9"/>' +
        '<rect x="80" y="138" width="4" height="9"/><rect x="90" y="138" width="4" height="9"/>' +
        '<rect x="100" y="138" width="4" height="9"/><rect x="110" y="138" width="4" height="9"/></g>' +
      '<circle cx="140" cy="142" r="5" fill="#6B5C86"/><circle cx="156" cy="142" r="5" fill="#6B5C86"/>' +
      '<rect x="118" y="104" width="52" height="30" rx="3" fill="#0E0B14"/>' +
      '<rect x="122" y="108" width="44" height="22" fill="#3DC7FF" opacity=".35"/>' +
    '</g>' +
    /* casse */
    '<g fill="#1D1826">' +
      '<rect x="558" y="120" width="58" height="116" rx="5"/>' +
      '<circle cx="587" cy="150" r="14" fill="#12101A"/><circle cx="587" cy="150" r="5" fill="#2E2840"/>' +
      '<circle cx="587" cy="200" r="20" fill="#12101A"/><circle cx="587" cy="200" r="7" fill="#2E2840"/>' +
    '</g>' +
    /* divano */
    '<g fill="#2B2036">' +
      '<rect x="248" y="186" width="150" height="34" rx="8"/>' +
      '<rect x="248" y="166" width="150" height="26" rx="8" fill="#332742"/>' +
    '</g>' +
    gente +
    '<ellipse cx="150" cy="236" rx="70" ry="16" fill="url(#sa-alone)"/>' +
    '<g transform="translate(150,236) scale(0.30)">' + corpo + '</g>' +
    '</svg>';
}

/* ==================== LA SCHERMATA ==================== */
let POSTO_PARLA = null;      /* con chi stai parlando, e quale situazione */
let POSTO_APERTA = null;     /* quale scheda è aperta nella lista */

function apriPosto(){
  sistemaGente();
  POSTO_PARLA = null;
  $("posto").classList.add("on");
  renderPosto();
}
function chiudiPosto(){
  POSTO_PARLA = null;
  $("posto").classList.remove("on");
  save(); renderGioco();
  if(typeof renderHub === "function") renderHub();
}

/* Il nome è lungo di proposito: nel gioco tutti i file dividono lo stesso
   scope, e un «bottone» qualsiasi qui dentro pesterebbe i piedi a quello delle
   impostazioni. */
function poTasto(p, tipo, testo, sotto, costo, pronto){
  return '<button class="poazione' + (pronto ? '' : ' no') + '" data-az="' + tipo + '" data-p="' + p.id + '"' +
    (pronto ? '' : ' disabled') + '><span class="n">' + testo + '</span>' +
    '<span class="d">' + sotto + '</span>' +
    (costo ? '<span class="c">' + costo + '</span>' : '') + '</button>';
}

/* quello che puoi chiedere a una persona dipende da quanto la conosci */
function azioniDi(p){
  const r = POSTO_RUOLI[p.ruolo];
  let out = poTasto(p, "parla", "Fatti due parole",
    p.rel >= 5 ? "Ci conosciamo ormai" : "Sali di un gradino con " + p.n, PO_COSTO.parla + " energia",
    G.energy >= PO_COSTO.parla);

  /* Il numero: si scambia con chi lavora sui pezzi — chi fa i beat e chi sta
     al mixer — perche' sono quelli che poi ti scrivono per lavoro. A un
     rapper si propone un feat guardandolo in faccia, a un giornalista si
     rilascia un'intervista: non e' la stessa cosa.
     Serve almeno un contatto: il numero non lo si da' a uno appena visto. */
  if(p.ruolo === "beatmaker" || p.ruolo === "fonico"){
    out += p.numero
      ? poTasto(p, "numero", "Avete il numero", "Ti scrive in chat", "", false)
      : poTasto(p, "numero", "Scambiatevi il numero",
          p.rel >= 1 ? "Da qui in poi ti scrive in chat" : "Serve almeno un contatto",
          PO_COSTO.numero + " energia",
          p.rel >= 1 && G.energy >= PO_COSTO.numero);
  }

  if(p.ruolo === "beatmaker"){
    out += poTasto(p, "beat", "Fatti sentire un beat",
      p.rel >= 1 ? "Te lo mette nel mercato, a prezzo da amico" : "Serve almeno un contatto",
      "gratis", p.rel >= 1);
    out += poTasto(p, "sessione", "Sessione in studio",
      p.rel >= 2 ? "Un pomeriggio in sala: esce un beat vostro" : "Serve che siate amici",
      PO_COSTO.sessione + " energie · 60 €", p.rel >= 2 && G.energy >= PO_COSTO.sessione && G.money >= 60);
  }
  if(p.ruolo === "fonico"){
    out += poTasto(p, "mix", "Portagli un pezzo",
      p.rel >= 2 ? "Te lo mixa lui, meglio di come lo faresti tu" : "Serve che siate amici",
      PO_COSTO.mix + " energie", p.rel >= 2 && G.energy >= PO_COSTO.mix && G.songs.some(s => !s.mixed));
  }
  if(p.ruolo === "rapper"){
    const cd = (typeof totalWeeks === "function" ? totalWeeks() : G.week) - p.feat;
    out += poTasto(p, "feat", "Proponi un pezzo insieme",
      p.rel >= 3 ? (cd < 6 ? "Ne avete fatto uno da poco" : "Un feat vero, con la sua gente dietro")
        : "Serve che siate collaboratori",
      PO_COSTO.feat + " energie", p.rel >= 3 && cd >= 6 && G.energy >= PO_COSTO.feat);
  }
  if(p.ruolo === "giornalista"){
    out += poTasto(p, "intervista", "Fatti intervistare",
      p.rel >= 1 ? "Un pezzo sul giro locale: la gente legge" : "Serve almeno un contatto",
      PO_COSTO.intervista + " energia", p.rel >= 1 && G.energy >= PO_COSTO.intervista);
  }
  return '<div class="poaz">' + out + '</div>' +
    '<p class="poruolo">' + r.d + '</p>';
}

function schedaPersona(p, aperta){
  const r = POSTO_RUOLI[p.ruolo];
  const gen = p.gen && typeof genBeat === "function" ? genBeat(p.gen).n : "";
  return '<div class="poperso' + (aperta ? " aperta" : "") + '" style="--k:' + r.k + '">' +
    '<button class="potesta" data-apri="' + p.id + '">' +
      '<span class="poav">' + faccia(p, 46) + '</span>' +
      '<span class="potx"><b>' + p.n + '</b>' +
        '<i>' + (p.eta ? p.eta + " anni · " : "") + r.n + (gen ? " · " + gen.toLowerCase() : "") + '</i></span>' +
      '<span class="porel"><u>' + relNome(p) + '</u>' +
        '<span class="pobar"><i style="width:' + Math.round(p.pt / relSoglia(p) * 100) + '%"></i></span>' +
        '<em>' + (p.scoperto ? "tipo " + p.car : "non lo conosci ancora") + '</em></span>' +
    '</button>' +
    (aperta ? azioniDi(p) : '') + '</div>';
}

function renderPosto(){
  const chi = presentiOggi();
  $("po-scena").innerHTML = scenaSala(chi);

  if(POSTO_PARLA){ renderDialogo(); return; }

  const conosciuti = G.gente.filter(p => !p.via && p.rel >= 1).length;
  $("po-dove").innerHTML =
    "Sala prove dietro al bar centrale. Ci si passa la sera: chi porta un beat, chi " +
    "cerca una voce, chi sta lì e basta. <b>" + chi.length + "</b> facce stasera, " +
    "<b>" + conosciuti + "</b> di rete vera.";

  $("po-lista").innerHTML = chi.map(p => schedaPersona(p, p.id === POSTO_APERTA)).join("");

  const rete = G.gente.filter(p => !p.via);
  $("po-rete").innerHTML = '<span class="pok2">La tua rete</span>' +
    (rete.length ? rete.map(p =>
      '<span class="porig" style="--k:' + POSTO_RUOLI[p.ruolo].k + '">' +
      '<b>' + p.n + '</b><i>' + POSTO_RUOLI[p.ruolo].n.toLowerCase() + '</i>' +
      '<u>' + relNome(p) + '</u></span>').join("")
      : '<span class="porig"><i>Ancora nessuno.</i></span>');
}

/* ==================== PARLARE ==================== */
function renderDialogo(){
  const {p, sit} = POSTO_PARLA;
  $("po-dove").innerHTML = '<b>' + p.n + '</b> · ' + POSTO_RUOLI[p.ruolo].n.toLowerCase() +
    ' · ' + relNome(p);
  $("po-lista").innerHTML =
    '<div class="podial"><p class="poq">' + sit.t + '</p>' +
    sit.o.map((o, i) => '<button class="porisp" data-r="' + i + '">' + o[0] + '</button>').join("") +
    '</div>';
  $("po-rete").innerHTML = "";
}

function parlaCon(id){
  const p = G.gente.find(x => x.id === id);
  if(!p || G.energy < PO_COSTO.parla) return;
  G.energy -= PO_COSTO.parla;
  const pool = DIALOGHI[p.ruolo];
  POSTO_PARLA = {p:p, sit:pick(pool)};
  SFX.tap(); save(); renderPosto();
  if(typeof renderHub === "function") renderHub();
}

function poRispondi(i){
  if(!POSTO_PARLA) return;
  const {p, sit} = POSTO_PARLA;
  const o = sit.o[i];
  const sett = typeof totalWeeks === "function" ? totalWeeks() : G.week;
  let pt = o[1];
  if(o[2] && o[2] === p.car){ pt += 1; p.scoperto = true; }     /* hai capito che tipo è */
  if(p.ult === sett) pt = Math.min(pt, 1);                       /* già visto oggi: vale meno */
  p.ult = sett;

  let esito, cls;
  if(pt >= 2){ esito = "Ci ha preso gusto a parlare con te."; cls = "bene"; }
  else if(pt >= 1){ esito = "Niente di che, ma la faccia adesso se la ricorda."; cls = ""; }
  else if(pt === 0){ esito = "Ti ha ascoltato con mezzo orecchio."; cls = ""; }
  else { esito = "Hai detto la cosa sbagliata."; cls = "male"; }

  p.pt += pt;
  gain("rete", pt > 0 ? 0.5 : 0.1);
  addLuc(1);

  /* si sale di un gradino alla volta */
  let salito = false;
  while(p.pt >= relSoglia(p) && p.rel < 5){ p.pt -= relSoglia(p); p.rel++; salito = true; }
  if(p.pt < 0 && p.rel > 0){ p.rel--; p.pt = 0; }

  /* con un rapper si può anche rompere: e quello diventa un opp */
  let opp = false;
  if(p.pt <= -3 && p.rel === 0 && p.ruolo === "rapper"){ diventaOpp(p); opp = true; }
  else if(p.pt <= -3){ p.pt = -2; }

  POSTO_PARLA = null;
  POSTO_APERTA = opp ? null : p.id;

  if(salito){
    SFX.fanfare();
    pushLog("Con <b>" + p.n + "</b> adesso siete <b>" + relNome(p) + "</b>.", "");
    toast(p.n + ": adesso siete " + relNome(p), "good", "◆", ["#7C3AED", "#4C1D95"]);
  } else if(opp){
    toast(p.n + " ti ha preso in antipatia. Adesso è un opp.", "bad", "✕", ["#B91C1C", "#7F1D1D"]);
  } else {
    toast(esito, cls === "male" ? "bad" : "good", "…", ["#3A3F49", "#22262E"]);
  }
  save(); renderGioco(); renderPosto();
  if(typeof renderHub === "function") renderHub();
}

/* Il rapper con cui hai rotto entra in classifica come rivale: la rivalità non
   è un menù, è una persona che ti si mette contro. */
function diventaOpp(p){
  p.via = true;
  if(typeof nuovoRivale === "function"){
    const r = nuovoRivale(rnd(400, 1800));
    r.n = p.n; r.gen = p.gen || r.gen; r.skin = p.skin; r.col = p.col; r.hair = p.hair;
    r.storia = "Vi siete conosciuti alla Sala. È finita male.";
    G.rivals.push(r);
  }
  pushLog("<b>" + p.n + "</b> non ti saluta più. Adesso è uno contro cui corri.", "bad");
}

/* ==================== QUELLO CHE LA RETE TI DÀ ==================== */
function azionePosto(tipo, id){
  const p = G.gente.find(x => x.id === id);
  if(!p) return;
  const sett = typeof totalWeeks === "function" ? totalWeeks() : G.week;

  if(tipo === "parla"){ parlaCon(id); return; }

  if(tipo === "numero"){
    if(p.numero || p.rel < 1 || G.energy < PO_COSTO.numero) return;
    G.energy -= PO_COSTO.numero;
    p.numero = true;
    p.numDa = sett;
    /* si fa vivo subito: aprire una chat vuota e' peggio che non averla */
    if(typeof chatPresentazione === "function") chatPresentazione(p);
    pushLog("Ti sei scambiato il numero con <b>" + p.n + "</b>. Adesso lo trovi in chat, sul telefono.", "");
    toast(p.n + " è nelle tue chat", "good", "☎", [POSTO_RUOLI[p.ruolo].k, "#0B1220"]);
    SFX.tap();
  }

  if(tipo === "beat"){
    const presi = G.market.map(b => b.n).concat(G.beats.map(b => b.n));
    const q = rnd(30, 50) + p.fama * 0.3 + p.rel * 7 + G.skills.rete * 0.3;
    const b = creaBeat(p.gen || mioGenere(), q, presi);
    b.price = Math.max(20, Math.round(b.price * (1 - p.rel * 0.12)));
    b.da = p.n;
    G.market.push(b);
    pushLog("<b>" + p.n + "</b> ti ha fatto sentire «" + b.n + "» — qualità " + b.q +
      ", " + b.price + " €. È nel catalogo.", "");
    toast(p.n + ": «" + b.n + "» nel catalogo, " + b.price + " €", "good", "♪", ["#4ADE80", "#166534"]);
    SFX.tap();
  }

  if(tipo === "sessione"){
    if(G.energy < PO_COSTO.sessione || G.money < 60) return;
    G.energy -= PO_COSTO.sessione; G.money -= 60;
    const presi = G.market.map(b => b.n).concat(G.beats.map(b => b.n));
    const q = rnd(46, 62) + p.fama * 0.35 + p.rel * 8 + G.skills.rete * 0.3;
    const b = creaBeat(p.gen || mioGenere(), q, presi);
    b.da = p.n; b.price = 0;
    G.beats.push(b);
    gain("rete", 0.8); addLuc(4);
    G.wellbeing = clamp(G.wellbeing - 2, 0, 100);
    p.pt += 1;
    pushLog("Pomeriggio in sala con <b>" + p.n + "</b>: ne è uscito «" + b.n +
      "», qualità " + b.q + ". È tuo, non lo paghi.", "big");
    toast("Sessione con " + p.n + ": «" + b.n + "» q" + b.q, "good", "★", ["#7C3AED", "#4C1D95"]);
    SFX.rec();
  }

  if(tipo === "mix"){
    const s = G.songs.filter(x => !x.mixed).sort((a, b2) => b2.q - a.q)[0];
    if(!s || G.energy < PO_COSTO.mix) return;
    G.energy -= PO_COSTO.mix;
    const su = Math.round(mixGain() + p.rel * 2 + p.fama * 0.06);
    s.q = clamp(s.q + su, 5, 100); s.mixed = true;
    gain("rete", 0.4);
    pushLog("<b>" + p.n + "</b> ha mixato «" + s.t + "»: qualità +" + su + ".", "");
    toast(p.n + " ha mixato «" + s.t + "» · +" + su, "good", "◎", ["#38BDF8", "#0C4A6E"]);
    SFX.mix();
  }

  if(tipo === "feat"){
    if(G.energy < PO_COSTO.feat) return;
    G.energy -= PO_COSTO.feat;
    p.feat = sett;
    const h = Math.round(6 + p.fama * 0.22 + p.rel * 2);
    const f = Math.round(rnd(20, 60) + p.fama * 4 + G.fans * 0.05);
    G.hype = clamp(G.hype + h, 0, 100); G.fans += f;
    gain("rete", 1); gain("flow", 0.5);
    pushLog("Pezzo insieme a <b>" + p.n + "</b>: +" + h + " hype, +" + fmt(f) + " fan.", "big");
    toast("Feat con " + p.n + " · +" + fmt(f) + " fan", "good", "★", ["#A855F7", "#4C1D95"]);
    SFX.crowd();
  }

  if(tipo === "intervista"){
    if(G.energy < PO_COSTO.intervista) return;
    G.energy -= PO_COSTO.intervista;
    const h = Math.round(4 + p.fama * 0.16 + p.rel * 2);
    G.hype = clamp(G.hype + h, 0, 100);
    G.fans += Math.round(rnd(5, 25) + G.fans * 0.01);
    gain("rete", 0.5);
    pushLog("<b>" + p.n + "</b> ha scritto di te: +" + h + " hype.", "");
    toast("Pezzo di " + p.n + " su di te · +" + h + " hype", "good", "✎", ["#FBBF24", "#78350F"]);
    SFX.publish();
  }

  save(); renderGioco(); renderPosto();
  if(typeof renderHub === "function") renderHub();
}

/* ==================== COMANDI ==================== */
$("po-lista").addEventListener("click", ev => {
  const r = ev.target.closest(".porisp");
  if(r){ poRispondi(+r.dataset.r); return; }
  const az = ev.target.closest("[data-az]");
  if(az && !az.disabled){ azionePosto(az.dataset.az, az.dataset.p); return; }
  const ap = ev.target.closest("[data-apri]");
  if(ap){
    POSTO_APERTA = POSTO_APERTA === ap.dataset.apri ? null : ap.dataset.apri;
    SFX.tap(); renderPosto();
  }
});
$("po-x").onclick = () => { SFX.tap(); chiudiPosto(); };
