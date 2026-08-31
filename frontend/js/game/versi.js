/* Il generatore di barre: serve a completare una strofa lasciata a metà.

   Come è fatta una riga: un'apertura che porta il tema, una virgola, e una
   chiusura che porta la rima. Le aperture sono frasi compiute, le chiusure
   cominciano con una congiunzione: attaccate danno quasi sempre italiano
   sensato, e la parola in rima finisce dove deve, cioè in fondo.

   Le chiusure sono raggruppate per suono finale. Dentro un gruppo le ultime
   tre lettere sono sempre uguali, così quantoRima() (in writer.js) le vede
   come rima piena e non come assonanza. */
"use strict";

/* le aperture, una lista per tema: l'indice è quello di TEMI in writer.js.
   Dentro ci stanno le parole chiave del tema, che è quello che analizza()
   cerca per dare il punto sul tema. */
const APERTURE = [
  [ /* 0 · Quello che non hai */
    "In tasca ho le mani", "La fame non passa", "Di soldi manco l'ombra",
    "Sono partito da zero", "Conto quello che manca", "Il freddo entra dai vetri",
    "Ho un vuoto nello stomaco", "Non ho niente da perdere",
    "La tasca resta vuota", "Zero in banca e zero amici"
  ],
  [ /* 1 · Il quartiere */
    "Sotto questi palazzi", "La strada la conosco", "In piazza non c'è nessuno",
    "Il quartiere non perdona", "Sul muro c'è il mio nome", "Dal cortile si sente tutto",
    "La panchina è sempre quella", "Questa città mi tiene",
    "La strada me l'ha insegnato", "Nel palazzo di fronte"
  ],
  [ /* 2 · Chi ti ha detto di lasciar perdere */
    "Nessuno ci credeva", "Dicevano di lasciar perdere", "Si mettevano a ridere",
    "Avevano sbagliato", "Adesso guarda bene", "Ora che mi guardano",
    "Chi rideva sta zitto", "Dicevano che era finita",
    "Nessuno mi ha aspettato", "Guarda chi c'è adesso"
  ],
  [ /* 3 · Le notti sveglio */
    "Sono le quattro di notte", "Il sonno non arriva", "Al buio scrivo meglio",
    "Passo le ore sveglio", "L'insonnia è la mia crew", "Aspetto che venga l'alba",
    "La luce del telefono", "Di notte penso troppo",
    "Il buio non mi spaventa", "Sveglio da troppe ore"
  ],
  [ /* 4 · Tua madre */
    "Mia madre non lo dice", "In cucina c'è la luce", "Le mani di mia mamma",
    "A casa non lo sanno", "Mia madre si preoccupa", "Lei aspetta ancora sveglia",
    "Suo figlio non risponde", "La mamma lo capisce",
    "In casa non si parla", "Mia madre ci ha creduto"
  ],
  [ /* 5 · I soldi che ancora non ci sono */
    "L'affitto scade lunedì", "Il conto è sempre rosso", "Al lavoro non ci torno",
    "Un altro turno di notte", "La paga non mi basta", "In banca mi ridono dietro",
    "Ogni euro conta", "Il debito non dorme",
    "Faccio i turni e poi scrivo", "Duecento euro al mese"
  ],
  [ /* 6 · Chi ti sta intorno */
    "Gli amici di una volta", "I fratelli sono pochi", "La crew è rimasta uguale",
    "La gente cambia in fretta", "Chi stava dietro adesso spinge", "Davanti ci vado io",
    "Siamo rimasti soli", "Insieme si regge meglio",
    "Chi c'era prima è ancora qui", "La gente parla e basta"
  ]
];

/* le chiusure, per suono finale */
const CHIUSE = {
  ente: ["ma qui non cambia niente", "e non lo sa la gente", "però mi resta in mente",
         "e chi vuole capire mi sente", "che vale solo il presente", "e resto indifferente"],
  ale:  ["ma non mi ha fatto male", "e resta tutto uguale", "però non è normale",
         "e questo è solo il finale", "e vediamo quanto vale", "e stasera c'è un locale"],
  nno:  ["ed è passato un anno", "ma non mi fanno danno", "e vediamo cosa fanno",
         "e guardo quelli che vanno", "però era un inganno", "e tutti quanti ce l'hanno"],
  tto:  ["e dormo sotto un tetto", "ma resto sveglio nel letto", "e me lo tengo nel petto",
         "e chiedo solo rispetto", "come ti avevo detto", "e sono ancora qui che aspetto"],
  ore:  ["e mi rimane nel cuore", "che non è più dolore", "e fuori c'è rumore",
         "e sa di sudore", "e adesso ha un altro valore", "e passano le ore"],
  ata:  ["ed è finita la giornata", "e mi faccio la nottata", "e aspetto una chiamata",
         "e prendo solo l'andata", "e me la sono strappata", "e non è più tornata"],
  ino:  ["e non c'è nessuno vicino", "e faccio giorno col mattino", "e non ci credo al destino",
         "e mi tengo il mio cammino", "da quando ero bambino", "e fuori è un gran casino"],
  sso:  ["e mi ci trovo adesso", "però sono lo stesso", "e lo chiamano successo",
         "e ci ripenso spesso", "e ce l'ho sempre messo", "e non chiedo permesso"],
  uro:  ["e scrivo sopra un muro", "ma questo è sicuro", "e il cielo resta scuro",
         "e diventa tutto duro", "e mi gioco il futuro", "e stavolta te lo giuro"],
  are:  ["e so quello che devo fare", "e adesso posso andare", "e nessuno vuole restare",
         "e mi metto a guardare", "e continuo a sognare", "e sto lontano dal mare"],
  mia:  ["e me ne vado via", "però la colpa è mia", "e sembra una follia",
         "e torno in periferia", "e non ho compagnia", "e non è allegria"],
  ero:  ["e il cielo resta nero", "e questo è tutto vero", "e riparto da zero",
         "e mi rimane il pensiero", "e ci ho messo un anno intero", "e ogni tanto ci spero"],
  one:  ["e ne faccio una canzone", "e aspetto l'occasione", "e forse hanno ragione",
         "ed è passata una stagione", "e resto sotto al portone", "e non è più una questione"]
};
const FAMIGLIE = Object.keys(CHIUSE);

/* la famiglia che rima con una parola già scritta dall'utente: serve a far
   attaccare le righe generate a quelle sue, invece di ignorarle */
function famigliaPer(parola){
  if(!parola) return null;
  let best = null, bestV = 0;
  for(const f of FAMIGLIE){
    for(const c of CHIUSE[f]){
      const v = quantoRima(parola, ultimaParola(c));
      if(v > bestV){ bestV = v; best = f; }
    }
  }
  return bestV >= .6 ? best : null;
}

/* i gruppi di rima: righe a coppie, e se sono dispari l'ultima terzina resta
   insieme. Cosi' ogni riga ha con chi rimare, che e' quello che conta il punteggio. */
function gruppiDiRima(n){
  const g = [];
  for(let i = 0; i < n; i += 2) g.push([i, i+1]);
  const ult = g[g.length-1];
  if(ult && ult[1] >= n){ ult.pop(); if(g.length > 1){ g[g.length-2].push(ult[0]); g.pop(); } }
  return g;
}

/* Completa una strofa: tiene tutte le righe già scritte e riempie solo i buchi.
   `righe` è l'array del foglio, `tema` una voce di TEMI. Torna un array nuovo. */
function completaStrofa(righe, tema){
  const iTema = Math.max(0, TEMI.indexOf(tema));
  const out = righe.slice();
  const scritta = i => (out[i] || "").trim().length > 1;

  const ap = APERTURE[iTema].slice();
  const usateFam = [];
  const usateChiuse = [];

  /* la misura da tenere: se hai già scritto qualcosa si va dietro alla tua,
     se no si punta a tredici sillabe. Righe tutte della stessa lunghezza sono
     quello che analizza() chiama metrica, ed è mezzo voto. */
  const tue = out.filter((r, i) => scritta(i)).map(sillabe);
  const misura = tue.length ? tue.reduce((a, b) => a + b, 0) / tue.length : 13;

  for(const gr of gruppiDiRima(out.length)){
    const vuoti = gr.filter(i => !scritta(i));
    if(!vuoti.length) continue;

    /* se nel gruppo c'è già una riga dell'utente, si rima con quella.
       Attenzione: find() torna l'indice trovato, e l'indice 0 è falso. */
    const ancora = gr.filter(i => scritta(i))[0];
    let fam = ancora !== undefined ? famigliaPer(ultimaParola(out[ancora])) : null;
    if(!fam){
      const libere = FAMIGLIE.filter(f => usateFam.indexOf(f) < 0);
      fam = pick(libere.length ? libere : FAMIGLIE);
    }
    usateFam.push(fam);

    for(const i of vuoti){
      /* l'apertura si prende fra le tre più vicine a metà misura, e poi si toglie
         dal mazzo: se le aperture si ripetono analizza() taglia il punto sulle parole */
      const vicine = ap.map((t, j) => [Math.abs(sillabe(t) - misura/2), j])
        .sort((x, y) => x[0] - y[0]).slice(0, 3);
      const apertura = ap.length > 1 ? ap.splice(pick(vicine)[1], 1)[0] : ap[0];
      /* fra le chiusure rimaste si prende quella che porta la riga più vicina
         alla misura, con un po' di gioco fra le due migliori per non essere sempre uguali */
      const libere = CHIUSE[fam].filter(c => usateChiuse.indexOf(c) < 0);
      const cand = (libere.length ? libere : CHIUSE[fam]).slice()
        .sort((x, y) => Math.abs(sillabe(apertura + " " + x) - misura)
                      - Math.abs(sillabe(apertura + " " + y) - misura));
      const chiusa = pick(cand.slice(0, 2));
      usateChiuse.push(chiusa);
      out[i] = apertura + ", " + chiusa;
    }
  }
  return out;
}
