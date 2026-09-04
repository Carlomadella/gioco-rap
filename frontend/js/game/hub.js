/* La plancia: la schermata da cui si gioca.

   La mappa è la foto del concept (media/photo/pagina di gioco/mappa_citta.jpg): i luoghi con le
   loro targhette e i loro tasti «Entra» stanno dentro all'immagine, e sopra ci
   vanno solo le zone da toccare, in percentuale, così restano incollate anche
   quando la plancia si rimpicciolisce.

   Tutto il resto è vivo e legge la partita: la fascia in alto, il profilo con
   le sue quattro viste, gli eventi di oggi (che sono le azioni vere della
   settimana) e il telefono. Niente di quello che si vede è finto: se un numero
   nel gioco non c'è, qui non compare. */
"use strict";

/* ================= ICONE ================= */
/* contenuto grezzo di un <svg viewBox="0 0 24 24">: il colore arriva da fuori */
const HIC = {
  energia:'<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>',
  soldi:'<path fill-rule="evenodd" d="M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm9 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>',
  hype:'<path d="M12.6 2c.5 3.2-1.2 4.4-2.4 5.8C8.7 9.4 7.5 10.9 7.5 13a4.5 4.5 0 0 0 9 0c0-2-.9-3.6-2.1-5 .2 1.2-.3 2-1 2.4.5-3.3-.8-6.6-1.8-8.4z"/>',
  fama:'<path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z"/>',
  gente:'<path d="M9 11.4a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8zM2 19.4c0-3.5 3.1-5.6 7-5.6s7 2.1 7 5.6zm14.4-8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6zm.2 2.2c3 .2 5.4 1.9 5.4 4.6v1.2h-3.7c.1-2.6-.6-4.4-1.7-5.8z"/>',
  cuore:'<path d="M12 21s-8-4.7-8-10.2A4.8 4.8 0 0 1 12 7.4a4.8 4.8 0 0 1 8 3.4C20 16.3 12 21 12 21z"/>',
  testa:'<path d="M12 2a7 7 0 0 1 7 7c0 2.2-1 3.6-1.8 4.7-.6.9-1.2 1.6-1.2 2.6V17H8v-.7c0-1-.6-1.7-1.2-2.6C6 12.6 5 11.2 5 9a7 7 0 0 1 7-7zM9 19h6v1.2c0 .5-.4.8-.9.8h-4.2c-.5 0-.9-.3-.9-.8z"/>',
  luna:'<path d="M20.7 14.6A8.6 8.6 0 0 1 9.4 3.3a8.6 8.6 0 1 0 11.3 11.3z"/>',
  matita:'<path d="M3 17.2 16.4 3.8l3.8 3.8L6.8 21H3zM18 2.2l3.8 3.8-1.4 1.4-3.8-3.8z"/>',
  mic:'<path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11h2a5 5 0 0 0 10 0h2a7 7 0 0 1-6 6.9V21h-2v-3.1A7 7 0 0 1 5 11z"/>',
  cursori:'<path d="M4 4h2v6H4zm0 10h2v6H4zM2 10h6v4H2zm9-6h2v10h-2zm-2 10h6v4H9zm2 4h2v2h-2zM18 4h2v3h-2zm-2 3h6v4h-6zm2 4h2v9h-2z"/>',
  manopole:'<path d="M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm0 2.4A5.6 5.6 0 1 0 12 17.6 5.6 5.6 0 0 0 12 6.4zM11 8h2v5h-2z"/>',
  faccia:'<path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm-3.4 7a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6.8 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM7 14.4c1.2 2 3 3 5 3s3.8-1 5-3z"/>',
  persona:'<path d="M12 12.4a4.7 4.7 0 1 0 0-9.4 4.7 4.7 0 0 0 0 9.4zM3.5 21c0-4.3 3.9-6.6 8.5-6.6s8.5 2.3 8.5 6.6z"/>',
  maglietta:'<path d="M9 3h6a3 3 0 0 0 6 0l1.6 4.6-3.6 1.8V21H5V9.4L1.4 7.6 3 3a3 3 0 0 0 6 0z"/>',
  scudo:'<path d="M12 2.4 20 5v6.4c0 4.6-3.3 8.6-8 10.2-4.7-1.6-8-5.6-8-10.2V5zm-1 6v3H8v2h3v3h2v-3h3v-2h-3v-3z"/>',
  chat:'<path d="M4 3.5h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9.6L4 21z"/>',
  mirino:'<path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 2.4a7.6 7.6 0 1 0 0 15.2 7.6 7.6 0 0 0 0-15.2zm0 3.2a4.4 4.4 0 1 1 0 8.8 4.4 4.4 0 0 1 0-8.8zm0 2.6a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z"/>',
  giornale:'<path d="M3 4h13v16H4a1 1 0 0 1-1-1zm2 2v4h9V6zm0 6v2h9v-2zm0 4v2h9v-2zM17 8h4v11a1 1 0 0 1-2 0V9h-2z"/>',
  zaino:'<path d="M9 3h6v2h1.5A4.5 4.5 0 0 1 21 9.5V21H3V9.5A4.5 4.5 0 0 1 7.5 5H9zm-2 8v3h10v-3zm3-6h4V4.6h-4z"/>',
  barre:'<path d="M4 20V10h4v10zm6 0V4h4v16zm6 0v-7h4v7z"/>',
  coppa:'<path d="M6 3h12v2h3v3a4 4 0 0 1-4 4h-.6A6 6 0 0 1 13 15.9V18h3v3H8v-3h3v-2.1A6 6 0 0 1 7.6 12H7a4 4 0 0 1-4-4V5h3zM5 7v1a2 2 0 0 0 2 2V7zm14 0h-2v3a2 2 0 0 0 2-2z"/>',
  agenda:'<path d="M7 2h2v3H7zm8 0h2v3h-2zM4 7h16v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2 4v2h3v-2zm5 0v2h3v-2zm5 0v2h2v-2zM6 15v2h3v-2zm5 0v2h3v-2z"/>',
  ingranaggio:'<path d="M12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2zM10.6 2h2.8l.4 2.6 2.2 1.3 2.4-1.1 1.4 2.4-1.9 1.8v2.6l1.9 1.8-1.4 2.4-2.4-1.1-2.2 1.3-.4 2.6h-2.8l-.4-2.6-2.2-1.3-2.4 1.1L4.2 17l1.9-1.8v-2.6L4.2 10.8l1.4-2.4 2.4 1.1 2.2-1.3z"/>',
  maschera:'<path d="M3.6 4h16.8v5.6c0 4.9-3.8 8.8-8.4 8.8S3.6 14.5 3.6 9.6zm4.2 4.4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm8.4 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM8 14.4c1.1 1.3 2.5 2 4 2s2.9-.7 4-2z"/>',
  corona:'<path d="M2 19h20l-1.6-11-5 3.6L12 4 8.6 11.6l-5-3.6z"/>',
  nota:'<path d="M20 3v11.4a3.3 3.3 0 1 1-2-3V7.7l-7 1.5v7.8a3.3 3.3 0 1 1-2-3V6.5z"/>',
  rischio:'<path d="M12 2 1.5 21h21zm-1 6h2v7h-2zm0 9h2v2h-2z"/>',
  dado:'<path d="M12 2 21 6.6v10.8L12 22 3 17.4V6.6zM5.8 7.5 12 10.7l6.2-3.2L12 4.3z"/>',
  duebolle:'<path d="M3 4h13v9H8.4L4 17V4zM21 9h-4v7l-3.2-2.6H10V9h2v2.4h5.6L19 13V11h2z"/>',
  manubrio:'<path d="M2 9a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm17 0a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2zM8 10h2v4H8zm6 0h2v4h-2zM9 11h6v2H9z"/>'
};
const hsvg = (n, cls) => '<svg class="' + (cls || "hicon") + '" viewBox="0 0 24 24" aria-hidden="true">' + HIC[n] + '</svg>';
const spoglia = t => String(t).replace(/<[^>]*>/g, "");

/* ================= I LUOGHI ================= */
/* Le targhette sono dentro alla foto: qui c'è solo dove si tocca, in
   percentuale dell'immagine (1536×600 — punto 6: il ritaglio della mappa
   definitiva, frontend/concept/mappa_definitiva.png,
   senza fascia in alto, profilo, player e slider dell'ora, che sono già
   disegnati veri altrove), e cosa succede quando si tocca.
   Gli id non si toccano: orari.js, eventi-tempo.js, spostamenti.js e
   trasferte.js li usano per sapere orari, eventi ambientali e distanze. */
const HUB_LUOGHI = [
  /* punto 12: lo studio non è più una scorciatoia alla linguetta della
     settimana — è una stanza sua, con dentro le quattro fasi di un pezzo e la
     gente che ci lavora (js/game/studio.js). Punto 10: è sempre aperto. */
  {id:"studio", n:"Studio", x:19.50, y:56.00, w:10.50, h:12.50,
   vai:() => apriStudio("beat")},
  /* punto 59/61: era un cartello chiuso («Club & discoteche», ancora dentro
     alla foto — cambia solo quando cambia la mappa, punto 45); qui sotto
     adesso c'è un lavoro vero, part time. */
  {id:"pizzeria", n:"Pizzeria", x:49.00, y:68.00, w:12.50, h:17.00,
   vai:() => schedaLavoro("lavapiatti", "Pizzeria")},
  /* punto 48: non più un cartello chiuso — è dove si va a fare l'open mic,
     che esisteva già come azione ma non aveva un posto sulla mappa. Se non
     hai ancora un pezzo fuori il palco non c'è, ma lo dice, non fa finta di
     niente. Nella mappa definitiva il cartello dice «Live Club», il posto
     resta lo stesso di sempre (id "concerti"). */
  /* «Via il quaderno»: qui adesso si sceglie, come a Casa e in Palestra. Il
     freestyle sulla mappa c'era già, ma solo come evento della sera alle 21:00
     («Freestyle al bar centrale»): se passavi di lì a un'altra ora non
     esisteva. Il palco è il posto dove si sta davanti alla gente: ci stanno
     tutte e due. */
  {id:"concerti", n:"Live Club", x:33.00, y:20.00, w:14.00, h:13.50,
   vai:() => {
     const palco = hubPronta("live");
     showEvent({k:"Live Club", t:"Che serata fai?",
       d:"Il palco vero vuole un pezzo pubblicato. La piazza no: lì c’è solo il beat e la gente che passa.",
       annulla(){},
       opts:[
         {n:"Serata open mic", d:palco.ok ? "Il palco, con i tuoi pezzi" : "Non ancora: " + palco.perche,
          run(){ if(palco.ok) hubAzione("live");
                 else hubChiuso({n:"Live Club", chiuso:"Non ancora: " + palco.perche +
                   ". Il palco vero aspetta un pezzo pubblicato."});
                 return null; }},
         {n:"Freestyle in piazza", d:"Solo il beat e la gente che passa",
          run(){ hubAzione("free"); return null; }}
       ]});
   }},
  /* il beat maker non è un listino: è la sala dove si conosce la gente */
  {id:"beat", n:"La Sala", x:49.50, y:20.00, w:11.00, h:13.50,
   vai:() => apriPosto()},
  /* Beat Maker non è più un luogo sulla mappa: i beatmaker si conoscono
     alla Sala e si lavora con loro nello Studio. */
  /* punto 60: si chiamava «Vita quotidiana» — la palestra è uscita da qui
     ed è diventata un posto suo (punto 61), resta stacca la spina e i conti */
  {id:"vita", n:"Casa", x:16.50, y:67.00, w:14.50, h:16.50,
   vai:() => showEvent({k:"Casa", t:"Stacca la spina o guarda i conti",
     d:"La settimana non è solo musica. Ogni tanto la testa va spenta, e i conti vanno guardati.",
     annulla(){},
     opts:[
       {n:"Stacca la spina", d:"Una sera senza pensare a niente",
        run(){ hubAzione("stacca"); return null; }},
       {n:"Guarda cosa ti costa vivere", d:"Casa, look, uscite: le spese fisse",
        run(){ apriPannello("Le spese fisse", "lifestyle",
          "Quanto ti costa vivere come vivi, e cosa ti dà in cambio."); return null; }}
     ]})},
  /* punto 21/57: la Strada, ricostruita da claude/carriera-criminale.md
     (js/game/strada-crimine.js) — non era mai stata scritta, solo pensata */
  {id:"crimin", n:"Attività criminali", x:0.50, y:64.00, w:13.00, h:16.00,
   vai:() => (G.strada && G.strada.arresto && typeof apriCarcere === "function")
  ? apriCarcere()
  : apriStrada()},
  /* punto 59: il secondo lavoro, full time — era «Sponsor & brand» */
  {id:"fabbrica", n:"Fabbrica", x:79.00, y:28.00, w:20.00, h:22.00,
   vai:() => schedaLavoro("operaio", "Fabbrica")},
  /* punto 61: la palestra esce dal sottomenu di Casa e diventa un posto
     suo — era «Business», un altro cartello chiuso senza niente dietro.
     Punto 9: non è più un pulsante solo — si sceglie cosa fare, come a Casa. */
  {id:"palestra", n:"Palestra", x:71.50, y:75.00, w:17.50, h:17.00,
   vai:() => showEvent({k:"Palestra", t:"Che allenamento fai?",
     d:"Il fisico che si vede sotto le luci, o la testa che si svuota prima di scrivere: scegli tu.",
     annulla(){},
     opts:[
       {n:"Pesi", d:"Più energia, 18 € — benessere e presenza su.",
        run(){ avviaAzioneDiretta("palestra_pesi"); return null; }},
       {n:"Cardio leggero", d:"Poca energia, gratis — lucidità e benessere su.",
        run(){ avviaAzioneDiretta("palestra_cardio"); return null; }}
     ]})},
  /* punto 48: idem — l'attrezzatura da studio è già nel catalogo, la vetrina
     non deve stare spenta se quello che promette esiste già */
  /* punto 48 + «via il quaderno»: qui dentro è finito tutto quello che si
     compra — l'attrezzatura, il banco dei beat e i vestiti. Era il Catalogo,
     che come linguetta a sé non aveva senso: un negozio è un posto. */
  {id:"shop", n:"Shop", x:43.50, y:30.00, w:15.00, h:11.50,
   vai:() => apriPannello("Shop", "shop",
     "Attrezzatura, beat da comprare e roba da mettersi addosso.")},
  /* punto 6: il centro per l'impiego, arrivato con la mappa definitiva.
     Apre tutti i lavori (JOBS), non solo i due che hanno già un edificio —
     rispetta i requisiti, non finge che siano tutti presi al volo.
     Il campetto (che stava qui) è uscito col punto 8: non lo vogliamo un
     posto giocabile. Il cartello nella foto resta — punto 45, le targhette
     sono dentro al pixel — ma senza una zona da toccare sopra non fa più
     niente, come «Periferia» o «Centro». */
  {id:"impiego", n:"Centro per l'impiego", x:60.00, y:21.50, w:18.50, h:18.50,
   vai:() => schedaImpiego()}
];

/* ================= GLI EVENTI DI OGGI ================= */
/* Non sono cartelli finti: ognuno fa partire un'azione vera della settimana,
   con il suo costo e i suoi rischi. Il colpo rapido è l'unico che ancora non
   c'è, e lo dice invece di far finta. */
/* Mappa nuova: nomi dei luoghi come UI, non testo raster nell'immagine. */
const HUB_PIN_COLOR = Object.freeze({
  studio:"#A855F7",
  pizzeria:"#FF5A36",
  concerti:"#EC4899",
  beat:"#A855F7",
  vita:"#FB923C",
  crimin:"#EF4444",
  fabbrica:"#CBD5E1",
  palestra:"#38BDF8",
  shop:"#0EA5E9",
  impiego:"#22D3EE"
});

/* Quartieri UI. Le strade principali sono fasce neutre e fanno da confine naturale. */
const HUB_DISTRICT = Object.freeze({
  studio:"periferia",
  vita:"periferia",
  crimin:"periferia",
  concerti:"centro",
  beat:"centro",
  shop:"centro",
  impiego:"centro",
  fabbrica:"industriale",
  pizzeria:"industriale",
  palestra:"industriale"
});

/* V5-strade approvata: nessuna sovrapposizione tra i tre quartieri. */
const HUB_DISTRICT_POLY = Object.freeze({
  periferia:[[0,0],[18,0],[18,23],[20,26],[25,30],[30,34],[35,39],[38,45],[39,52],[38,58],[36,65],[36,72],[38,80],[44,89],[50,100],[0,100]],
  centro:[[22,0],[100,0],[100,23],[88,28],[82,31],[76,36],[70,40],[64,45],[58,49],[52,52],[48,55],[46,50],[43,40],[38,33],[33,28],[28,24],[24,21]],
  industriale:[[89,30],[100,30],[100,100],[59,100],[54,96],[48,89],[44,82],[42,75],[42,68],[45,61],[52,55],[61,51],[70,47],[79,40],[86,32]]
});

let HUB_QUARTIERE = "";

function hubDentroPoligono(x, y, poly){
  let dentro = false;
  for(let i=0, j=poly.length-1; i<poly.length; j=i++){
    const xi=poly[i][0], yi=poly[i][1];
    const xj=poly[j][0], yj=poly[j][1];
    const incrocia=((yi>y)!==(yj>y)) &&
      (x < (xj-xi)*(y-yi)/((yj-yi)||0.000001)+xi);
    if(incrocia) dentro=!dentro;
  }
  return dentro;
}

function hubQuartiereDaPunto(x, y){
  for(const id of ["periferia","centro","industriale"]){
    if(hubDentroPoligono(x,y,HUB_DISTRICT_POLY[id])) return id;
  }
  return "";
}

function hubSetQuartiere(id){
  HUB_QUARTIERE = id || "";
  const foto = document.getElementById("hb-foto");
  if(foto){
    if(HUB_QUARTIERE) foto.dataset.district = HUB_QUARTIERE;
    else delete foto.dataset.district;
  }
  document.querySelectorAll("#hb-pins .pspot[data-l]").forEach(btn => {
    const q = HUB_DISTRICT[btn.dataset.l] || "";
    btn.classList.toggle("district-active", !!HUB_QUARTIERE && q === HUB_QUARTIERE);
  });
  document.querySelectorAll("#hb-districts .pdistrict").forEach(poly => {
    poly.classList.toggle("active", !!HUB_QUARTIERE && poly.dataset.district === HUB_QUARTIERE);
  });
}

function hubPuntoPercentuale(ev){
  const foto = document.getElementById("hb-foto");
  if(!foto) return null;
  const r=foto.getBoundingClientRect();
  if(!r.width || !r.height) return null;
  return {x:(ev.clientX-r.left)/r.width*100,y:(ev.clientY-r.top)/r.height*100};
}

function hubInitQuartieri(){
  const foto=document.getElementById("hb-foto");
  if(!foto || foto.dataset.districtBound==="1") return;
  foto.dataset.districtBound="1";
  foto.addEventListener("pointermove", ev => {
    if(ev.pointerType && ev.pointerType !== "mouse") return;
    const p=hubPuntoPercentuale(ev);
    hubSetQuartiere(p ? hubQuartiereDaPunto(p.x,p.y) : "");
  });
  foto.addEventListener("pointerleave", ev => {
    if(!ev.pointerType || ev.pointerType === "mouse") hubSetQuartiere("");
  });
  foto.addEventListener("click", ev => {
    if(ev.target.closest(".pspot,.pfrec")) return;
    const p=hubPuntoPercentuale(ev);
    if(!p) return;
    const q=hubQuartiereDaPunto(p.x,p.y);
    if(q) hubSetQuartiere(HUB_QUARTIERE===q ? "" : q);
    else hubSetQuartiere("");
  });
}
const HUB_EVENTI = [
  {id:"free", ic:"mic", k:"#A855F7", n:"Freestyle al bar centrale",
   d:"Freestyle contest aperto a tutti.", ora:"21:00",
   righe:[["hype", "Hype in piazza"], ["gente", "Gente nuova"]]},
  {id:"sala", ic:"nota", k:"#38BDF8", n:"Producer session",
   d:"Passa dalla Sala: stasera c'è chi fa beat.", ora:"22:30", posto:true,
   righe:[["gente", "Gente da conoscere"], ["cursori", "Beat da farsi sentire"]]},
  {id:"stacca", ic:"corona", k:"#FACC15", n:"Piccolo party",
   d:"Party in appartamento.", ora:"00:00",
   righe:[["cuore", "Ti rimette su"], ["dado", "Evento casuale"]]},
  {id:"colpo", ic:"maschera", k:"#EF4444", n:"Colpo rapido",
   d:"Lavoro illegale. Rischio vero.", ora:"01:30", strada:true,
   righe:[["soldi", "Soldi veloci"], ["rischio", "Rischio vero"]]}
];

/* Le app del telefono (HUB_APP, HUB_APP_VECCHIO) e il loro disegno stanno in
   js/game/telefono.js: qui restano solo i dati che servono a tutta la
   plancia, non solo al telefono. */

/* ================= NOTIZIE E SUGGERIMENTI ================= */
const HUB_NOTIZIE = [
  {ic:"hype", k:"#FB923C", t:"Nuovo freestyle contest in città!"},
  {ic:"mic", k:"#C084FC", t:"Al bar sulla statale cercano gente per le serate."},
  {ic:"maschera", k:"#F87171", t:"Controlli della polizia nella zona industriale."},
  {ic:"zaino", k:"#F59E0B", t:"Nuova opportunità di lavoro disponibile."}
];
const HUB_SUGG = [
  "Costruisci la tua rete di contatti. Ti aprirà le porte giuste.",
  "Un pezzo forte vale più di tre pezzi buttati fuori in fretta.",
  "L'energia si ricarica la notte: chiudi la giornata quando non hai più mosse.",
  "La lucidità si consuma. Se scende troppo, quello che scrivi non regge.",
  "Il beat giusto è metà del pezzo. Ascoltali prima di comprare."
];

/* ================= APERTURE ================= */
/* Il luogo non rifà quello che sa già fare la partita: la apre sulla sezione
   giusta. Così la plancia resta la porta, e il gioco resta dov'è. */
/* IL PANNELLO DI UN LUOGO.
   Uno solo, riusato: Casa ci mette le spese fisse, lo Shop il banco e la
   vetrina. Il contenuto non lo disegna lui — se lo prende in prestito dal
   magazzino (`#g-magazzino`), dove `renderGioco()` continua a scrivere come ha
   sempre fatto, e alla chiusura glielo restituisce. Così non è stata riscritta
   una riga di quello che disegna le spese, il banco dei beat o la vetrina. */
function prendiDalMagazzino(gruppo, dove){
  document.querySelectorAll('#g-magazzino [data-mag="' + gruppo + '"]')
    .forEach(n => dove.appendChild(n));
}
function rimettiInMagazzino(dove){
  const mag = $("g-magazzino");
  if(!mag || !dove) return;
  Array.from(dove.children).forEach(n => { if(n.dataset.mag) mag.appendChild(n); });
  dove.innerHTML = "";
}

function apriPannello(titolo, gruppo, dove){
  renderGioco();                       /* prima si riempie, poi si mostra */
  const corpo = $("pn-corpo");
  rimettiInMagazzino(corpo);
  $("pn-tit").textContent = titolo;
  $("pn-dove").textContent = dove || "";
  $("pn-dove").hidden = !dove;
  prendiDalMagazzino(gruppo, corpo);
  $("pannello").classList.add("on");
}
function chiudiPannello(){
  $("pannello").classList.remove("on");
  rimettiInMagazzino($("pn-corpo"));
  renderHub();
}
window.apriPannello = apriPannello;
window.chiudiPannello = chiudiPannello;

function hubPresto(titolo, testo){
  showEvent({k:"Non ancora", t:titolo, d:testo, annulla(){},
    opts:[{n:"Va bene", d:"Torni alla mappa", run(){ return null; }}]});
}

function hubChiuso(l){
  showEvent({k:"Chiuso", t:l.n, d:l.chiuso, annulla(){},
    opts:[{n:"Ho capito", d:"Torni alla mappa", run(){ return null; }}]});
}

/* punto 59: due posti di lavoro veri sulla mappa, non un cartello con su
   scritto «arriva a Milano». Si assume da solo chi ci va, se non lavora
   già altrove — un posto alla volta, come è sempre stato G.job. */
function assumitiCome(jobId){
  const def = JOBS.find(j => j.id === jobId);
  if(!def) return;
  if(!G.job || G.job.id !== jobId){
    if(G.job){
      hubChiuso({n:def.n, chiuso:"Lavori già come " + G.job.n.toLowerCase() +
        ". Un posto alla volta — lascialo o aspetta di essere licenziato."});
      return;
    }
    G.job = {id:def.id, n:def.n, pay:def.pay, e:def.e, missed:0};
    pushLog("Hai preso il posto da " + def.n.toLowerCase() + ": " + def.pay + " € a turno.", "good");
  }
  hubAzione("turno");
}
function schedaLavoro(jobId, luogo){
  const def = JOBS.find(j => j.id === jobId);
  const mio = G.job && G.job.id === jobId;
  showEvent({k:luogo, t:def.n,
    d:mio ? "Sei già assunto qui." : def.d,
    annulla(){},
    opts:[
      {n:mio ? "Fai il turno" : "Fatti assumere e lavora", d:def.pay + " € · " + def.e + " energia",
       run(){ assumitiCome(jobId); return null; }},
      {n:"Lascia stare", d:"Torni alla mappa", run(){ return null; }}
    ]});
}

/* punto 6: il centro per l'impiego — l'unico luogo che apre tutti i lavori
   di JOBS (actions.js), non solo Pizzeria e Fabbrica che hanno un edificio
   loro. Chi non ha i requisiti lo vede, ma non può prenderlo: niente finto. */
function schedaImpiego(){
  const righe = JOBS.map(j => {
    const ok = !j.req || j.req(G);
    return {n:j.n, d:ok ? j.pay + " € · " + j.e + " energia" : "Serve di più: non ancora",
      run(){ if(ok) assumitiCome(j.id); return null; }};
  });
  righe.push({n:"Lascia stare", d:"Torni alla mappa", run(){ return null; }});
  showEvent({k:"Centro per l'impiego", t:"Tutti i lavori in città",
    d:G.job ? "Lavori già come " + G.job.n.toLowerCase() +
      ". Un posto alla volta — lascialo o aspetta di essere licenziato."
      : "Guarda cosa c'è, e fatti assumere.",
    annulla(){}, opts:righe});
}

function hubNotizie(){
  showEvent({k:"Notizie della settimana", t:"Cosa gira in paese",
    d:HUB_NOTIZIE.map(n => "• " + n.t).join("<br>"), annulla(){},
    opts:[{n:"Chiudi", d:"Torni alla mappa", run(){ return null; }}]});
}

/* L'azione vera dietro a un evento di oggi: si apre nella partita, con il suo
   costo, la sua conferma e le sue scene. Qui si guarda solo se si può fare. */
/* Far partire una mossa. La griglia delle mosse non è più una schermata — sta
   nel magazzino, invisibile — ma è sempre lei la macchina: si ridisegna e si
   preme la card, che porta con sé la conferma, il costo e le scene di sempre. */
function hubAzione(id){
  renderGioco();
  const t = document.querySelector('.tile[data-id="' + id + '"]');
  if(t) t.click();
}
function hubDetenuto(){
  return !!(G.strada && G.strada.arresto);
}
function hubPronta(id){
  if(hubDetenuto()) return {ok:false, perche:"Sei in carcere"};
  const a = ACTIONS.find(x => x.id === id);
  if(!a) return {ok:false, perche:"Non c'è"};
  if(a.avail && !a.avail()) return {ok:false, perche:"Non adesso"};
  const e = a.dyn ? a.dyn() : a.e;
  const c = a.money ? a.money() : 0;
  const miss = a.need ? a.need() : null;
  if(miss) return {ok:false, perche:"Serve " + miss};
  if(c && G.money < c) return {ok:false, perche:fmt(c) + " €"};
  if(G.energy < e) return {ok:false, perche:"Serve energia"};
  return {ok:true, perche:""};
}

/* ================= PEZZI DI DISEGNO ================= */
let HUB_VISTA = "profilo";     /* quale delle quattro linguette di sinistra */
let HUB_QUI = -1;              /* il luogo illuminato dal giro guidato */

function statCella(k, ic, lab, val, barra){
  return '<div class="ps" style="--k:' + k + '">' + hsvg(ic) +
    '<div><span class="pk">' + lab + '</span><div class="pv">' + val + '</div>' +
    (barra == null ? '' : '<span class="pbar"><i style="width:' + clamp(barra, 0, 100) + '%"></i></span>') +
    '</div></div>';
}

function rigaStat(ic, k, n, v, barra){
  return '<div class="prow" style="--k:' + k + '">' + hsvg(ic) +
    '<span class="n">' + n + '</span>' +
    (barra == null ? '' : '<span class="mini"><i style="width:' + clamp(barra, 0, 100) + '%"></i></span>') +
    '<span class="v">' + v + '</span></div>';
}

function rigaSkill(ic, n, v, titolo){
  return '<div class="pskrow"' + (titolo ? ' title="' + titolo + '"' : '') + '>' + hsvg(ic) +
    '<span class="n">' + n + '</span><span class="b"><i style="width:' +
    clamp(v / 88 * 100, 0, 100) + '%"></i></span><span class="v">' + Math.round(v) + '</span></div>';
}

/* le quattro abilità del rapper: quello che fa lui, non il mestiere di
   qualcun altro. Produzione e mixing non sono più abilità tue — le fa il
   beatmaker e il fonico alla Sala (punto 46); l'attrezzatura e il mestiere
   al mixer restano nel gioco (gearBonus, mixGain) come qualità del pezzo,
   non come una barra che ti appartiene. */
function skillRighe(){
  return rigaSkill("mic", "Rap", G.skills.flow) +
    rigaSkill("matita", "Scrittura", G.skills.scrittura) +
    rigaSkill("faccia", "Carisma", G.skills.presenza) +
    rigaSkill("gente", "Networking", G.skills.rete);
}

/* la fan base, detta come la direbbe uno del giro */
function fanBase(){
  const f = G.fans;
  return f < 500 ? "Locale" : f < 5000 ? "Provinciale" : f < 50000 ? "Regionale"
    : f < 500000 ? "Nazionale" : "Internazionale";
}

/* l'ora della sera: la giornata si consuma con l'energia */
function hubOra(){
  const usate = clamp(Math.round((1 - G.energy / G.maxEnergy) * 8), 0, 8);
  const h = (18 + usate * 3) % 24;
  return String(h).padStart(2, "0") + (usate % 2 ? ":30" : ":00");
}

/* ---- la colonna di sinistra, quattro viste ---- */
function vistaProfilo(L, ph){
  const art = window.ARTIST || {};
  return '<span class="ptit">Il tuo profilo</span>' +
    '<div class="pface">' +
      '<div class="pport">' + (window.ARTIST_PORTRAIT ? window.ARTIST_PORTRAIT() : '') + '</div>' +
      '<div class="pwho">' +
        '<div class="pnome">' + ((art.name || "senza nome").toUpperCase()) + hsvg("matita") + '</div>' +
        '<div class="plv">Lv. ' + L.lvl + '</div>' +
        '<div class="pgrado">' + ph.n + '</div>' +
        '<div class="pxp"><span>XP</span><b>' + fmt(L.into) + ' / ' + fmt(L.need) + '</b></div>' +
        '<span class="pbar2"><i style="width:' + clamp(L.into / L.need * 100, 0, 100) + '%"></i></span>' +
      '</div>' +
    '</div>' +
    '<div class="prighe">' +
      /* punto 63: soldi/energia/fama/hype/network/benessere stanno già nella
         fascia in alto — qui restava solo lucidità, che lì non c'è. Al posto
         dei doppioni: il lifestyle e quanto ti sei fatto notare per strada */
      rigaStat("testa", "#A855F7", "Lucidità", Math.round(luc()), luc()) +
      rigaStat("zaino", "#F59E0B", "Lifestyle", lifestyleRiepilogo().alzati + " su " + LIFE.length + " curati", lifestyleRiepilogo().pct) +
      rigaStat("rischio", "#EF4444", "Livello sospetto", Math.round((G.strada && G.strada.heat) || 0), (G.strada && G.strada.heat) || 0) +
    '</div>' +
    '<div class="psk"><span class="pk">Skill</span>' + skillRighe() + '</div>' +
    /* punto 7: «trasferisci tutte le info sulla mappa». Erano le ultime due
       che stavano solo nella vecchia schermata di gioco e in nessun altro
       posto — quanti pezzi hai fuori, e con chi hai firmato. Adesso stanno
       qui, dove sta il resto di chi sei, e la testata doppia può sparire. */
    '<div class="pdue">' +
      '<div><span class="pk">Stile musicale</span><div class="v">' +
        (typeof genre === "function" ? genre().n : "—") + '</div></div>' +
      '<div><span class="pk">Fan base</span><div class="v">' + fanBase() + '</div></div>' +
    '</div>' +
    '<div class="pdue">' +
      '<div><span class="pk">Pezzi fuori</span><div class="v">' +
        G.songs.filter(s => s.released).length + '</div></div>' +
      '<div><span class="pk">Contratto</span><div class="v">' +
        (G.contract ? G.contract.label : "indipendente") + '</div></div>' +
    '</div>' +
    '<div class="pnext"><div class="pnexthead"><span class="pk">Prossimo livello</span>' +
      hsvg("fama") + '</div>' +
      '<div class="t">' + fmt(L.need - L.into) + ' XP per il livello ' + (L.lvl + 1) + '</div>' +
      '<span class="pbar2"><i style="width:' + clamp(L.into / L.need * 100, 0, 100) + '%"></i></span>' +
    '</div>';
}

function vistaAbilita(){
  return '<span class="ptit">Le tue abilità</span>' +
    '<div class="psk" style="margin-top:14px">' + skillRighe() + '</div>' +
    '<div class="prighe" style="margin-top:18px">' +
      rigaStat("mic", "#A855F7", "Rap", "cresce registrando") +
      rigaStat("matita", "#C084FC", "Scrittura", "cresce al foglio") +
      rigaStat("faccia", "#FACC15", "Carisma", "cresce sul palco") +
      rigaStat("gente", "#60A5FA", "Networking", "cresce uscendo") +
    '</div>' +
    '<div class="pnext" style="margin-top:18px"><div class="pnexthead">' +
      '<span class="pk">Come si sale</span>' + hsvg("mirino") + '</div>' +
      '<div class="t">Le abilità non si comprano: crescono facendo la cosa. ' +
      'Ogni mossa della settimana ne alza una.</div></div>';
}

function vistaDisciplina(){
  const ph = PHASES[G.phase], nt = typeof nextTrial === "function" ? nextTrial() : null;
  return '<span class="ptit">Disciplina</span>' +
    '<div class="prighe" style="margin-top:14px">' +
      rigaStat("cuore", "#EF4444", "Benessere", Math.round(G.wellbeing), G.wellbeing) +
      rigaStat("testa", "#A855F7", "Lucidità", Math.round(luc()), luc()) +
      rigaStat("energia", "#FACC15", "Energia", G.energy + " / " + G.maxEnergy,
        G.energy / G.maxEnergy * 100) +
      rigaStat("agenda", "#60A5FA", "Settimane fatte",
        (typeof totalWeeks === "function" ? totalWeeks() : G.week)) +
      rigaStat("zaino", "#F59E0B", "Lavoro", G.job ? G.job.n : "nessuno") +
      rigaStat("soldi", "#4ADE80", "Spese fisse", fmt(weeklyCosts()) + " €") +
      rigaStat("manubrio", "#57C98B", "Palestra", palestraTesto()) +
    '</div>' +
    '<div class="pnext" style="margin-top:18px"><div class="pnexthead">' +
      '<span class="pk">La tua scalata</span>' + hsvg("coppa") + '</div>' +
      '<div class="t">' + ph.n + ' — ' + ph.d + '</div></div>' +
    '<div class="pnext" style="margin-top:10px"><div class="pnexthead">' +
      '<span class="pk">Prossimo passo</span>' + hsvg("mirino") + '</div>' +
      '<div class="t">' + (nt ? "<b>" + nt.t + "</b>. " + nt.hint
        : "Sei arrivato in cima. Adesso il difficile è restarci.") + '</div></div>';
}

/* ================= IL GRANDE DISEGNO ================= */
function renderHub(){
  const art = window.ARTIST || {};
  const L = livello();
  const ph = PHASES[G.phase];


  /* ---- fascia in alto ---- */
  $("hb-citta").textContent = (art.city || "").trim() || "Città di provincia";
  $("hb-fase").textContent = ph.n;
  $("hb-week").textContent = G.week + ", giorno " + (G.day || 1) + "/7";
  $("hb-anno").textContent = "Anno " + G.year;
  $("hb-ora").textContent = hubOra();
  $("hb-telora").textContent = hubOra();
  $("hb-stat").innerHTML =
    statCella("#FACC15", "energia", "Energia", G.energy + " / " + G.maxEnergy,
      G.energy / G.maxEnergy * 100) +
    statCella("#4ADE80", "soldi", "Soldi", fmt(G.money) + " €") +
    statCella("#FB923C", "hype", "Hype", Math.round(G.hype)) +
    statCella("#FBBF24", "fama", "Fama", short(G.fans)) +
    statCella("#60A5FA", "gente", "Network", Math.round(G.skills.rete)) +
    statCella("#EF4444", "cuore", "Benessere", Math.round(G.wellbeing), G.wellbeing);

  /* ---- colonna di sinistra ---- */
  $("hb-profilo").innerHTML =
    HUB_VISTA === "abilita" ? vistaAbilita() :
    HUB_VISTA === "disciplina" ? vistaDisciplina() : vistaProfilo(L, ph);

  $("hb-sxtab").innerHTML = [
    ["profilo", "Profilo", "persona"], ["abilita", "Abilità", "matita"],
    ["vestiti", "Vestiti", "maglietta"], ["disciplina", "Disciplina", "scudo"]
  ].map(([id, n, ic]) =>
    '<button class="ptab' + (HUB_VISTA === id ? " on" : "") + '" data-v="' + id + '">' +
    hsvg(ic) + '<span>' + n + '</span></button>').join("");

  /* ---- i luoghi sulla mappa ---- */
  $("hb-pins").innerHTML = HUB_LUOGHI.map((l, i) =>
    '<button class="pspot' + (l.chiuso ? " chiuso" : "") + (HUB_QUI === i ? " qui" : "") +
    '" data-l="' + l.id + '" data-district="' + (HUB_DISTRICT[l.id] || "") +
    '" style="--x:' + l.x + '%;--y:' + l.y + '%;--w:' + l.w + '%;--h:' + l.h +
    '%;--pk:' + (HUB_PIN_COLOR[l.id] || "#C084FC") + '" ' +
    'aria-label="' + l.n + (l.chiuso ? " — chiuso" : "") + '" title="' + l.n + '">' +
    '<span class="pspot-dot"></span><span class="pspot-tag"><i></i><b>' + l.n + '</b></span></button>').join("") +
    '<button class="pfrec" data-f="-1" aria-label="Luogo precedente" ' +
      'style="--x:34.82%;--y:93.5%;--w:5.06%;--h:4.28%"></button>' +
    '<button class="pfrec" data-f="1" aria-label="Luogo successivo" ' +
      'style="--x:56.02%;--y:93.5%;--w:5.06%;--h:4.28%"></button>';
  hubInitQuartieri();
  hubSetQuartiere(HUB_QUARTIERE);
  /* ---- gli eventi di oggi ---- */
  $("hb-eventi").innerHTML = HUB_EVENTI.map(e => {
    const st = hubDetenuto()
      ? {ok:false, perche:"Sei in carcere"}
      : ((e.presto || e.posto || e.strada) ? {ok:true, perche:""} : hubPronta(e.id));
    return '<button class="pev" data-e="' + e.id + '" style="--k:' + e.k + '"' +
      (st.ok ? '' : ' disabled') + '>' +
      '<span class="pevt">' + hsvg(e.ic) + e.n + '</span>' +
      '<span class="pevd">' + e.d + '</span>' +
      '<span class="pevl">' + e.righe.map(([ic, t]) =>
        '<span>' + hsvg(ic) + t + '</span>').join("") + '</span>' +
      '<span class="pevfoot"><span class="pevora">' + e.ora + '</span>' +
      '<span class="pevgo">' + (st.ok ? (e.id === "colpo" ? "Accetta" : "Partecipa") : st.perche) +
      '</span></span></button>';
  }).join("") +
    '<div class="pevpiu"><b>Più avanti…</b><span>Nuovi eventi arriveranno durante la settimana.</span></div>';

  /* ---- il telefono (js/game/telefono.js: iPhone da PC, vecchia colonna sotto) ---- */
  renderTelefono();

  /* ---- la riga di fondo ---- */
  $("hb-sugg").innerHTML = "Suggerimento: <b>" +
    HUB_SUGG[(G.week + G.year) % HUB_SUGG.length] + "</b>";
}

/* ================= COMANDI ================= */
const hubTap = () => { if(typeof SFX === "object" && SFX.tap) SFX.tap(); };

$("hb-pins").addEventListener("click", ev => {
  const f = ev.target.closest(".pfrec");
  if(f){
    /* «scorri per esplorare»: il giro guidato dei luoghi, uno alla volta */
    const n = HUB_LUOGHI.length;
    HUB_QUI = (HUB_QUI + (+f.dataset.f) + n) % n;
    hubTap(); renderHub();
    const q = document.querySelector(".pspot.qui");
    /* sul telefono la mappa è più larga dello schermo e si sposta col dito:
       il giro guidato deve portare in mezzo il luogo che sta illuminando,
       se no indica un cartello che è fuori dalla finestra */
    /* niente `behavior:"smooth"` a mano: provato, su questo contenitore non
       scorre affatto. Senza, va sempre — e il verso lo decide comunque il CSS,
       che con le animazioni spente (Impostazioni → Aspetto) è già `auto`. */
    if(q){ q.focus({preventScroll:true});
      q.scrollIntoView({block:"nearest", inline:"center"}); }
    return;
  }
  const b = ev.target.closest(".pspot"); if(!b) return;
  const l = HUB_LUOGHI.find(x => x.id === b.dataset.l); if(!l) return;
  hubTap();
  if(l.chiuso) hubChiuso(l); else l.vai();
});

$("hb-sxtab").addEventListener("click", ev => {
  const b = ev.target.closest(".ptab"); if(!b) return;
  hubTap();
  /* punto 7: la linguetta «Vestiti» è il guardaroba — solo equip, mai
     acquisto. I capi nuovi si comprano allo Shop → Abbigliamento, o
     arrivano da un evento. */
  if(b.dataset.v === "vestiti"){ apriArmadio(); return; }
  HUB_VISTA = b.dataset.v;
  renderHub();
});

$("hb-eventi").addEventListener("click", ev => {
  const b = ev.target.closest(".pev"); if(!b || b.disabled) return;
  const e = HUB_EVENTI.find(x => x.id === b.dataset.e); if(!e) return;
  if(hubDetenuto()){
    if(typeof apriCarcere === "function") apriCarcere();
    return;
  }
  hubTap();
  if(e.posto) apriPosto();
  else if(e.strada) apriStrada();
  else if(e.presto) hubPresto(e.n, "Sta arrivando.");
  else hubAzione(e.id);
});

$("hb-logo").onclick = () => GO("menu");

/* La via di ritorno da un pannello è chiuderlo: la mappa è sempre rimasta lì
   sotto, viva, quindi non c'è nessuna schermata da riaccendere — si ridisegna
   e basta, perché nel frattempo può essere cambiato tutto (soldi, energia,
   giorno). Si chiude anche con Esc, come gli altri pannelli. */
$("pn-x").onclick = () => chiudiPannello();
document.addEventListener("keydown", e => {
  if(e.key === "Escape" && $("pannello").classList.contains("on")) chiudiPannello();
});

window.HUB = { apri(){ GO("hub"); renderHub(); }, render: renderHub };
