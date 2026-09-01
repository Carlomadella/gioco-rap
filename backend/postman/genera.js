/* Costruisce la collezione Postman di Anni di Fame.

     node postman/genera.js

   Perché generata e non scritta a mano: la collezione è un file JSON da
   tremila righe, in cui una virgola fuori posto non si vede e un controllo
   copiato-incollato male passa inosservato. Qui invece le rotte stanno una
   sotto l'altra, si leggono, e i controlli che si ripetono (lo stato giusto,
   la risposta che è JSON, la forma di un errore) si scrivono una volta sola.

   Il JSON che esce è comunque committato lì accanto, così chi vuole importarla
   in Postman non deve far girare niente. */
"use strict";
const fs = require("fs");
const path = require("path");

const UUID_FINTO = "00000000-0000-4000-8000-000000000000";
const cartelle = [];

/* ==================== ATTREZZI ==================== */
function req(nome, metodo, url, o){
  o = o || {};
  const r = { name: nome, request: { method: metodo, header: [], url: "{{base}}" + url } };
  if(o.descrizione) r.request.description = o.descrizione;
  if(o.sessione) r.request.header.push({ key: "x-sessione", value: "{{token}}" });
  if(o.chiave) r.request.header.push({ key: "x-chiave", value: "{{chiave}}" });
  if(o.admin) r.request.header.push({ key: "x-admin", value: "{{admin}}" });
  if(o.corpo !== undefined){
    r.request.header.push({ key: "content-type", value: "application/json" });
    r.request.body = {
      mode: "raw",
      raw: typeof o.corpo === "string" ? o.corpo : JSON.stringify(o.corpo, null, 2),
      options: { raw: { language: "json" } }
    };
  }
  r.event = [];
  if(o.prima) r.event.push({ listen: "prerequest", script: { type: "text/javascript", exec: o.prima } });
  if(o.prova) r.event.push({ listen: "test", script: { type: "text/javascript", exec: o.prova } });
  if(!r.event.length) delete r.event;
  r.response = [];
  return r;
}
const cartella = (nome, descrizione, item) => cartelle.push({ name: nome, description: descrizione, item: item });

/* Il controllo che si ripete: lo stato giusto, e una risposta che è JSON.
   Non è pignoleria: una rotta che sbaglia spesso torna una pagina di errore
   con dentro dell'HTML, e «status 200» da solo non se ne accorgerebbe. */
const json = (stato, righe) => [
  'pm.test("risponde ' + stato + '", function(){ pm.response.to.have.status(' + stato + '); });',
  'pm.test("e la risposta e\' JSON", function(){ pm.response.to.be.json; });',
  'var d = pm.response.json();'
].concat(righe || []);

/* Un errore del server ha sempre la stessa forma: { errore: "..." } */
const errore = (stato, quale, righe) => json(stato, [
  'pm.test("l\'errore e\' \\"' + quale + '\\"", function(){ pm.expect(d.errore).to.eql("' + quale + '"); });'
].concat(righe || []));

/* ==================== 1 · IL MONDO ==================== */
cartella("1 · Il mondo",
  "Le rotte che rispondono a chiunque, senza sessione: com'è messo il server, le notizie, il feed del telefono.", [
  req("Lo stato del server", "GET", "/api/stato", {
    descrizione: "Quanti artisti ci sono, che settimana è, quanti collegati. È la rotta con cui si controlla che il server sia vivo.",
    prova: json(200, [
      'pm.test("dice ok", function(){ pm.expect(d.ok).to.be.true; });',
      'pm.test("c\'e\' gente in pista", function(){ pm.expect(d.artisti).to.be.above(0); });',
      'pm.test("la settimana e\' un numero da 1 in su", function(){ pm.expect(d.settimana).to.be.at.least(1); });',
      'pm.test("dice ogni quante ore gira la settimana", function(){ pm.expect(d.settimanaOre).to.be.above(0); });',
      'pm.collectionVariables.set("settimanaPrima", d.settimana);'
    ])
  }),
  req("Le notizie", "GET", "/api/notizie?quante=5", {
    descrizione: "Le ultime notizie del mondo. `?quante` va da 1 a 60, di suo 10.",
    prova: json(200, [
      'pm.test("torna una lista", function(){ pm.expect(d.notizie).to.be.an("array"); });',
      'pm.test("non ne torna piu\' di quante chieste", function(){ pm.expect(d.notizie.length).to.be.at.most(5); });'
    ])
  }),
  req("Le notizie · quante fuori scala", "GET", "/api/notizie?quante=99999", {
    descrizione: "Il tetto è 60: un numero più grande viene stretto lì, non fa esplodere niente.",
    prova: json(200, [
      'pm.test("il tetto regge: al massimo 60", function(){ pm.expect(d.notizie.length).to.be.at.most(60); });'
    ])
  }),
  req("Il feed di LaFamegram (da sconosciuto)", "GET", "/api/feed?quanti=5", {
    descrizione: "Senza sessione torna solo i post del mondo. Con la sessione ci finiscono anche quelli che riguardano te.",
    prova: json(200, [
      'pm.test("torna i post", function(){ pm.expect(d.post).to.be.an("array"); });',
      'pm.test("dice a che settimana siamo", function(){ pm.expect(d.settimana).to.be.at.least(1); });'
    ])
  }),
  req("Gli opps · senza dire chi sei", "GET", "/api/opps", {
    descrizione: "Senza sessione e senza `?io`, il server non sa di chi parli: 404.",
    prova: errore(404, "artista-sconosciuto")
  })
]);

/* ==================== 2 · LA CLASSIFICA ==================== */
cartella("2 · La classifica",
  "La classifica vera, una per tutti, coi filtri per città e per genere. La posizione si conta **dentro** al filtro.", [
  req("La classifica", "GET", "/api/classifica?quanti=5", {
    descrizione: "Da qui esce anche l'id di un artista qualsiasi, che le prove dopo usano come «l'altro».",
    prova: json(200, [
      'pm.test("torna una lista non vuota", function(){ pm.expect(d.righe).to.be.an("array").that.is.not.empty; });',
      'pm.test("ne torna 5 come chiesto", function(){ pm.expect(d.righe.length).to.eql(5); });',
      'pm.test("il primo e\' in posizione 1", function(){ pm.expect(d.righe[0].pos).to.eql(1); });',
      'pm.test("le posizioni salgono di uno alla volta", function(){',
      '  for(var i = 1; i < d.righe.length; i++) pm.expect(d.righe[i].pos).to.eql(d.righe[i-1].pos + 1);',
      '});',
      '',
      '// Regola di gioco, non dettaglio tecnico: il server non deve MAI dire chi e\' un bot.',
      'pm.test("non si vede chi e\' un bot", function(){',
      '  pm.expect(JSON.stringify(d.righe)).to.not.match(/"bot"/);',
      '});',
      '',
      'pm.collectionVariables.set("altroId", d.righe[0].id);',
      'pm.collectionVariables.set("altraCitta", d.righe[0].citta);'
    ])
  }),
  req("La classifica · a pagina due", "GET", "/api/classifica?da=11&quanti=5", {
    descrizione: "`?da` è la posizione da cui partire.",
    prova: json(200, [
      'pm.test("parte dalla posizione 11", function(){ pm.expect(d.righe[0].pos).to.eql(11); });'
    ])
  }),
  req("La classifica · di una citta'", "GET", "/api/classifica?citta={{altraCitta}}&quanti=5", {
    descrizione: "Il filtro non è un'etichetta appiccicata sopra: dentro a Rovereto sei terzo, non 428esimo.",
    prova: json(200, [
      'pm.test("sono tutti di quella citta\'", function(){',
      '  var citta = pm.collectionVariables.get("altraCitta");',
      '  d.righe.forEach(function(r){ pm.expect(r.citta).to.eql(citta); });',
      '});',
      'pm.test("la posizione riparte da 1 dentro al filtro", function(){ pm.expect(d.righe[0].pos).to.eql(1); });'
    ])
  }),
  req("La classifica · di un genere", "GET", "/api/classifica?genere=trap&quanti=5", {
    prova: json(200, [
      'pm.test("sono tutti trap", function(){ d.righe.forEach(function(r){ pm.expect(r.genere).to.eql("trap"); }); });'
    ])
  }),
  req("La classifica · genere inventato", "GET", "/api/classifica?genere=liscio&quanti=5", {
    descrizione: "Un genere che non esiste non è un errore: il filtro si spegne e torna la classifica intera.",
    prova: json(200, [
      'pm.test("torna comunque la classifica", function(){ pm.expect(d.righe).to.be.an("array").that.is.not.empty; });'
    ])
  }),
  req("Le citta' e i generi in gioco", "GET", "/api/classifiche", {
    descrizione: "Solo quelli che hanno davvero gente dentro: serve a non mostrare un filtro che poi non dà niente.",
    prova: json(200, [
      'pm.test("torna le citta\'", function(){ pm.expect(d.citta).to.be.an("array").that.is.not.empty; });',
      'pm.test("torna i generi", function(){ pm.expect(d.generi).to.be.an("array").that.is.not.empty; });'
    ])
  })
]);

/* ==================== 3 · LE STAGIONI ==================== */
cartella("3 · Le stagioni",
  "La stagione corrente, l'albo di chi ha vinto quelle chiuse, e chi hai davanti e dietro.", [
  req("Le stagioni", "GET", "/api/stagioni", {
    prova: json(200, [
      'pm.test("c\'e\' una stagione corrente", function(){ pm.expect(d.corrente).to.be.an("object"); });',
      'pm.test("e la lista di tutte", function(){ pm.expect(d.tutte).to.be.an("array"); });'
    ])
  }),
  req("L'albo d'oro", "GET", "/api/albo", {
    prova: json(200, ['pm.test("torna l\'albo", function(){ pm.expect(d.albo).to.be.an("array"); });'])
  }),
  req("Chi ho davanti e dietro", "GET", "/api/classifica/intorno/{{altroId}}?raggio=3", {
    descrizione: "Le frecce ▲▼ della schermata di classifica: chi ti sta appena sopra e appena sotto.",
    prova: json(200, [
      'pm.test("torna i vicini", function(){ pm.expect(d.righe).to.be.an("array").that.is.not.empty; });',
      'pm.test("dice quanti sono in tutto", function(){ pm.expect(d.totale).to.be.above(0); });',
      '',
      '// Senza questo, la schermata non saprebbe quale riga evidenziare.',
      'pm.test("e segna qual e\' quello chiesto", function(){',
      '  var mio = d.righe.filter(function(r){ return r.io === true; });',
      '  pm.expect(mio).to.have.lengthOf(1);',
      '  pm.expect(mio[0].id).to.eql(pm.collectionVariables.get("altroId"));',
      '});'
    ])
  }),
  req("Chi ho davanti · artista che non c'e'", "GET", "/api/classifica/intorno/" + UUID_FINTO, {
    prova: errore(404, "artista-sconosciuto")
  })
]);

/* ==================== 4 · ACCOUNT E SESSIONI ==================== */
const PRIMA_ACCOUNT = [
  '// Ogni giro si fa un account suo: se no il secondo giro trova la mail gia\' usata',
  '// e il nome dell\'artista gia\' occupato.',
  'var n = Math.random().toString(36).slice(2, 8);',
  'pm.collectionVariables.set("email", "prova-" + n + "@annidifame.test");',
  'pm.collectionVariables.set("segreto", "segreto-" + n);',
  'pm.collectionVariables.set("nomeArtista", ("Prova " + n).slice(0, 22));'
];
cartella("4 · Account e sessioni",
  "Gli account (mail, ospite, Steam/Apple/Google) e le sessioni.\n\n**Da qui in poi le prove vanno in ordine**: la sessione che si apre qui la usano tutte le cartelle dopo.", [
  req("Apri un account con la mail", "POST", "/api/account", {
    descrizione: "Fa l'account e apre subito la sessione: torna il token che serve a tutto il resto.",
    prima: PRIMA_ACCOUNT,
    corpo: { tipo: "email", email: "{{email}}", segreto: "{{segreto}}", dispositivo: { piattaforma: "web", nome: "Postman" } },
    prova: json(201, [
      'pm.test("torna un token", function(){ pm.expect(d.token).to.be.a("string").with.length.above(20); });',
      'pm.test("torna l\'account, attivo", function(){ pm.expect(d.account.stato).to.eql("attivo"); });',
      'pm.test("la mail e\' quella", function(){ pm.expect(d.account.email).to.eql(pm.collectionVariables.get("email")); });',
      '',
      '// Il segreto non deve tornare indietro. Mai, in nessuna forma.',
      'pm.test("il segreto non torna indietro", function(){',
      '  pm.expect(pm.response.text()).to.not.include(pm.collectionVariables.get("segreto"));',
      '});',
      '',
      'pm.collectionVariables.set("token", d.token);',
      'pm.collectionVariables.set("accountId", d.account.id);'
    ])
  }),
  req("Account · la stessa mail due volte", "POST", "/api/account", {
    corpo: { tipo: "email", email: "{{email}}", segreto: "{{segreto}}" },
    prova: errore(409, "email-gia-usata")
  }),
  req("Account · mail scritta male", "POST", "/api/account", {
    corpo: { tipo: "email", email: "non-e-una-mail", segreto: "abbastanza-lungo" },
    prova: errore(400, "email-non-valida")
  }),
  req("Account · segreto troppo corto", "POST", "/api/account", {
    descrizione: "Meno di 8 caratteri non passa.",
    corpo: { tipo: "email", email: "corto-{{$randomInt}}@annidifame.test", segreto: "corto" },
    prova: errore(400, "segreto-troppo-corto")
  }),
  req("Account · da ospite", "POST", "/api/account", {
    descrizione: "Senza compilare niente. Torna anche `identita.idEsterno`, che è l'unica cosa con cui ci si rientra: il gioco se lo deve tenere.",
    corpo: { tipo: "ospite", dispositivo: { piattaforma: "web" } },
    prova: json(201, [
      'pm.test("torna il token", function(){ pm.expect(d.token).to.be.a("string"); });',
      'pm.test("torna l\'idEsterno per rientrare", function(){ pm.expect(d.identita.idEsterno).to.be.a("string"); });',
      'pm.collectionVariables.set("ospiteId", d.identita.idEsterno);'
    ])
  }),
  req("Rientra da ospite", "POST", "/api/sessione", {
    corpo: { tipo: "ospite", idEsterno: "{{ospiteId}}", dispositivo: { piattaforma: "web" } },
    prova: json(200, ['pm.test("torna una sessione nuova", function(){ pm.expect(d.token).to.be.a("string"); });'])
  }),
  req("Rientra con la mail", "POST", "/api/sessione", {
    descrizione: "Rimette a posto `token` sull'account con la mail: le prove dopo lavorano su quello.",
    corpo: { tipo: "email", email: "{{email}}", segreto: "{{segreto}}", dispositivo: { piattaforma: "web" } },
    prova: json(200, [
      'pm.test("e\' lo stesso account", function(){ pm.expect(d.account.id).to.eql(pm.collectionVariables.get("accountId")); });',
      'pm.collectionVariables.set("token", d.token);'
    ])
  }),
  req("Rientra · segreto sbagliato", "POST", "/api/sessione", {
    corpo: { tipo: "email", email: "{{email}}", segreto: "questo-non-e-il-segreto" },
    prova: errore(403, "non-torna")
  }),
  req("Rientra con Apple · biglietto finto", "POST", "/api/sessione", {
    descrizione: "Senza le chiavi di Apple (`ADF_APPLE_AUD`) il canale è chiuso e lo dice: **501**. Con le chiavi messe, un biglietto finto prende **403**. Quello che non deve mai succedere è un 200.",
    corpo: { tipo: "apple", biglietto: "questo-non-e-un-biglietto" },
    prova: [
      'pm.test("non fa entrare: 501 se il canale e\' chiuso, 403 se il biglietto e\' finto", function(){',
      '  pm.expect(pm.response.code).to.be.oneOf([501, 403]);',
      '});',
      'pm.test("e la risposta e\' JSON", function(){ pm.response.to.be.json; });',
      'var d = pm.response.json();',
      'pm.test("non torna nessun token", function(){ pm.expect(d.token).to.be.undefined; });'
    ]
  }),
  req("Chi sono", "GET", "/api/io", {
    descrizione: "Tutto quello che sei: account, artisti, salvataggi, traguardi. La chiamata con cui il gioco si ritrova al primo avvio.",
    sessione: true,
    prova: json(200, [
      'pm.test("torna il mio account", function(){ pm.expect(d.account.id).to.eql(pm.collectionVariables.get("accountId")); });',
      'pm.test("torna la lista degli artisti", function(){ pm.expect(d.artisti).to.be.an("array"); });',
      'pm.test("torna le carriere", function(){ pm.expect(d.carriere).to.be.an("array"); });'
    ])
  }),
  req("Chi sono · senza sessione", "GET", "/api/io", {
    prova: errore(403, "sessione-scaduta")
  }),
  req("Chi sono · con un token inventato", "GET", "/api/io", {
    descrizione: "Un token a caso non deve valere più di niente.",
    prova: errore(403, "sessione-scaduta")
  })
]);
/* al token inventato ci va un'intestazione sua, non quella buona */
cartelle[cartelle.length - 1].item.slice(-1)[0].request.header
  .push({ key: "x-sessione", value: "questo-token-non-esiste" });

/* ==================== 5 · GLI ARTISTI ==================== */
cartella("5 · Gli artisti",
  "Iscriversi in classifica, cambiare la propria scheda, mandare un punteggio. E i freni: i nomi che non vanno, la roba degli altri, il punteggio mandato troppo in fretta.", [
  req("Iscrivi un artista", "POST", "/api/artista", {
    descrizione: "Con la sessione addosso, l'artista finisce sotto il tuo account. Senza, il server apre un account da ospite al volo — perché entrare in classifica non deve chiedere di compilare niente.",
    sessione: true,
    corpo: { nome: "{{nomeArtista}}", citta: "Rovereto", genere: "trap", storia: "Comincia da zero.", seed: 12345 },
    prova: json(201, [
      'pm.test("torna l\'id", function(){ pm.expect(d.id).to.be.a("string"); });',
      'pm.test("il nome e\' quello chiesto", function(){ pm.expect(d.nome).to.eql(pm.collectionVariables.get("nomeArtista")); });',
      'pm.test("la citta\' e\' quella chiesta", function(){ pm.expect(d.citta).to.eql("Rovereto"); });',
      '',
      '// La chiave vecchio stile torna una volta sola, alla nascita.',
      'pm.test("torna la chiave, una volta sola", function(){ pm.expect(d.chiave).to.be.a("string"); });',
      '',
      'pm.collectionVariables.set("artistaId", d.id);',
      'pm.collectionVariables.set("chiave", d.chiave);'
    ])
  }),
  req("Artista · nome gia' preso", "POST", "/api/artista", {
    sessione: true,
    corpo: { nome: "{{nomeArtista}}" },
    prova: errore(409, "nome-occupato")
  }),
  req("Artista · nome di una lettera", "POST", "/api/artista", {
    descrizione: "Sotto i due caratteri il nome non è un nome.",
    sessione: true,
    corpo: { nome: "a" },
    prova: errore(400, "nome-non-valido")
  }),
  req("Artista · nome che finge di essere noi", "POST", "/api/artista", {
    descrizione: "«Admin», «Staff», «La Fame Studio». Non è offensivo, è peggio: è qualcuno che può farsi credere.",
    sessione: true,
    corpo: { nome: "Admin Ufficiale" },
    prova: errore(400, "nome-riservato")
  }),
  req("La scheda di un artista", "GET", "/api/artista/{{artistaId}}", {
    descrizione: "Pubblica: la si guarda anche senza sessione.",
    prova: json(200, [
      'pm.test("e\' il mio", function(){ pm.expect(d.id).to.eql(pm.collectionVariables.get("artistaId")); });',
      'pm.test("non fa vedere la chiave", function(){',
      '  pm.expect(pm.response.text()).to.not.include(pm.collectionVariables.get("chiave"));',
      '});',
      'pm.test("non dice se e\' un bot", function(){ pm.expect(d.bot).to.be.undefined; });'
    ])
  }),
  req("La scheda · artista che non c'e'", "GET", "/api/artista/" + UUID_FINTO, {
    prova: errore(404, "artista-sconosciuto")
  }),
  req("Cambia la mia scheda", "PUT", "/api/artista/{{artistaId}}", {
    sessione: true,
    corpo: { citta: "Milano", genere: "drill", storia: "Si e' trasferito." },
    prova: json(200, [
      'pm.test("la citta\' e\' cambiata", function(){ pm.expect(d.citta).to.eql("Milano"); });',
      'pm.test("il genere e\' cambiato", function(){ pm.expect(d.genere).to.eql("drill"); });'
    ])
  }),
  req("Cambia la scheda · di uno che non e' mio", "PUT", "/api/artista/{{altroId}}", {
    descrizione: "Il freno che conta: con la mia sessione non tocco la roba di un altro.",
    sessione: true,
    corpo: { nome: "Rubato" },
    prova: errore(403, "non-e-tuo")
  }),
  req("Manda un punteggio", "POST", "/api/punteggio", {
    descrizione: "Il gioco manda i numeri della settimana. Il server li mette in classifica e dà i traguardi che gli spettano.",
    sessione: true,
    corpo: { id: "{{artistaId}}", stream: 12000, fan: 800, livello: 5, fase: 2, uscite: 3, ultima: "Il primo pezzo" },
    prova: json(200, [
      'pm.test("dice ok", function(){ pm.expect(d.ok).to.be.true; });',
      'pm.test("torna la posizione in classifica", function(){ pm.expect(d.pos).to.be.a("number").above(0); });',
      'pm.test("e quanti sono in tutto", function(){ pm.expect(d.totale).to.be.above(0); });',
      '',
      '// Qui si vede la riga che divide: 12.000 stream e 3 uscite bastano, e i',
      '// traguardi che il server sa controllare da se\' arrivano da soli, senza',
      '// che il gioco li abbia chiesti.',
      'pm.test("e i traguardi che spettano, dati dal server da solo", function(){',
      '  pm.expect(d.traguardi).to.include("primo_pezzo");',
      '  pm.expect(d.traguardi).to.include("primi_mille");',
      '  pm.expect(d.traguardi).to.include("in_classifica");',
      '});'
    ])
  }),
  req("Punteggio · subito un altro", "POST", "/api/punteggio", {
    descrizione: "Il freno contro chi manda punteggi a raffica: fra due invii dello stesso artista devono passare `ADF_INVIO_MS` (10 secondi di suo).",
    sessione: true,
    corpo: { id: "{{artistaId}}", stream: 99999999 },
    prova: errore(429, "troppo-in-fretta")
  }),
  req("Punteggio · per un artista che non e' mio", "POST", "/api/punteggio", {
    sessione: true,
    corpo: { id: "{{altroId}}", stream: 99999999 },
    prova: errore(403, "non-e-tuo")
  })
]);

/* ==================== 6 · IL MONDO CHE TI RIGUARDA ==================== */
cartella("6 · Il mondo che ti riguarda",
  "Le stesse rotte della prima cartella, ma adesso il server sa chi sei — più le relazioni fra artisti.", [
  req("Il feed, con la sessione", "GET", "/api/feed?quanti=10", {
    sessione: true,
    prova: json(200, ['pm.test("torna i post", function(){ pm.expect(d.post).to.be.an("array"); });'])
  }),
  req("Gli opps", "GET", "/api/opps?quanti=3", {
    descrizione: "Chi ti sta appena sopra in classifica (`sopra`), più chi ti sei preso come rivale (`dichiarati`).",
    sessione: true,
    prova: json(200, [
      'pm.test("dice chi sono io", function(){ pm.expect(d.io.id).to.eql(pm.collectionVariables.get("artistaId")); });',
      'pm.test("torna chi mi sta sopra", function(){ pm.expect(d.sopra).to.be.an("array"); });',
      'pm.test("e i rivali dichiarati: per ora nessuno", function(){',
      '  pm.expect(d.dichiarati).to.be.an("array").that.is.empty;',
      '});'
    ])
  }),
  req("Prenditi un rivale", "POST", "/api/relazione", {
    sessione: true,
    corpo: { artistaId: "{{artistaId}}", altroId: "{{altroId}}", tipo: "rivale", nota: "Se l'e' cercata." },
    prova: json(200, [
      'pm.test("dice con chi", function(){ pm.expect(d.con).to.be.a("string"); });',
      'pm.test("e di che tipo", function(){ pm.expect(d.tipo).to.eql("rivale"); });'
    ])
  }),
  req("Rivale · lo stesso due volte", "POST", "/api/relazione", {
    descrizione: "Non è un errore: era già così, e il server lo dice invece di raddoppiare la riga.",
    sessione: true,
    corpo: { artistaId: "{{artistaId}}", altroId: "{{altroId}}", tipo: "rivale" },
    prova: json(200, ['pm.test("dice che c\'era gia\'", function(){ pm.expect(d.gia).to.be.true; });'])
  }),
  req("Relazione · un tipo che non esiste", "POST", "/api/relazione", {
    descrizione: "I tipi buoni sono quattro: rivale, feat, amico, crew.",
    sessione: true,
    corpo: { artistaId: "{{artistaId}}", altroId: "{{altroId}}", tipo: "nemico giurato" },
    prova: errore(400, "relazione-non-valida")
  }),
  req("Relazione · con se stessi", "POST", "/api/relazione", {
    sessione: true,
    corpo: { artistaId: "{{artistaId}}", altroId: "{{artistaId}}", tipo: "rivale" },
    prova: errore(400, "relazione-non-valida")
  }),
  req("Relazione · a nome di un altro", "POST", "/api/relazione", {
    sessione: true,
    corpo: { artistaId: "{{altroId}}", altroId: "{{artistaId}}", tipo: "rivale" },
    prova: errore(403, "non-e-tuo")
  }),
  req("Gli opps · adesso col rivale dentro", "GET", "/api/opps?quanti=3", {
    descrizione: "La prova che le due rotte si tengono: quello che ti sei preso come rivale ricompare qui, in `dichiarati`.",
    sessione: true,
    prova: json(200, [
      'pm.test("il rivale appena preso e\' fra i dichiarati", function(){',
      '  var ids = d.dichiarati.map(function(r){ return r.id; });',
      '  pm.expect(ids).to.include(pm.collectionVariables.get("altroId"));',
      '});'
    ])
  }),
  req("Togli il rivale", "POST", "/api/relazione", {
    sessione: true,
    corpo: { artistaId: "{{artistaId}}", altroId: "{{altroId}}", tipo: "rimuovi", era: "rivale" },
    prova: json(200, ['pm.test("dice ok", function(){ pm.expect(d.ok).to.be.true; });'])
  }),
  req("Gli opps · e adesso non c'e' piu'", "GET", "/api/opps?quanti=3", {
    sessione: true,
    prova: json(200, [
      'pm.test("tolto il rivale, i dichiarati sono di nuovo vuoti", function(){',
      '  pm.expect(d.dichiarati).to.be.an("array").that.is.empty;',
      '});'
    ])
  })
]);

/* ==================== 7 · I SALVATAGGI IN CLOUD ==================== */
cartella("7 · I salvataggi in cloud",
  "Tre slot per account. È quello che porta una carriera dal PC al telefono — e la parte delicata è cosa succede quando due dispositivi salvano la stessa partita.", [
  req("Salva nello slot 1", "PUT", "/api/carriera/1", {
    sessione: true,
    corpo: { stato: { settimana: 40, soldi: 1200, nome: "prova" }, settimana: 40, anno: 1,
      versioneGioco: "1.0.0", artistaId: "{{artistaId}}" },
    prova: json(200, [
      'pm.test("torna la scheda del salvataggio", function(){ pm.expect(d.salvata.slot).to.eql(1); });',
      'pm.test("con la settimana giusta", function(){ pm.expect(d.salvata.settimana).to.eql(40); });',
      'pm.test("e quanto pesa", function(){ pm.expect(d.salvata.byte).to.be.above(0); });'
    ])
  }),
  req("Rileggi lo slot 1", "GET", "/api/carriera/1", {
    sessione: true,
    prova: json(200, [
      'pm.test("torna lo stato salvato, uguale", function(){ pm.expect(d.stato.soldi).to.eql(1200); });',
      'pm.test("e la settimana", function(){ pm.expect(d.settimana).to.eql(40); });'
    ])
  }),
  req("Salva una partita piu' indietro", "PUT", "/api/carriera/1", {
    descrizione: "**Il caso che conta.** In cloud c'è la settimana 40, questo dispositivo è alla 12. Non si fondono da soli — si perderebbe roba senza che nessuno capisca perché. Chi resta indietro se lo sente dire: **409**, con dentro cosa c'è già salvato.",
    sessione: true,
    corpo: { stato: { settimana: 12, soldi: 10 }, settimana: 12, anno: 1 },
    prova: json(409, [
      'pm.test("dice che in cloud c\'e\' roba piu\' avanti", function(){ pm.expect(d.errore).to.eql("carriera-piu-avanti"); });',
      'pm.test("e dice cosa c\'e\', per poter scegliere", function(){ pm.expect(d.salvata.settimana).to.eql(40); });'
    ])
  }),
  req("Salva piu' indietro, ma forzando", "PUT", "/api/carriera/1", {
    descrizione: "`forza: true` è il «sì, sovrascrivi» del giocatore. Solo dopo averglielo chiesto.",
    sessione: true,
    corpo: { stato: { settimana: 12, soldi: 10 }, settimana: 12, anno: 1, forza: true },
    prova: json(200, ['pm.test("adesso in cloud c\'e\' la 12", function(){ pm.expect(d.salvata.settimana).to.eql(12); });'])
  }),
  req("Salva · senza stato", "PUT", "/api/carriera/2", {
    sessione: true,
    corpo: { settimana: 3, anno: 1 },
    prova: errore(400, "stato-mancante")
  }),
  req("Leggi uno slot vuoto", "GET", "/api/carriera/3", {
    sessione: true,
    prova: errore(404, "slot-vuoto")
  }),
  req("Leggi lo slot 4 · non esiste", "GET", "/api/carriera/4", {
    descrizione: "Gli slot sono tre. Il quarto non è uno slot vuoto: è una rotta che non c'è.",
    sessione: true,
    prova: errore(404, "rotta-sconosciuta")
  }),
  req("Tutti i miei salvataggi", "GET", "/api/carriere", {
    sessione: true,
    prova: json(200, [
      'pm.test("ce n\'e\' uno solo, lo slot 1", function(){',
      '  pm.expect(d.carriere).to.be.an("array").with.lengthOf(1);',
      '  pm.expect(d.carriere[0].slot).to.eql(1);',
      '});'
    ])
  }),
  req("I salvataggi · senza sessione", "GET", "/api/carriere", {
    prova: errore(403, "sessione-scaduta")
  })
]);

/* ==================== 8 · I TRAGUARDI ==================== */
cartella("8 · I traguardi",
  "Il catalogo, quelli presi, e la richiesta di uno nuovo.\n\nLa riga che divide: quelli che il server sa controllare da sé **non si chiedono**, se no basterebbe la console del browser.", [
  req("Il catalogo dei traguardi", "GET", "/api/traguardi", {
    prova: json(200, [
      'pm.test("il catalogo non e\' vuoto", function(){ pm.expect(d.traguardi).to.be.an("array").that.is.not.empty; });',
      'pm.test("ogni traguardo ha codice e nome", function(){',
      '  d.traguardi.forEach(function(t){ pm.expect(t.codice).to.be.a("string"); pm.expect(t.nome).to.be.a("string"); });',
      '});'
    ])
  }),
  req("Chiedi un traguardo che sa solo il gioco", "POST", "/api/traguardo", {
    descrizione: "«Milano» il server non può saperlo: gliel'ha detto il gioco. Questo passa.",
    sessione: true,
    corpo: { artistaId: "{{artistaId}}", codice: "milano" },
    prova: json(200, [
      'pm.test("il traguardo e\' stato dato", function(){',
      '  pm.expect(d.gia === true || d.nuovo === true || d.ok === true).to.be.true;',
      '});'
    ])
  }),
  req("Chiedi un traguardo che da' il server", "POST", "/api/traguardo", {
    descrizione: "**`primo_pezzo` lo guarda il server ai numeri che ha in mano.** Chiederlo dal client è esattamente la strada che porta ai traguardi presi aprendo la console — e con Steam attaccato dietro, quella differenza è tutto. Qui deve rispondere 409.",
    sessione: true,
    corpo: { artistaId: "{{artistaId}}", codice: "primo_pezzo" },
    prova: errore(409, "questo-lo-da-il-server")
  }),
  req("Chiedi un traguardo inventato", "POST", "/api/traguardo", {
    sessione: true,
    corpo: { artistaId: "{{artistaId}}", codice: "traguardo_che_non_esiste" },
    prova: errore(404, "traguardo-sconosciuto")
  }),
  req("Traguardo · per un artista non mio", "POST", "/api/traguardo", {
    sessione: true,
    corpo: { artistaId: "{{altroId}}", codice: "milano" },
    prova: errore(403, "non-e-tuo")
  }),
  req("I traguardi di un artista", "GET", "/api/traguardi/{{artistaId}}", {
    prova: json(200, [
      'pm.test("c\'e\' dentro Milano, quello appena preso", function(){',
      '  pm.expect(d.traguardi.map(function(t){ return t.codice; })).to.include("milano");',
      '});',
      '',
      '// Il punteggio di prima (12.000 stream, 3 uscite) doveva far scattare i suoi da solo.',
      'pm.test("e quelli che il server si e\' dato da solo col punteggio", function(){',
      '  var codici = d.traguardi.map(function(t){ return t.codice; });',
      '  pm.expect(codici).to.include("primo_pezzo");',
      '  pm.expect(codici).to.include("primi_mille");',
      '});'
    ])
  })
]);

/* ==================== 9 · SEGNALARE UN NOME ==================== */
cartella("9 · Segnalare un nome",
  "Chi gioca segnala un nome che non va. Le segnalazioni finiscono nella coda che si guarda dalle rotte di servizio.", [
  req("Segnala un artista", "POST", "/api/segnalazione", {
    descrizione: "Si segnala il proprio, in prova: così non si sporca la coda vera con roba finta.",
    sessione: true,
    corpo: { artistaId: "{{artistaId}}", motivo: "nome", nota: "prova di Postman, si puo' respingere" },
    prova: json(200, ['pm.test("dice ok", function(){ pm.expect(d.ok).to.be.true; });'])
  }),
  req("Segnala · lo stesso due volte", "POST", "/api/segnalazione", {
    descrizione: "Uno solo non può contare per dieci: la seconda segnalazione dallo stesso account non raddoppia niente.",
    sessione: true,
    corpo: { artistaId: "{{artistaId}}", motivo: "nome" },
    prova: json(200, ['pm.test("dice che c\'era gia\'", function(){ pm.expect(d.gia).to.be.true; });'])
  }),
  req("Segnala · un bot", "POST", "/api/segnalazione", {
    descrizione: "I bot non si segnalano: non c'è nessuno da moderare dietro. E il server non dice «è un bot» — dice solo che non lo trova.",
    sessione: true,
    corpo: { artistaId: "{{altroId}}", motivo: "nome" },
    prova: errore(404, "artista-sconosciuto")
  }),
  req("Segnala · senza sessione", "POST", "/api/segnalazione", {
    corpo: { artistaId: "{{artistaId}}", motivo: "nome" },
    prova: errore(403, "sessione-scaduta")
  })
]);

/* ==================== 10 · LE ROTTE DI SERVIZIO ==================== */
cartella("10 · Le rotte di servizio",
  "Le otto rotte da dietro le quinte: la coda della moderazione, le sanzioni, il giro di settimana, i traguardi da spingere sugli store.\n\n**Vogliono `ADF_ADMIN`**, e senza quella manopola sono chiuse per tutti — così un server messo su di fretta non se le ritrova aperte per sbaglio.", [
  req("Servizio · senza la chiave", "GET", "/api/sospetti", {
    descrizione: "Il primo controllo: senza `x-admin` non si entra. Vale per tutte e otto.",
    prova: errore(403, "non-sei-tu")
  }),
  req("Servizio · con la chiave sbagliata", "GET", "/api/sospetti", {
    prova: errore(403, "non-sei-tu")
  }),
  req("I sospetti", "GET", "/api/sospetti?quanti=10", {
    descrizione: "Chi ha mandato numeri che non stanno in piedi.",
    admin: true,
    prova: json(200, ['pm.test("torna la lista", function(){ pm.expect(d.sospetti).to.be.an("array"); });'])
  }),
  req("La coda da guardare", "GET", "/api/da-guardare?quanti=30", {
    admin: true,
    prova: json(200, [
      'pm.test("torna la coda", function(){ pm.expect(d.artisti).to.be.an("array"); });',
      'pm.test("c\'e\' dentro quello segnalato poco fa", function(){',
      '  var ids = d.artisti.map(function(a){ return a.artista_id; });',
      '  pm.expect(ids).to.include(pm.collectionVariables.get("artistaId"));',
      '});'
    ])
  }),
  req("Respingi la segnalazione", "POST", "/api/moderazione", {
    descrizione: "Il nome va bene: la segnalazione si chiude e basta.",
    admin: true,
    corpo: { artistaId: "{{artistaId}}", azione: "respingi" },
    prova: json(200, ['pm.test("dice ok", function(){ pm.expect(d.ok).to.be.true; });'])
  }),
  req("Moderazione · un'azione che non esiste", "POST", "/api/moderazione", {
    admin: true,
    corpo: { artistaId: "{{artistaId}}", azione: "bandisci" },
    prova: errore(400, "azione-sconosciuta")
  }),
  req("Rinomina d'ufficio", "POST", "/api/moderazione", {
    descrizione: "Togliere un nome non è una punizione da scrivere in faccia a tutti: è un nome neutro al posto suo. Quello di prima resta nel database, per poter rispondere a «perché mi avete cambiato il nome».",
    admin: true,
    corpo: { artistaId: "{{artistaId}}", azione: "rinomina" },
    prova: json(200, [
      'pm.test("torna il nome nuovo", function(){ pm.expect(d.nome).to.be.a("string"); });',
      'pm.test("e quello di prima, che era il mio", function(){',
      '  pm.expect(d.prima).to.eql(pm.collectionVariables.get("nomeArtista"));',
      '});'
    ])
  }),
  req("Una sanzione", "POST", "/api/sanzione", {
    descrizione: "Un avviso: resta scritto, ma non toglie nessuno dalla classifica. `fuori_classifica` e `sospensione` invece pesano.",
    admin: true,
    corpo: { accountId: "{{accountId}}", tipo: "avviso", motivo: "prova di Postman", giorni: 1 },
    prova: json(200, ['pm.test("dice che tipo di sanzione e\'", function(){ pm.expect(d.tipo).to.eql("avviso"); });'])
  }),
  req("Sanzione · un tipo che non esiste", "POST", "/api/sanzione", {
    admin: true,
    corpo: { accountId: "{{accountId}}", tipo: "fucilazione", motivo: "no" },
    prova: errore(400, "sanzione-non-valida")
  }),
  req("I traguardi da spingere sugli store", "GET", "/api/da-spingere", {
    descrizione: "Quelli presi qui e non ancora raccontati a Steam o agli store del telefono.",
    admin: true,
    prova: json(200, [
      'pm.test("torna la lista", function(){ pm.expect(d.traguardi).to.be.an("array"); });',
      'pm.test("ci sono i miei, non ancora spinti", function(){ pm.expect(d.traguardi.length).to.be.above(0); });'
    ])
  }),
  req("Segna un traguardo come spinto", "POST", "/api/spinto", {
    admin: true,
    corpo: { artistaId: "{{artistaId}}", codice: "milano" },
    prova: json(200, ['pm.test("dice ok", function(){ pm.expect(d.ok).to.be.true; });'])
  }),
  req("Il giro di settimana", "POST", "/api/giro", {
    descrizione: "Fa girare la classifica di una settimana: i bot si muovono, escono le notizie. Di suo succede da solo ogni 24 ore.",
    admin: true,
    prova: json(200, [
      'pm.test("la settimana e\' avanzata di uno", function(){',
      '  pm.expect(d.settimana).to.eql(Number(pm.collectionVariables.get("settimanaPrima")) + 1);',
      '});'
    ])
  }),
  req("Chiudi la stagione", "POST", "/api/stagione/chiudi", {
    descrizione: "Scrive nell'albo i primi 100 e apre la stagione dopo.\n\n**Non è una prova da fare su un server vero**: azzera lo slancio dei bot e chiude la stagione per tutti.",
    admin: true,
    corpo: { quanti: 10 },
    prova: json(200, [
      'pm.test("dice quale ha chiuso e quale ha aperto", function(){',
      '  pm.expect(d.chiusa).to.be.a("string");',
      '  pm.expect(d.nuova).to.be.a("string");',
      '  pm.expect(d.nuova).to.not.eql(d.chiusa);',
      '});',
      'pm.test("e quanti ne ha scritti nell\'albo", function(){',
      '  pm.expect(d.inAlbo).to.be.at.least(1).and.at.most(10);',
      '});'
    ])
  })
]);
/* la chiave sbagliata, sulla seconda */
cartelle[cartelle.length - 1].item[1].request.header
  .push({ key: "x-admin", value: "questa-chiave-non-e-quella-giusta" });

/* ==================== 11 · I BORDI ==================== */
cartella("11 · I bordi",
  "Le cose che non sono una rotta: il preflight del browser, una rotta che non c'è, un corpo scritto male.", [
  req("Il preflight del browser (CORS)", "OPTIONS", "/api/stato", {
    descrizione: "Quello che il browser manda da solo prima di una POST. Deve rispondere 204 e dire quali intestazioni accetta — se sbaglia questa, il gioco nel browser non parla più col server e in console si vede solo «CORS error».",
    prova: [
      'pm.test("risponde 204", function(){ pm.response.to.have.status(204); });',
      'pm.test("dice quali metodi accetta", function(){',
      '  pm.expect(pm.response.headers.get("access-control-allow-methods")).to.include("POST");',
      '});',
      'pm.test("e accetta le nostre intestazioni", function(){',
      '  var h = (pm.response.headers.get("access-control-allow-headers") || "").toLowerCase();',
      '  pm.expect(h).to.include("x-sessione");',
      '  pm.expect(h).to.include("x-admin");',
      '  pm.expect(h).to.include("x-chiave");',
      '});'
    ]
  }),
  req("Una rotta che non c'e'", "GET", "/api/questa-rotta-non-esiste", {
    prova: errore(404, "rotta-sconosciuta")
  }),
  req("La radice", "GET", "/", {
    descrizione: "Il server è solo API: non serve pagine.",
    prova: errore(404, "rotta-sconosciuta")
  }),
  req("Un corpo che non e' JSON", "POST", "/api/artista", {
    descrizione: "Deve rispondere 400 e non 500: è un errore di chi chiama, non del server.",
    sessione: true,
    corpo: "{ questo non e' json",
    prova: errore(400, "json non valido")
  }),
  req("Il metodo sbagliato", "DELETE", "/api/classifica", {
    descrizione: "La rotta esiste in GET. In DELETE non esiste, e il server lo dice così.",
    prova: errore(404, "rotta-sconosciuta")
  })
]);

/* ==================== 12 · CHIUDERE ==================== */
cartella("12 · Chiudere",
  "Uscire, e cancellare l'account — quella che Apple e Google pretendono **dentro** al gioco. In fondo apposta: da qui in poi la sessione non vale più.", [
  req("Esci", "DELETE", "/api/sessione", {
    sessione: true,
    prova: json(200, ['pm.test("dice ok", function(){ pm.expect(d.ok).to.be.true; });'])
  }),
  req("Esci · un'altra volta", "DELETE", "/api/sessione", {
    descrizione: "Il token è stato revocato: adesso non vale più.",
    sessione: true,
    prova: errore(403, "sessione-scaduta")
  }),
  req("Rientra per poter cancellare", "POST", "/api/sessione", {
    corpo: { tipo: "email", email: "{{email}}", segreto: "{{segreto}}" },
    prova: json(200, [
      'pm.test("torna un token nuovo", function(){ pm.expect(d.token).to.be.a("string"); });',
      'pm.collectionVariables.set("token", d.token);'
    ])
  }),
  req("Cancella l'account · senza confermare", "DELETE", "/api/account", {
    descrizione: "Una cancellazione non deve poter partire per sbaglio.",
    sessione: true,
    corpo: {},
    prova: errore(400, "serve-la-conferma")
  }),
  req("Cancella l'account", "DELETE", "/api/account", {
    descrizione: "Non cancella la storia della classifica — quella è di tutti. Toglie il nome e tutto quello che è personale, e ritira gli artisti.",
    sessione: true,
    corpo: { conferma: "cancella" },
    prova: json(200, [
      'pm.test("dice ok", function(){ pm.expect(d.ok).to.be.true; });',
      'pm.test("dice quanti artisti ha ritirato", function(){ pm.expect(d.artistiRitirati).to.be.at.least(1); });'
    ])
  }),
  req("Chi sono · dopo la cancellazione", "GET", "/api/io", {
    descrizione: "La prova che ha funzionato davvero: la sessione di un account cancellato non vale più niente.",
    sessione: true,
    prova: errore(403, "sessione-scaduta")
  })
]);

/* ==================== LA COLLEZIONE ==================== */
const DESCRIZIONE = [
  "Tutte le rotte del server di **Anni di Fame**, con dentro i controlli.",
  "",
  "## Come si fa girare",
  "",
  "1. `cd backend && npm start` (il server sta su `http://127.0.0.1:8787`).",
  "2. Scegli l'ambiente **Anni di Fame — in casa**.",
  "3. Runner → questa collezione → Run.",
  "",
  "Le cartelle vanno **in ordine**: la 4 apre l'account e la sessione che tutte le",
  "altre usano, la 12 la chiude e cancella l'account. Una richiesta presa da sola,",
  "in mezzo, funziona solo se il giro è già passato di lì.",
  "",
  "## Cosa serve avere acceso",
  "",
  "| manopola | senza di lei |",
  "| --- | --- |",
  "| `ADF_ADMIN` | le otto rotte di servizio (cartella 10) rispondono 403 — ed è giusto così |",
  "| `ADF_APPLE_AUD`, `ADF_GOOGLE_CLIENT`, `ADF_STEAM_CHIAVE` | entrare con Apple/Google/Steam risponde 501 «canale chiuso». La prova accetta tutti e due i casi: quello che non deve mai succedere è un 200 |",
  "",
  "## Due avvertenze",
  "",
  "- **Non contro il server vero.** La cartella 10 fa girare la settimana e chiude la",
  "  stagione: sono cose che si vedono da fuori. Contro un database usa e getta, o",
  "  contro quello di casa.",
  "- **Il freno è 120 richieste al minuto per indirizzo.** Il giro intero ne fa una",
  "  ottantina lunga, tutte dentro allo stesso minuto: un secondo giro lanciato",
  "  subito dopo il primo prende 429."
].join("\n");

const collezione = {
  info: {
    name: "Anni di Fame — il server",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    description: DESCRIZIONE
  },
  item: cartelle,
  /* Due controlli che valgono per tutte le richieste, senza doverli ripetere:
     il server non deve mai spaccarsi, e niente qui dentro deve metterci un secondo.

     Non è «sotto il 500» ma un elenco: il 501 di «Apple non è ancora collegato»
     è una risposta voluta e giusta, e mettendo la soglia a 500 quella prova si
     bocciava da sola. Gli altri — 500, 502, 503, 504 — sono sempre roba nostra. */
  event: [{
    listen: "test",
    script: { type: "text/javascript", exec: [
      'pm.test("il server non si e\' spaccato", function(){',
      '  pm.expect(pm.response.code).to.not.be.oneOf([500, 502, 503, 504]);',
      '});',
      'pm.test("risponde entro un secondo", function(){ pm.expect(pm.response.responseTime).to.be.below(1000); });'
    ]}
  }],
  variable: [
    { key: "base", value: "http://127.0.0.1:8787", description: "Dove sta il server." },
    { key: "admin", value: "", description: "ADF_ADMIN: la chiave delle rotte di servizio. Vuota = cartella 10 tutta 403." },
    { key: "token", value: "", description: "La sessione. La riempie la cartella 4." },
    { key: "accountId", value: "" },
    { key: "artistaId", value: "" },
    { key: "chiave", value: "", description: "La chiave vecchio stile dell'artista, per l'intestazione x-chiave." },
    { key: "altroId", value: "", description: "Un artista che non è mio: serve alle prove dei permessi." },
    { key: "altraCitta", value: "" },
    { key: "email", value: "" },
    { key: "segreto", value: "" },
    { key: "nomeArtista", value: "" },
    { key: "ospiteId", value: "" },
    { key: "settimanaPrima", value: "" }
  ]
};

const fuori = path.join(__dirname, "anni-di-fame.postman_collection.json");
fs.writeFileSync(fuori, JSON.stringify(collezione, null, 2) + "\n");

let richieste = 0, controlli = 0;
for(const c of cartelle){
  richieste += c.item.length;
  for(const r of c.item)
    for(const e of (r.event || []))
      if(e.listen === "test") controlli += e.script.exec.filter(l => /^pm\.test\(/.test(l)).length;
}
console.log("fatta: " + cartelle.length + " cartelle, " + richieste + " richieste, " +
  (controlli + richieste * 2) + " controlli");
console.log("       " + fuori);
