/* Quanto è credibile un punteggio.

   Il tetto «al massimo il quintuplo» tiene fuori i numeri assurdi, ma non
   guarda il gioco: uno con zero fan e zero pezzi fuori poteva quintuplicare
   come uno che ha appena pubblicato un album. Qui invece si guarda **da dove
   vengono** gli ascolti, e si dice quanti potevano essere al massimo.

   Il modello è volutamente **largo**: fermare per sbaglio uno che gioca
   davvero è molto peggio che lasciar passare uno che bara piano. Chi bara
   piano lo prendiamo dall'altra parte — dai sospetti che si accumulano.

   Quello che il server sa di un artista: gli stream della settimana prima, i
   fan, quanti pezzi ha fuori, il livello, la fase. Basta per dire se un numero
   sta in piedi. */
"use strict";

/* le manopole, tutte generose di proposito */
const M = {
  perFan: 14,          // quante volte a settimana ti ascolta chi ti segue
  perUscita: 9000,     // il botto di un pezzo appena uscito
  inerzia: 1.7,        // quanto può crescere da sola la settimana scorsa
  minimo: 3000,        // sotto questo non si contesta niente a nessuno
  primoInvio: 250000,  // chi arriva con una carriera già avviata
  fanPrimoInvio: 20000,// ...ma nemmeno lui può dichiarare un milione di fan al volo
  fanInPiu: 0.3,       // i fan possono crescere al massimo del 30%...
  fanFissi: 400,       // ...più questi, per chi parte da zero
  livelliInPiu: 3      // livelli guadagnabili in una settimana
};

/* Il tetto per gli stream: la somma di quello che li può giustificare.
   `prima` è l'artista com'è adesso nel database, `adesso` quello che manda. */
function tettoStream(prima, adesso){
  if(!prima.punteggio) return { tetto: M.primoInvio, prima: true };
  const fan = Math.max(prima.fan || 0, Number(adesso.fan) || 0);
  const uscite = Math.max(0, (Number(adesso.uscite) || 0) - (prima.uscite || 0));
  const tetto = Math.round(
    M.minimo +
    fan * M.perFan +                         // chi ti segue ti ascolta
    (uscite + (uscite ? 0 : 0.35)) * M.perUscita +  // un pezzo nuovo fa il botto; se no resta una coda
    (prima.stream || 0) * M.inerzia          // e quello che già andava continua ad andare
  );
  return { tetto: Math.max(tetto, M.minimo * 2) };
}

/* I fan non raddoppiano in una settimana. Anche questo largo: +30% e +400. */
const tettoFan = prima =>
  Math.round((prima.fan || 0) * (1 + M.fanInPiu) + M.fanFissi);

/* Il livello sale con l'esperienza, non con la fantasia. */
const tettoLivello = prima => (prima.livello || 1) + M.livelliInPiu;

/* Guarda tutto insieme e torna cosa accettiamo davvero, più — se qualcosa non
   torna — quanto era fuori misura. La gravità è il rapporto fra quello che ha
   chiesto e quello che poteva: 1 è al limite, 10 è «ha inventato un numero».
   Serve a distinguere chi ha sfondato di poco (magari siamo noi ad avere il
   modello stretto) da chi ha scritto vent'anni di carriera in una riga. */
function esamina(prima, adesso){
  const s = tettoStream(prima, adesso);
  const chiesto = Math.max(0, Math.round(Number(adesso.stream) || 0));
  const fanChiesti = Math.max(0, Math.round(Number(adesso.fan) || prima.fan || 0));
  const livChiesto = Math.max(1, Math.round(Number(adesso.livello) || prima.livello || 1));

  /* Il primo invio ha la mano larga sugli stream, ma **non sui fan**: sono
     loro a comandare il tetto delle settimane dopo, e uno che si dichiara un
     milione di fan al primo colpo si compra il soffitto per sempre. Questa era
     la falla vera del modello, e l'ha trovata la prova. */
  const tf = s.prima ? M.fanPrimoInvio : tettoFan(prima);
  const tl = s.prima ? 60 : tettoLivello(prima);
  const fuori = [];
  let gravita = 0;

  if(chiesto > s.tetto){
    fuori.push("stream");
    gravita = Math.max(gravita, chiesto / Math.max(1, s.tetto));
  }
  if(fanChiesti > tf){
    fuori.push("fan");
    gravita = Math.max(gravita, fanChiesti / Math.max(1, tf));
  }
  if(livChiesto > tl) fuori.push("livello");

  return {
    stream: Math.min(chiesto, s.tetto),
    fan: Math.min(fanChiesti, tf),
    livello: Math.min(livChiesto, tl),
    tetto: s.tetto,
    limato: fuori.length > 0,
    fuori,
    /* il peso che finisce nel registro dei sospetti: uno che sfora di poco
       pesa 1, uno che moltiplica per venti pesa 5. Non si sanziona nessuno per
       un singolo sospetto — si guarda quanti ne ha messi insieme */
    /* Al **primo invio** non si segna nessun sospetto anche se limiamo: è
       l'unico caso in cui limare uno che gioca onesto è normale — sta portando
       dentro una carriera che noi non abbiamo mai visto. Si segna da lì in poi. */
    peso: (!fuori.length || s.prima) ? 0
      : Math.min(5, Math.max(1, Math.round(Math.log10(Math.max(1.1, gravita)) * 3 + 1))),
    primoInvio: !!s.prima,
    gravita: Number(gravita.toFixed(2))
  };
}

module.exports = { esamina, tettoStream, tettoFan, tettoLivello, M };
