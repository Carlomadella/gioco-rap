/* LE RISPOSTE E LA CATENA DEI MIDDLEWARE.

   Qui dentro c'è tutto quello che una richiesta incontra **prima** e **dopo**
   le rotte: le intestazioni CORS, il preflight, il freno delle troppe
   richieste, la manutenzione, la rotta che non esiste e l'errore che scoppia.
   `server.js` non fa più il giro a mano: infila gli strati in `catena()` e
   mette il suo instradamento in fondo.

   **Perché serviva.** Ogni errore usciva da qui in JSON, sempre e comunque:
   `{"errore":"rotta-sconosciuta"}`. Per un client va benissimo — è quello che
   si aspetta — ma chi apriva l'indirizzo del server con il browser, e capita
   ogni volta che qualcuno controlla se è acceso, si prendeva una riga di JSON
   nuda in faccia. Adesso la stessa risposta cambia vestito a seconda di chi
   la chiede: JSON per il gioco, una pagina leggibile per una persona. Il
   codice HTTP e il campo `errore` restano gli stessi di prima, quindi per il
   client non cambia niente.

   **Le pagine si scrivono qui, non stanno in un file .html.** Una pagina che
   deve dire «il server ha un problema» non può dipendere da un file che il
   server dovrebbe andare a leggere dal disco proprio in quel momento: se il
   problema è il disco, o è il percorso, resta un errore dentro all'errore.
   Sono quattro funzioni che tornano una stringa, senza niente da caricare —
   nessun foglio di stile, nessun carattere, nessuna immagine.

   **Cosa NON può stare qui.** Il caricamento del gioco, la schermata di quando
   il JavaScript si rompe, il salvataggio illeggibile e il server che non
   risponde restano nel frontend, e non è una scelta di gusto: il gioco gira
   anche da `file://` dentro a Electron e Capacitor, dove un backend non c'è
   proprio; un errore JavaScript succede nel browser e il server non lo vede;
   e la pagina che dice «il server non risponde» non la può servire il server
   che non risponde. Quello che si poteva portare qui è portato qui. */
"use strict";

/* ==================== CHI STA CHIEDENDO ====================
   Un browser dice `Accept: text/html,...`; il gioco e curl no. Non si guarda
   lo user-agent: quello se lo scrive chiunque, e comunque la domanda giusta
   non è «chi sei» ma «cosa sai leggere». */
function vuoleHtml(req){
  const a = String((req.headers && req.headers.accept) || "");
  if(!a) return false;
  if(a.indexOf("application/json") >= 0) return false;
  return a.indexOf("text/html") >= 0;
}

/* ==================== LA PAGINA ====================
   Una sola, con dentro il suo stile: cambia il numero, il titolo e le righe.
   Non chiede niente a nessuno — è l'unico modo perché funzioni anche il
   giorno che il resto non funziona. */
const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const esc = t => String(t == null ? "" : t).replace(/[&<>"]/g, c => ESC[c]);

function pagina({ codice, occhiello, titolo, righe, chiusa }){
  return '<!doctype html>\n<html lang="it"><head>' +
    '<meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="dark">' +
    '<title>' + esc(titolo) + ' — Anni di Fame</title>' +
    '<style>' +
      '*{box-sizing:border-box}html,body{margin:0;height:100%}' +
      'body{display:flex;align-items:center;justify-content:center;padding:28px;' +
        'background:radial-gradient(120% 80% at 50% 0%,#1a1526,#08080B 66%);color:#fff;' +
        'font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}' +
      'main{width:min(520px,100%);text-align:center}' +
      '.n{font-size:clamp(64px,15vw,116px);line-height:.86;font-weight:900;letter-spacing:-.04em;' +
        'background:linear-gradient(180deg,#FFD980,#E0A32E 62%,#8a5f14);' +
        '-webkit-background-clip:text;background-clip:text;color:transparent}' +
      '.k{display:block;margin-top:14px;font-size:12px;font-weight:800;letter-spacing:.16em;' +
        'text-transform:uppercase;color:#E0A32E}' +
      'h1{margin:8px 0 12px;font-size:clamp(20px,3.8vw,27px);line-height:1.2;letter-spacing:-.01em}' +
      'p{margin:0 0 11px;color:#A8A8B3;font-size:15px;line-height:1.6}' +
      'p b{color:#fff}' +
      '.r{margin-top:24px;padding-top:15px;border-top:1px solid rgba(255,255,255,.09);' +
        'color:#6C6C7A;font-size:13px;line-height:1.55}' +
      'code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;' +
        'padding:1px 6px;border-radius:5px;background:rgba(0,0,0,.4);color:#FFC53D}' +
    '</style></head><body><main>' +
      '<div class="n">' + esc(codice) + '</div>' +
      '<span class="k">' + esc(occhiello) + '</span>' +
      '<h1>' + esc(titolo) + '</h1>' +
      righe.map(r => '<p>' + r + '</p>').join("") +
      (chiusa ? '<p class="r">' + chiusa + '</p>' : '') +
    '</main></body></html>\n';
}

/* Le quattro che il server sa dire. Il testo è quello che direbbe una persona
   a un'altra: cosa è successo, se i dati sono al sicuro, cosa fare adesso. */
const PAGINE = {
  400: () => pagina({
    codice: 400, occhiello: "Richiesta storta", titolo: "Questa richiesta non si capisce",
    righe: ["Il server ha ricevuto qualcosa che non riesce a leggere: un indirizzo malformato, o un corpo che non è JSON valido."],
    chiusa: "Se ci sei arrivato dal gioco è un errore nostro: segnalalo dicendo cosa stavi facendo."
  }),
  404: ({ dove }) => pagina({
    codice: 404, occhiello: "Non c'è niente qui", titolo: "Questo indirizzo non porta da nessuna parte",
    righe: [
      "Qui c'è il server di <b>Anni di Fame</b>: tiene la classifica, gli account e i salvataggi in cloud. Non è il gioco, e non ha pagine da guardare — parla solo con il gioco, in JSON.",
      "L'indirizzo che hai chiesto non esiste: <code>" + esc(dove || "/") + "</code>"
    ],
    chiusa: "L'elenco di tutto quello che il server sa fare sta in <code>backend/README-API.md</code>."
  }),
  429: () => pagina({
    codice: 429, occhiello: "Troppe richieste", titolo: "Stai bussando troppo in fretta",
    righe: [
      "Il server accetta un certo numero di richieste al minuto da uno stesso indirizzo, e per un momento le hai finite.",
      "<b>Non è successo niente di grave</b>: non hai perso niente e non sei stato bloccato. Aspetta un minuto e riprova."
    ]
  }),
  503: ({ fino }) => pagina({
    codice: 503, occhiello: "Manutenzione", titolo: "Il server è fermo per lavori",
    righe: [
      "Classifica, account e salvataggi in cloud sono momentaneamente chiusi." +
        (fino ? " Dovrebbero tornare " + esc(fino) + "." : ""),
      "<b>La partita non c'entra e non si ferma.</b> Il gioco si salva nel tuo dispositivo: puoi giocare come sempre, e quando il server torna quello che hai fatto si riallinea da sé."
    ]
  }),
  500: () => pagina({
    codice: 500, occhiello: "Errore del server", titolo: "Qualcosa si è rotto qui dentro",
    righe: [
      "Non è colpa di quello che hai chiesto: è il server che non è riuscito a rispondere. L'errore è finito nei nostri log con tutto quello che serve per capirlo.",
      "<b>I tuoi dati non sono stati toccati.</b> Riprova fra poco."
    ]
  })
};

/* ==================== RISPONDERE ====================
   Un posto solo da cui escono tutte le risposte: così il codice HTTP, il
   `cache-control` e la lunghezza sono sempre giusti, e non c'è modo di
   scordarsene uno. */
function json(res, codice, corpoRisposta){
  const testo = JSON.stringify(corpoRisposta);
  res.writeHead(codice, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(testo),
    "cache-control": "no-store"
  });
  res.end(testo);
}
function html(res, codice, testo){
  res.writeHead(codice, {
    "content-type": "text/html; charset=utf-8",
    "content-length": Buffer.byteLength(testo),
    "cache-control": "no-store"
  });
  res.end(testo);
}
/* La risposta di errore: stesso codice e stesso `errore` per tutti, vestito
   diverso a seconda di chi legge. */
function male(req, res, codice, errore, extra){
  if(res.writableEnded) return;
  if(vuoleHtml(req)){
    /* alla pagina si passa l'intero `extra`: prima le si davano due argomenti
       posizionali e la 503 riceveva `dove` al posto di `fino`, quindi «si
       torna verso le 22» non lo diceva mai a nessuno. */
    const fai = PAGINE[codice] || PAGINE[500];
    return html(res, codice, fai(extra || {}));
  }
  return json(res, codice, Object.assign({ errore }, extra && extra.pubblico ? extra.pubblico : {}));
}

/* ==================== LA CATENA ====================
   Uno strato è `(req, res, ctx, avanti)`. Chi risponde non chiama `avanti` e
   il giro finisce lì; chi non c'entra chiama `avanti` e passa la mano. Chi
   scoppia lo raccoglie `catena()`, che è l'ultimo strato di tutti — così un
   errore in mezzo non lascia mai una richiesta appesa senza risposta.

   Trenta righe invece di una libreria: il giro delle richieste di questo
   server è tutto qui, e si legge in un colpo solo. */
function catena(...strati){
  return async (req, res) => {
    /* il taccuino della richiesta: uno solo, creato qui. Se lo si creasse
       dentro ad `avanti()` ogni strato ne riceverebbe uno suo, e quello che
       scrive `ctx.url` lo scriverebbe su una copia che nessuno legge. */
    const ctx = {};
    let i = 0;
    const avanti = async () => {
      const strato = strati[i++];
      if(!strato) return;
      await strato(req, res, ctx, avanti);
    };
    try{
      await avanti();
      /* nessuno strato ha risposto: la rotta non esiste */
      if(!res.writableEnded && !res.headersSent){
        male(req, res, 404, "rotta-sconosciuta", { dove: req.url });
      }
    }catch(e){
      if(res.headersSent || res.writableEnded) return;
      /* «suo» vuol dire colpa di chi chiama (corpo illeggibile, JSON storto):
         quello è un 400 e il messaggio si può dire; tutto il resto è un 500 e
         il dettaglio resta nei log, non in faccia a chi ha chiamato. */
      const suo = e && /json|corpo/i.test(String(e.message || ""));
      if(!suo) console.error("[errore] " + (e && e.stack || e));
      male(req, res, suo ? 400 : 500, suo ? e.message : "errore-del-server");
    }
  };
}

/* ==================== GLI STRATI ==================== */

/* CORS: le intestazioni su ogni risposta, e il preflight che finisce qui. */
function cors(origini){
  return (req, res, ctx, avanti) => {
    const origine = req.headers.origin || "";
    const permessa = origini === "*" ? "*"
      : (origini.split(",").map(s => s.trim()).indexOf(origine) >= 0 ? origine : "");
    if(permessa) res.setHeader("access-control-allow-origin", permessa);
    res.setHeader("vary", "origin");
    if(req.method === "OPTIONS"){
      res.writeHead(204, {
        "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
        "access-control-allow-headers": "content-type, x-chiave, x-sessione, x-admin",
        "access-control-max-age": "86400"
      });
      return res.end();
    }
    return avanti();
  };
}

/* Manutenzione: si accende con ADF_MANUTENZIONE=1 e spegne tutto tranne il
   battito. Sta prima del freno e prima delle rotte apposta — quando il server
   è chiuso per lavori non deve nemmeno toccare il database. */
function manutenzione(acceso, fino, salvi){
  const passa = new Set(salvi || ["/api/stato"]);
  return (req, res, ctx, avanti) => {
    if(!acceso() || passa.has(String(req.url).split("?")[0])) return avanti();
    res.setHeader("retry-after", "600");
    return male(req, res, 503, "in-manutenzione", { fino, pubblico: fino ? { fino } : null });
  };
}

/* Il freno delle troppe richieste. La memoria di chi ha bussato la tiene chi
   lo monta: qui c'è solo la decisione. */
function freno(troppe, indirizzo){
  return (req, res, ctx, avanti) => {
    if(!troppe(indirizzo(req))) return avanti();
    res.setHeader("retry-after", "60");
    return male(req, res, 429, "troppe-richieste");
  };
}

/* L'URL: se non si legge, la richiesta finisce qui. Quello buono resta in
   `ctx.url`, così le rotte non lo rifanno. */
function indirizzoValido(){
  return (req, res, ctx, avanti) => {
    try{
      ctx.url = new URL(req.url, "http://" + (req.headers.host || "localhost"));
    }catch(e){
      return male(req, res, 400, "url-non-valido");
    }
    return avanti();
  };
}

module.exports = {
  vuoleHtml, pagina, PAGINE, json, html, male, catena,
  cors, manutenzione, freno, indirizzoValido
};
