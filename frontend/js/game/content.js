/* Contenuti statici: titoli generati, attrezzatura, offerte di contratto, traguardi. */
"use strict";

/* ==================== CONTENUTI ==================== */
const W1 = ["Notte","Fame","Ferro","Vetro","Asfalto","Sangue","Fumo","Cemento","Neve","Corsa","Zero","Ombra","Freddo","Oro","Cane"];
const W2 = ["in tasca","addosso","di lato","alla gola","che brucia","senza nome","in periferia","sotto casa","d'inverno","a vuoto","per sempre","e basta"];
const title = () => Math.random() < .45 ? pick(W1) : pick(W1) + " " + pick(W2);

const GEAR = [
  {id:"cuffie", n:"Cuffie da studio", p:220, q:4, d:"Senti quello che stai facendo davvero."},
  {id:"mic", n:"Microfono a condensatore", p:520, q:9, d:"La voce smette di suonare piccola."},
  {id:"scheda", n:"Scheda audio", p:380, q:6, d:"Niente più latenza, niente più take buttate."},
  {id:"monitor", n:"Monitor da studio", p:760, q:8, d:"I bassi finalmente si sentono per quello che sono."},
  {id:"tratt", n:"Trattamento acustico", p:640, q:7, d:"La stanza smette di rovinarti le registrazioni."}
];

const OFFERS = [
  {id:"distro", label:"Rete Distribuzione", tag:"Solo distribuzione", need:1500,
   advance:0, share:.88, masters:true, push:1.15, deliver:0, weeks:0,
   pitch:"Zero anticipo, zero vincoli. Mettono i tuoi pezzi ovunque e trattengono poco.",
   catch:"Il rischio resta tutto tuo."},
  {id:"indie", label:"Cantiere Dischi", tag:"Indipendente locale", need:6000,
   advance:3000, share:.68, masters:true, push:1.5, deliver:3, weeks:40,
   pitch:"Piccoli ma seri. Tieni i master e decidi tu i pezzi.",
   catch:"Tre uscite in dieci mesi, e la spinta arriva solo fin qui."},
  {id:"agency", label:"Nord Agency", tag:"Contratto 360", need:25000,
   advance:14000, share:.32, masters:false, push:2.3, deliver:4, weeks:52,
   pitch:"Dischi, live, merchandising: gestiscono tutto loro.",
   catch:"Prendono una quota anche sui live. Anche su quello che fai da solo."},
  {id:"major", label:"Vertice Music Group", tag:"Major nazionale", need:70000,
   advance:40000, share:.19, masters:false, push:3.4, deliver:6, weeks:78,
   pitch:"Quarantamila subito, radio nazionali, campagne pagate.",
   catch:"Sei uscite e i master sono loro. Uscirne costa più di quanto ti danno."}
];

/* ==================== LE CERTIFICAZIONI (punto 13) ====================
   Un disco d'oro non è un traguardo del giocatore: è del **pezzo**. I traguardi
   (GOALS qui sotto, e quelli che dà il server) guardano la carriera intera;
   questi guardano un singolo brano, e restano attaccati a quello per sempre —
   è la riga che uno si mette in firma cinque anni dopo.

   Le soglie sono quelle chieste al punto 13. La scala lì era scritta di corsa
   e non tornava — «diamante a 1 milione» sotto al platino, e il platino
   definito con se stesso («dopo i 10× dischi di platino») — quindi sono state
   rimesse nell'ordine che hanno nel mondo, tenendo i numeri dati: oro mezzo
   milione, platino un milione, e il diamante che è il 10× del platino.

   I multipli contano: oltre il milione si dice «2× platino», «3× platino»,
   fino al diamante. È così che si legge una certificazione vera, ed è anche
   quello che fa venire voglia di rimettere in giro un pezzo vecchio. */
const DISCHI = [
  {id:"diamante", n:"Disco di diamante", soglia:10000000, k:"#7DD3FC"},
  {id:"platino",  n:"Disco di platino",  soglia:1000000,  k:"#D9DEE7"},
  {id:"oro",      n:"Disco d'oro",       soglia:500000,   k:"#FFC53D"}
];
/* La certificazione di un pezzo, o `null` se non è ancora arrivato a niente.
   `volte` è il multiplo: 3 vuol dire «3× platino». */
function certificazione(stream){
  const s = Math.max(0, Math.round(stream || 0));
  for(const d of DISCHI){
    if(s < d.soglia) continue;
    const volte = Math.floor(s / d.soglia);
    /* il diamante non si moltiplica: sopra non c'è più niente da dire */
    return { id:d.id, n:d.n, k:d.k, volte: d.id === "diamante" ? 1 : volte,
             etichetta: (volte > 1 && d.id !== "diamante" ? volte + "× " : "") + d.n };
  }
  return null;
}
/* Il gradino di una certificazione, per sapere se un pezzo ne ha appena
   passato uno: 0 = niente, poi oro, platino, 2× platino… e il diamante in
   cima. Serve al giro di settimana, che deve dirlo **quando succede**. */
function gradinoDisco(stream){
  const c = certificazione(stream);
  if(!c) return 0;
  if(c.id === "oro") return 1;
  if(c.id === "platino") return 1 + c.volte;
  return 999;
}

const GOALS = [
  {id:"g1", n:"Primo pezzo pubblicato", d:"Metti fuori qualcosa. Qualsiasi cosa.", ok:g => g.songs.some(s=>s.released), rw:{hype:5}},
  {id:"g2", n:"Mille ascoltatori", d:"Mille persone che non conosci.", ok:g => g.fans >= 1000, rw:{hype:8}},
  {id:"g3", n:"Entra nei primi cinque", d:"Un piazzamento vero, non l'ultima riga.", ok:g => g.best.chart <= 5, rw:{hype:12, money:200}},
  {id:"g4", n:"Vivi di musica", d:"Mille euro in banca senza aver lavorato altrove.", ok:g => g.money >= 1000, rw:{wellbeing:10}},
  {id:"g5", n:"Un pezzo che gira", d:"Un singolo oltre i centomila stream.", ok:g => g.songs.some(s=>s.streams >= 100000), rw:{hype:15}},
  {id:"g6", n:"Firma un contratto", d:"O rifiutali tutti sapendo cosa rifiuti.", ok:g => !!g.contract || g.goals.g6, rw:{}},
  {id:"g7", n:"Diecimila fan", d:"Non sei più un caso isolato.", ok:g => g.fans >= 10000, rw:{hype:10}},
  {id:"g8", n:"Primo posto", d:"Numero uno, almeno per una settimana.", ok:g => g.best.chart === 1, rw:{hype:25, money:2000}},
  {id:"g9", n:"Centomila fan", d:"Adesso è una carriera.", ok:g => g.fans >= 100000, rw:{}},
];
