/* La Sala: il posto fisico della provincia dove si conosce la gente.

   È la sala prove dietro al bar: ci passano beatmaker, rapper e fonici, e più
   avanti anche chi scrive di musica. Non è un negozio di beat — è il posto dove
   si costruisce la rete, e la rete è quello che poi ti apre le porte.

   La regola: ogni persona ha un carattere, e con ognuna si sale un gradino alla
   volta — conoscenza, contatto, amico, collaboratore, fidato, partner. Quello che
   puoi chiedere dipende da dove sei arrivato. Dal 21/09/2026 qui **non si spende
   energia** («non deve costare energia interagire con gli altri all'interno
   della sala», CARLO): parlare, il numero, la sessione, il mix, il feat, il
   video, l'intervista sono a zero. Non si farma lo stesso: ogni mossa ha il
   suo tempo (`PO_TEMPO`, il gate del tempo reale) e «due parole» con la stessa
   persona nello stesso giorno vale meno (`p.ult`).

   In provincia c'è poca gente e pochi ruoli, di proposito: il giornalista si
   affaccia solo quando qualcuno comincia a sapere chi sei. Manager e uffici stampa
   restano roba da Milano; un promoter non occupa mai un posto casuale al Circolo,
   ma può diventare un contatto eccezionale se lo incontri davvero lavorando.

   Dal 29/09/2026 la Sala non ha più una pagina sua: con il Live Club è
   diventata **Il Circolo** (js/game/circolo.js), e la gente si incontra nel
   riquadro «1. La gente» di quella pagina. Qui resta tutto quello che la
   gente È — chi arriva, i caratteri, i dialoghi, quello che la rete ti dà —
   e le mosse si descrivono come dati (`vociDi`), che il Circolo disegna. */
"use strict";

const POSTO_MAX = 8;                  /* quanta gente può girare in provincia */
const REL_NOMI = ["conoscenza", "contatto", "amico", "collaboratore", "fidato", "partner"];

/* Tutto a zero dal 21/09/2026 (erano parla 12, sessione 45, mix 20, feat 45,
   intervista 12, numero 4, video 35): la Sala e' rete, non lavoro. La tabella
   resta perche' i controlli e le etichette passano di qui, e se un giorno si
   torna indietro basta cambiare i numeri. */
const PO_COSTO = {parla:0, sessione:0, mix:0, feat:0, intervista:0, numero:0, video:0};
/* l'etichetta del costo: l'energia solo se c'e', i soldi se ci sono, se no «gratis» */
function poEtichetta(tipo, soldi){
  const e = PO_COSTO[tipo] || 0;
  const parti = [];
  if(e) parti.push(e + (e === 1 ? " energia" : " energie"));
  if(soldi) parti.push(soldi);
  return parti.length ? parti.join(" \u00b7 ") : "gratis";
}

const PO_TEMPO = Object.freeze({
  parla:30,
  numero:15,
  beat:60,
  sessione:180,
  mix:120,
  feat:180,
  video:240,
  intervista:60
});

function poTempoMinuti(tipo){
  return Number(PO_TEMPO[tipo]||0);
}

function poTempoGate(tipo){
  const minuti=poTempoMinuti(tipo);

  if(typeof GAME_TIME==="undefined" ||
     typeof GAME_TIME.canSpend!=="function"){
    return {ok:true,reason:null,minutes:minuti,remaining:Infinity};
  }

  return GAME_TIME.canSpend(minuti);
}

function poTempoTesto(tipo){
  const minuti=poTempoMinuti(tipo);

  if(typeof GAME_TIME!=="undefined" &&
     typeof GAME_TIME.formatDuration==="function")
    return GAME_TIME.formatDuration(minuti);

  return minuti+" min";
}

function poTempoPerche(g){
  if(g && g.reason==="day-end"){
    const rim = typeof GAME_TIME!=="undefined" &&
      typeof GAME_TIME.formatDuration==="function"
        ? GAME_TIME.formatDuration(g.remaining)
        : g.remaining+" min";

    return "Troppo tardi: restano "+rim+" prima delle 04:00";
  }

  return "Prima risolvi quello che hai in sospeso";
}

function poTempoCosto(tipo,costo){
  if(!costo) return "";
  return costo+" \u00b7 "+poTempoTesto(tipo);
}

function poTempoBlocca(tipo){
  const g=poTempoGate(tipo);
  if(g.ok) return false;

  toast(
    poTempoPerche(g),
    "bad",
    "!",
    ["#3A3F49","#22262E"]
  );

  return true;
}

function poTempoAvanza(tipo){
  if(typeof GAME_TIME==="undefined" ||
     typeof GAME_TIME.spend!=="function")
    return true;

  const out=GAME_TIME.spend(
    poTempoMinuti(tipo),
    "sala-"+tipo
  );

  return !(out && out.blocked);
}


const POSTO_RUOLI = {
  beatmaker: {n:"Beatmaker", k:"#4ADE80",
    d:"Fa beat. Se ti prende in simpatia te li fa sentire prima degli altri."},
  rapper: {n:"Rapper", k:"#A855F7",
    d:"Uno come te. Può diventare un pezzo insieme o un problema."},
  fonico: {n:"Fonico", k:"#38BDF8",
    d:"Sta dietro al mixer. Un pezzo mixato bene è un altro pezzo."},
  giornalista: {n:"Giornalista", k:"#FBBF24",
    d:"Scrive di musica per il giro. Arriva quando cominci a esistere.",
    da:g => g.fans >= 2000},
  /* punto 10: il videomaker. Nelle trasferte c'era già (js/game/trasferte.js),
     in città no — e in città è quello che decide come ti si vede prima ancora
     di come suoni. Si affaccia quando hai qualcosa da girare: prima di avere
     un pezzo fuori non avrebbe niente da fare con te. */
  videomaker: {n:"Videomaker", k:"#22D3EE",
    d:"Gira i video. Decide come ti si vede, prima ancora di come suoni.",
    da:g => (g.songs || []).some(x => x.released)},
  /* Questi ruoli possono nascere dal lavoro ma non occupano posti casuali
     al Circolo: sono contatti persistenti della vita fuori dalla Sala. */
  promoter: {n:"Promoter", k:"#FB7185",
    d:"Lavora con serate e locali. Può farti arrivare occasioni che al Circolo non passano."},
  cliente: {n:"Cliente abituale", k:"#D6B98C",
    d:"Una faccia che torna spesso. Non è dentro alla musica per definizione: è semplicemente parte del giro del locale."},
  fornitore: {n:"Fornitore", k:"#A7B5C6",
    d:"Passa per consegne e rifornimenti. Conosce persone e posti, ma non è una scorciatoia musicale."},
  rider: {n:"Rider", k:"#8FD3C8",
    d:"Incrocia la Pizzeria durante i ritiri. È una conoscenza del quartiere, non un contatto professionale della musica."},
  collega: {n:"Collega", k:"#94A3B8",
    d:"Una persona conosciuta sul posto di lavoro. Non è per forza dentro alla musica."},
  strada: {n:"Conoscenza della Strada", k:"#F97316",
    d:"Una persona legata al giro della Strada. Compare solo se quel giro lo hai già avviato."},
  avvocato: {n:"Avvocato", k:"#E2E8F0",
    d:"Un professionista che può diventare il tuo legale di fiducia. Conoscerlo non significa automaticamente averlo a libro paga."}
};

const POSTO_NOMI = {
  beatmaker: ["Bit", "Cassa", "Tino Sale", "Otto", "Grillo", "Pino Beats", "Sonar", "Mimmo Loop"],
  rapper: null,                        /* i rapper prendono i nomi dei rivali */
  fonico: ["Andre", "Gigi", "Fede", "Nico", "Sara", "Pippo"],
  giornalista: ["Marta", "Dario", "Elisa", "Toni"],
  videomaker: ["Ciro", "Vale", "Manu", "Bea", "Tommy", "Zeta"],
  promoter: ["Riky", "Mauri", "Simo", "Vale P.", "Dado", "Nina"],
  cliente: ["Giulia", "Davide", "Elena", "Mattia", "Irene", "Pietro", "Chiara", "Lorenzo"],
  fornitore: ["Stefano", "Mauro", "Claudia", "Fabio", "Enzo", "Lucia"],
  rider: ["Leo", "Sam", "Noemi", "Teo", "Miki", "Ari"],
  collega: ["Luca", "Marco", "Simo", "Vale", "Ale", "Marta", "Nico", "Sara"],
  strada: ["Cobra", "Lupo", "Moro", "Zero", "Nox", "Rami"],
  avvocato: ["Avv. Ferri", "Avv. Riva", "Avv. Sala", "Avv. Conti", "Avv. Greco", "Avv. Villa"]
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
        ["Gli dici che è il Circolo, è sempre stato così", 0, "diffidente"],
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
  ],
  /* punto 10: dodici situazioni anche per lui, come per gli altri mestieri.
     Il videomaker ragiona per immagini: quello che gli interessa è se hai
     un'idea di come ti si deve vedere, non quanto sei bravo a rappare. */
  videomaker: [
    {t:"Ti mostra sul telefono trenta secondi girati ieri notte per un altro.",
     o:[["Guardi tutto e gli dici quale inquadratura ti è rimasta", 2, "aperto"],
        ["Gli chiedi con che roba l'ha girato", 1, "pratico"],
        ["Gli dici che il tuo verrebbe meglio", 0, "gasato"]]},
    {t:"«Se domani ti giro un video, tu come ti vedi? Dimmi un posto.»",
     o:[["Gli dici un posto vero della tua zona e perché quello", 2, "diffidente"],
        ["Gli dici che decide lui, ti fidi", 1, "aperto"],
        ["Gli dici «una villa, macchine, il solito»", 0, "gasato"]]},
    {t:"Sta rimontando la stessa scena per la quinta volta e sbuffa.",
     o:[["Ti siedi e guardi con lui finché non esce", 2, "pratico"],
        ["Gli dici che così va già bene", 1, "gasato"],
        ["Gli dici di lasciar perdere e uscire", 0, null]]},
    {t:"«La gente ti riconosce da come sei vestito nel video, non dalle barre.»",
     o:[["Gli dai ragione e gli chiedi come lo useresti", 2, "pratico"],
        ["Gli dici che tu vuoi restare quello che sei", 2, "diffidente"],
        ["Gli dici che le barre bastano", 0, "gasato"]]},
    {t:"Ti chiede se puoi girare alle sei di mattina, che la luce è quella giusta.",
     o:[["Gli dici che ci sei, e ci sei davvero", 2, "aperto"],
        ["Gli chiedi se si può fare al tramonto", 1, "pratico"],
        ["Gli dici che a quell'ora non ti alzi", -1, null]]},
    {t:"«Ho una camera vecchia. Se aspetti due mesi ne prendo una seria.»",
     o:[["Gli dici che giri adesso, con quella che ha", 2, "aperto"],
        ["Gli chiedi quanto costa quella nuova", 1, "pratico"],
        ["Gli dici che allora aspetti", 0, "diffidente"]]},
    {t:"Ha montato il tuo pezzo su immagini che non c'entrano niente con il testo.",
     o:[["Gli spieghi di cosa parla davvero il pezzo", 2, "pratico"],
        ["Gli dici che così è più interessante", 1, "aperto"],
        ["Gli dici che ha rovinato tutto", -1, "gasato"]]},
    {t:"«Il video più visto che ho fatto l'ho girato col telefono in un garage.»",
     o:[["Gli chiedi cosa aveva quel video che gli altri non hanno", 2, "pratico"],
        ["Gli dici che è stato culo", 0, "gasato"],
        ["Gli dici che ci credi, la roba vera si vede", 2, "aperto"]]},
    {t:"Ti riprende mentre non te ne accorgi e poi te lo fa vedere.",
     o:[["Gli dici di tenerlo, che sei tu più di mille pose", 2, "aperto"],
        ["Gli chiedi di cancellarlo", 1, "diffidente"],
        ["Ti arrabbi", -1, null]]},
    {t:"«Quanto vuoi spendere? Perché con zero si fa, ma si vede.»",
     o:[["Gli dici la cifra vera che hai, senza gonfiarla", 2, "pratico"],
        ["Gli dici che i soldi arrivano dopo il video", 1, "gasato"],
        ["Gli dici che tu non paghi i video", -1, null]]},
    {t:"Ti fa vedere due montaggi dello stesso girato e ti chiede quale.",
     o:[["Scegli e gli dici esattamente perché quello", 2, "diffidente"],
        ["Gli dici che sono belli tutti e due", 0, "aperto"],
        ["Gli dici di scegliere lui, che è il suo mestiere", 1, "pratico"]]},
    {t:"«Ma tu i video li guardi, o li fai e basta?»",
     o:[["Gli fai il nome di un video che ti ha cambiato la testa", 2, "aperto"],
        ["Gli dici che guardi solo i tuoi", 0, "gasato"],
        ["Gli chiedi lui quali guarda", 1, "diffidente"]]}
  ]
};


/* Persone nate fuori dal circuito musicale (lavoro, quartiere, Strada).
   Prima del punto 3 potevano esistere in G.gente ma, una volta rese visibili
   al Circolo, parlaCon() non aveva dialoghi per loro. Questi sono dialoghi
   sociali normali: fanno crescere il rapporto personale, NON la futura
   fiducia criminale del punto 4. */
function dialogoCarcereFuori(p){
  const rapporto=Number(p&&p.carcere&&p.carcere.rapporto||0);
  if((p.strada&&p.strada.rivalita===true) || rapporto<=-4){
    return {
      jailOutside:"rival",
      t:"Vi riconoscete subito. "+p.n+
        " non ha dimenticato come vi siete lasciati dentro, e fuori non c'è più una porta a separarvi.",
      o:[
        ["Gli dici che non vuoi riaprire il conto",1,"pratico"],
        ["Non gli concedi niente e tiri dritto",0,"diffidente"]
      ]
    };
  }
  if(rapporto>=1){
    return {
      jailOutside:"favore",
      t:"Vi siete già visti dietro una porta che adesso non c'è più. "+p.n+
        " ti ricorda una cosa fatta insieme dentro e ti chiede una mano per rimettere in ordine una faccenda fuori.",
      o:[
        ["Gli dai una mano",2,"pratico"],
        ["Gli dici che il carcere è finito e vuoi tenerlo lì",0,"diffidente"]
      ]
    };
  }
  return {
    jailOutside:"reincontro",
    t:"Per un secondo vi riconoscete senza sapere bene se salutarvi. Dentro dividevate lo stesso spazio; fuori siete di nuovo due persone libere.",
    o:[
      ["Ti fermi e scambi due parole",1,"aperto"],
      ["Fai un cenno e tieni le distanze",0,"diffidente"]
    ]
  };
}

const DIALOGHI_VITA = Object.freeze([
  Object.freeze({
    t:"Ti fa un cenno e resta appoggiato al bancone. «Com'è che gira, ultimamente?»",
    o:[
      ["Gli racconti una cosa vera della tua settimana",2,"aperto"],
      ["Gli chiedi prima come sta lui",2,"diffidente"],
      ["Gli dici che va tutto alla grande",1,"gasato"]
    ]
  }),
  Object.freeze({
    t:"Per un attimo finite a parlare della gente che passa sempre dagli stessi posti.",
    o:[
      ["Ascolti più di quanto parli",2,"diffidente"],
      ["Racconti chi hai incontrato tu",2,"aperto"],
      ["Tagli corto: non ti interessa",0,"pratico"]
    ]
  }),
  Object.freeze({
    t:"«La provincia è piccola. Prima o poi le facce tornano tutte.»",
    o:[
      ["Gli chiedi quali facce vede più spesso",2,"pratico"],
      ["Gli dici che è proprio quello il bello",1,"aperto"],
      ["Gli dici che tu non ti fai notare",2,"diffidente"]
    ]
  }),
  Object.freeze({
    t:"Ti chiede cosa stai combinando fuori dalla musica.",
    o:[
      ["Gli rispondi senza raccontargli tutta la tua vita",2,"diffidente"],
      ["Gli racconti davvero come stai messo",2,"aperto"],
      ["Gli dici che ti fai i fatti tuoi",1,"pratico"]
    ]
  }),
  Object.freeze({
    t:"Si mette a parlare di orari, soldi e gente che promette più di quanto mantiene.",
    o:[
      ["Gli dici che guardi soprattutto chi mantiene la parola",2,"pratico"],
      ["Gli racconti di una promessa andata male",2,"aperto"],
      ["Gli dici che basta saper comandare",1,"gasato"]
    ]
  }),
  Object.freeze({
    t:"La conversazione si ferma per qualche secondo. Nessuno dei due sembra avere fretta di riempire il silenzio.",
    o:[
      ["Resti lì senza forzare il discorso",2,"diffidente"],
      ["Gli fai una domanda personale ma semplice",2,"aperto"],
      ["Tiri fuori il telefono e cambi aria",0,null]
    ]
  })
]);

/* ==================== LA GENTE ==================== */
function relNome(p){ return REL_NOMI[clamp(p.rel, 0, 5)]; }
function relSoglia(p){ return 3 + p.rel; }         /* più sali, più costa salire */

function nuovaPersona(ruolo){
  /* i rapper pescano dagli stessi nomi dei rivali: un nome che sta gia' in
     classifica non si riusa, se no alla Sala gira un omonimo di uno che poi
     non si puo' chiamare in Cabina (problemi-riscontrati, 15/09) */
  const usati = (G.gente || []).map(p => p.n).concat((G.rivals || []).map(r => r.n));
  let pool = POSTO_NOMI[ruolo];
  if(!pool) pool = RIV_NOMI;                        /* i rapper: nomi da rivali */
  const liberi = pool.filter(n => usati.indexOf(n) < 0);
  /* punto 65: un'età vera, non un numero a caso — i fonici e i giornalisti
     sono il mestiere di chi ha già fatto qualche anno di gavetta, gli altri
     due partono dalla stessa fascia del giocatore */
  const etaMin = {fonico:26, giornalista:28, videomaker:22, avvocato:30}[ruolo] || 18;
  const etaMax = {fonico:52, giornalista:58, videomaker:45, avvocato:62}[ruolo] || 32;
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

/* Contatti nati sul lavoro.
   Restano persone normali di G.gente: stessi rapporti, stessa chat e gli stessi
   effetti compatibili col loro ruolo. L'origine impedisce che compaiano per
   magia al Circolo: prima li incontri davvero lavorando. */
function postoContattiLavoro(luogo){
  return (G.gente || []).filter(p => p && !p.via && p.origineLuogo === luogo);
}

function postoNuovoContattoLavoro(luogo, ruolo, meta){
  if(!G.gente) G.gente = [];
  meta = meta || {};

  let r = ruolo;
  if(!r){
    const haPezzoFuori = (G.songs || []).some(s => s && s.released);
    const pool = haPezzoFuori
      ? ["beatmaker","beatmaker","fonico","fonico","videomaker"]
      : ["beatmaker","beatmaker","beatmaker","fonico","fonico"];
    r = pick(pool);
  }

  /* Mai salvare una persona con un ruolo che il sistema relazioni non sa
     descrivere. Se una configurazione futura sbaglia, ripieghiamo su rapper
     invece di creare un contatto rotto. */
  if(!POSTO_RUOLI[r]) r = "rapper";

  const p = nuovaPersona(r);
  p.origine = "lavoro";
  p.origineLuogo = luogo;
  p.origineLavoro = meta.jobId || luogo;
  p.origineRuoloLavoro = meta.workRoleId || meta.jobId || null;
  p.origineRuoloNome = meta.workRoleName || null;
  p.origineDettaglio = meta.dettaglio ||
    (luogo === "fabbrica" ? "collega di Fabbrica" : "contatto conosciuto al lavoro");
  p.storia = meta.storia ||
    (luogo === "fabbrica"
      ? "Vi siete conosciuti lavorando in Fabbrica."
      : "Vi siete conosciuti sul lavoro.");
  p.collega = luogo === "fabbrica" || luogo === "magazzino";
  p.circoloSbloccato = false;
  p.numero = false;
  p.numDa = null;
  G.gente.push(p);
  return p;
}

function postoContattoLavoroCandidato(luogo, daRiprendere, maxContatti, ruoli, meta){
  const ripresa = Array.isArray(daRiprendere)
    ? daRiprendere.filter(p => p && !p.via && p.origineLuogo === luogo && !p.numero)
    : [];

  /* Un rapporto già iniziato ha priorità su una faccia nuova: così i lavori
     costruiscono ambienti riconoscibili e non distributori infiniti di NPC. */
  if(ripresa.length) return pick(ripresa);

  const presenti = postoContattiLavoro(luogo);
  if(maxContatti != null && presenti.length >= Number(maxContatti)) return null;

  const pool = Array.isArray(ruoli)
    ? ruoli.filter(r => !!POSTO_RUOLI[r])
    : [];
  const ruolo = pool.length ? pick(pool) : null;
  return postoNuovoContattoLavoro(luogo, ruolo, meta);
}

function postoAvvicinaContattoLavoro(p, punti){
  if(!p || p.via) return null;
  p.pt = Number(p.pt || 0) + Math.max(0, Number(punti || 0));
  while(p.pt >= relSoglia(p) && p.rel < 5){
    p.pt -= relSoglia(p);
    p.rel++;
  }
  return p;
}

function postoScambiaNumeroLavoro(p){
  if(!p || p.via) return null;
  const sett = typeof totalWeeks === "function" ? totalWeeks() : G.week;

  /* Sul lavoro vi siete già conosciuti davvero: il numero apre il primo
     gradino del rapporto, senza inventare una seconda persona in rubrica. */
  p.rel = Math.max(1, Number(p.rel || 0));
  p.pt = Math.max(0, Number(p.pt || 0));
  p.numero = true;
  p.numDa = sett;

  if(typeof chatPresentazione === "function") chatPresentazione(p);
  if(typeof pushLog === "function")
    pushLog("Hai scambiato il numero con <b>" + p.n +
      "</b>, " + (p.origineDettaglio || "un contatto conosciuto al lavoro") +
      ". Adesso lo trovi nelle chat.", "good");

  return p;
}

function postoGiornoAssolutoValido(v){
  /* Le date persistite possono arrivare come numero o stringa numerica.
     Null/false/stringa vuota non sono il giorno zero: significano dato assente. */
  if(typeof v==="number")
    return Number.isSafeInteger(v) && v>0 ? v : null;
  if(typeof v==="string"){
    const s=v.trim();
    if(!/^\d+$/.test(s)) return null;
    const n=Number(s);
    return Number.isSafeInteger(n) && n>0 ? n : null;
  }
  return null;
}

function postoRientroCarcereDisponibile(p){
  if(!p || p.via || p.origineLuogo!=="carcere" || p.circoloSbloccato || !p.carcere)
    return false;
  const m=p.carcere;
  if(m.currentJailId) return false;
  const oggi=typeof stradaAbsDay==="function"
    ? stradaAbsDay()
    : (((Math.max(1,Number(G.year)||1)-1)*52+(Math.max(1,Number(G.week)||1)-1))*7+
       (Math.max(1,Number(G.day)||1)-1)+1);

  let quando=postoGiornoAssolutoValido(m.returnAfterAbsoluteDay);
  /* Migrazione dei salvataggi creati dalla prima versione del punto 20:
     avevano releasedAbsoluteDay ma nessuna data di riemersione. */
  if(quando==null && m.linkedStreet!==true && m.outsideFollowupDone!==true){
    const uscita=postoGiornoAssolutoValido(m.releasedAbsoluteDay);
    if(uscita!=null){
      const rapporto=Number(m.rapporto||0);
      const ritardo=rapporto>=2?42:rapporto>=1?56:rapporto===0?84:63;
      quando=uscita+ritardo;
      m.returnAfterAbsoluteDay=quando;
    }
  }
  if(quando==null || oggi<quando) return false;

  /* Il carcere non genera un contatto gratis: sblocca soltanto la possibilità
     di ritrovare FUORI la stessa persona. Il seguito dipenderà da cosa fai
     quando la incontri davvero. */
  p.circoloSbloccato=true;
  m.returnAfterAbsoluteDay=null;
  if(typeof pushLog==="function")
    pushLog("<b>Una faccia del carcere è tornata fuori.</b> "+p.n+
      " ha ricominciato a girare in provincia. Prima o poi potreste incrociarvi.","");
  if(typeof save==="function") save();
  return true;
}

function postoSoloLavoro(p){
  postoRientroCarcereDisponibile(p);
  return !!(p && p.origineLuogo && !p.circoloSbloccato);
}

/* Punto Strada 16: la rete sociale è fatta di legami tra persone, non di
   percentuali visibili al giocatore. I legami sono generici e persistenti:
   possono nascere da una presentazione della Strada, da un favore o da un
   contatto comune, senza trasformare la persona in un "NPC criminale". */
function postoReteLegami(p){
  if(!p || p.via) return [];
  if(!Array.isArray(p.reteLegami)) p.reteLegami=[];
  return p.reteLegami;
}

function postoCollegaPersone(a,b,motivo){
  if(!a || !b || a===b || a.via || b.via || !a.id || !b.id) return false;
  const sett=typeof totalWeeks==="function" ? totalWeeks() : Number(G.week||1);
  const aggiungi=(da,aChi)=>{
    const legami=postoReteLegami(da);
    let legame=legami.find(x=>x&&x.personId===aChi.id);
    if(!legame){
      legame={personId:aChi.id,reason:motivo||"contatto-comune",sinceWeek:sett};
      legami.push(legame);
    }else if(motivo){
      legame.reason=motivo;
    }
  };
  aggiungi(a,b);
  aggiungi(b,a);
  return true;
}

function postoLegamiAttivi(p){
  const ids=new Set(postoReteLegami(p).map(x=>x&&x.personId).filter(Boolean));
  return (G.gente||[]).filter(x=>x && !x.via && ids.has(x.id));
}

/* Punto Strada 17: una persona non ha una memoria diversa per ogni schermata.
   Quello che succede nella Strada lascia quindi una traccia sociale generica
   sulla STESSA persona che poi puoi ritrovare al lavoro, al Circolo o altrove.
   Non sostituisce p.strada (fiducia/debiti/tensione criminali): è il ponte
   minimo che rende quei fatti parte della vita intera del personaggio. */
function postoConseguenzeMondo(p){
  if(!p || p.via) return [];
  if(!Array.isArray(p.conseguenzeMondo)) p.conseguenzeMondo=[];
  return p.conseguenzeMondo;
}

function postoUltimaConseguenzaMondo(p){
  const eventi=postoConseguenzeMondo(p);
  return eventi.length ? eventi[eventi.length-1] : null;
}

function postoRegistraConseguenzaMondo(p,tipo,punti,meta){
  if(!p || p.via) return null;

  const delta=Number.isFinite(Number(punti)) ? Math.trunc(Number(punti)) : 0;
  const relPrima=Math.max(0,Number(p.rel||0));
  const ptPrima=Number(p.pt||0);

  if(delta){
    p.pt=ptPrima+delta;

    /* Stessa grammatica relazionale dei dialoghi: una conseguenza positiva
       può far maturare un rapporto; una negativa può raffreddarlo di un
       gradino. Non crea però un Opp musicale "di nascosto": quello resta una
       conseguenza esplicita dei dialoghi dedicati. */
    while(p.pt>=relSoglia(p) && p.rel<5){
      p.pt-=relSoglia(p);
      p.rel++;
    }
    if(p.pt<0 && p.rel>0){
      p.rel--;
      p.pt=0;
    }else if(p.rel===0 && p.pt<-2){
      p.pt=-2;
    }
  }

  const sett=typeof totalWeeks==="function" ? totalWeeks() : Number(G.week||1);
  const m=meta&&typeof meta==="object" ? meta : {};
  const evento={
    type:String(tipo||"world-consequence"),
    source:String(m.source||"mondo"),
    week:sett,
    absoluteDay:typeof stradaAbsDay==="function" ? stradaAbsDay() : null,
    points:delta,
    reason:m.reason==null?null:String(m.reason),
    relatedPersonId:m.relatedPersonId||null,
    relatedPersonName:m.relatedPersonName||null,
    context:m.context||null,
    relBefore:relPrima,
    relAfter:Number(p.rel||0)
  };
  const eventi=postoConseguenzeMondo(p);
  eventi.push(evento);
  if(eventi.length>20) eventi.shift();

  return {
    persona:p,
    evento,
    relBefore:relPrima,
    relAfter:Number(p.rel||0),
    ptBefore:ptPrima,
    ptAfter:Number(p.pt||0),
    relChanged:Number(p.rel||0)!==relPrima
  };
}

/* Quanta gente gira: all'inizio tre facce, poi ne arriva una ogni due settimane.
   Il giornalista compare solo quando qualcuno comincia a sapere chi sei. */
/* La gente DELLA SALA: chi e' arrivato dalla classifica (`rivale`, studio.js)
   sta in `G.gente` come tutti, ma non prende un posto di quelli che la Sala
   fa arrivare — se no due feat comprati in Cabina volevano dire due persone
   in meno alla Sala, magari il videomaker o il giornalista
   (problemi-riscontrati, 15/09; chiuso il 21/09). */
function genteBaseDellaSala(){
  /* Invariante storico, lasciato esplicito anche per il gate regressioni:
     classifica e contatti confinati al lavoro non consumano slot della Sala. */
  return (G.gente || []).filter(p => p && !p.rivale && !postoSoloLavoro(p));
}
function genteDellaSala(){
  /* Punto 3: dal conteggio generativo escludiamo in più i contatti Strada già
     scoperti. Possono comunque comparire in presentiOggi(): semplicemente non
     sostituiscono beatmaker/rapper/fonici che sistemaGente deve garantire. */
  return genteBaseDellaSala().filter(p =>
    !(p.strada && p.strada.known) && p.ruolo!=="avvocato"
  );
}
function sistemaGente(){
  if(!G.gente) G.gente = [];
  const sett = typeof totalWeeks === "function" ? totalWeeks() : G.week;
  const quante = clamp(3 + Math.floor(sett / 2), 3, POSTO_MAX);
  const ruoli = ["beatmaker", "rapper", "fonico", "beatmaker", "rapper", "beatmaker", "fonico", "rapper"];
  while(genteDellaSala().length < quante){
    const n = genteDellaSala().length;
    let r = ruoli[n % ruoli.length];
    /* punto 10: uno slot lo prende il videomaker, appena hai qualcosa da
       girare — prima del giornalista, che arriva molto più avanti */
    if(n >= 3 && POSTO_RUOLI.videomaker.da(G) &&
       !G.gente.some(p => p.ruolo === "videomaker")) r = "videomaker";
    /* uno slot ogni tanto lo prende il giornalista, se è ora */
    else if(n >= 4 && POSTO_RUOLI.giornalista.da(G) &&
       !G.gente.some(p => p.ruolo === "giornalista")) r = "giornalista";
    const p=nuovaPersona(r);
    p.origine="circolo";
    p.origineDettaglio="persona del Circolo";
    p.storia="È una faccia che gira al Circolo.";
    p.circoloSbloccato=true;
    G.gente.push(p);
  }

  /* Punto Strada 6: il legale privato è una persona del mondo, non un toggle.
     Dopo essere entrato davvero nella Strada e aver costruito un minimo di
     reputazione, può comparire una volta al Circolo senza rubare slot al cast
     musicale. Conoscerlo non equivale ancora ad assumerlo. */
  const puoConoscereLegale=!!(G.strada&&G.strada.badgeSbloccato) &&
    (Number(G.strada.rep||0)>=8 || Number(G.strada.precedenti||0)>0);
  if(puoConoscereLegale && !G.gente.some(p=>p&&p.ruolo==="avvocato"&&!p.via)){
    const legale=nuovaPersona("avvocato");
    legale.origine="circolo";
    legale.origineLuogo=null;
    legale.origineDettaglio="conosciuto al Circolo";
    legale.storia="Vi siete conosciuti al Circolo, fuori dal contesto di un arresto.";
    legale.circoloSbloccato=true;
    legale.numero=false;
    legale.numDa=null;
    G.gente.push(legale);
  }
}

/* Chi c'è oggi: tre facce, sempre le stesse dentro la settimana. Il Circolo
   ne chiede di più la sera (`quanti`): l'ordine è lo stesso, quindi chi c'è
   di pomeriggio c'è anche stasera, e se ne aggiungono altri. */
function presentiOggi(quanti){
  sistemaGente();
  const sett = typeof totalWeeks === "function" ? totalWeeks() : G.week;
  const vivi = G.gente.filter(p => !p.via && !postoSoloLavoro(p));

  const punteggio=p=>{
    const k=(p.id.charCodeAt(1)*31+sett*17)%97;
    const strada=p.strada&&p.strada.known ? 8 : 0;
    const ritorno=Math.min(6,Math.max(0,Number(p.circoloPresenze||0))*2);
    /* Una conseguenza recente non genera un popup casuale: rende semplicemente
       più probabile rivedere quella stessa persona, se già appartiene al mondo
       sociale del Circolo. Così il seguito di una storia può avvenire faccia
       a faccia invece di sparire nel sottosistema che l'ha creata. */
    const eco=postoUltimaConseguenzaMondo(p);
    const etaEco=eco ? Math.max(0,sett-Number(eco.week||sett)) : 99;
    const conseguenza=eco&&etaEco<=4 ? Math.max(0,8-etaEco*2) : 0;
    /* I contatti comuni pesano davvero: chi è collegato a persone che già
       frequenti ha più probabilità di ricomparire nello stesso ambiente. */
    const rete=Math.min(10,postoLegamiAttivi(p).reduce((n,x)=>
      n+(Number(x.rel||0)>=1 || (x.strada&&x.strada.known) ? 4 : 1),0));
    return k+Number(p.rel||0)*12+strada+ritorno+rete+conseguenza;
  };

  const ord=vivi.slice().sort((a,b)=>punteggio(b)-punteggio(a));
  const limite=Math.max(0,Number(quanti||3));
  const scelti=[];
  const presi=new Set();

  for(const p of ord){
    if(scelti.length>=limite) break;
    if(presi.has(p.id)) continue;
    scelti.push(p); presi.add(p.id);

    /* Se una persona è già davvero nella tua rete, un suo legame può
       comparire insieme a lei. Questo trasforma "un contatto comune" in una
       relazione del mondo, non in un nuovo tiro casuale scollegato. */
    if(scelti.length<limite &&
       (Number(p.rel||0)>0 || (p.strada&&p.strada.known))){
      const legato=postoLegamiAttivi(p)
        .filter(x=>!presi.has(x.id) && vivi.includes(x))
        .sort((a,b)=>punteggio(b)-punteggio(a))[0] || null;
      if(legato){
        scelti.push(legato);
        presi.add(legato.id);
      }
    }
  }

  /* Ricordiamo solo che la faccia è passata dal Circolo, non il suo nome:
     "visto" resta riservato a quando il giocatore ci parla davvero. */
  const giorno=[Number(G.year||1),Number(G.week||1),Number(G.day||1)].join(":");
  scelti.forEach(p=>{
    if(p.circoloUltimoVistoKey!==giorno){
      p.circoloUltimoVistoKey=giorno;
      p.circoloPresenze=Math.max(0,Number(p.circoloPresenze||0))+1;
    }
  });

  return scelti.slice(0,limite);
}

/* ==================== DOVE SI INCONTRA ====================
   La Sala è un pezzo del Circolo (js/game/circolo.js): chi chiama
   `apriPosto()` — l'agenda del telefono, un evento che dice «passa dalla
   Sala» — apre il Circolo sul riquadro della gente. */
let POSTO_PARLA = null;      /* con chi stai parlando, e quale situazione */
let POSTO_APERTA = null;     /* chi è selezionato nel riquadro della gente */

function apriPosto(){
  sistemaGente();
  POSTO_PARLA = null;
  if(typeof apriLuogo === "function") apriLuogo("circolo", {pannello:"gente"});
}
function chiudiPosto(){
  POSTO_PARLA = null;
  if(typeof chiudiLuogo === "function") chiudiLuogo();
  save(); renderGioco();
  if(typeof renderHub === "function") renderHub();
}

/* Una mossa verso una persona, come dato: cosa c'è scritto, sotto, quanto
   costa e se si può. Il gate del tempo reale si guarda qui, una volta sola,
   perché il Circolo e chiunque altro la disegni dicano la stessa cosa. */
function poVoce(p, tipo, testo, sotto, costo, pronto){
  const gate=poTempoGate(tipo);
  const puo=!!pronto && gate.ok;
  const sottoFinale=(!!pronto && !gate.ok)
    ? poTempoPerche(gate)
    : sotto;
  const costoFinale=poTempoCosto(tipo,costo);
  return {tipo:tipo, p:p.id, n:testo, sotto:sottoFinale, costo:costoFinale, puo:puo};
}

/* ============ IL BEAT SUL TAVOLO (punto 20 e 22) ============
   Quando un beatmaker ti fa sentire un beat, quello finisce nel catalogo, che
   pero' e' un'altra schermata: da dentro a La Sala non si vedeva niente e il
   tasto sembrava rotto. Il beat resta segnato sulla persona finche' sta nel
   mercato, cosi' lo si vede, lo si ascolta e lo si compra da qui. */
function beatSulTavolo(p){
  if(!p.beatOff) return null;
  const b = (G.market || []).find(x => x.n === p.beatOff);
  if(!b) delete p.beatOff;
  return b || null;
}
/* la riga del beat dentro alla scheda della persona: copertina, qualita', bpm,
   il tasto per ascoltarlo, quello per prenderlo e quello per lasciarlo li' */
function rigaBeatSala(b){
  const i = G.market.indexOf(b);
  const info = typeof beatInfo === "function" ? beatInfo(b) : {bpm:"-"};
  return '<div class="pobeat">' +
    '<span class="pobcov" style="background:' + beatCov(b) + '"></span>' +
    '<span class="pobnm"><b>' + b.n + '</b><span>qualit\u00e0 ' + b.q + ' \u00b7 ' + info.bpm + ' bpm</span></span>' +
    '<button class="pobplay" data-sent="' + i + '" title="Ascolta il beat" aria-label="Ascolta il beat" aria-pressed="false">\u25b6</button>' +
    '<button class="pobbuy" data-prendi="' + i + '"' + (G.money < b.price ? ' disabled' : '') + '>' +
      b.price + ' \u20ac</button>' +
    '<button class="pobno" data-lascia="' + i + '" title="Lascialo dov\u2019e\u0300">\u2715</button>' +
    '</div>';
}

/* ==================== IL VIDEO (punto 10) ====================
   Il pezzo che ha più senso girare: quello uscito da poco che ancora non ha
   un video. Se sono tutti coperti non c'è niente da fare, e il tasto lo dice
   invece di restare acceso a vuoto. */
function daGirare(){
  return (G.songs || [])
    .filter(s => s.released && !s.video)
    .sort((a, b) => (b.week - a.week) || (b.q - a.q))[0] || null;
}
/* costa più caro se il videomaker è uno che conta: è il suo mestiere, non un
   favore. Con il rapporto scende, come tutto il resto qui dentro. */
function costoVideo(p){
  return Math.max(60, Math.round((110 + p.fama * 3.4) * (1 - p.rel * 0.09)));
}

/* quello che puoi chiedere a una persona dipende da quanto la conosci */
function vociDi(p){
  const out = [];
  out.push(poVoce(p, "parla", "Parla",
    p.rel >= 5 ? "Ci conosciamo ormai" : "Sali di un gradino con " + p.n, poEtichetta("parla"),
    G.energy >= PO_COSTO.parla));

  /* Il numero: si scambia con chi lavora sui pezzi — chi fa i beat e chi sta
     al mixer — perche' sono quelli che poi ti scrivono per lavoro. A un
     rapper si propone un feat guardandolo in faccia, a un giornalista si
     rilascia un'intervista: non e' la stessa cosa.
     Serve almeno un contatto: il numero non lo si da' a uno appena visto. */
  if(p.ruolo === "beatmaker" || p.ruolo === "fonico" || p.ruolo === "videomaker"){
    out.push(p.numero
      ? poVoce(p, "numero", "Avete il numero", "Ti scrive in chat", "", false)
      : poVoce(p, "numero", "Scambia il numero",
          p.rel >= 1 ? "Da qui in poi ti scrive in chat" : "Serve almeno un contatto",
          poEtichetta("numero"),
          p.rel >= 1 && G.energy >= PO_COSTO.numero));
  }

  if(p.ruolo === "beatmaker"){
    /* punto 20 e 22: il beat che ti fa sentire adesso si vede qui, non solo nel
       catalogo di un'altra schermata. Finche' ce l'hai sul tavolo resta li':
       lo ascolti, lo compri o lo lasci, e solo dopo te ne fa sentire un altro. */
    const sul = beatSulTavolo(p);
    out.push(poVoce(p, "beat", "Chiedi un beat",
      sul ? "Ce n'e' gia' uno sul tavolo: ascoltalo, prendilo o lascialo"
        : p.rel >= 1 ? "Te lo mette nel mercato, a prezzo da amico" : "Serve almeno un contatto",
      "gratis", p.rel >= 1 && !sul));
    out.push(poVoce(p, "sessione", "Sessione in studio",
      p.rel >= 2 ? "Un pomeriggio in sala: esce un beat vostro" : "Serve che siate amici",
      poEtichetta("sessione", "60 €"), p.rel >= 2 && G.energy >= PO_COSTO.sessione && G.money >= 60));
  }
  if(p.ruolo === "fonico"){
    out.push(poVoce(p, "mix", "Portagli un pezzo",
      p.rel >= 2 ? "Te lo mixa lui, meglio di come lo faresti tu" : "Serve che siate amici",
      poEtichetta("mix"), p.rel >= 2 && G.energy >= PO_COSTO.mix && G.songs.some(s => !s.mixed)));
  }
  if(p.ruolo === "rapper"){
    const cd = (typeof totalWeeks === "function" ? totalWeeks() : G.week) - p.feat;
    out.push(poVoce(p, "feat", "Proponi un feat",
      p.rel >= 3 ? (cd < 6 ? "Ne avete fatto uno da poco" : "Un feat vero, con la sua gente dietro")
        : "Serve che siate collaboratori",
      poEtichetta("feat"), p.rel >= 3 && cd >= 6 && G.energy >= PO_COSTO.feat));
  }
  /* punto 10: il videomaker gira il video di un pezzo che è già fuori. Un
     pezzo, un video: non è una leva da tirare due volte sullo stesso. */
  if(p.ruolo === "videomaker"){
    const senza = daGirare();
    out.push(poVoce(p, "video", "Fategli un video",
      p.rel < 2 ? "Serve che siate amici"
        : (senza ? "«" + senza.t + "»: il pezzo continua a girare" : "Ogni pezzo fuori ha già il suo video"),
      poEtichetta("video", costoVideo(p) + " €"),
      p.rel >= 2 && !!senza && G.energy >= PO_COSTO.video && G.money >= costoVideo(p)));
  }
  if(p.ruolo === "giornalista"){
    out.push(poVoce(p, "intervista", "Fatti intervistare",
      p.rel >= 1 ? "Un pezzo sul giro locale: la gente legge" : "Serve almeno un contatto",
      poEtichetta("intervista"), p.rel >= 1 && G.energy >= PO_COSTO.intervista));
  }
  return out;
}

/* Il Circolo disegna la pagina: chi ridisegnava la Sala dopo una mossa
   (qui sotto, eventi-v2, tempo-controlli) ridisegna il Circolo. */
function renderPosto(){
  if(typeof renderLuogo === "function") renderLuogo();
}

/* ==================== PARLARE ==================== */
function parlaCon(id){
  const p = G.gente.find(x => x.id === id);
  if(!p || G.energy < PO_COSTO.parla) return;
  if(poTempoBlocca("parla")) return;
  G.energy -= PO_COSTO.parla;
  poTempoAvanza("parla");
  const pool = DIALOGHI[p.ruolo] || DIALOGHI_VITA;
  const jailFollowup=(p.origine==="carcere" && p.carcere &&
    p.carcere.releasedAbsoluteDay!=null && !p.carcere.outsideFollowupDone)
      ? dialogoCarcereFuori(p)
      : null;
  POSTO_PARLA = {p:p, sit:jailFollowup||pick(pool)};
  SFX.tap(); save(); renderPosto();
  if(typeof renderHub === "function") renderHub();
}

function poRispondi(i){
  if(!POSTO_PARLA) return;
  const {p, sit} = POSTO_PARLA;
  const o = sit.o[i];
  const sett = typeof totalWeeks === "function" ? totalWeeks() : G.week;
  let pt = o[1];
  /* «Hai capito che tipo è»: se la risposta è quella giusta per il suo
     carattere vale un punto in più, e da lì in poi il carattere lo sai.

     Il bonus però **non si applica a una risposta che non è un passo verso di
     lui**. Prima si sommava a tutte, e usciva la cosa che non torna del punto
     14: alla richiesta di prestargli il microfono, «gli dici che te lo tieni
     per te» vale zero ed è etichettata «diffidente» — con uno diffidente
     davanti diventava +1 e l'amicizia **saliva dicendo di no**. Aver capito
     che tipo è resta vero comunque (e infatti `scoperto` si segna lo stesso):
     è quello che conta come rapporto che non deve crescere. */
  if(o[2] && o[2] === p.car){
    p.scoperto = true;
    if(pt > 0) pt += 1;
  }
  /* Il dopo-serata (js/game/circolo.js): se sei appena sceso dal palco, una
     risposta buona vale un punto in più. Si somma PRIMA del «già visto
     oggi», che resta il tetto: la serata non diventa un modo per farmare. */
  if(pt > 0 && typeof circoloDopoSerata === "function" && circoloDopoSerata()) pt += 1;
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

  /* Punto Strada 20: il primo vero incontro DOPO il carcere chiude il filo
     sospeso. Se il rapporto dentro era positivo, la persona può chiedere un
     favore: ricambiarlo non regala una relazione, ma rende concreto il ponte
     fra rapporto carcerario, rete sociale e fiducia della Strada. */
  if(sit.jailOutside && p.carcere){
    p.carcere.outsideFollowupDone=true;
    if(sit.jailOutside==="favore"){
      if(i===0){
        if(typeof stradaSegnaPersona==="function")
          stradaSegnaPersona(p,{
            key:"carcere:"+p.id,
            source:"carcere-reunion",
            story:"Vi siete conosciuti dentro e vi siete ritrovati fuori."
          });
        if(typeof stradaModificaFiducia==="function")
          stradaModificaFiducia(p,4,"carcere-favore-fuori");
        if(typeof stradaAggiungiFavore==="function")
          stradaAggiungiFavore(p,1,"carcere-favore-fuori");
        if(typeof postoRegistraConseguenzaMondo==="function")
          postoRegistraConseguenzaMondo(p,"jail-reunion-helped",1,{
            source:"carcere",reason:"favore-ricambiato-fuori",context:"circolo"
          });
      }else if(typeof postoRegistraConseguenzaMondo==="function"){
        postoRegistraConseguenzaMondo(p,"jail-reunion-declined",0,{
          source:"carcere",reason:"favore-rifiutato-fuori",context:"circolo"
        });
      }
    }else if(sit.jailOutside==="rival"){
      if(typeof postoRegistraConseguenzaMondo==="function")
        postoRegistraConseguenzaMondo(p,"jail-rival-reunion",i===0?0:-1,{
          source:"carcere",reason:i===0?"conto-tenuto-freddo":"conto-riacceso",context:"circolo"
        });
      if(i!==0 && typeof stradaModificaTensionePersona==="function")
        stradaModificaTensionePersona(p,1,"carcere-rivale-reincontro");
    }else if(typeof postoRegistraConseguenzaMondo==="function"){
      postoRegistraConseguenzaMondo(p,"jail-reunion",i===0?1:0,{
        source:"carcere",reason:i===0?"reincontro-aperto":"reincontro-freddo",context:"circolo"
      });
    }
  }

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
  /* Se in classifica c'e' gia' lui — venuto da li' (studio.js, `rivaleId`) o,
     in un salvataggio di prima del 21/09, un omonimo che la Sala aveva pescato
     senza guardare la classifica — non ne nasce un secondo con lo stesso
     nome: quello che c'e' cambia storia. Se no ne nasce uno. In tutti e due i
     casi la persona resta legata al suo rivale (`rivaleId`): un opp non torna
     in «Dalla classifica» come uno sconosciuto da pagare. Solo l'id, non
     `rivale`: quello vuol dire «venuto dalla classifica» e tiene la persona
     fuori dal conto della Sala (genteDellaSala) — chi ha rotto con te alla
     Sala il suo posto lo occupa ancora, com'e' sempre stato. */
  if(!G.rivals) G.rivals = [];
  let r = G.rivals.find(x => p.rivaleId != null ? x.id === p.rivaleId : x.n === p.n) || null;
  /* La storia vale anche per il rivale ricreato: chi era venuto dalla
     classifica con un feat ed e' poi uscito dalla classifica non «si e'
     conosciuto alla Sala». */
  const storia = p.rivale ? "Ha fatto un feat con te, poi al Circolo è finita male."
    : "Vi siete conosciuti al Circolo. È finita male.";
  if(r){
    r.storia = storia;
  } else if(typeof nuovoRivale === "function"){
    r = nuovoRivale(rnd(400, 1800));
    r.n = p.n; r.gen = p.gen || r.gen; r.skin = p.skin; r.col = p.col; r.hair = p.hair;
    r.storia = storia;
    G.rivals.push(r);
  }
  if(r) p.rivaleId = r.id;
  pushLog("<b>" + p.n + "</b> non ti saluta più. Adesso è uno contro cui corri.", "bad");
}

/* ==================== QUELLO CHE LA RETE TI DÀ ==================== */
function azionePosto(tipo, id){
  const p = G.gente.find(x => x.id === id);
  if(!p) return;
  const sett = typeof totalWeeks === "function" ? totalWeeks() : G.week;
  if(tipo !== "parla"){
    if(!Object.prototype.hasOwnProperty.call(PO_TEMPO,tipo)) return;
    if(poTempoBlocca(tipo)) return;
  }

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
    if(p.rel < 1 || beatSulTavolo(p)) return;
    /* «Producer session: passa dalla Sala, stasera c'è chi fa beat» — se te
       l'eri segnato, farti sentire un beat lo onora (solo quello di oggi: la
       «Sessione lunga» della settimana vuole la sessione vera, sotto) */
    if(window.AGENDA && typeof AGENDA.onora === "function" && AGENDA.onora("sala", "oggi") &&
      typeof save === "function") save();
    const presi = G.market.map(b => b.n).concat(G.beats.map(b => b.n));
    const q = rnd(30, 50) + p.fama * 0.3 + p.rel * 7 + G.skills.rete * 0.3;
    const b = creaBeat(p.gen || mioGenere(), q, presi, p.fama);
    b.price = Math.max(20, Math.round(b.price * (1 - p.rel * 0.12)));
    b.da = p.n;
    G.market.push(b);
    p.beatOff = b.n;
    pushLog("<b>" + p.n + "</b> ti ha fatto sentire «" + b.n + "» — qualità " + b.q +
      ", " + b.price + " €. È sul banco dello Studio.", "");
    toast(p.n + ": «" + b.n + "» sul banco dello Studio, " + b.price + " €", "good", "♪", ["#4ADE80", "#166534"]);
    SFX.tap();
  }

  if(tipo === "sessione"){
    if(G.energy < PO_COSTO.sessione || G.money < 60) return;
    G.energy -= PO_COSTO.sessione; G.money -= 60;
    /* Da smistare, punto 6: se questa sessione è "Sessione lunga alla Sala"
       segnata in agenda per oggi, vale il suo peso — la sera vera è
       migliore, non solo più lunga sulla carta. */
    const peso = (window.AGENDA && typeof AGENDA.consumaPeso === "function")
      ? AGENDA.consumaPeso("sala") : 1;
    const presi = G.market.map(b => b.n).concat(G.beats.map(b => b.n));
    const q = (rnd(46, 62) + p.fama * 0.35 + p.rel * 8 + G.skills.rete * 0.3) * peso;
    const b = creaBeat(p.gen || mioGenere(), q, presi, p.fama);
    b.da = p.n; b.price = 0;
    G.beats.push(b);
    gain("rete", 0.8 * peso); addLuc(4);
    G.wellbeing = clamp(G.wellbeing - 2, 0, 100);
    p.pt += 1;
    pushLog("Pomeriggio in sala con <b>" + p.n + "</b>: ne è uscito «" + b.n +
      "», qualità " + b.q + ". È tuo, non lo paghi." + (peso > 1 ? " Serata giusta per esserci." : ""), "big");
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
    G.hype = clamp(G.hype + h, 0, (typeof hypeCap==="function"?hypeCap():100)); G.fans += f;
    gain("rete", 1); gain("flow", 0.5);
    diarioBordo().feat++;
    pushLog("Pezzo insieme a <b>" + p.n + "</b>: +" + h + " hype, +" + fmt(f) + " fan.", "big");
    toast("Feat con " + p.n + " · +" + fmt(f) + " fan", "good", "★", ["#A855F7", "#4C1D95"]);
    SFX.crowd();
  }

  /* punto 10: il video non è un colpo secco di hype — è quello che tiene in
     piedi un pezzo nelle settimane dopo. Resta attaccato alla canzone
     (`s.video`) e js/game/sim.js lo legge ogni settimana in songWeekly(). */
  if(tipo === "video"){
    const s = daGirare();
    const costo = costoVideo(p);
    if(!s || p.rel < 2 || G.energy < PO_COSTO.video || G.money < costo) return;
    G.energy -= PO_COSTO.video; G.money -= costo;
    s.video = Math.min(1.75, 1 + 0.16 + p.rel * 0.06 + p.fama * 0.004 + G.skills.presenza * 0.002);
    s.videoDa = p.n;
    const h = Math.round(5 + p.fama * 0.18 + p.rel * 2);
    G.hype = clamp(G.hype + h, 0, (typeof hypeCap==="function"?hypeCap():100));
    G.fans += Math.round(rnd(10, 40) + G.fans * 0.012);
    gain("rete", 0.6); gain("presenza", 0.4);
    p.pt += 1;
    pushLog("<b>" + p.n + "</b> ha girato il video di «" + s.t + "»: +" + h +
      " hype, e il pezzo continua a girare più a lungo.", "big");
    toast("Video di «" + s.t + "» · +" + h + " hype", "good", "▶", ["#22D3EE", "#083344"]);
    SFX.publish();
  }

  if(tipo === "intervista"){
    if(G.energy < PO_COSTO.intervista) return;
    G.energy -= PO_COSTO.intervista;
    const h = Math.round(4 + p.fama * 0.16 + p.rel * 2);
    G.hype = clamp(G.hype + h, 0, (typeof hypeCap==="function"?hypeCap():100));
    G.fans += Math.round(rnd(5, 25) + G.fans * 0.01);
    gain("rete", 0.5);
    pushLog("<b>" + p.n + "</b> ha scritto di te: +" + h + " hype.", "");
    toast("Pezzo di " + p.n + " su di te · +" + h + " hype", "good", "✎", ["#FBBF24", "#78350F"]);
    SFX.publish();
  }

  if(tipo !== "parla") poTempoAvanza(tipo);
  save(); renderGioco(); renderPosto();
  if(typeof renderHub === "function") renderHub();
}

/* ==================== IL BEAT LASCIATO LÌ ====================
   Era dentro al listener della vecchia pagina: adesso lo chiama il Circolo. */
function lasciaBeatSala(i){
  const b = G.market[i];
  if(!b) return;
  G.market.splice(i, 1);
  const chi = G.gente.find(x => x.beatOff === b.n);
  if(chi) delete chi.beatOff;
  pushLog("Hai lasciato l\u00ec \u00ab" + b.n + "\u00bb.", "");
  SFX.tap(); save(); renderGioco(); renderPosto();
}
