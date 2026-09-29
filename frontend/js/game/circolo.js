/* IL CIRCOLO — la Sala e il Live Club diventati un posto solo (29/09/2026).

   «Un posto, due vite»: di pomeriggio è il retro dove si conosce la gente
   (la Sala di prima), la sera si accende il palco e il retro resta aperto.
   Sulla mappa sta dov'era la Sala (id "beat", hub.js); il cartello del Live
   Club non c'è più e chi dice ancora «concerti» finisce qui (orari.js,
   `PLACE_ALIAS`).

   La pagina è quella del riferimento
   `media/photo/schermate_luoghi/schermate_luoghi_con_elementi_HTML/il_circolo.png`,
   senza la barra di sotto (Mappa, Contatti…), che CARLO ha tolto: la foto
   del locale con i quattro cartelli, la colonna degli orari, e sotto i
   quattro riquadri — la gente, il palco, la serata di oggi, i momenti del
   live — sempre aperti. Vive dentro `#luogo` (luoghi-foto.js), così la
   fascia in alto, il menu di sistema, l'orologio e l'esito delle mosse sono
   quelli di Casa e della Palestra.

   Le tre cose che nascono solo dall'unione:
   1. il dopo-serata — sceso dal palco, per due ore di gioco una risposta
      buona nel dialogo vale un punto in più (`circoloDopoSerata`, letto da
      `poRispondi` in posto.js prima del tetto «già visto oggi»);
   2. la gente guarda — chi è collaboratore o più ed è in sala stasera vede
      com'è andata: +1 se è andata bene, −1 se è andata male, ma nessuno
      scende di gradino (`circoloGenteGuarda`);
   3. il feat nasce sul palco — «Proponi un feat» si accende solo la sera,
      quando il palco è acceso e lui è in sala.

   Niente economia nuova per la rete: le mosse con la gente sono quelle di
   posto.js, il live è la mossa `live` di actions.js. Due cose nuove sì, e
   stanno qui: l'open mic (il palco senza requisiti, che prima non c'era:
   la mossa `live` chiede un pezzo fuori) e la serata giocata a momenti —
   il punto «La serata del Live Club giocata a momenti» — che pesa sulla
   resa del live da 0,55 a 1,45 (`circoloResaSerata`). */
"use strict";

const CIRCOLO_NOME = "Il Circolo";
const CIRCOLO_FOTO = "media/photo/circolo/";

/* Le fasce del riferimento («Orari oggi»). `gente` è quanti ne trovi nel
   retro: di pomeriggio le tre facce di sempre, la sera la sala è piena.
   L'apertura del locale sta in orari.js (beat, 13:00–03:00), il palco del
   live in `ACTION_HOURS`: qui si dice solo com'è fatta la giornata dentro. */
const CIRCOLO_FASCE = [
  {id:"networking", da:"13:00", a:"19:00", n:"Networking", gente:3},
  {id:"soundcheck", da:"19:00", a:"21:00", n:"Soundcheck e arrivi", gente:4},
  {id:"serata",     da:"21:00", a:"00:00", n:"Open Mic e Live", gente:5, palco:true},
  {id:"aftershow",  da:"00:00", a:"03:00", n:"Aftershow", gente:4}
];
const CIRCOLO_STASERA = 5;             /* quanti ne vedi in «Chi c'è stasera» */
const CIRCOLO_DOPO_MIN = 120;          /* quanto dura il dopo-serata, in minuti di gioco */
const CIRCOLO_OPENMIC = {e:22, min:60};

/* ==================== L'ORA ==================== */
function circoloMin(t){
  if(typeof GAME_HOURS !== "undefined" && GAME_HOURS.parse) return GAME_HOURS.parse(t);
  const m = String(t).match(/^(\d{1,2}):(\d{2})$/);
  let v = +m[1] * 60 + +m[2];
  if(v < 480) v += 1440;
  return v;
}
function circoloOra(){
  return typeof GAME_TIME !== "undefined" && GAME_TIME.now ? GAME_TIME.now() : circoloMin("21:30");
}
/* La fascia di adesso, o null se il locale è chiuso (03:00–13:00). */
function circoloFascia(at){
  const ora = at == null ? circoloOra() : at;
  return CIRCOLO_FASCE.find(f => ora >= circoloMin(f.da) && ora < circoloMin(f.a)) || null;
}
function circoloPalcoAcceso(){ const f = circoloFascia(); return !!(f && f.palco); }

/* ==================== LO STATO ====================
   Nel salvataggio (`G.circolo`) ci sta quello che deve sopravvivere a un
   ricarica: quando sei sceso dal palco (il dopo-serata) e la serata a metà
   — uscire dalla pagina non la ricomincia da capo, se no una serata andata
   storta si rigiocava finché non veniva bene. Fuori dal salvataggio, solo
   cosa stai guardando. */
function circoloStato(){
  if(!G.circolo || typeof G.circolo !== "object") G.circolo = {};
  const c = G.circolo;
  /* una serata lasciata a metà si riprende solo se è ancora la stessa sera,
     il palco è ancora acceso e sei ancora qui: se no è finita lì, e non
     pesa su niente (problemi-riscontrati, «La serata lasciata a metà») */
  if(c.serata && (c.serata.key !== circoloGiorno() || !circoloPalcoAcceso() || !circoloQui())) c.serata = null;
  return c;
}
/* Sei al Circolo? La pagina si apre anche da lontano — il telefono, una
   card, l'agenda: la gente si guarda anche da lì — ma sul palco si sale
   solo stando qui (problemi-riscontrati, «Il palco funziona anche da
   lontano»). */
function circoloQui(){
  if(typeof G === "undefined" || !G || !G.currentPlace) return true;
  return typeof GAME_HOURS !== "undefined" && GAME_HOURS.samePlace
    ? GAME_HOURS.samePlace(G.currentPlace, "beat") : G.currentPlace === "beat";
}
/* Mentre la pagina è aperta gli eventi della giornata aspettano, come
   aspettavano con la Sala (eventi-v2.js lo chiede qui). */
function circoloOccupato(){
  return typeof LUOGO !== "undefined" && !!LUOGO && LUOGO.id === "circolo" &&
    !!$("luogo") && $("luogo").classList.contains("on");
}
function circoloGiorno(){ return typeof adfGiornoKey === "function" ? adfGiornoKey() : String(G.week || 1); }
let CIRCOLO = {scelto:null, nessuno:false, lampo:null};
let CIRCOLO_RESA = 1;

/* Il dopo-serata: vero per due ore dopo che sei sceso dal palco, lo stesso
   giorno. Lo legge poRispondi (posto.js). */
function circoloDopoSerata(){
  if(typeof G === "undefined" || !G || !G.circolo || !G.circolo.suonato) return false;
  const s = G.circolo.suonato;
  if(s.key !== circoloGiorno()) return false;
  const passati = circoloOra() - s.min;
  return passati >= 0 && passati <= CIRCOLO_DOPO_MIN;
}
/* La resa della serata giocata a momenti, per la mossa `live` (actions.js):
   si legge una volta e torna a 1, così un live partito da fuori — l'agenda,
   una card — vale com'è sempre valso. */
function circoloResaSerata(){ const r = CIRCOLO_RESA; CIRCOLO_RESA = 1; return r; }

/* ==================== LA GENTE ==================== */
function circoloPresenti(){
  const f = circoloFascia();
  if(!f || typeof presentiOggi !== "function") return [];
  return presentiOggi(f.gente);
}
function circoloStasera(){
  return typeof presentiOggi === "function" ? presentiOggi(CIRCOLO_STASERA) : [];
}
/* uno che non hai mai visto: il nome non lo sai ancora */
function circoloSconosciuto(p){ return p.rel === 0 && !p.scoperto && (p.ult == null || p.ult < 0); }
const CIRCOLO_CARATTERE = {aperto:"Amichevole", diffidente:"Diffidente", gasato:"Gasato", pratico:"Pratico"};

/* ==================== ICONE ==================== */
const CC_ICO = {
  gente:"M7 9.5a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6zM1.5 16c0-2.9 2.5-4.6 5.5-4.6s5.5 1.7 5.5 4.6zm12-6.4a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6zm.2 1.8c2.4.2 4.3 1.6 4.3 3.8v.8h-3c.1-2-.4-3.5-1.3-4.6z",
  mic:"M13.6 2.2a3.6 3.6 0 0 1 4.2 4.2l-4.5 4.5-4.2-4.2zM8.4 7.4l4.2 4.2-1.2.6L4.3 18l-2.3-2.3 5.8-7.1z",
  bolla:"M3 4h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H8l-4 3v-3H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm3 5.2a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zm4 0a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zm4 0a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z",
  stella:"M10 1.6l2.6 5.5 6 .7-4.4 4.1 1.2 6-5.4-3-5.4 3 1.2-6L1.4 7.8l6-.7z",
  orologio:"M10 1.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zm0 1.8a6.7 6.7 0 1 0 0 13.4 6.7 6.7 0 0 0 0-13.4zM9.1 5h1.8v4.6l3.2 2-1 1.5-4-2.5z",
  lucchetto:"M6 8V6a4 4 0 1 1 8 0v2h1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zm2 0h4V6a2 2 0 1 0-4 0z",
  parla:"M3 3h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-6l-4 3.5V13H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm3 4v2h8V7z",
  beat:"M4 6h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm1 3v5h2V9zm4 1v4h2v-4zm4-2v6h2V8zM6 2h8v2H6z",
  feat:"M6.5 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM1 17c0-3 2.5-5.2 5.5-5.2S12 14 12 17zM15 6h2v3h3v2h-3v3h-2v-3h-3V9h3z",
  numero:"M5 1.5h10a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 17V3A1.5 1.5 0 0 1 5 1.5zm.5 2V14h9V3.5zM10 15a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
  studio:"M10 2a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3zM5 10h1.6a3.4 3.4 0 0 0 6.8 0H15a5 5 0 0 1-4.2 4.9V17h3v1.6H6.2V17h3v-2.1A5 5 0 0 1 5 10z",
  mix:"M4 2h2v6.2a2.5 2.5 0 0 1 0 4.6V18H4v-5.2a2.5 2.5 0 0 1 0-4.6zm5 0h2v2.2a2.5 2.5 0 0 1 0 4.6V18H9V8.8a2.5 2.5 0 0 1 0-4.6zm5 0h2v10.2a2.5 2.5 0 0 1 0 4.6V18h-2v-1.2a2.5 2.5 0 0 1 0-4.6z",
  video:"M3 5h10a1 1 0 0 1 1 1v2.4L18 6v8l-4-2.4V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
  intervista:"M4 2h9l4 4v12H4zm8 1.5V7h3.5zM6.5 9v1.6h8V9zm0 3v1.6h8V12zm0 3v1.6H12V15z",
  indietro:"M10 1.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zm.6 4.3L6.4 10l4.2 4.2 1.2-1.2-2.2-2.2H14V9.2H9.6l2.2-2.2z",
  fuoco:"M10 1.5c.6 3-2.8 4.6-2.8 8a2.8 2.8 0 0 0 5.6.3c1.2 1 1.9 2.6 1.9 4.2A4.7 4.7 0 0 1 10 18.5 5.2 5.2 0 0 1 4.6 13c0-5.4 5.4-6.6 5.4-11.5z",
  bicchiere:"M4 2h12l-5 7v7h3v2H6v-2h3V9zm3.3 2L10 7.6 12.7 4z",
  sagoma:"M10 2.4a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4zM2.6 20c0-4.4 3.3-7.4 7.4-7.4s7.4 3 7.4 7.4z"
};
function ccIco(n){
  return '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="' + (CC_ICO[n] || "") + '"/></svg>';
}
const ccEsc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
/* la faccia disegnata di posto.js, quadrata: nel riferimento sono ritratti */
function ccFaccia(p, size){
  if(typeof faccia !== "function") return "";
  return faccia(p, size).replace('rx="11"', 'rx="0"').replace(/width="\d+" height="\d+"/, 'width="100%" height="100%" preserveAspectRatio="xMidYMid slice"');
}
function ccRuolo(p){ return (POSTO_RUOLI[p.ruolo] || {n:p.ruolo}).n; }

/* ==================== APRIRE ====================
   Dalla mappa si entra col video dell'ora: la stanza coi computer di giorno
   (quello della Sala), il club la sera — il filmato 08, che prima non usava
   nessuno. */
function circoloEntra(){
  const f = circoloFascia();
  const video = f && (f.palco || f.id === "aftershow") ? "club" : "sala";
  if(typeof transizioneVideo === "function") transizioneVideo(video, () => apriLuogo("circolo"));
  else apriLuogo("circolo");
}
/* la chiama apriLuogo (luoghi-foto.js): su che riquadro si apre */
function circoloApri(opz){
  if(typeof sistemaGente === "function") sistemaGente();
  CIRCOLO.lampo = opz.pannello || null;
  CIRCOLO.nessuno = false;
  if(opz.persona) CIRCOLO.scelto = opz.persona;
}

/* ==================== LA PAGINA ==================== */
function circoloParti(){
  const f = circoloFascia();
  circoloStato();
  return {pagina:
    '<div class="cc" data-fascia="' + (f ? f.id : "chiuso") + '">' +
      '<div class="cc-su">' + ccScena(f) + ccInfo(f) + '</div>' +
      '<div class="cc-giu">' +
        ccPannello("gente", "1.", "La gente", ccGente(f),
          "Parla con le persone, conosci nuovi contatti,<br>costruisci rapporti, ottieni opportunità.") +
        ccPannello("palco", "2.", "Il palco", ccPalco(f),
          "Sali sul palco: open mic, freestyle, live e showcase.<br>La serata cresce con la tua carriera.") +
        ccPannello("serata", "3.", "La serata di oggi", ccSerata(f),
          "Ogni sera ci sono persone diverse. Scopri chi è presente<br>e sfrutta le occasioni.") +
        ccPannello("momenti", "4.", "Momenti durante il live", ccMomenti(f),
          "Durante il live possono succedere eventi imprevisti.<br>Le tue scelte influenzano il pubblico, la fama e nuove opportunità.") +
      '</div>' +
    '</div>'};
}
function ccPannello(id, num, titolo, corpo, dida){
  return '<section class="cc-pan" id="cc-' + id + '" data-pan="' + id + '">' +
    '<h3 class="cc-pank"><span>' + num + '</span> ' + titolo + '</h3>' +
    '<div class="cc-box cc-' + id + '">' + corpo + '</div>' +
    '<p class="cc-dida">' + dida + '</p></section>';
}

/* ---------- la foto e i quattro cartelli ----------
   Stanno dove stanno nel riferimento, in percentuale della foto. La foto è
   un riquadro col suo rapporto (1250 × 526) che si ritaglia dentro alla
   scena come un `cover` (`.cc-quadro`, circolo.css): i cartelli ci stanno
   dentro, quindi restano sul bancone, sul palco, in sala e davanti alla
   porta del backstage a qualsiasi misura. */
function ccScena(f){
  const palco = f && f.palco;
  const cart = (id, ic, t, righe) =>
    '<button type="button" class="cc-cart cc-c-' + id + '" data-cc-vai="' + id + '">' +
      '<i>' + ccIco(ic) + '</i><span><b>' + t + '</b>' + righe.map(r => '<em>' + r + '</em>').join("") + '</span></button>';
  const palcoRighe = palco ? ["Open Mic, Freestyle,", "Live, Showcase"]
    : !f ? ["Chiuso", "Riapre alle 13:00"]
    : f.id === "aftershow" ? ["Spento per stasera", "Si riaccende alle 21:00"]
    : ["Si accende alle 21:00", "Open Mic, Freestyle, Live"];
  const L = LUOGHI_FOTO.circolo;
  return '<section class="cc-scena' + (palco ? "" : " cc-buio") + '">' +
    '<div class="cc-quadro" style="background-image:url(&quot;' + LUOGHI_FOTO_DIR + L.f + '&quot;)">' +
    cart("bancone", "gente", "Bancone", ["Parla con le persone", "Conosci nuovi contatti"]) +
    cart("palco", "mic", "Palco", palcoRighe) +
    cart("sala", "bolla", "Sala", ["Rapper, producer,", "fonici, videomaker...", "Costruisci rapporti"]) +
    cart("backstage", "stella", "Backstage", ["Artisti della serata", "Opportunità speciali"]) +
  '</div></section>';
}

/* ---------- la colonna a destra ---------- */
function ccInfo(f){
  const righe = CIRCOLO_FASCE.map(x =>
    '<li class="' + (f && f.id === x.id ? "ora" : "") + '"><span>' + x.da + ' – ' + x.a + '</span><b>' + x.n + '</b></li>').join("");
  const stato = f
    ? '<i class="cc-pallino"></i><b>Aperto</b> <span>(chiusura ore 03:00)</span>'
    : '<i class="cc-pallino no"></i><b>Chiuso</b> <span>(riapre alle 13:00)</span>';
  return '<aside class="cc-info">' +
    '<h2 class="cc-titolo">' + CIRCOLO_NOME + '</h2>' +
    '<p class="cc-motto">Il posto della scena locale.</p>' +
    '<p class="cc-desc">Di giorno è un punto d’incontro: qui conosci rapper, producer, fonici e gente del giro. ' +
      'Di sera il palco si accende: open mic, freestyle, live. Le persone che incontri possono portarti lontano.</p>' +
    '<div class="cc-orari"><h4>' + ccIco("orologio") + 'Orari oggi</h4><ul>' + righe + '</ul></div>' +
    '<p class="cc-stato">' + stato + '</p>' +
  '</aside>';
}

/* ---------- 1. la gente ---------- */
function ccGente(f){
  const chi = circoloPresenti();
  if(!chi.length){
    return '<div class="cc-vuoto">' + (f ? "Non c’è nessuno, adesso." : "Il Circolo è chiuso. Riapre alle 13:00: di pomeriggio ci trovi la gente del giro.") + '</div>';
  }
  /* chi è selezionato: quello scelto se è qui, se no il primo — come nel
     riferimento, dove la scheda è sempre aperta su qualcuno */
  let p = null;
  if(typeof POSTO_PARLA !== "undefined" && POSTO_PARLA) p = POSTO_PARLA.p;
  if(!p && !CIRCOLO.nessuno) p = chi.find(x => x.id === CIRCOLO.scelto) || chi[0];
  if(p) CIRCOLO.scelto = p.id;
  const lista = '<div class="cc-lista">' + chi.map(x => {
    const ignoto = circoloSconosciuto(x);
    return '<button type="button" class="cc-chi' + (p && x.id === p.id ? " on" : "") + '" data-cc-chi="' + x.id + '">' +
      '<span class="cc-av">' + ccFaccia(x, 34) + '</span>' +
      '<span class="cc-chitx"><b>' + (ignoto ? "???" : ccEsc(x.n)) +
        (x.numero ? ' <i class="cc-tel" title="Avete il numero">' + ccIco("bolla") + '</i>' : "") + '</b>' +
      '<i>' + ccRuolo(x) + '</i></span></button>';
  }).join("") + '</div>';
  return lista + '<div class="cc-dett">' + (p ? ccScheda(p) : ccNessuno(chi)) + '</div>';
}
function ccNessuno(chi){
  return '<div class="cc-vuoto">' + chi.length + (chi.length === 1 ? " persona" : " persone") +
    ' nel retro, adesso. Sceglie tu con chi parlare: con ognuno si sale un gradino alla volta.</div>';
}
function ccScheda(p){
  const r = POSTO_RUOLI[p.ruolo] || {d:""};
  const ignoto = circoloSconosciuto(p);
  const car = p.scoperto ? CIRCOLO_CARATTERE[p.car] || p.car : "Da scoprire";
  const rel = typeof relNome === "function" ? relNome(p) : "";
  const testa = '<div class="cc-scheda">' +
    '<div class="cc-ritratto">' + ccFaccia(p, 96) + '</div>' +
    '<div class="cc-chie"><b>' + (ignoto ? "???" : ccEsc(p.n)) + '</b><i>' + ccRuolo(p) + '</i>' +
      '<div class="cc-badge"><span class="' + (p.scoperto ? "verde" : "grigio") + '">' + ccIco("gente") + car + '</span>' +
        '<span class="viola">' + ccIco("numero") + rel.charAt(0).toUpperCase() + rel.slice(1) + '</span></div>' +
      '<p>' + (ignoto ? "Non vi siete mai parlati. " : "") + r.d + '</p></div>' +
  '</div>';
  /* il dialogo: la situazione e le risposte al posto delle mosse */
  if(typeof POSTO_PARLA !== "undefined" && POSTO_PARLA && POSTO_PARLA.p.id === p.id){
    const sit = POSTO_PARLA.sit;
    return testa + '<div class="cc-dialogo"><p>' + sit.t + '</p>' +
      sit.o.map((o, i) => '<button type="button" class="cc-az" data-cc-risp="' + i + '"><span>' + o[0] + '</span></button>').join("") +
      '</div>';
  }
  return testa + '<div class="cc-azioni">' + ccVoci(p).join("") +
    ccBeatSulTavolo(p) +
    '<button type="button" class="cc-az" data-cc-indietro="1"><i>' + ccIco("indietro") + '</i><span>Torna indietro</span></button>' +
  '</div>';
}
const CC_AZ_ICO = {parla:"parla", numero:"numero", beat:"beat", sessione:"studio", mix:"mix", feat:"feat", video:"video", intervista:"intervista"};
function ccVoci(p){
  const voci = typeof vociDi === "function" ? vociDi(p) : [];
  return voci.map(v => {
    /* il feat nasce sul palco: la sera, col palco acceso, e lui in sala */
    if(v.tipo === "feat" && v.puo && !circoloPalcoAcceso()){
      v = Object.assign({}, v, {puo:false, sotto:"Il feat nasce sul palco: torna dopo le 21:00, quando lui è in sala"});
    } else if(v.tipo === "feat" && v.puo){
      v = Object.assign({}, v, {sotto:"Ti chiede di salire con lui, stasera"});
    }
    return '<button type="button" class="cc-az' + (v.puo ? "" : " no") + '" data-cc-az="' + v.tipo + '" data-p="' + v.p + '"' +
      (v.puo ? "" : " disabled") + ' title="' + ccEsc(v.sotto) + '">' +
      '<i>' + ccIco(CC_AZ_ICO[v.tipo] || "parla") + '</i><span>' + v.n + '</span>' +
      '<em>' + ccEsc(v.puo ? v.costo || "" : v.sotto) + '</em></button>';
  });
}
/* il beat che un producer ti ha fatto sentire: si ascolta, si prende o si
   lascia da qui, come prima nella Sala (posto.js, punto 20 e 22) */
function ccBeatSulTavolo(p){
  if(p.ruolo !== "beatmaker" || typeof beatSulTavolo !== "function") return "";
  const b = beatSulTavolo(p);
  if(!b) return "";
  const i = G.market.indexOf(b);
  const info = typeof beatInfo === "function" ? beatInfo(b) : {bpm:"-"};
  return '<div class="cc-beat">' +
    '<span class="cc-bcov" style="background:' + (typeof beatCov === "function" ? beatCov(b) : "#333") + '"></span>' +
    '<span class="cc-bnm"><b>' + ccEsc(b.n) + '</b><i>qualità ' + b.q + ' · ' + info.bpm + ' bpm</i></span>' +
    '<button type="button" data-sent="' + i + '" title="Ascolta il beat" aria-label="Ascolta il beat" aria-pressed="false">▶</button>' +
    '<button type="button" class="oro" data-prendi="' + i + '"' + (G.money < b.price ? " disabled" : "") + '>' + b.price + ' €</button>' +
    '<button type="button" data-lascia="' + i + '" title="Lascialo dov’è">✕</button>' +
  '</div>';
}

/* ---------- 2. il palco ----------
   Le sei righe del riferimento. Le prime tre si fanno: l'open mic senza
   requisiti, il freestyle (la mossa `free`, con la sua battle), il live (la
   mossa `live`, un pezzo fuori). Le ultime tre sono la carriera che deve
   ancora venire: si vedono chiuse, col lucchetto, come nel riferimento. */
function ccPalcoStato(id){
  const f = circoloFascia();
  const st = circoloStato();
  if(st.serata) return {ok:false, perche:"Sei sul palco: la serata è ancora in corso"};
  if(!f || !f.palco){
    return {ok:false, perche:!f ? "Il Circolo è chiuso" : f.id === "aftershow" ? "Il palco è spento: domani dalle 21:00" : "Il palco si accende alle 21:00"};
  }
  if(!circoloQui()) return {ok:false, perche:"Sei lontano: raggiungi il Circolo dalla mappa"};
  if(id === "openmic"){
    if(typeof adfOggi === "function" && adfOggi("openmic") > 0) return {ok:false, perche:"Il tuo giro stasera l’hai fatto"};
    if(G.energy < CIRCOLO_OPENMIC.e) return {ok:false, perche:"Serve energia"};
    if(typeof GAME_TIME !== "undefined" && GAME_TIME.canSpend){
      const g = GAME_TIME.canSpend(CIRCOLO_OPENMIC.min);
      if(g && !g.ok) return {ok:false, perche:"Non fai più in tempo stasera"};
    }
    return {ok:true};
  }
  const st2 = typeof hubPronta === "function" ? hubPronta(id) : {ok:true};
  if(!st2.ok) return st2;
  if(id === "live" && typeof GAME_HOURS !== "undefined" && GAME_HOURS.actionStatus){
    const ore = GAME_HOURS.actionStatus("live");
    if(ore && !ore.open) return {ok:false, perche:ore.label || "Adesso non si può"};
  }
  return {ok:true};
}
function ccPalco(f){
  const riga = (id, n, d, costo) => {
    const st = ccPalcoStato(id);
    return '<button type="button" class="cc-mossa' + (st.ok ? "" : " no") + '" data-cc-palco="' + id + '"' +
      (st.ok ? "" : " disabled") + ' title="' + ccEsc(st.ok ? d : st.perche) + '">' +
      '<b>' + n + '</b><i>' + ccEsc(st.ok ? d : st.perche + ".") + '</i>' +
      (st.ok && costo ? '<em>' + costo + '</em>' : "") + '</button>';
  };
  const chiusa = (n, d, perche) =>
    '<button type="button" class="cc-mossa chiusa" disabled title="' + ccEsc(perche) + '">' +
      '<b>' + n + '</b><i>' + d + '</i><s>' + ccIco("lucchetto") + '</s></button>';
  const costo = id => typeof lfCosto === "function" ? lfCosto(id) : "";
  return '<div class="cc-foto" style="background-image:url(&quot;' + CIRCOLO_FOTO + 'palco.jpg&quot;)"></div>' +
    '<div class="cc-cosa"><h4>Cosa vuoi fare?</h4>' +
      riga("openmic", "Open Mic", "Ideale per iniziare.", CIRCOLO_OPENMIC.e + " energie") +
      riga("free", "Freestyle", "Mettiti alla prova.", costo("free")) +
      riga("live", "Live", "Suona i tuoi pezzi.", costo("live")) +
      chiusa("Showcase", "Solo su invito.", "Ti ci chiama un promoter: arriva più avanti nella carriera") +
      chiusa("Opening Act", "Apri il concerto di qualcuno.", "Serve un nome che la gente conosce già") +
      chiusa("Headline", "La serata è tutta tua.", "Quando il locale lo riempi da solo") +
    '</div>';
}

/* ---------- 3. la serata di oggi ----------
   Il programma cambia da una sera all'altra (il 22:30), sempre lo stesso
   dentro alla giornata; sotto, chi c'è stasera — anche chi non conosci
   ancora, che è un «???» finché non ci parli. */
const CC_PROGRAMMA_2230 = [
  ["Showcase locale", "Con artisti emergenti"],
  ["Battle di freestyle", "Chi vince si prende la serata"],
  ["Live di un nome del giro", "La sala si riempie presto"]
];
function ccSerata(f){
  const ora = circoloOra();
  const giorno = Number(G.day || 1) + Number(G.week || 1) * 7;
  const act = CC_PROGRAMMA_2230[giorno % CC_PROGRAMMA_2230.length];
  const fatto = typeof adfOggi === "function" && (adfOggi("openmic") > 0 || adfOggi("live") > 0);
  const voce = (t, cls, ic, n, d) => {
    const passato = ora >= circoloMin(t) + (n === "Aftershow" ? 180 : 90);
    return '<li class="' + (passato ? "passato" : "") + '"><span class="cc-ora ' + cls + '">' + ccIco(ic) + t + '</span>' +
      '<div><b>' + n + '</b><i>' + d + '</i></div></li>';
  };
  const chi = circoloStasera();
  const invito = p => p.ruolo === "rapper" && p.rel >= 3 &&
    ((typeof totalWeeks === "function" ? totalWeeks() : G.week) - p.feat) >= 6;
  const facce = chi.slice(0, 4).map(p => {
    const ignoto = circoloSconosciuto(p);
    return '<button type="button" class="cc-faccia" data-cc-chi="' + p.id + '">' +
      '<span class="cc-fr">' + (ignoto ? '<span class="cc-sagoma">' + ccIco("sagoma") + '</span>' : ccFaccia(p, 80)) +
        (invito(p) && !ignoto ? '<u>ti chiama sul palco</u>' : "") + '</span>' +
      '<b>' + (ignoto ? "???" : ccEsc(p.n)) + '</b><i>' + ccRuolo(p) + '</i></button>';
  }).join("");
  return '<div class="cc-prog"><ul>' +
      voce("21:00", "rosso", "mic", "Open Mic", fatto ? "Ci sei salito" : ora >= circoloMin("00:00") ? "Iscrizioni chiuse" : "Iscrizioni aperte") +
      voce("22:30", "rosso", "fuoco", act[0], act[1]) +
      voce("00:00", "verde", "bicchiere", "Aftershow", "DJ set e networking") +
    '</ul><div class="cc-foto" style="background-image:url(&quot;' + CIRCOLO_FOTO + 'serata.jpg&quot;)"></div></div>' +
    '<div class="cc-stasera"><h4>Chi c’è stasera</h4><div class="cc-facce">' +
      (facce || '<p class="cc-vuoto">Stasera non c’è nessuno che conosci.</p>') + '</div></div>';
}

/* ---------- 4. i momenti durante il live ----------
   La serata giocata a momenti (il punto «La serata del Live Club giocata a
   momenti»): tre pezzi, a ogni pezzo succede una cosa e scegli come
   rispondere. La gente parte da 50 e sale o scende; alla fine quanto è
   andata bene pesa sulla resa (da 0,55 a 1,45). Le risposte sicure danno
   poco e rischiano poco; quelle forti dipendono da Carisma (presenza) o da
   Rap (flow), le due abilità che il profilo mostra con quei nomi. */
const CC_MOMENTI = [
  {id:"freddi", t:"Una parte del pubblico non sta reagendo.", o:[
    {n:"Continua la scaletta", d:"Rischio basso.", p:.85, su:5, giu:-3},
    {n:"Passa subito al pezzo più forte", d:"Consumi il tuo highlight troppo presto.", p:.9, su:12, giu:-4, hl:true},
    {n:"Fermati e parla col pubblico", d:"Dipende da Carisma.", p:.35, ab:"presenza", su:14, giu:-8}]},
  {id:"sopra", t:"Uno in fondo comincia a parlare sopra.", o:[
    {n:"«Se hai da dire, sali qui»", d:"Rischio alto: ridono con te o di te.", p:.3, ab:"presenza", su:16, giu:-10},
    {n:"Vai avanti, tanto perde lui", d:"Rischio basso.", p:.8, su:4, giu:-3},
    {n:"Ti fermi e aspetti che smetta", d:"La sala si raffredda un po’.", p:.6, su:2, giu:-5}]},
  {id:"base", t:"La base parte storta: hanno sbagliato traccia.", o:[
    {n:"Riparti a cappella", d:"Dipende da Rap.", p:.3, ab:"flow", su:15, giu:-9},
    {n:"Fai segno al fonico e ricominci", d:"Perdi il ritmo, non la faccia.", p:.8, su:3, giu:-3, amico:"fonico"},
    {n:"Ci ridi sopra col pubblico", d:"Dipende da Carisma.", p:.4, ab:"presenza", su:10, giu:-6}]},
  {id:"richiesta", t:"Qualcuno urla il titolo di un tuo pezzo.", se:() => (G.songs || []).some(s => s.released), o:[
    {n:"Lo fai subito", d:"La gente lo voleva: rischio basso.", p:.85, su:9, giu:-2},
    {n:"«Dopo», e tieni la scaletta", d:"Rischio medio.", p:.55, su:5, giu:-5},
    {n:"Solo il ritornello, a cappella", d:"Dipende da Rap.", p:.35, ab:"flow", su:14, giu:-7}]},
  {id:"microfono", t:"Il microfono si spegne per due secondi.", o:[
    {n:"Vai avanti a voce piena", d:"Dipende da Carisma.", p:.3, ab:"presenza", su:13, giu:-8},
    {n:"Aspetti fermo che torni", d:"Rischio basso.", p:.8, su:2, giu:-3, amico:"fonico"},
    {n:"Ci scherzi e riparti dalla barra", d:"Rischio medio.", p:.55, su:7, giu:-5}]},
  {id:"file", t:"Le prime file sono tue, dietro si chiacchiera.", o:[
    {n:"Scendi in mezzo alla gente", d:"Rischio alto.", p:.3, ab:"presenza", su:16, giu:-9},
    {n:"Suoni per chi ti ascolta", d:"Rischio basso.", p:.85, su:4, giu:-2},
    {n:"Alzi la voce e il tiro", d:"Dipende da Rap.", p:.4, ab:"flow", su:10, giu:-6}]},
  {id:"producer", t:"Un producer ti guarda da sotto il palco.", o:[
    {n:"Gli dedichi la prossima barra", d:"Rischio medio: o lo prendi o no.", p:.5, ab:"presenza", su:9, giu:-5},
    {n:"Fai finta di niente e spingi", d:"Rischio basso.", p:.8, su:5, giu:-2},
    {n:"Metti il pezzo più tecnico", d:"Dipende da Rap.", p:.35, ab:"flow", su:12, giu:-6}]}
];
/* l'ultimo pezzo, se la sala è già tua */
const CC_BIS = {id:"bis", t:"La gente chiede il bis.", o:[
  {n:"Lo fai, e chiudi in alto", d:"Rischio basso.", p:.85, su:8, giu:-3},
  {n:"Ringrazi e scendi", d:"Lasciali con la voglia: rischio medio.", p:.6, su:6, giu:-2},
  {n:"Freestyle di chiusura", d:"Dipende da Rap.", p:.35, ab:"flow", su:16, giu:-8}]};
const CC_PASSI = ["Primo pezzo.", "Secondo pezzo.", "Ultimo pezzo."];
function ccMomento(id){ return id === "bis" ? CC_BIS : CC_MOMENTI.find(m => m.id === id) || CC_MOMENTI[0]; }

function ccMomenti(f){
  const st = circoloStato();
  const s = st.serata;
  const e = typeof LUOGO !== "undefined" && LUOGO && LUOGO.esito;
  let card;
  if(e){
    card = '<p class="cc-msit"><b>Com’è andata.</b></p>' +
      '<div class="cc-esito"><p>' + (e.msg || "") + '</p>' + (e.extra ? '<p class="cc-extra">' + e.extra + '</p>' : "") + '</div>' +
      '<button type="button" class="cc-mopz" data-continua="1"><b>Continua</b><i>Torni nel locale.</i></button>';
  } else if(s){
    const m = ccMomento(s.ids[s.passo]);
    card = (s.detto ? '<p class="cc-mdetto">' + s.detto + '</p>' : "") +
      '<p class="cc-msit">' + CC_PASSI[s.passo] + '<br>' + m.t + '</p>' +
      m.o.map((o, i) => '<button type="button" class="cc-mopz" data-cc-momento="' + i + '"><b>' + o.n + '</b><i>' + ccDetto(o) + '</i></button>').join("") +
      '<div class="cc-meter" title="Come sta andando la gente"><span style="width:' + s.pubblico + '%"></span></div>';
  } else {
    const palco = f && f.palco;
    card = '<p class="cc-msit">' + (palco
      ? "Il palco è acceso.<br>Scegli cosa fare: qui la serata si gioca un pezzo alla volta."
      : "Il palco è spento.<br>" + (f && f.id === "aftershow" ? "Si riaccende domani alle 21:00." : "Si accende alle 21:00.")) + '</p>' +
      '<div class="cc-mvuoto"><b>Tre pezzi, tre momenti.</b><i>Quello che scegli fa salire o scendere la gente, e la gente fa la serata.</i></div>';
  }
  /* la foto è quella del Live Club di prima: il palco visto dalla gente */
  return '<div class="cc-mfoto" style="background-image:url(&quot;' + LUOGHI_FOTO_DIR + 'schermate luoghi_senza_HTML/live_club.png&quot;)"></div>' +
    '<div class="cc-momento">' + card + '</div>';
}
/* la riga sotto a una risposta: il rischio, e se hai un aiuto in sala */
function ccDetto(o){
  const a = o.amico && ccAmico(o.amico);
  if(a) return ccEsc(a.n) + " è al mixer: te la sistema lui.";
  const d = ccEsc(o.d);
  return d.replace(/^(Rischio \w+|Dipende da \w+|Consumi)/, '<u>$1</u>');
}
/* il fonico che conosci (amico o più), se stasera c'è: la base te la salva */
function ccAmico(ruolo){
  return circoloStasera().find(p => p.ruolo === ruolo && p.rel >= 2 && !circoloSconosciuto(p)) || null;
}

/* ==================== SALIRE SUL PALCO ==================== */
function circoloPalco(id){
  const st = ccPalcoStato(id);
  if(!st.ok) return;
  if(typeof SFX === "object" && SFX.tap) SFX.tap();
  /* il freestyle ha già il suo gioco (piazza.js): si parte da lì */
  if(id === "free"){ avviaAzioneDiretta("free"); return; }
  const parti = () => {
    const pool = CC_MOMENTI.filter(m => !m.se || m.se());
    const ids = [];
    while(ids.length < 3 && pool.length) ids.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0].id);
    circoloStato().serata = {key:circoloGiorno(), tipo:id, passo:0, pubblico:50, ids:ids, hl:false, detto:""};
    if(typeof LUOGO !== "undefined" && LUOGO) LUOGO.esito = null;
    CIRCOLO.lampo = "momenti";
    save(); renderLuogo();
  };
  /* il filmato del live (11) fra il tasto e il primo pezzo */
  if(typeof transizioneVideo === "function" && TRANSIZIONI_VIDEO.palco) transizioneVideo("palco", parti);
  else parti();
}

function circoloScegli(i){
  const s = circoloStato().serata;
  if(!s) return;
  const m = ccMomento(s.ids[s.passo]);
  const o = m.o[i];
  if(!o) return;
  let p = o.p;
  if(o.ab) p += Math.min(0.5, ((G.skills && G.skills[o.ab]) || 0) / 100 * 0.6);
  const amico = o.amico && ccAmico(o.amico);
  if(amico) p = Math.max(p, 0.95);
  let d = Math.random() < Math.min(0.95, p) ? o.su + (amico ? 4 : 0) : o.giu;
  /* l'highlight bruciato: il finale è più debole */
  if(s.passo === 2 && s.hl) d -= 6;
  if(o.hl) s.hl = true;
  s.pubblico = Math.max(0, Math.min(100, s.pubblico + d));
  s.detto = d >= 8 ? "La sala è con te." : d > 0 ? "Qualcuno si è avvicinato al palco." :
    d === 0 ? "Niente di che." : d > -6 ? "Qualcuno è andato al bancone." : "Hai perso una fetta di sala.";
  if(typeof SFX === "object") (d > 0 ? SFX.tap : SFX.fail || SFX.tap)();
  s.passo++;
  /* l'ultimo pezzo: se la sala è già tua, chiedono il bis */
  if(s.passo === 2 && s.pubblico >= 65) s.ids[2] = "bis";
  if(s.passo >= 3){ circoloFineSerata(); return; }
  save(); renderLuogo();
}

/* Com'è andata: la gente (0–100) diventa la resa, 0,55–1,45. Poi la mossa
   vera — il live di actions.js, o l'open mic qui sotto — e le due cose
   dell'unione: la gente che guarda, il dopo-serata. */
function circoloFineSerata(){
  const st = circoloStato();
  const s = st.serata;
  st.serata = null;
  const resa = Math.round((0.55 + s.pubblico / 100 * 0.9) * 100) / 100;
  const guarda = circoloGenteGuarda(resa);
  const sala = '<b>La gente: ' + s.pubblico + '/100.</b>';
  if(s.tipo === "live"){
    CIRCOLO_RESA = resa;
    const fatto = avviaAzioneDiretta("live");
    CIRCOLO_RESA = 1;
    if(!fatto){ save(); renderLuogo(); return; }
    if(typeof LUOGO !== "undefined" && LUOGO && LUOGO.esito)
      LUOGO.esito.extra = (LUOGO.esito.extra || "") + " " + sala + (guarda ? " " + guarda : "");
  } else {
    if(G.energy < CIRCOLO_OPENMIC.e){
      if(typeof toast === "function") toast("<b>Non ce la fai più.</b> L’energia è finita prima della fine del giro.", "bad", "!", ["#B91C1C","#7F1D1D"]);
      save(); renderLuogo(); return;
    }
    const msg = circoloOpenMic(resa);
    if(typeof LUOGO !== "undefined" && LUOGO) LUOGO.esito = {a:"openmic", msg:msg, extra:sala + (guarda ? " " + guarda : "")};
  }
  st.suonato = {key:circoloGiorno(), min:circoloOra()};
  save(); renderGioco();
  if(typeof renderHub === "function") renderHub();
}

/* L'open mic: il palco senza requisiti. Poco, ma per chi non ha ancora un
   pezzo fuori è l'unico modo di farsi vedere su un palco vero: presenza e
   qualche fan, niente soldi. Una volta a sera. */
function circoloOpenMic(resa){
  G.energy -= CIRCOLO_OPENMIC.e;
  if(typeof GAME_TIME !== "undefined" && GAME_TIME.spend) GAME_TIME.spend(CIRCOLO_OPENMIC.min, "circolo-openmic");
  const ritmo = typeof RITMO === "number" ? RITMO : 0.4;
  const pres = typeof presenzaSulPalco === "function" ? presenzaSulPalco() : ((G.skills && G.skills.presenza) || 0);
  const f = Math.max(0, Math.round((rnd(4, 14) + pres * 0.5) * ritmo * resa));
  G.fans += f;
  if(typeof gain === "function") gain("presenza", 0.9 * resa);
  if(typeof addLuc === "function") addLuc(1);
  G.wellbeing = Math.max(0, Math.min(100, G.wellbeing - 2));
  if(typeof adfSegnaOggi === "function") adfSegnaOggi("openmic");
  const msg = "Open mic fatto: <b>+" + f + " fan</b>" + (resa >= 1.1 ? ", e la sala se lo ricorda." : resa < 0.85 ? ". Non è la tua sera." : ".");
  if(typeof pushLog === "function") pushLog("Open mic al Circolo: +" + f + " fan.", "");
  return msg;
}

/* La gente guarda: chi è collaboratore o più ed è in sala stasera. Se è
   andata bene sale di un pezzo di rapporto — e se basta, di un gradino —;
   se è andata male ne perde uno, ma non si scende mai di gradino: una serata
   storta non rompe un'amicizia. Riusa `p.pt` e `relSoglia()` di posto.js. */
function circoloGenteGuarda(resa){
  const chi = circoloStasera().filter(p => p.rel >= 3 && !p.via);
  if(!chi.length) return "";
  const nomi = chi.map(p => ccEsc(p.n)).join(", ");
  if(resa >= 1.05){
    chi.forEach(p => {
      p.pt += 1;
      while(typeof relSoglia === "function" && p.pt >= relSoglia(p) && p.rel < 5){ p.pt -= relSoglia(p); p.rel++; }
    });
    return nomi + (chi.length === 1 ? " era in sala: gli è piaciuta." : " erano in sala: gli è piaciuta.");
  }
  if(resa < 0.85){
    chi.forEach(p => { p.pt = Math.max(0, p.pt - 1); });
    return nomi + (chi.length === 1 ? " era in sala, e l’ha vista." : " erano in sala, e l’hanno vista.");
  }
  return "";
}

/* ==================== I COMANDI ==================== */
function circoloVai(dove){
  const pan = {bancone:"gente", sala:"gente", palco:"palco", backstage:"serata"}[dove] || dove;
  /* al bancone si conosce gente nuova: la scheda si apre su chi non conosci */
  if(dove === "bancone"){
    const nuovo = circoloPresenti().find(circoloSconosciuto);
    if(nuovo){ CIRCOLO.scelto = nuovo.id; CIRCOLO.nessuno = false; }
  }
  CIRCOLO.lampo = pan;
  renderLuogo();
}
/* dopo il disegno: se c'è un riquadro da mostrare, ci si scorre sopra e
   lampeggia una volta (la chiama renderLuogo, luoghi-foto.js) */
function circoloDopoDisegno(wrap){
  const pan = CIRCOLO.lampo;
  if(!pan) return;
  CIRCOLO.lampo = null;
  const el = wrap.querySelector('[data-pan="' + pan + '"]');
  if(!el) return;
  el.classList.add("lampo");
  if(el.scrollIntoView) el.scrollIntoView({block:"nearest", behavior:"smooth"});
  setTimeout(() => el.classList.remove("lampo"), 900);
}

if($("luogo")){
  $("luogo").addEventListener("click", e => {
    if(typeof LUOGO === "undefined" || !LUOGO || LUOGO.id !== "circolo") return;
    const t = e.target.closest("button");
    if(!t || t.disabled) return;
    const d = t.dataset;
    if(d.ccVai){ if(SFX.tap) SFX.tap(); circoloVai(d.ccVai); return; }
    if(d.ccChi){
      if(typeof POSTO_PARLA !== "undefined" && POSTO_PARLA) return;   /* a metà dialogo non si cambia persona */
      if(SFX.tap) SFX.tap();
      const qui = circoloPresenti().some(p => p.id === d.ccChi);
      CIRCOLO.scelto = d.ccChi; CIRCOLO.nessuno = false;
      if(!qui && typeof toast === "function")
        toast("Arriva più tardi, stasera. Adesso non è qui.", "", "…", ["#3A3F49", "#22262E"]);
      CIRCOLO.lampo = "gente";
      renderLuogo(); return;
    }
    if(d.ccIndietro){ if(SFX.tap) SFX.tap(); CIRCOLO.nessuno = true; renderLuogo(); return; }
    if(d.ccRisp != null){ poRispondi(+d.ccRisp); return; }
    if(d.ccAz){
      /* il feat, sul palco: la pagina lo dice, qui si controlla di nuovo */
      if(d.ccAz === "feat" && !circoloPalcoAcceso()) return;
      const prima = d.ccAz === "feat" ? (G.gente.find(x => x.id === d.p) || {}).feat : null;
      azionePosto(d.ccAz, d.p);
      /* il dopo-serata, solo se sul palco con lui ci sei salito davvero */
      if(d.ccAz === "feat" && (G.gente.find(x => x.id === d.p) || {}).feat !== prima){
        circoloStato().suonato = {key:circoloGiorno(), min:circoloOra()};
        save();
      }
      return;
    }
    if(d.ccPalco){ circoloPalco(d.ccPalco); return; }
    if(d.ccMomento != null){ circoloScegli(+d.ccMomento); return; }
    /* il beat sul tavolo: ascolta, prendi, lascia (come nella Sala di prima) */
    if(d.sent != null){ const b = G.market[+d.sent]; if(b && typeof beatSuona === "function") beatSuona(b, t); return; }
    if(d.prendi != null){ const b = G.market[+d.prendi]; if(b && prendiBeatDalBanco(b)) renderLuogo(); return; }
    if(d.lascia != null){ lasciaBeatSala(+d.lascia); return; }
  });
}
