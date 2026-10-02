/* IL CIRCOLO — la Sala e il Live Club diventati un posto solo (29/09/2026).

   «Un posto, due vite»: di pomeriggio è il retro dove si conosce la gente
   (la Sala di prima), la sera si accende il palco e il retro resta aperto.
   Sulla mappa sta dov'era la Sala (id "beat", hub.js); il cartello del Live
   Club non c'è più e chi dice ancora «concerti» finisce qui (orari.js,
   `PLACE_ALIAS`).

   La pagina è quella del riferimento
   `media/photo/schermate_luoghi/schermate_luoghi_con_elementi_HTML/il_circolo.png`,
   senza la barra di sotto (Mappa, Contatti…), che CARLO ha tolto: la foto
   del locale con i quattro cartelli, e la colonna degli orari che si apre
   passandoci sopra (col tocco sul telefono). Dal 01/10/2026 i quattro
   riquadri di sotto non ci sono più: ogni cartello apre la sua stanza —
   Bancone, Sala, Palco, Backstage — disegnata in circolo-stanze.js sui
   riferimenti `bancone.png`, `sala.png`, `open_mic.png`, `backstage.png`,
   con le mosse nuove in circolo-incontri.js. Vive dentro `#luogo`
   (luoghi-foto.js), così la fascia in alto, il menu di sistema, l'orologio
   e l'esito delle mosse sono quelli di Casa e della Palestra.

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
/* `stanza` è la pagina aperta (null: la foto coi cartelli), `bsSel` chi è
   scelto nel backstage, `filtro` la lista della Sala, `detto` l'ultima cosa
   successa con una mossa del Circolo, `orari` la colonna aperta col tocco */
let CIRCOLO = {scelto:null, nessuno:false, lampo:null, stanza:null, bsSel:null, filtro:"tutti", detto:null, orari:false};
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
/* uno che non hai mai visto: il nome non lo sai ancora. Parlarci, offrirgli
   da bere o presentarti (circolo-incontri.js) te lo fa conoscere: `p.visto`.
   Ascoltarlo da lontano no: ne capisci il carattere (`p.scoperto`), non il
   nome — prima di quella mossa `scoperto` arrivava solo dal dialogo, che
   segna già `p.ult` (problemi-riscontrati, voce 89). */
function circoloSconosciuto(p){ return p.rel === 0 && !p.visto && (p.ult == null || p.ult < 0); }
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
  /* le stanze (01/10/2026) */
  boccale:"M4 4h9v2h1.5A2.5 2.5 0 0 1 17 8.5v4a2.5 2.5 0 0 1-2.5 2.5H13v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm9 4v5h1.5a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 0-.5-.5zM6 7v8h1V7zm3 0v8h1V7z",
  orecchio:"M10 2a6 6 0 0 1 6 6c0 2.3-1 3.6-2 4.6-.8.8-1.3 1.4-1.4 2.6A3 3 0 0 1 9.6 18H9v-2h.6a1 1 0 0 0 1-1c.1-2 1-3 2-3.9.8-.8 1.4-1.6 1.4-3.1a4 4 0 0 0-8 0H4a6 6 0 0 1 6-6zm0 3a3 3 0 0 1 3 3h-2a1 1 0 0 0-2 0c0 .6.3.9.8 1.4l-1.4 1.4C7.6 10 7 9.2 7 8a3 3 0 0 1 3-3z",
  mano:"M1 9l4-4 3 1 2-1.5h3L19 9l-2 2-2-1-4 4-1 .1L7 11l-1 1-5-3zm6.8 0l2.4 2.2 3.3-3.2-1-.9h-1.6l-1.7 1.2z",
  freccia:"M7.6 3.4 14.2 10l-6.6 6.6-1.4-1.4L11.4 10 6.2 4.8z",
  occhio:"M10 4c4.6 0 8 4.2 8.8 6-.8 1.8-4.2 6-8.8 6S2 11.8 1.2 10C2 8.2 5.4 4 10 4zm0 2.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm0 2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z",
  aggiorna:"M10 3a7 7 0 0 1 6.3 4H14v2h5V4h-2v1.4A9 9 0 0 0 1 10h2a7 7 0 0 1 7-7zm7 7a7 7 0 0 1-13.3 3H6v-2H1v5h2v-1.4A9 9 0 0 0 19 10z",
  nota:"M17 2v11.5a2.5 2.5 0 1 1-2-2.45V5.3l-7 1.5v8.7A2.5 2.5 0 1 1 6 13.05V5.2z",
  calendario:"M5 1h2v2h6V1h2v2h2a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h2zM4 8v8h12V8zm2 2h3v3H6z",
  bilancia:"M9 2h2v2h5l2.5 6a3 3 0 0 1-6 0L15 5h-4v11h4v2H5v-2h4V5H5l2.5 5a3 3 0 0 1-6 0L4 4h5zm6.5 4.6-1.6 3.9h3.2zm-11 0-1.6 3.9h3.2z",
  barre:"M3 16V9h3v7zm5.5 0V5h3v11zM14 16v-4.5h3V16z",
  fiato:"M9 2h2v5.5l1.5 1.5c1-2.4 2.3-4 3.5-4 1.7 0 2 4 2 7 0 2.5-.6 5-2.5 5-1.6 0-2.5-1.5-3-3.2L11 12.3V18H9v-5.7L7.5 13.8C7 15.5 6.1 17 4.5 17 2.6 17 2 14.5 2 12c0-3 .3-7 2-7 1.2 0 2.5 1.6 3.5 4L9 7.5z",
  soldi:"M2 5h16a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm8 2.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  info:"M10 1.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM9 8.5V14h2V8.5zM10 5a1.2 1.2 0 1 0 0 2.4A1.2 1.2 0 0 0 10 5z",
  foto:"M7 3h6l1.5 2H18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h3.5zm3 4a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z",
  punto:"M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM9 5v6h2V5zm0 8v2h2v-2z",
  faccia:"M10 1.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zm0 1.8a6.7 6.7 0 1 0 0 13.4 6.7 6.7 0 0 0 0-13.4zM7 7.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zm6 0a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM6.3 12h7.4a4 4 0 0 1-7.4 0z",
  persona:"M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2.5 18c0-3.7 3.4-5.8 7.5-5.8s7.5 2.1 7.5 5.8z",
  spunta:"M7.8 13.6 3.9 9.7 2.5 11.1l5.3 5.3L17.5 6.7l-1.4-1.4z",
  cuore:"M10 17.5s-7.5-4.4-7.5-9.6A4.3 4.3 0 0 1 10 5.1a4.3 4.3 0 0 1 7.5 2.8c0 5.2-7.5 9.6-7.5 9.6z",
  rischio:"M10 1.5 19 17.5H1zM9 7v5h2V7zm0 6.5v2h2v-2z",
  /* le briciole del Bancone (02/10/2026) */
  spillo:"M10 1.5a6 6 0 0 1 6 6c0 4.4-6 11-6 11s-6-6.6-6-11a6 6 0 0 1 6-6zm0 3.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8z"
};
function ccIco(n){
  return '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="' + (CC_ICO[n] || "") + '"/></svg>';
}
const ccEsc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
/* I volti: nel riferimento sono ritratti, e dal 30/09 lo sono davvero — gli
   otto di `concept/simil_avatar.png`, ritagliati uno per uno in
   `media/photo/circolo/volti/` (320 × 320). Tre sono ragazze (3, 5, 8): a chi
   ha un nome da ragazza tocca uno di quelli, agli altri uno dei cinque
   ragazzi. Il volto si sceglie la prima volta che la persona compare, fra
   quelli meno usati da chi gira già, e resta suo (`p.volto`): due facce
   uguali nel retro si vedono solo quando la gente supera i volti. */
const CC_VOLTI = ["", "volto-1.jpg", "volto-2.jpg", "volto-3.jpg", "volto-4.jpg",
  "volto-5.jpg", "volto-6.jpg", "volto-7.jpg", "volto-8.jpg"];
const CC_VOLTI_LEI = [3, 5, 8], CC_VOLTI_LUI = [1, 2, 4, 6, 7];
const CC_NOMI_LEI = ["Sara", "Marta", "Elisa", "Vale", "Bea", "Sara Sette", "Vale P.", "Farah", "Miele", "Ninna", "Selva", "Nebbia"];
function circoloVolto(p){
  const pool = CC_NOMI_LEI.indexOf(String(p.n).replace(/ \d$/, "")) >= 0 ? CC_VOLTI_LEI : CC_VOLTI_LUI;
  if(pool.indexOf(p.volto) >= 0) return p.volto;
  const usati = (G.gente || []).filter(x => x !== p).map(x => x.volto);
  const uso = v => usati.filter(u => u === v).length;
  const semi = String(p.id).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  p.volto = pool.slice().sort((a, b) => uso(a) - uso(b) || ((a + semi) % pool.length) - ((b + semi) % pool.length))[0];
  return p.volto;
}
function ccFaccia(p){
  return '<img class="cc-volto" src="' + CIRCOLO_FOTO + 'volti/' + CC_VOLTI[circoloVolto(p)] + '" alt="" loading="lazy" decoding="async">';
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
/* la chiama apriLuogo (luoghi-foto.js): su che stanza si apre. Chi chiede
   ancora un riquadro di prima (l'agenda, «passa dalla Sala»: `pannello:
   "gente"`) finisce nella stanza che ne ha preso il posto. */
const CC_STANZA_DI = {gente:"sala", palco:"palco", momenti:"palco", serata:"backstage",
  bancone:"bancone", sala:"sala", backstage:"backstage"};
function circoloApri(opz){
  if(typeof sistemaGente === "function") sistemaGente();
  CIRCOLO.lampo = null;
  CIRCOLO.nessuno = false;
  CIRCOLO.detto = null;
  CIRCOLO.orari = false;
  CIRCOLO.pubblico = null;
  CIRCOLO.stanza = CC_STANZA_DI[opz.stanza || opz.pannello] || null;
  if(opz.persona) CIRCOLO.scelto = opz.persona;
}

/* ==================== LA PAGINA ====================
   La foto del locale coi quattro cartelli, e la colonna degli orari che
   sta chiusa sul bordo destro e si apre passandoci sopra col mouse — col
   tocco sul telefono (CARLO, 01/10/2026: «la barra di destra con gli
   orari deve aprirsi quando ci si passa sopra col cursore»). Un cartello
   apre la sua stanza (circolo-stanze.js); dalla stanza «Il Circolo» in alto
   torna qui. */
function circoloParti(){
  const f = circoloFascia();
  circoloStato();
  /* l'esito di un live partito da fuori (l'agenda, una card) si legge sul
     palco, dove c'è il pubblico che l'ha visto */
  if(typeof LUOGO !== "undefined" && LUOGO && LUOGO.esito && !CIRCOLO.stanza) CIRCOLO.stanza = "palco";
  /* una serata a metà è sul palco: si torna lì */
  if(circoloStato().serata) CIRCOLO.stanza = "palco";
  if(CIRCOLO.stanza && typeof circoloStanza === "function")
    return {pagina:'<div class="cc cc-in" data-fascia="' + (f ? f.id : "chiuso") + '" data-stanza="' + CIRCOLO.stanza + '">' +
      circoloStanza(CIRCOLO.stanza, f) + '</div>'};
  return {pagina:
    '<div class="cc cc-casa" data-fascia="' + (f ? f.id : "chiuso") + '">' +
      ccScena(f) + ccInfo(f) + ccPorte(f) +
    '</div>'};
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
  const palcoRighe = palco ? ["Open Mic e Live", "I momenti della serata"]
    : !f ? ["Chiuso", "Riapre alle 13:00"]
    : f.id === "aftershow" ? ["Spento per stasera", "Si riaccende alle 21:00"]
    : ["Si accende alle 21:00", "Open Mic e Live"];
  const L = LUOGHI_FOTO.circolo;
  /* la foto intera, e dietro la stessa sfocata a riempire i bordi: lo
     schermo è meno largo della foto (1250 × 526), e un ritaglio tagliava
     Bancone e Backstage */
  return '<section class="cc-scena' + (palco ? "" : " cc-buio") + '">' +
    '<div class="cc-sfondo" aria-hidden="true" style="background-image:url(&quot;' + LUOGHI_FOTO_DIR + L.f + '&quot;)"></div>' +
    '<div class="cc-quadro" style="background-image:url(&quot;' + LUOGHI_FOTO_DIR + L.f + '&quot;)">' +
    cart("bancone", "gente", "Bancone", ["Parla con le persone", "Conosci nuovi contatti"]) +
    cart("palco", "mic", "Palco", palcoRighe) +
    cart("sala", "bolla", "Sala", ["Rapper, producer,", "fonici, videomaker...", "Costruisci rapporti"]) +
    cart("backstage", "stella", "Backstage", ["Artisti della serata", "Opportunità speciali"]) +
  '</div></section>';
}

/* ---------- la colonna degli orari ----------
   Chiusa è una linguetta sul bordo destro: l'orologio, «Orari» e il
   pallino aperto/chiuso. Si apre col mouse sopra (`:hover`, solo dove il
   mouse c'è) o col tocco sulla linguetta, che la richiude. */
function ccInfo(f){
  const righe = CIRCOLO_FASCE.map(x =>
    '<li class="' + (f && f.id === x.id ? "ora" : "") + '"><span>' + x.da + ' – ' + x.a + '</span><b>' + x.n + '</b></li>').join("");
  const stato = f
    ? '<i class="cc-pallino"></i><b>Aperto</b> <span>(chiusura ore 03:00)</span>'
    : '<i class="cc-pallino no"></i><b>Chiuso</b> <span>(riapre alle 13:00)</span>';
  return '<aside class="cc-info' + (CIRCOLO.orari ? " aperta" : "") + '">' +
    '<button type="button" class="cc-linguetta" data-cc-orari="1" aria-expanded="' + (CIRCOLO.orari ? "true" : "false") + '" aria-label="Orari del Circolo">' +
      ccIco("orologio") + '<b>Orari</b><i class="cc-pallino' + (f ? "" : " no") + '"></i></button>' +
    '<div class="cc-infocorpo">' +
      '<h2 class="cc-titolo">' + CIRCOLO_NOME + '</h2>' +
      '<p class="cc-motto">Il posto della scena locale.</p>' +
      '<p class="cc-desc">Di giorno è un punto d’incontro: qui conosci rapper, producer, fonici e gente del giro. ' +
        'Di sera il palco si accende: open mic e live. Le persone che incontri possono portarti lontano.</p>' +
      '<div class="cc-orari"><h4>' + ccIco("orologio") + 'Orari oggi</h4><ul>' + righe + '</ul></div>' +
      '<p class="cc-stato">' + stato + '</p>' +
    '</div>' +
  '</aside>';
}
/* sotto i 900 punti i cartelli sulla foto sono piccoli: le quattro stanze
   sono anche quattro tasti sotto alla foto, grandi per il dito */
function ccPorte(f){
  const porta = (id, ic, t, d) => '<button type="button" class="cc-porta" data-cc-vai="' + id + '">' +
    '<i>' + ccIco(ic) + '</i><span><b>' + t + '</b><em>' + d + '</em></span><s>' + ccIco("freccia") + '</s></button>';
  const palco = f && f.palco ? "Open Mic e Live, adesso" : "Si accende alle 21:00";
  return '<nav class="cc-porte" aria-label="Le stanze del Circolo">' +
    porta("bancone", "boccale", "Bancone", "Parla con le persone, conosci nuovi contatti") +
    porta("sala", "bolla", "Sala", "Costruisci rapporti con la scena locale") +
    porta("palco", "mic", "Palco", palco) +
    porta("backstage", "stella", "Backstage", circoloBackstageAperto() ? "Artisti della serata e i tuoi fan" : "Apre con la serata, alle 21:00") +
  '</nav>';
}

/* ---------- le mosse con una persona ----------
   Le voci di posto.js (`vociDi`) come tasti: le disegnano la Sala e il
   Bancone (circolo-stanze.js). */
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

/* ---------- il palco ----------
   Dal 01/10/2026 sul palco c'è solo il live (CARLO: «sul palco deve esserci
   solo il live, e i momenti giocati»): si sale col live vero (la mossa
   `live`, un pezzo fuori) o con l'open mic, che è lo stesso palco per chi
   un pezzo fuori non ce l'ha ancora. Il freestyle sta in Piazza; Showcase e
   Opening Act, la carriera che deve venire, li mostra il backstage fra le
   cose da sbloccare. */
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
/* ---------- i momenti durante il live ----------
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
/* i tre momenti, come nel riferimento `open_mic.png` */
const CC_PASSI = ["Intro", "Prima barra", "Chiusura"];
function ccMomento(id){ return id === "bis" ? CC_BIS : CC_MOMENTI.find(m => m.id === id) || CC_MOMENTI[0]; }

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
  if(id !== "live" && id !== "openmic") return;
  if(typeof SFX === "object" && SFX.tap) SFX.tap();
  const parti = () => {
    const pool = CC_MOMENTI.filter(m => !m.se || m.se());
    const ids = [];
    while(ids.length < 3 && pool.length) ids.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0].id);
    circoloStato().serata = {key:circoloGiorno(), tipo:id, passo:0, pubblico:50, ids:ids, hl:false, detto:""};
    CIRCOLO.pubblico = null;
    if(typeof LUOGO !== "undefined" && LUOGO) LUOGO.esito = null;
    CIRCOLO.stanza = "palco";
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
  /* la reazione del pubblico resta sul palco accanto all'esito */
  CIRCOLO.pubblico = s.pubblico;
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
/* Un cartello apre la sua stanza. Al bancone la lista si apre su chi non
   conosci ancora, nella Sala sull'ultimo scelto, nel backstage
   sull'artista della serata. */
function circoloVai(dove){
  if(["bancone", "sala", "palco", "backstage"].indexOf(dove) < 0) return;
  CIRCOLO.stanza = dove;
  CIRCOLO.detto = null;
  CIRCOLO.orari = false;
  CIRCOLO.nessuno = false;
  if(dove === "bancone"){
    const nuovo = circoloPresenti().find(circoloSconosciuto);
    if(nuovo) CIRCOLO.scelto = nuovo.id;
  }
  if(dove === "backstage" && !CIRCOLO.bsSel) CIRCOLO.bsSel = "ospite";
  renderLuogo();
  const w = typeof $ === "function" && $("lf-wrap");
  if(w) w.scrollTop = 0;
}
/* «Il Circolo» in alto: si torna alla foto coi cartelli. A metà dialogo o
   sul palco a metà serata no — prima si finisce. */
function circoloEsci(){
  if(typeof POSTO_PARLA !== "undefined" && POSTO_PARLA) POSTO_PARLA = null;
  if(circoloStato().serata) return;
  if(typeof LUOGO !== "undefined" && LUOGO) LUOGO.esito = null;
  CIRCOLO.stanza = null;
  CIRCOLO.detto = null;
  CIRCOLO.pubblico = null;
  renderLuogo();
}
/* dopo il disegno: la chiama renderLuogo (luoghi-foto.js) */
function circoloDopoDisegno(wrap){
  CIRCOLO.lampo = null;
}

if($("luogo")){
  $("luogo").addEventListener("click", e => {
    if(typeof LUOGO === "undefined" || !LUOGO || LUOGO.id !== "circolo") return;
    const t = e.target.closest("button");
    if(!t || t.disabled) return;
    const d = t.dataset;
    if(d.ccOrari){ if(SFX.tap) SFX.tap(); CIRCOLO.orari = !CIRCOLO.orari; renderLuogo(); return; }
    if(d.ccVai){ if(SFX.tap) SFX.tap(); circoloVai(d.ccVai); return; }
    if(d.ccEsci){ if(SFX.tap) SFX.tap(); circoloEsci(); return; }
    if(d.ccFiltro){ if(SFX.tap) SFX.tap(); CIRCOLO.filtro = d.ccFiltro; renderLuogo(); return; }
    if(d.ccChi){
      if(typeof POSTO_PARLA !== "undefined" && POSTO_PARLA) return;   /* a metà dialogo non si cambia persona */
      if(SFX.tap) SFX.tap();
      const qui = circoloPresenti().some(p => p.id === d.ccChi);
      CIRCOLO.scelto = d.ccChi; CIRCOLO.nessuno = false; CIRCOLO.detto = null;
      /* «Chi c'è stasera»: chi non è ancora arrivato si guarda dalla Sala */
      if(!qui && typeof toast === "function")
        toast("Arriva più tardi, stasera. Adesso non è qui.", "", "…", ["#3A3F49", "#22262E"]);
      if(CIRCOLO.stanza !== "bancone") CIRCOLO.stanza = "sala";
      renderLuogo(); return;
    }
    if(d.ccBs){ if(SFX.tap) SFX.tap(); CIRCOLO.bsSel = d.ccBs; CIRCOLO.detto = null; renderLuogo(); return; }
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
    /* le mosse nuove delle stanze (circolo-incontri.js) */
    if(d.ccBan){ circoloBancone(d.ccBan, CIRCOLO.scelto); return; }
    if(d.ccBsm){ circoloBackstage(d.ccBsm, CIRCOLO.bsSel); return; }
    if(d.ccFan){ circoloFanMossa(d.ccFan, d.fan); return; }
    if(d.ccPalco){ circoloPalco(d.ccPalco); return; }
    if(d.ccMomento != null){ circoloScegli(+d.ccMomento); return; }
    /* il beat sul tavolo: ascolta, prendi, lascia (come nella Sala di prima) */
    if(d.sent != null){ const b = G.market[+d.sent]; if(b && typeof beatSuona === "function") beatSuona(b, t); return; }
    if(d.prendi != null){ const b = G.market[+d.prendi]; if(b && prendiBeatDalBanco(b)) renderLuogo(); return; }
    if(d.lascia != null){ lasciaBeatSala(+d.lascia); return; }
  });
}
