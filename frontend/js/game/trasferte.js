/*
 * ANNI DI FAME — TRASFERTE FUORI CITTÀ E CATENE DI OPPORTUNITÀ
 * (implementazioni.md, «Da smistare» punto 9)
 *
 * Si carica DOPO eventi-v2.js e eventi-tempo.js: usa il loro centro notifiche,
 * la modale di modal.js, la rete contatti di posto.js e il calendario di sim.js.
 *
 * Cosa fa, in una riga: quando qualcuno fuori dalla tua provincia comincia a
 * sapere chi sei, ti chiama. E una chiamata non è un bottone che dà fan — è una
 * piccola spedizione:
 *
 *     invito → viaggio → evento principale → incontri → conseguenze → nuove occasioni
 *
 * Le regole che tengono insieme tutto:
 *
 * - **L'invito è una scelta, non un premio.** Arriva come notifica sul telefono e
 *   apre una decisione vera: accetti pagando viaggio, energia e giorni; rimandi;
 *   oppure rifiuti, e chi ti ha chiamato se lo ricorda. Rifiutare di continuo
 *   raffredda il giro e fa arrivare meno telefonate.
 *
 * - **Non serve aver sbloccato la città.** Ci vai due giorni e torni: la trasferta
 *   non sposta l'hub, sposta te. La mappa d'Italia, quando arriverà, troverà qui
 *   i dati già pronti (`G.trasferte.citta`).
 *
 * - **Le persone si conoscono lavorando, non in un menù.** Nel backstage di un
 *   live incontri un fonico, a uno shooting un videomaker, in studio un producer
 *   che ti presenta un altro. Ogni incontro entra in `G.gente` come tutti gli
 *   altri contatti — con ruolo, città, grado del rapporto e, per i pesci grossi,
 *   un requisito da soddisfare prima di poterci fare qualcosa.
 *
 * - **Le conoscenze richiamano.** Chi ti ha preso in simpatia può rifarsi vivo
 *   settimane dopo con un altro lavoro, o presentarti a qualcun altro
 *   (`G.trasferte.catene`). È questo che rende la catena diversa fra una partita
 *   e l'altra: non c'è uno script, ci sono persone con una probabilità.
 *
 * - **Le città si ricordano di te.** Ogni trasferta lascia fan locali e
 *   reputazione in quella città, e da lì in poi da quella città ti chiamano più
 *   spesso. È il seme del tour: `G.trasferte.citta[id]` è già la mappa d'Italia,
 *   solo senza il disegno sopra.
 */
"use strict";

(function(){

/* ============================================================
   LE CITTÀ
   ------------------------------------------------------------
   Non c'è una geografia vera (la città di partenza la scrive il giocatore),
   quindi `dist` non sono chilometri: è quanto ti costa arrivarci — soldi, ore,
   e se ti tocca dormire fuori. `scena` è quanto conta quel giro: decide cachet,
   fan e che razza di gente incontri. `ruoli` è l'affinità della città: a Rimini
   incontri DJ e proprietari di club, a Milano A&R e manager. Serve a non far
   uscire sempre le stesse facce.
   ============================================================ */
const CITTA = [
  {id:"milano",   n:"Milano",   dist:3, scena:10, peso:1.5,
   ruoli:{ar:1.9, manager:1.7, brand:1.6, stylist:1.4, fotografo:1.3, promoter:1.2, beatmaker:1.2}},
  {id:"roma",     n:"Roma",     dist:3, scena:9,  peso:1.3,
   ruoli:{videomaker:1.6, fotografo:1.4, rapper:1.3, manager:1.2, promoter:1.2}},
  {id:"bologna",  n:"Bologna",  dist:2, scena:7,  peso:1.25,
   ruoli:{fonico:1.6, promoter:1.4, dj:1.3, rapper:1.2, club:1.2}},
  {id:"torino",   n:"Torino",   dist:2, scena:7,  peso:1.15,
   ruoli:{beatmaker:1.6, fonico:1.3, videomaker:1.3, rapper:1.2}},
  {id:"napoli",   n:"Napoli",   dist:3, scena:8,  peso:1.15,
   ruoli:{rapper:1.7, beatmaker:1.3, club:1.3, promoter:1.2}},
  {id:"firenze",  n:"Firenze",  dist:2, scena:6,  peso:.95,
   ruoli:{fotografo:1.5, stylist:1.4, promoter:1.2, brand:1.2}},
  {id:"verona",   n:"Verona",   dist:1, scena:5,  peso:.95,
   ruoli:{promoter:1.4, club:1.3, dj:1.2}},
  {id:"padova",   n:"Padova",   dist:1, scena:5,  peso:.9,
   ruoli:{fonico:1.3, rapper:1.2, dj:1.2}},
  {id:"brescia",  n:"Brescia",  dist:1, scena:4,  peso:.8,
   ruoli:{fonico:1.3, rapper:1.2, promoter:1.1}},
  {id:"genova",   n:"Genova",   dist:2, scena:5,  peso:.85,
   ruoli:{rapper:1.4, fonico:1.2, club:1.2}},
  {id:"rimini",   n:"Rimini",   dist:2, scena:4,  peso:.85,
   ruoli:{dj:1.8, club:1.6, promoter:1.3}},
  {id:"perugia",  n:"Perugia",  dist:2, scena:4,  peso:.75,
   ruoli:{promoter:1.3, rapper:1.1, fotografo:1.1}},
  {id:"pescara",  n:"Pescara",  dist:2, scena:3,  peso:.7,
   ruoli:{club:1.4, dj:1.2, rapper:1.1}},
  {id:"bari",     n:"Bari",     dist:3, scena:5,  peso:.9,
   ruoli:{rapper:1.4, promoter:1.2, dj:1.2}},
  {id:"palermo",  n:"Palermo",  dist:3, scena:5,  peso:.8,
   ruoli:{rapper:1.4, club:1.2, fotografo:1.1}},
  {id:"catania",  n:"Catania",  dist:3, scena:4,  peso:.75,
   ruoli:{rapper:1.3, dj:1.2, club:1.2}},
  {id:"cagliari", n:"Cagliari", dist:3, scena:3,  peso:.7,
   ruoli:{promoter:1.2, dj:1.2, club:1.2}},
  {id:"trieste",  n:"Trieste",  dist:2, scena:3,  peso:.65,
   ruoli:{fonico:1.2, promoter:1.1, videomaker:1.1}}
];
const CITTA_BY_ID = CITTA.reduce((a, c) => { a[c.id] = c; return a; }, {});

/* ============================================================
   I RUOLI DI CHI INCONTRI
   ------------------------------------------------------------
   Tre esistono già nella Sala (beatmaker, rapper, fonico) e li riusiamo per
   intero: un producer conosciuto a Torino che ti dà il numero finisce nelle chat
   con le stesse battute di quelli di casa, e va bene così — è la stessa persona,
   cambia solo dove l'hai incontrata. Gli altri nove sono nuovi e li registriamo
   dentro a POSTO_RUOLI, se no la Sala e il telefono si troverebbero fra le mani
   un `ruolo` che non sanno disegnare.
   ============================================================ */
const RUOLI = {
  beatmaker: {n:"Producer", k:"#4ADE80",
    d:"Fa le basi. Se gli piaci ti fa sentire roba prima che la senta chiunque altro.",
    nomi:["Zeno", "Kito", "Marra B.", "Sette", "Ruggine", "Fango", "Nasty P.", "Dorian", "Nico Loop", "Ventuno"]},
  rapper: {n:"Rapper", k:"#A855F7",
    d:"Uno come te, con la sua città alle spalle. Può diventare un pezzo o un problema.",
    nomi:null},
  fonico: {n:"Fonico", k:"#38BDF8",
    d:"Sta dietro al mixer. Conosce ogni sala della sua città e chi ci lavora.",
    nomi:["Ivan", "Paola", "Cencio", "Miro", "Beppe", "Rana", "Tonino", "Lisa"]},
  videomaker: {n:"Videomaker", k:"#22D3EE",
    d:"Gira i video. Decide come ti si vede, prima ancora di come suoni.",
    nomi:["Tommy", "Cri", "Vlad", "Simo", "Zara", "Bruno", "Kevin", "Neri"]},
  fotografo: {n:"Fotografo", k:"#F472B6",
    d:"Scatta. Una foto giusta ti fa sembrare arrivato sei mesi prima.",
    nomi:["Ale F.", "Ninni", "Greta", "Cosimo", "Ruben", "Sole", "Manu"]},
  stylist: {n:"Stylist", k:"#FCD34D",
    d:"Ti veste. Non è vanità: è il primo pezzo di te che arriva a chi non ti ha mai sentito.",
    nomi:["Deby", "Ciro", "Lena", "Yuri", "Fabri", "Nadia", "Otto S."]},
  promoter: {n:"Promoter", k:"#FB923C",
    d:"Riempie le date. Se si fida di te ti mette dove le persone ci sono già.",
    nomi:["Fusco", "Bea", "Il Marchese", "Ricky", "Sandra", "Pino Live", "Tonda"]},
  manager: {n:"Manager", k:"#818CF8",
    d:"Gestisce artisti. Ti guarda per capire se sei un lavoro o una perdita di tempo.",
    nomi:["Vallone", "Carla D.", "Testa", "Bianchi", "Moroni", "Serena L."]},
  dj: {n:"DJ", k:"#34D399",
    d:"Fa ballare la sua città. Se ti mette in scaletta ti sente gente che non ti cercava.",
    nomi:["Dj Ombra", "Kaso", "Selva", "Dj Nube", "Turbo", "Mimì", "Basso"]},
  club: {n:"Proprietario di club", k:"#F87171",
    d:"Ha le chiavi del posto. Non gli interessa la tua arte, gli interessa il sabato pieno.",
    nomi:["Berto", "Nadia V.", "Il Conte", "Peppe R.", "Anna B.", "Dorio"]},
  brand: {n:"Brand / agenzia", k:"#A3E635",
    d:"Paga bene e ti vuole pulito. Quello che ti chiede di essere non sempre sei tu.",
    nomi:["Colle Studio", "Nord Adv", "Sedici Agency", "Vetro Lab", "Casa Rossa", "Piano B"]},
  ar: {n:"A&R", k:"#C084FC",
    d:"Scouta per un'etichetta. Ti dà il numero e poi sparisce per sei mesi. È il mestiere.",
    nomi:["Ferrante", "Luce", "Ghezzi", "Dea", "Tosi", "Marani"]}
};
const RUOLI_NUOVI = ["videomaker", "fotografo", "stylist", "promoter", "manager", "dj", "club", "brand", "ar"];

/* ============================================================
   I REQUISITI PER SVILUPPARE UN CONTATTO
   ------------------------------------------------------------
   Un A&R conosciuto a un festival non è un A&R che ti risponde: il numero ce
   l'hai, il peso per usarlo no. Il requisito sta sulla persona come **chiave**
   (`reqKey`) e non come funzione, se no il salvataggio se lo mangerebbe.
   ============================================================ */
const REQUISITI = {
  aperto:     {t:"niente: dipende solo da te",                ok:() => true},
  fan1k:      {t:"mille persone che ti seguono",              ok:() => (G.fans || 0) >= 1000},
  fan5k:      {t:"cinquemila persone che ti seguono",         ok:() => (G.fans || 0) >= 5000},
  fan20k:     {t:"ventimila persone che ti seguono",          ok:() => (G.fans || 0) >= 20000},
  hype40:     {t:"hype 40",                                   ok:() => (G.hype || 0) >= 40},
  hype60:     {t:"hype 60",                                   ok:() => (G.hype || 0) >= 60},
  pezzoBuono: {t:"un pezzo fuori sopra la sufficienza",        ok:() => (G.songs || []).some(s => s.released && (s.q || 0) >= 55)},
  tornarci:   {t:"tornare in quella città almeno un'altra volta",
               ok:p => (cittaStato(p && p.citta).visite || 0) >= 2},
  affidabile: {t:"reputazione 45 nel giro",                   ok:() => reputazione() >= 45},
  duefacce:   {t:"conoscere già altre due persone di quella città",
               ok:p => rete(p && p.citta).filter(x => x.id !== (p && p.id) && (x.rel || 0) >= 1).length >= 2}
};

/* Più il mestiere sta in alto nella catena alimentare, più chiede prima di
   guardarti in faccia. Le tre voci sono le tre fasce di scena della città. */
const REQ_RUOLO = {
  beatmaker:  ["aperto", "aperto", "pezzoBuono"],
  fonico:     ["aperto", "aperto", "tornarci"],
  rapper:     ["aperto", "fan1k", "pezzoBuono"],
  videomaker: ["aperto", "fan1k", "hype40"],
  fotografo:  ["aperto", "fan1k", "tornarci"],
  stylist:    ["fan1k", "hype40", "duefacce"],
  dj:         ["aperto", "fan1k", "tornarci"],
  promoter:   ["fan1k", "affidabile", "duefacce"],
  club:       ["fan1k", "affidabile", "tornarci"],
  manager:    ["fan5k", "hype40", "affidabile"],
  brand:      ["fan5k", "hype40", "hype60"],
  ar:         ["fan5k", "fan20k", "hype60"]
};

/* ============================================================
   HELPER
   ============================================================ */
const cl = (v, a, b) => Math.max(a, Math.min(b, v));
const ri = (a, b) => Math.round(a + Math.random() * (b - a));
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, ch =>
  ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"}[ch]));
const eur = n => (typeof fmt === "function" ? fmt(n) : String(Math.round(n))) + " €";

function artista(){ try{ return window.ARTIST || {}; }catch(e){ return {}; } }
function mioNome(){ return String(artista().name || "").trim() || "tu"; }
function normalizza(s){
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");
}
/* la città di partenza la scrive il giocatore: se ha scritto «Bologna», da
   Bologna non lo chiama nessuno — ci abita */
function casaMia(){ return normalizza(artista().city); }

function assoluto(){
  return (((G.year || 1) - 1) * 52 + ((G.week || 1) - 1)) * 7 + (G.day || 1);
}
function quandoTesto(abs){
  const d = abs - assoluto();
  if(d <= 0) return "adesso";
  if(d === 1) return "domani";
  if(d < 7) return "fra " + d + " giorni";
  const s = Math.round(d / 7);
  return s <= 1 ? "fra una settimana" : "fra " + s + " settimane";
}

/* ------------------ lo stato ------------------ */
function st(){
  if(!G.trasferte || typeof G.trasferte !== "object") G.trasferte = {};
  const s = G.trasferte;
  if(typeof s.seq !== "number") s.seq = 0;
  if(!Array.isArray(s.inviti)) s.inviti = [];
  if(!Array.isArray(s.catene)) s.catene = [];
  if(!Array.isArray(s.storico)) s.storico = [];
  if(!s.citta || typeof s.citta !== "object") s.citta = {};
  if(s.attiva === undefined) s.attiva = null;
  /* la reputazione nel giro: non è la fama, è quanto sei uno su cui contare.
     Parte a metà — nessuno ti conosce, nessuno ha motivo di diffidare. */
  if(typeof s.rep !== "number") s.rep = 50;
  if(typeof s.rifiutiFila !== "number") s.rifiutiFila = 0;
  if(typeof s.ultimoInvito !== "number") s.ultimoInvito = -99;
  if(typeof s.ultimaTrasferta !== "number") s.ultimaTrasferta = -99;
  if(typeof s.ultimoGiorno !== "number") s.ultimoGiorno = 0;
  return s;
}
function cittaStato(id){
  const s = st();
  if(!id) return {visite:0, fan:0, rep:0, ultima:-99, inviti:0};
  if(!s.citta[id]) s.citta[id] = {visite:0, fan:0, rep:0, ultima:-99, inviti:0};
  return s.citta[id];
}
/* punto 12: la reputazione non e' piu' roba solo delle trasferte — e' una
   statistica della partita (js/game/reputazione.js, `G.rep`). Qui si continua a
   leggerla e a muoverla con gli stessi nomi di prima, ma il numero e' uno solo:
   chi ti chiama da fuori citta' guarda la stessa reputazione che guardano alla
   Sala, al lavoro e per strada. Se il file nuovo non c'e' si ricasca sul vecchio
   `st().rep`, cosi' questo modulo resta capace di girare da solo. */
function reputazione(){
  if(typeof repValore === "function") return repValore();
  return Math.round(cl(st().rep, 0, 100));
}
function addRep(n, perche){
  if(typeof repAggiungi === "function"){ st().rep = repAggiungi(n, perche); return; }
  const s = st(); s.rep = cl(s.rep + n, 0, 100);
}

function salva(){ try{ if(typeof save === "function") save(); }catch(e){} }
function diario(t, c){ try{ if(typeof pushLog === "function") pushLog(t, c || ""); }catch(e){} }
function avviso(html, cls, ic, tint){
  try{ if(typeof toast === "function") toast(html, cls || "", ic || "◆", tint || ["#7C3AED", "#2A1055"]); }catch(e){}
}
function notifica(dati){
  try{
    if(window.ADF_EVENTI && typeof window.ADF_EVENTI.addNotification === "function")
      window.ADF_EVENTI.addNotification(Object.assign({source:"trasferte", family:"Trasferta"}, dati));
  }catch(e){}
}

/* ------------------ la rete fuori città ------------------ */
function rete(cittaId){
  return (G.gente || []).filter(p => p.fuori && !p.via && (!cittaId || p.citta === cittaId));
}
function conosciuti(cittaId){ return rete(cittaId).filter(p => (p.rel || 0) >= 1); }
function personaPerId(id){ return (G.gente || []).find(p => p.id === id) || null; }
function ruoloInfo(r){ return RUOLI[r] || (typeof POSTO_RUOLI !== "undefined" ? POSTO_RUOLI[r] : null) || {n:r, k:"#9AA1B2", d:""}; }
function gradoNome(p){
  const nomi = (typeof REL_NOMI !== "undefined") ? REL_NOMI : ["conoscenza", "contatto", "amico", "collaboratore", "fidato", "partner"];
  return nomi[cl(p.rel || 0, 0, nomi.length - 1)];
}
function requisito(p){ return REQUISITI[p && p.reqKey] || REQUISITI.aperto; }
function requisitoOk(p){ try{ return !!requisito(p).ok(p); }catch(e){ return true; } }

/* ============================================================
   I TIPI DI TRASFERTA
   ------------------------------------------------------------
   Dodici motivi per cui qualcuno ti fa salire su un treno. Ognuno porta con sé
   il suo prezzo (viaggio, energia, giorni), la sua resa e — la parte che conta —
   la sua gente: a uno shooting non conosci un promoter, conosci chi tiene la
   luce. `incontri` è quel filtro lì.
   ============================================================ */
const TIPI = [
  {id:"live", n:"Una data live", k:"#FF5A36", ic:"mic", giorni:1, base:{energia:38, ore:9},
   soglia:{fans:300, rep:30},
   incontri:{fonico:1.5, beatmaker:.9, promoter:1.2, dj:.9, club:.8, rapper:1.0},
   nMax:3,
   chiama:c => "il promoter di un locale di " + c.n,
   invito:(c, da) => "Una data libera fra poco in un locale di <b>" + esc(c.n) + "</b>. " +
     (da ? "Ti ci ha messo <b>" + esc(da) + "</b>. " : "Hanno sentito qualcosa di tuo e ti vogliono in cartellone. ") +
     "Quaranta minuti tuoi, prima di chi chiude la serata.",
   scena:c => "Il locale è più piccolo di come te lo eri immaginato e più pieno di come temevi. " +
     "Il fonico ti fa un cenno dalla consolle: la voce te la sistema lui, il resto è tuo. " +
     "Sotto ci sono duecento persone di <b>" + esc(c.n) + "</b> che non ti hanno mai visto in faccia.",
   azioni:() => [
     {n:"Fai il set che avevi in testa", d:"Quello che sai fare, fatto bene. Nessuna sorpresa.",
      esito:{fan:1, hype:1, soldi:1, incontri:1, energia:1, well:0,
        t:"Set pulito, chiuso in tempo. Nessuno se ne va prima della fine."}},
     {n:"Butti dentro il pezzo nuovo", d:"Non l'hai mai provato dal vivo. O li prendi, o li perdi.",
      rischio:g => .40 + Math.min(.35, ((g.skills || {}).presenza || 0) / 60) + (g.hype || 0) / 400,
      esito:{fan:1.7, hype:1.6, soldi:1, incontri:1.25, energia:1.15, well:-2,
        t:"Il pezzo nuovo tiene. A metà ritornello sotto c'è gente che prova a seguirti."},
      esitoNo:{fan:.55, hype:.6, soldi:1, incontri:.85, energia:1.15, well:-6,
        t:"Il pezzo nuovo non regge il palco. Si sente il vuoto fra una barra e l'altra."}},
     {n:"Resti fino a che chiudono", d:"Meno riposo, ma il backstage è dove si conosce la gente.",
      esito:{fan:1.1, hype:1.1, soldi:1, incontri:1.8, energia:1.35, well:-5,
        t:"Sei rimasto fino alle sedie sui tavoli. Metà delle cose utili succedono lì."}}
   ]},

  {id:"apertura", n:"Apertura di un nome grosso", k:"#FACC15", ic:"corona", giorni:1, base:{energia:42, ore:10},
   soglia:{fans:2500, hype:25, rep:40},
   incontri:{rapper:1.5, manager:1.1, promoter:1.1, fonico:.9, ar:.8, fotografo:.7},
   nMax:3,
   chiama:c => "il management di un artista in giro per l'Italia",
   invito:(c, da) => "Cercano un opening act per la data di <b>" + esc(c.n) + "</b>. " +
     (da ? "Il tuo nome l'ha fatto <b>" + esc(da) + "</b>. " : "") +
     "Trenta minuti davanti a gente venuta per un altro: è la palestra più dura che c'è.",
   scena:c => "Il palco è il più grande su cui sei mai salito e non è tuo. " +
     "Sotto, a <b>" + esc(c.n) + "</b>, ci sono millecinquecento persone che stanno aspettando qualcun altro " +
     "e che ti guardano come si guarda l'attesa.",
   azioni:() => [
     {n:"Suoni come se fossero venuti per te", d:"Presenza pura. Se non ce l'hai si vede da lontano.",
      rischio:g => .28 + Math.min(.45, ((g.skills || {}).presenza || 0) / 45),
      esito:{fan:2.1, hype:1.9, soldi:1, incontri:1.4, energia:1.2, well:-3,
        t:"Li hai presi. A metà set le teste in fondo hanno smesso di guardare il telefono."},
      esitoNo:{fan:.5, hype:.5, soldi:1, incontri:.8, energia:1.2, well:-8,
        t:"Trenta minuti lunghissimi. Applausi di educazione e una sensazione che ti resta addosso."}},
     {n:"Fai il tuo, corto e preciso", d:"Non ti bruci. Non ti ricorda nessuno.",
      esito:{fan:.9, hype:.85, soldi:1, incontri:1, energia:.9, well:0,
        t:"Set corto e senza errori. Chi doveva lavorare ha lavorato, tu compreso."}},
     {n:"Cerchi l'headliner nel backstage", d:"Umiliante o decisivo, dipende da come ci arrivi.",
      rischio:g => .3 + Math.min(.4, ((g.skills || {}).rete || 0) / 55) + (g.hype || 0) / 500,
      esito:{fan:1.1, hype:1.25, soldi:1, incontri:2.1, energia:1.15, well:-2,
        t:"Cinque minuti veri, non di circostanza. Ti ha chiesto lui come ti chiami."},
      esitoNo:{fan:1, hype:.95, soldi:1, incontri:1.1, energia:1.15, well:-4,
        t:"Non ti ha filato. In compenso hai fatto due chiacchiere con chi ci lavora attorno."}}
   ]},

  {id:"festival", n:"Un festival", k:"#B026FF", ic:"nota", giorni:2, base:{energia:55, ore:12},
   soglia:{fans:4000, hype:30, rep:45},
   incontri:{promoter:1.5, rapper:1.4, manager:1.1, dj:1.0, ar:.9, fotografo:.9, videomaker:.7},
   nMax:4,
   chiama:c => "l'organizzazione di un festival",
   invito:(c, da) => "Due giorni di festival a <b>" + esc(c.n) + "</b>, palco secondario, orario decente. " +
     (da ? "Ti ha segnalato <b>" + esc(da) + "</b>. " : "") +
     "Dormi lì, mangi lì, e nel backstage c'è mezza scena italiana in ciabatte.",
   scena:c => "Due giorni a <b>" + esc(c.n) + "</b>: prato, polvere, un palco tuo alle sette di sera e un pass " +
     "che apre porte che a casa non esistono. Il concerto è la metà del motivo per cui sei qui.",
   azioni:() => [
     {n:"Concentrati sul palco", d:"Il set migliore possibile, poi via a dormire.",
      esito:{fan:1.6, hype:1.4, soldi:1, incontri:.85, energia:1, well:-3,
        t:"Set solido davanti a gente che non ti conosceva. Il prato era pieno a metà, ed è tanto."}},
     {n:"Vivi il backstage per due giorni", d:"Suoni normale e passi il resto del tempo fra le persone.",
      esito:{fan:1.1, hype:1.05, soldi:1, incontri:2.2, energia:1.3, well:-6,
        t:"Hai suonato onestamente e passato quarantott'ore in mezzo a gente che lavora. Vale più del set."}},
     {n:"Ti fai vedere ovunque, anche dove non sei invitato", d:"Ad alcuni piaci, ad altri diventi il tizio insistente.",
      rischio:g => .35 + Math.min(.4, ((g.skills || {}).rete || 0) / 50),
      esito:{fan:1.3, hype:1.5, soldi:1, incontri:2.4, energia:1.35, well:-7, rep:3,
        t:"Sei finito in ogni foto e in tre conversazioni che contavano. Faccia tosta premiata."},
      esitoNo:{fan:1, hype:.9, soldi:1, incontri:1.2, energia:1.35, well:-9, rep:-5,
        t:"Ti hanno fatto capire due volte che stavi dove non dovevi. Il giro è piccolo e si racconta."}}
   ]},

  {id:"showcase", n:"Uno showcase", k:"#3DC7FF", ic:"cursori", giorni:1, base:{energia:26, ore:6},
   soglia:{fans:600, rep:30},
   incontri:{club:1.2, promoter:1.2, dj:1.0, rapper:.9, fotografo:.7, fonico:.6},
   nMax:2,
   chiama:c => "un negozio di dischi di " + c.n,
   invito:(c, da) => "Uno showcase a <b>" + esc(c.n) + "</b>: mezz'ora, impianto piccolo, quaranta persone strette. " +
     (da ? "Te lo gira <b>" + esc(da) + "</b>. " : "") + "Pagano poco e ti guardano tutti in faccia.",
   scena:c => "Non è un concerto: è una stanza a <b>" + esc(c.n) + "</b> con quaranta persone a due metri da te " +
     "e nessun buio dietro cui nascondersi. Chi è venuto, è venuto per sentire te.",
   azioni:() => [
     {n:"Fai le cose come vanno fatte", d:"Mezz'ora, saluti, foto a chi le chiede.",
      esito:{fan:1, hype:1, soldi:1, incontri:1.1, energia:1, well:0,
        t:"Mezz'ora onesta e venti minuti a parlare con chi è rimasto."}},
     {n:"Trasformi la mezz'ora in un a cappella", d:"Niente base, solo voce. Nudo.",
      rischio:g => .35 + Math.min(.42, ((g.skills || {}).flow || 0) / 50),
      esito:{fan:1.5, hype:1.6, soldi:1, incontri:1.3, energia:1.1, well:-2,
        t:"A cappella, in una stanza muta. Qualcuno ha ripreso tutto e quel video ha girato."},
      esitoNo:{fan:.7, hype:.8, soldi:1, incontri:.9, energia:1.1, well:-4,
        t:"Senza base ti si è sentito ogni respiro storto. Applausi corti."}},
     {n:"Resti a vendere le tue cose a mano", d:"Poca gloria, ma paga il viaggio e resta il contatto.",
      esito:{fan:1.05, hype:.9, soldi:1.7, incontri:1.2, energia:1.1, well:-1,
        t:"Hai venduto roba tua a mano, una copia alla volta. Non è flex, sono soldi veri."}}
   ]},

  {id:"comparsata", n:"Una comparsata in serata", k:"#34D399", ic:"maschera", giorni:1, base:{energia:30, ore:8},
   soglia:{fans:1200, hype:20, rep:35},
   incontri:{dj:1.5, club:1.3, promoter:1.0, rapper:.8},
   nMax:2,
   chiama:c => "il DJ resident di un locale di " + c.n,
   invito:(c, da) => "Una serata a <b>" + esc(c.n) + "</b>: sali sopra due pezzi verso l'una e mezza, prendi i soldi e vai. " +
     (da ? "Ti chiama <b>" + esc(da) + "</b>. " : "") + "Non è arte, è mestiere.",
   scena:c => "L'una e mezza a <b>" + esc(c.n) + "</b>, locale pieno di gente che non è venuta per la musica. " +
     "Hai due pezzi e un microfono che pizzica. In consolle il DJ aspetta un tuo cenno.",
   azioni:() => [
     {n:"Due pezzi, i soldi, a casa", d:"Il lavoro per cui ti hanno chiamato.",
      esito:{fan:1, hype:1, soldi:1.2, incontri:1, energia:.9, well:-1,
        t:"Due pezzi e busta. Nessuno si è ricordato niente, e va benissimo così."}},
     {n:"Ti fermi in consolle con il DJ", d:"Meno sonno, un rapporto in più.",
      esito:{fan:1.05, hype:1.05, soldi:1, incontri:1.9, energia:1.25, well:-4,
        t:"Sei rimasto in consolle fino a chiusura. Adesso quel locale ha una faccia, per te."}},
     {n:"Fai come se fosse un concerto tuo", d:"O ti amano, o gli hai rovinato la serata al gestore.",
      rischio:g => .38 + Math.min(.38, ((g.skills || {}).presenza || 0) / 52),
      esito:{fan:1.6, hype:1.4, soldi:1.2, incontri:1.2, energia:1.2, well:-3,
        t:"Hai preso il locale e l'hai girato dalla tua parte. Il gestore ti ha già richiesto."},
      esitoNo:{fan:.8, hype:.85, soldi:1, incontri:.8, energia:1.2, well:-5, rep:-3,
        t:"Hai spinto troppo su gente che voleva ballare. Ti hanno tolto il microfono a metà."}}
   ]},

  {id:"studio", n:"Una sessione in studio", k:"#4ADE80", ic:"manopole", giorni:1, base:{energia:44, ore:9},
   soglia:{fans:200, rep:30},
   incontri:{beatmaker:1.6, fonico:1.4, rapper:.9, ar:.5},
   nMax:3,
   chiama:c => "un producer di " + c.n,
   invito:(c, da) => "Una giornata in una sala di <b>" + esc(c.n) + "</b>, roba seria, di quelle che a casa non trovi. " +
     (da ? "Ti ci porta <b>" + esc(da) + "</b>. " : "") + "Non paga niente: paga in quello che esce dalla sala.",
   scena:c => "La sala di <b>" + esc(c.n) + "</b> è tre volte quella a cui sei abituato e si sente al primo take. " +
     "Hai dodici ore, un producer che ti guarda lavorare e nessuna scusa.",
   azioni:() => [
     {n:"Chiudi un pezzo dall'inizio alla fine", d:"Il motivo per cui sei venuto fin qui.",
      esito:{fan:.8, hype:1, soldi:.6, incontri:1.2, energia:1.15, well:-2, skill:{scrittura:1.4, flow:.8},
        t:"Un pezzo chiuso in una sala vera. Si sente la differenza già in cuffia."}},
     {n:"Stai a guardare come lavorano", d:"Non porti a casa un pezzo, porti a casa il mestiere.",
      esito:{fan:.6, hype:.8, soldi:.6, incontri:1.5, energia:.85, well:1, skill:{scrittura:.8, flow:.6, rete:1.2},
        t:"Hai passato mezza giornata dietro le loro spalle a guardare. Hai imparato più che in tre mesi da solo."}},
     {n:"Provi a farti dare una base gratis", d:"Se sbagli il tono passi per quello che chiede e basta.",
      rischio:g => .32 + Math.min(.4, ((g.skills || {}).rete || 0) / 48),
      esito:{fan:.7, hype:1, soldi:.6, incontri:1.3, energia:1, well:0, beat:true,
        t:"Te l'ha mandata. Non ti ha chiesto un euro, ti ha chiesto di farci qualcosa di buono."},
      esitoNo:{fan:.6, hype:.85, soldi:.6, incontri:.85, energia:1, well:-3, rep:-3,
        t:"Ha capito subito dove volevi arrivare. Non ha detto niente, ma è cambiata l'aria."}}
   ]},

  {id:"collabo", n:"Una collaborazione", k:"#A855F7", ic:"duebolle", giorni:1, base:{energia:40, ore:8},
   soglia:{fans:1500, rep:38},
   incontri:{rapper:1.6, beatmaker:1.2, fonico:.9, ar:.6, manager:.5},
   nMax:2,
   chiama:c => "un rapper di " + c.n,
   invito:(c, da) => "Un pezzo insieme, sala già prenotata a <b>" + esc(c.n) + "</b>. " +
     (da ? "Te lo propone <b>" + esc(da) + "</b>. " : "") +
     "Ha più numeri di te, e la strofa buona la vuole per sé.",
   scena:c => "Sala prenotata a <b>" + esc(c.n) + "</b>, otto ore, due rapper e una base sola. " +
     "Il pezzo uscirà a nome suo con te sopra. Adesso si decide quanto di quel pezzo è tuo.",
   azioni:() => [
     {n:"Gli lasci il pezzo e fai la tua strofa", d:"Rapporto pulito, la metà dei fan che porterebbe.",
      esito:{fan:1.3, hype:1.2, soldi:1, incontri:1.3, energia:1, well:0, rep:2,
        t:"Hai fatto la tua strofa e non hai rotto le scatole a nessuno. Vi risentirete."}},
     {n:"Ti prendi il ritornello", d:"Il pezzo diventa anche tuo, ma glielo devi strappare.",
      rischio:g => .3 + Math.min(.45, (((g.skills || {}).scrittura || 0) + ((g.skills || {}).flow || 0)) / 90),
      esito:{fan:2.0, hype:1.7, soldi:1.2, incontri:1.2, energia:1.15, well:-2,
        t:"Il ritornello è tuo e regge tutto il pezzo. Se lo sono tenuto perché era troppo buono per toglierlo."},
      esitoNo:{fan:.7, hype:.75, soldi:.9, incontri:.8, energia:1.15, well:-5, rep:-4,
        t:"Hai insistito su un ritornello che non teneva. Il pezzo lo chiuderanno senza di te."}},
     {n:"Chiedi di scriverlo insieme, riga per riga", d:"Lento, faticoso, e si costruisce una cosa vera.",
      esito:{fan:1.4, hype:1.3, soldi:1, incontri:1.6, energia:1.3, well:-3, rep:3, skill:{scrittura:1.6},
        t:"Otto ore a passarvi il quaderno. È venuto fuori un pezzo che nessuno dei due avrebbe scritto da solo."}}
   ]},

  {id:"shooting", n:"Uno shooting", k:"#F472B6", ic:"camera", giorni:1, base:{energia:34, ore:9},
   soglia:{fans:1500, hype:22, rep:35},
   incontri:{videomaker:1.7, fotografo:1.5, stylist:1.3, brand:.8, manager:.5},
   nMax:3,
   chiama:c => "una produzione di " + c.n,
   invito:(c, da) => "Uno shooting a <b>" + esc(c.n) + "</b>: video o foto, un giorno intero sul set. " +
     (da ? "Ti chiama <b>" + esc(da) + "</b>. " : "") + "Dodici ore per tre minuti di materiale.",
   scena:c => "Set a <b>" + esc(c.n) + "</b>: sei persone attorno a te, due luci, un fondale, e la stessa scena " +
     "rifatta undici volte. Nessuno ti spiega niente e tutti si aspettano che tu sappia stare davanti a un obiettivo.",
   azioni:() => [
     {n:"Fai quello che ti dicono", d:"Giornata liscia, materiale buono, zero attrito.",
      esito:{fan:1.1, hype:1.25, soldi:1, incontri:1.3, energia:1, well:-1, rep:2,
        t:"Set chiuso in orario. Sono contenti, e sul set essere facili vale come essere bravi."}},
     {n:"Proponi tu una scena", d:"Se l'idea è buona diventa la copertina, se no rallenti tutti.",
      rischio:g => .34 + Math.min(.4, (g.hype || 0) / 130 + ((g.life || {}).look || 0) * .05),
      esito:{fan:1.4, hype:1.7, soldi:1, incontri:1.7, energia:1.15, well:-2,
        t:"La tua idea è diventata l'immagine di tutta la campagna. Il videomaker ti ha chiesto il numero."},
      esitoNo:{fan:1, hype:1.05, soldi:1, incontri:1, energia:1.15, well:-4,
        t:"Hanno provato la tua idea per un'ora e poi sono tornati alla loro. Nessun dramma, un po' di imbarazzo."}},
     {n:"Passi la giornata con chi tiene le luci", d:"Le persone che contano su un set non sono davanti.",
      esito:{fan:1, hype:1.1, soldi:1, incontri:2.0, energia:1.1, well:-2,
        t:"Hai imparato i nomi di tutti quelli che stanno dietro. Sono quelli che ti richiameranno."}}
   ]},

  {id:"pubblicita", n:"Una pubblicità", k:"#A3E635", ic:"soldi", giorni:1, base:{energia:36, ore:10},
   soglia:{fans:6000, hype:35, rep:45},
   incontri:{brand:1.6, videomaker:1.2, fotografo:1.0, stylist:.9, manager:.7},
   nMax:3,
   chiama:c => "un'agenzia di " + c.n,
   invito:(c, da) => "Una campagna girata a <b>" + esc(c.n) + "</b>: la tua faccia, un prodotto, e dei soldi che " +
     "in un anno di serate non vedi. " + (da ? "Passa da <b>" + esc(da) + "</b>. " : "") +
     "Vogliono te, ma vogliono te come dicono loro.",
   scena:c => "Sala riunioni a <b>" + esc(c.n) + "</b>, poi set. Ti fanno leggere due righe di copione che non " +
     "diresti mai. Pagano bene. Metà del giro ti prenderà in giro, l'altra metà ti chiederà come hai fatto.",
   azioni:() => [
     {n:"Firmi e dici le loro righe", d:"Tanti soldi, e un pezzo di credibilità che lasci lì.",
      esito:{fan:1.2, hype:1.1, soldi:2.4, incontri:1.2, energia:.9, well:1, rep:-3,
        t:"Girato, incassato. Su internet gira già la clip con sotto i commenti che immaginavi."}},
     {n:"Tratti per riscrivere le tue battute", d:"Meno soldi, ma esce una cosa che puoi ancora guardare.",
      rischio:g => .3 + Math.min(.45, ((g.skills || {}).scrittura || 0) / 55 + (g.hype || 0) / 250),
      esito:{fan:1.35, hype:1.4, soldi:1.7, incontri:1.4, energia:1, well:0, rep:3,
        t:"Hai riscritto le tue righe e le hanno tenute. È uscita una cosa che sembra tua."},
      esitoNo:{fan:1.1, hype:1, soldi:1.9, incontri:1.1, energia:1, well:-3,
        t:"Hanno ascoltato, annuito e girato il copione loro. Almeno i soldi non li hai persi."}},
     {n:"Chiedi di portare la tua musica nello spot", d:"Se passa, è la spinta più grossa che potresti avere.",
      rischio:g => .22 + Math.min(.4, (g.hype || 0) / 190 + (g.fans || 0) / 90000),
      esito:{fan:2.6, hype:2.0, soldi:1.9, incontri:1.4, energia:1, well:0,
        t:"Sotto lo spot c'è un tuo pezzo. Per un mese lo sente gente che non sa nemmeno chi sei."},
      esitoNo:{fan:1.15, hype:1.05, soldi:2.2, incontri:1.1, energia:1, well:-2,
        t:"Hanno detto no alla musica e sì alla faccia. Il messaggio è chiaro."}}
   ]},

  {id:"brandev", n:"Un evento brand", k:"#FCD34D", ic:"maglietta", giorni:1, base:{energia:28, ore:7},
   soglia:{fans:3000, hype:30, rep:40},
   incontri:{brand:1.4, stylist:1.3, fotografo:1.2, manager:1.0, dj:.8, ar:.5},
   nMax:3,
   chiama:c => "l'ufficio eventi di un marchio",
   invito:(c, da) => "Apertura di uno store a <b>" + esc(c.n) + "</b>: ci vai, ti fai vedere, forse fai due pezzi. " +
     (da ? "L'invito arriva da <b>" + esc(da) + "</b>. " : "") + "Ti pagano per esserci.",
   scena:c => "Store nuovo a <b>" + esc(c.n) + "</b>, luci bianche, prosecco tiepido e una stanza piena di gente " +
     "che si guarda addosso. Ti hanno pagato per essere qui: adesso decidi cosa farci, di quest'ora.",
   azioni:() => [
     {n:"Fai il giro, saluti, sorridi", d:"Il minimo sindacale, fatto bene.",
      esito:{fan:1, hype:1.2, soldi:1.4, incontri:1.2, energia:.85, well:0,
        t:"Un'ora di sorrisi e stretta di mano. Ti hanno pagato per quello e l'hai fatto."}},
     {n:"Ti attacchi alle persone giuste", d:"Sei venuto per lavorare, non per il prosecco.",
      rischio:g => .3 + Math.min(.45, ((g.skills || {}).rete || 0) / 48),
      esito:{fan:1.05, hype:1.25, soldi:1.4, incontri:2.2, energia:1.1, well:-2,
        t:"Tre conversazioni vere in un posto fatto per non averne nessuna."},
      esitoNo:{fan:1, hype:1.1, soldi:1.4, incontri:1.1, energia:1.1, well:-3,
        t:"Hai parlato con tutti e concluso con nessuno. Serate così."}},
     {n:"Fai due pezzi improvvisati in mezzo allo store", d:"Fuori programma. O è la clip della settimana, o è imbarazzo.",
      rischio:g => .33 + Math.min(.4, ((g.skills || {}).presenza || 0) / 50 + (g.hype || 0) / 300),
      esito:{fan:1.7, hype:1.8, soldi:1.4, incontri:1.4, energia:1.15, well:-2,
        t:"Due pezzi in mezzo agli scaffali, trenta telefoni alzati. Quella clip ha girato."},
      esitoNo:{fan:.9, hype:.9, soldi:1.4, incontri:.9, energia:1.15, well:-5, rep:-3,
        t:"Nessuno si è girato. Hai finito il pezzo davanti a otto persone imbarazzate."}}
   ]},

  {id:"intervista", n:"Un'intervista", k:"#60A5FA", ic:"giornale", giorni:1, base:{energia:22, ore:6},
   soglia:{fans:1000, rep:35},
   incontri:{promoter:.9, videomaker:.8, ar:.7, rapper:.7, manager:.6, fotografo:.6},
   nMax:2,
   chiama:c => "una redazione di " + c.n,
   invito:(c, da) => "Un'intervista a <b>" + esc(c.n) + "</b>: podcast o webzine, un'ora davanti a un microfono. " +
     (da ? "Ti ci manda <b>" + esc(da) + "</b>. " : "") + "Non pagano. Ti leggono, però.",
   scena:c => "Stanza piccola a <b>" + esc(c.n) + "</b>, due microfoni e una telecamera fissa. " +
     "La prima domanda è già quella scomoda: da dove vieni, e perché uno da lì dovrebbe interessare a qualcuno.",
   azioni:() => [
     {n:"Racconti la storia vera", d:"La tua, com'è. Non è la più bella, è la tua.",
      esito:{fan:1.25, hype:1.15, soldi:.4, incontri:1.1, energia:.8, well:2, rep:4,
        t:"Un'ora di cose vere. Chi l'ha ascoltata ha capito con chi ha a che fare."}},
     {n:"Ti costruisci il personaggio", d:"Più clip, più hype, e una versione di te da mantenere.",
      rischio:g => .36 + Math.min(.4, (g.hype || 0) / 160),
      esito:{fan:1.5, hype:1.8, soldi:.4, incontri:1.2, energia:.9, well:-2, rep:-2,
        t:"Hai dato loro i trenta secondi che volevano. Il clip gira, e adesso quello sei tu."},
      esitoNo:{fan:.9, hype:.9, soldi:.4, incontri:.9, energia:.9, well:-4, rep:-5,
        t:"Il personaggio non ha tenuto per un'ora intera. Nei commenti l'hanno notato tutti."}},
     {n:"Parli del giro della tua città", d:"Nessuno lo fa. Chi conta se lo ricorda.",
      esito:{fan:1.05, hype:1, soldi:.4, incontri:1.6, energia:.8, well:1, rep:6,
        t:"Hai fatto i nomi di chi lavora con te. Nel giro è la cosa che pesa di più."}}
   ]},

  {id:"radioset", n:"Un passaggio in radio", k:"#F87171", ic:"mic", giorni:1, base:{energia:24, ore:6},
   soglia:{fans:2000, hype:25, rep:40},
   incontri:{dj:1.3, promoter:1.0, ar:.9, manager:.7, fonico:.6},
   nMax:2,
   chiama:c => "una radio di " + c.n,
   invito:(c, da) => "Live in radio a <b>" + esc(c.n) + "</b>: intervista corta e un pezzo suonato in diretta. " +
     (da ? "Ti ci porta <b>" + esc(da) + "</b>. " : "") + "Va in onda mentre la gente guida.",
   scena:c => "Studio radio a <b>" + esc(c.n) + "</b>, cuffie grosse, luce rossa accesa. " +
     "Dieci minuti di parole e un pezzo in diretta, senza rete: quello che esce dal microfono è quello che sentono.",
   azioni:() => [
     {n:"Suoni il pezzo che funziona sempre", d:"Nessun rischio in diretta. Nessuna sorpresa.",
      esito:{fan:1.2, hype:1.2, soldi:.7, incontri:1.1, energia:.85, well:0,
        t:"Diretta pulita e un pezzo che sai a memoria. È passato."}},
     {n:"Fai un freestyle sulla base del conduttore", d:"In diretta, senza carta. È il momento che le radio tagliano o rilanciano.",
      rischio:g => .3 + Math.min(.45, ((g.skills || {}).flow || 0) / 46),
      esito:{fan:1.8, hype:1.9, soldi:.7, incontri:1.3, energia:1.1, well:-1,
        t:"Un minuto e mezzo a braccio in diretta. Hanno ritagliato la clip e l'hanno postata loro."},
      esitoNo:{fan:.8, hype:.75, soldi:.7, incontri:.9, energia:1.1, well:-5,
        t:"Ti sei impantanato dopo quattro barre. In diretta il silenzio dura molto più di quanto duri davvero."}},
     {n:"Chiedi di far girare il pezzo in rotazione", d:"Faccia tosta. A volte dicono di sì.",
      rischio:g => .25 + Math.min(.4, (g.hype || 0) / 200 + ((g.skills || {}).rete || 0) / 70),
      esito:{fan:1.9, hype:1.5, soldi:.7, incontri:1.3, energia:.9, well:0,
        t:"Ti hanno messo in rotazione per due settimane. Ti sente gente ferma nel traffico che non ti cercava."},
      esitoNo:{fan:1.05, hype:1, soldi:.7, incontri:1, energia:.9, well:-2,
        t:"«Mandaci il pezzo e vediamo.» Che vuol dire no, detto gentilmente."}}
   ]}
];
const TIPI_BY_ID = TIPI.reduce((a, t) => { a[t.id] = t; return a; }, {});

/* ============================================================
   COSA CHIEDE UN INVITO PER ARRIVARE
   ------------------------------------------------------------
   Non basta un parametro solo, se no si farma quello e basta: servono fan,
   hype e reputazione insieme, e la città grossa chiede più della piccola.
   ============================================================ */
function livelloMio(){
  try{ return typeof livello === "function" ? livello().lvl : 1; }catch(e){ return 1; }
}
function tipoAperto(t, c){
  const s = t.soglia || {};
  const scala = 1 + (c ? (c.scena - 5) * .12 : 0);        /* Milano chiede di più di Pescara */
  if((G.fans || 0) < (s.fans || 0) * scala) return false;
  if((G.hype || 0) < (s.hype || 0)) return false;
  if(reputazione() < (s.rep || 0)) return false;
  return true;
}
function cittaAperta(c){
  /* la scena grossa non ti chiama finché sei nessuno, per quanto tu sia affidabile */
  const serve = {1:0, 2:800, 3:2500}[c.dist] || 0;
  return normalizza(c.n) !== casaMia() && (G.fans || 0) >= serve;
}

/* ============================================================
   L'INVITO
   ============================================================ */
function costoViaggio(c, t){
  const notti = Math.max(0, (t.giorni || 1) - 1);
  return Math.round((26 + c.dist * 38 + notti * 55) * (typeof difSpese === "function" ? difSpese() : 1));
}
function cachet(c, t){
  const q = c.scena * (t.id === "pubblicita" ? 46 : t.id === "brandev" ? 22 : 14);
  const mio = Math.min(1400, (G.fans || 0) * .035 + (G.hype || 0) * 7);
  return Math.round((q + mio) * (t.giorni || 1) * (.85 + Math.random() * .4));
}

function sceltaCitta(preferita){
  if(preferita && CITTA_BY_ID[preferita]) return CITTA_BY_ID[preferita];
  const buone = CITTA.filter(cittaAperta);
  if(!buone.length) return null;
  /* dove sei già stato ti richiamano più volentieri: è la reputazione locale
     che comincia a lavorare per te */
  const pesi = buone.map(c => c.peso * (1 + Math.min(1.4, (cittaStato(c.id).rep || 0) / 45)));
  let r = Math.random() * pesi.reduce((a, b) => a + b, 0);
  for(let i = 0; i < buone.length; i++){ if(r < pesi[i]) return buone[i]; r -= pesi[i]; }
  return buone[buone.length - 1];
}
function sceltaTipo(c, preferito){
  if(preferito && TIPI_BY_ID[preferito] && tipoAperto(TIPI_BY_ID[preferito], c)) return TIPI_BY_ID[preferito];
  const buoni = TIPI.filter(t => tipoAperto(t, c));
  return buoni.length ? pick(buoni) : null;
}

function creaInvito(opt){
  opt = opt || {};
  const s = st();
  const c = sceltaCitta(opt.citta);
  if(!c) return null;
  const t = sceltaTipo(c, opt.tipo);
  if(!t) return null;
  const da = opt.daId ? personaPerId(opt.daId) : null;
  const giorni = t.giorni || 1;
  const inv = {
    iid:"T" + (++s.seq),
    tipo:t.id, citta:c.id,
    daId:da ? da.id : null,
    daNome:da ? da.n : "",
    nato:assoluto(),
    scade:assoluto() + ri(4, 9),
    offerta:{
      cachet:cachet(c, t),
      viaggio:costoViaggio(c, t),
      energia:Math.round((t.base.energia || 30) * (1 + (c.dist - 2) * .08)),
      giorni:giorni
    },
    letto:false
  };
  s.inviti.push(inv);
  s.ultimoInvito = assoluto();
  cittaStato(c.id).inviti = (cittaStato(c.id).inviti || 0) + 1;

  const chi = da ? da.n : t.chiama(c);
  const titolo = t.n + " a " + c.n;
  diario("<b>Ti hanno chiamato da " + esc(c.n) + ".</b> " + esc(chi) + ": " + t.n.toLowerCase() +
    ". Hai tempo fino a " + quandoTesto(inv.scade) + " per rispondere.", "big");
  notifica({
    eventId:"trasferta:" + inv.iid, tier:"alto", title:titolo, family:"Trasferta",
    description:"Invito da " + chi,
    result:"Ti vogliono a " + c.n + ". Devi rispondere entro " + quandoTesto(inv.scade) + ".",
    effects:[]
  });
  avviso("<b>" + esc(titolo) + "</b> · " + esc(chi) + " ti vuole fuori città.", "good", "◆", [t.k, "#140B22"]);
  aggiornaBadge();
  salva();
  /* la scelta si apre da sola appena lo schermo è libero: un invito è un bivio,
     non una riga nel telefono che puoi non vedere mai */
  apriInvitoQuandoSiPuo(inv.iid);
  return inv;
}

function togliInvito(iid){
  const s = st();
  s.inviti = s.inviti.filter(x => x.iid !== iid);
}
function invitoPerId(iid){ return st().inviti.find(x => x.iid === iid) || null; }

/* ============================================================
   LA FINESTRA DELL'INVITO
   ------------------------------------------------------------
   Tre risposte, non due. «Ci penso» esiste perché un invito che sparisce se non
   lo apri adesso è una tagliola, non una scelta: resta in agenda (l'app
   Trasferte) fino alla scadenza, e la scadenza è vera.
   ============================================================ */
let CODA_INVITO = null;

function schermoLibero(){
  if(typeof G === "undefined" || G.ended) return false;
  const gioco = document.getElementById("s-game"), hub = document.getElementById("s-hub");
  const dentro = (gioco && gioco.classList.contains("on")) || (hub && hub.classList.contains("on"));
  if(!dentro) return false;
  for(const id of ["modal", "report", "writer", "piazza", "scena", "posto", "strada-crimine",
                   "negozio", "adf-result-overlay", "adf-social-overlay", "tras-overlay"]){
    const el = document.getElementById(id);
    if(el && el.classList.contains("on")) return false;
  }
  try{
    if(typeof GAME_EVENTS !== "undefined" && GAME_EVENTS.blocked && GAME_EVENTS.blocked()) return false;
  }catch(e){}
  return true;
}

/* Mai nello stesso tick in cui nasce: chi ci chiama (fine giornata, salto,
   catena) ha ancora da aprire il suo rapporto o la sua scena, e una finestra
   che spunta sotto a un'altra e' peggio che una finestra in ritardo. */
function apriInvitoQuandoSiPuo(iid, tentativi){
  if(tentativi == null){ setTimeout(() => apriInvitoQuandoSiPuo(iid, 90), 260); return; }
  if(CODA_INVITO && CODA_INVITO !== iid) return;
  CODA_INVITO = iid;
  if(!invitoPerId(iid)){ CODA_INVITO = null; return; }
  if(tentativi <= 0){ CODA_INVITO = null; return; }
  if(!schermoLibero()){ setTimeout(() => apriInvitoQuandoSiPuo(iid, tentativi - 1), 400); return; }
  CODA_INVITO = null;
  apriInvito(iid);
}

function rigaCosti(inv){
  const o = inv.offerta;
  return '<div class="trascosti">' +
    '<span><b>' + eur(o.cachet) + '</b>cachet</span>' +
    '<span><b>&minus;' + eur(o.viaggio) + '</b>viaggio</span>' +
    '<span><b>&minus;' + o.energia + '</b>energia</span>' +
    '<span><b>' + o.giorni + (o.giorni === 1 ? " giorno" : " giorni") + '</b>fuori</span>' +
  '</div>';
}

function apriInvito(iid){
  const inv = invitoPerId(iid);
  if(!inv || typeof showEvent !== "function") return;
  const t = TIPI_BY_ID[inv.tipo], c = CITTA_BY_ID[inv.citta];
  if(!t || !c){ togliInvito(iid); return; }
  inv.letto = true;
  const cs = cittaStato(c.id);
  const gia = cs.visite > 0
    ? '<p class="trasnota">Ci sei già stato ' + cs.visite + (cs.visite === 1 ? " volta" : " volte") +
      ': lì ti seguono in ' + (typeof fmt === "function" ? fmt(cs.fan) : cs.fan) + '.</p>'
    : '<p class="trasnota">A ' + esc(c.n) + ' non ci sei mai stato.</p>';
  const soldiOk = G.money >= inv.offerta.viaggio;
  const forzeOk = G.energy >= inv.offerta.energia * .5;

  showEvent({
    k:"Trasferta · " + c.n.toUpperCase(),
    t:t.n + " a " + c.n,
    d:'<p>' + t.invito(c, inv.daNome) + '</p>' + rigaCosti(inv) + gia +
      (!soldiOk ? '<p class="trasnota bad">Il viaggio costa ' + eur(inv.offerta.viaggio) +
        ' e in cassa non ce li hai. Ci vai lo stesso, ma il conto va sotto.</p>' : '') +
      (!forzeOk ? '<p class="trasnota bad">Sei a pezzi. Partire adesso te lo porti dietro per giorni.</p>' : ''),
    /* si può chiudere, e chiudere vuol dire «ci penso»: l'invito resta in agenda */
    annulla(){ rimanda(inv); },
    opts:[
      {n:"Accetti", d:"Parti. " + inv.offerta.giorni + (inv.offerta.giorni === 1 ? " giorno" : " giorni") +
        " fuori, " + eur(inv.offerta.viaggio) + " di viaggio, " + inv.offerta.energia + " di energia.",
       run(){ const id = inv.iid; setTimeout(() => accetta(id), 0); return {t:"", c:""}; }},
      {n:"Ci pensi", d:"Resta in agenda fino a " + quandoTesto(inv.scade) + ". Dopo, chiamano un altro.",
       run(){ rimanda(inv); return {t:"Hai preso tempo. L'invito da " + esc(c.n) + " resta in agenda fino a " +
         quandoTesto(inv.scade) + ".", c:""}; }},
      {n:"Rifiuti", d:"Chiudi la questione. Chi ti ha chiamato se lo ricorda.",
       run(){ return rifiuta(inv); }}
    ]
  });
}

function rimanda(inv){ aggiornaBadge(); salva(); }

function rifiuta(inv){
  const s = st(), c = CITTA_BY_ID[inv.citta], t = TIPI_BY_ID[inv.tipo];
  togliInvito(inv.iid);
  s.rifiutiFila = (s.rifiutiFila || 0) + 1;
  addRep(-3 - Math.min(6, s.rifiutiFila * 2),
    s.rifiutiFila > 1 ? "hai detto di no " + s.rifiutiFila + " volte di fila" : "hai rifiutato una data");
  /* chi ti aveva chiamato si raffredda davvero: il rapporto scende */
  const da = inv.daId ? personaPerId(inv.daId) : null;
  if(da){
    da.pt = (da.pt || 0) - 2;
    if(da.pt <= -2 && (da.rel || 0) > 0){ da.rel--; da.pt = 0; }
  }
  notifica({
    eventId:"trasferta:" + inv.iid, tier:"basso", title:"Invito rifiutato", family:"Trasferta",
    result:"Hai detto no a " + t.n.toLowerCase() + " a " + c.n + ".", effects:["Reputazione nel giro in calo"]
  });
  aggiornaBadge();
  salva();
  return {t:"Hai detto di no a " + esc(c.n) + "." +
    (s.rifiutiFila >= 3 ? " È la terza di fila: nel giro cominciano a darti per uno che non si muove." : ""),
    c:s.rifiutiFila >= 2 ? "bad" : ""};
}

/* ============================================================
   LA SPEDIZIONE
   ------------------------------------------------------------
   Quattro schermate in fila, ognuna aperta dalla scelta di prima:
   viaggio → evento → incontri → ritorno. Il calendario si consuma solo alla
   fine, quando torni: se lo consumassimo prima, il rapporto di fine settimana
   scoppierebbe in mezzo alla trasferta.
   ============================================================ */
function accetta(iid){
  const inv = invitoPerId(iid);
  if(!inv) return;
  const t = TIPI_BY_ID[inv.tipo], c = CITTA_BY_ID[inv.citta];
  const s = st();
  togliInvito(iid);
  s.rifiutiFila = 0;
  s.attiva = {
    iid:inv.iid, tipo:t.id, citta:c.id, daId:inv.daId, daNome:inv.daNome,
    partita:assoluto(), offerta:inv.offerta,
    resa:{fan:0, hype:0, soldi:0}, conosciuti:[], righe:[], daFare:null
  };
  G.money -= inv.offerta.viaggio;
  G.energy = Math.max(0, (G.energy || 0) - Math.round(inv.offerta.energia * .35));
  aggiornaBadge();
  salva();
  scenaViaggio();
}

function attiva(){ return st().attiva; }
function tipoAttivo(){ const a = attiva(); return a ? TIPI_BY_ID[a.tipo] : null; }
function cittaAttiva(){ const a = attiva(); return a ? CITTA_BY_ID[a.citta] : null; }

const MEZZI = [
  "Regionale delle sei e dieci, cambio a metà strada, panino di plastica.",
  "Un frecciarossa pagato più di quanto ti pagheranno, per non arrivare distrutto.",
  "Il furgone di uno del giro: tre ore di autostrada e sempre lo stesso disco.",
  "Pullman notturno. Dormi seduto e arrivi con il collo di legno.",
  "In macchina con uno che hai conosciuto ieri, che guida come si scrive in freestyle.",
  "Aereo low cost alle sei del mattino, bagaglio a mano con dentro tutta la vita."
];

function scenaViaggio(){
  const a = attiva(), t = tipoAttivo(), c = cittaAttiva();
  if(!a || !t || !c) return;
  const mezzo = pick(MEZZI);
  a.righe.push(mezzo);
  showEvent({
    k:"In viaggio",
    t:"Verso " + c.n,
    d:'<p>' + esc(mezzo) + '</p>' +
      '<p>Il paese finisce dietro il finestrino e comincia una città in cui non conosci nessuno' +
      (a.daNome ? ' tranne <b>' + esc(a.daNome) + '</b>' : '') +
      '. Nel telefono hai l&rsquo;indirizzo, l&rsquo;orario e niente altro.</p>' +
      '<p class="trasnota">Hai già lasciato ' + eur(a.offerta.viaggio) +
      ' di viaggio. Il resto si decide lì.</p>',
    opts:[{n:"Sei arrivato", d:"Si comincia.", run(){ setTimeout(scenaEvento, 0); return {t:"", c:""}; }}]
  });
}

function scenaEvento(){
  const a = attiva(), t = tipoAttivo(), c = cittaAttiva();
  if(!a || !t || !c) return;
  showEvent({
    k:t.n.toUpperCase() + " · " + c.n,
    t:t.n + " a " + c.n,
    d:'<p>' + t.scena(c) + '</p>',
    opts:t.azioni(G).map(o => ({
      n:o.n, d:o.d,
      run(){
        let riuscito = true;
        try{ riuscito = !o.rischio || Math.random() < cl(o.rischio(G), .05, .95); }catch(e){}
        const e = (riuscito || !o.esitoNo) ? o.esito : o.esitoNo;
        const testo = applicaEvento(e, riuscito);
        setTimeout(scenaIncontri, 0);
        return {t:testo, c:riuscito ? "good" : "bad"};
      }
    }))
  });
}

/* Quanto rende la trasferta: la base la danno la scena della città e il tipo di
   evento, poi la scelta la moltiplica. I fan sono in parte della città — restano
   lì e sono loro che ti faranno richiamare — e in parte tuoi ovunque. */
function applicaEvento(e, riuscito){
  const a = attiva(), t = tipoAttivo(), c = cittaAttiva();
  const scala = c.scena * (1 + (G.hype || 0) / 160) * (.8 + Math.random() * .5);
  const fan = Math.max(0, Math.round(scala * 26 * (e.fan == null ? 1 : e.fan) * (t.giorni || 1)));
  const hype = Math.round((1.4 + c.scena * .32) * (e.hype == null ? 1 : e.hype));
  const soldi = Math.round(a.offerta.cachet * (e.soldi == null ? 1 : e.soldi));

  G.fans += fan;
  G.hype = cl((G.hype || 0) + hype, 0, 100);
  G.money += soldi;
  G.wellbeing = cl((G.wellbeing || 0) + (e.well || 0), 0, 100);
  G.energy = Math.max(0, (G.energy || 0) - Math.round(a.offerta.energia * .65 * (e.energia == null ? 1 : e.energia)));
  if(e.skill && typeof gain === "function")
    for(const k of Object.keys(e.skill)) gain(k, e.skill[k]);
  if(e.rep) addRep(e.rep);
  addRep(riuscito ? 2 : -1, riuscito ? "una data fatta bene" : "");

  const cs = cittaStato(c.id);
  cs.fan = (cs.fan || 0) + Math.round(fan * .7);
  cs.rep = cl((cs.rep || 0) + (riuscito ? ri(6, 12) : ri(1, 4)), 0, 100);

  a.resa.fan += fan; a.resa.hype += hype; a.resa.soldi += soldi;
  a.esitoTesto = e.t;
  a.riuscito = riuscito;
  a.moltIncontri = e.incontri == null ? 1 : e.incontri;
  a.beatPromesso = !!e.beat;
  a.righe.push(e.t);
  salva();
  return e.t;
}

/* ============================================================
   GLI INCONTRI
   ------------------------------------------------------------
   Quanti ne fai dipende da tre cose: che evento è (a un festival si conosce
   gente, a un'intervista molto meno), come l'hai giocato, e quanto sei bravo a
   stare in mezzo alle persone. Chi incontri dipende dalla città. Quanti ne
   conosci già lì li fa scendere: la seconda volta a Bologna incontri meno facce
   nuove, perché mezza stanza la conosci.
   ============================================================ */
function quantiIncontri(){
  const a = attiva(), t = tipoAttivo(), c = cittaAttiva();
  const rt = ((G.skills || {}).rete || 0);
  const base = .5 * (a.moltIncontri || 1)
    + Math.min(.85, rt / 32)
    + Math.min(.45, (G.hype || 0) / 150)
    + Math.min(.35, (t.giorni || 1) * .16);
  const noti = conosciuti(c.id).length;
  const saturo = Math.max(.35, 1 - noti * .13);
  let n = 0;
  for(let i = 0; i < (t.nMax || 2); i++){
    if(Math.random() < cl(base * saturo / (i + 1), 0, .92)) n++;
  }
  return n;
}

function ruoloDaIncontrare(){
  const t = tipoAttivo(), c = cittaAttiva();
  const gia = attiva().conosciuti.map(id => (personaPerId(id) || {}).ruolo);
  const voci = Object.keys(t.incontri).map(r => {
    let p = t.incontri[r] * ((c.ruoli && c.ruoli[r]) || 1);
    /* due fonici la stessa sera capita, tre no: la penalita' si accumula */
    const ripetuti = gia.filter(x => x === r).length;
    if(ripetuti) p *= Math.pow(.3, ripetuti);
    return [r, p];
  });
  let tot = voci.reduce((s, v) => s + v[1], 0), r = Math.random() * tot;
  for(const v of voci){ if(r < v[1]) return v[0]; r -= v[1]; }
  return voci[voci.length - 1][0];
}

function nuovoContatto(ruolo, cittaId, daId){
  const c = CITTA_BY_ID[cittaId] || {n:"", scena:5};
  const info = RUOLI[ruolo] || {};
  const usati = (G.gente || []).map(p => p.n);
  let pool = info.nomi;
  if(!pool || !pool.length) pool = (typeof RIV_NOMI !== "undefined") ? RIV_NOMI : ["Senza nome"];
  const liberi = pool.filter(n => usati.indexOf(n) < 0);
  const fascia = c.scena >= 8 ? 2 : c.scena >= 5 ? 1 : 0;
  const skin = (typeof RIV_SKIN !== "undefined") ? RIV_SKIN : ["#C68A5C"];
  const generi = (typeof BEAT_IDS !== "undefined") ? BEAT_IDS : [""];
  const caratteri = (typeof CARATTERI !== "undefined") ? CARATTERI.map(x => x.id) : ["aperto"];
  const scala = REQ_RUOLO[ruolo] || ["aperto"];
  return {
    id:"f" + Math.floor(Math.random() * 1e9),
    ruolo:ruolo,
    n:liberi.length ? pick(liberi) : pick(pool) + " " + Math.floor(2 + Math.random() * 7),
    gen:(ruolo === "beatmaker" || ruolo === "rapper" || ruolo === "dj") ? pick(generi) : "",
    eta:Math.floor(22 + Math.random() * 26),
    fama:Math.round(8 + c.scena * 4 + Math.random() * 26),
    car:pick(caratteri),
    scoperto:false,
    rel:0, pt:0, ult:-1, feat:-99,
    skin:pick(skin), hair:Math.floor(Math.random() * 4),
    col:pick(["#FF5A36", "#B026FF", "#FFC53D", "#3DC7FF", "#FF4D9D", "#57C98B", "#7A5CFF"]),
    /* la parte nuova rispetto alla gente della Sala: chi è, dove sta, chi te
       l'ha presentato e cosa serve per farci qualcosa davvero */
    fuori:true,
    citta:cittaId,
    daId:daId || null,
    reqKey:scala[Math.min(fascia, scala.length - 1)] || "aperto",
    conosciutoIl:assoluto(),
    contesto:(tipoAttivo() || {}).id || "incontro"
  };
}

/* Dove e come lo incontri: è quello che rende l'incontro una scena e non una
   riga di database con sopra un nome. */
const SCENE_INCONTRO = {
  beatmaker:["Nel retro c'è uno con il portatile aperto sulle ginocchia che ti fa sentire un giro in cuffia.",
             "Uno ti ferma mentre esci: «Le basi te le fai da solo o si può parlare?»",
             "Si presenta come quello che ha fatto metà dei pezzi che girano qui."],
  fonico:["Il fonico ti raggiunge con due birre. «La voce, stasera, te la tenevo io.»",
          "Quello del mixer ti dice senza girarci intorno cosa non funzionava nel tuo impianto.",
          "Vi ritrovate a smontare i cavi insieme e a parlare per venti minuti."],
  rapper:["Uno del posto ti aspetta fuori: fa la stessa cosa che fai tu, in una città dove è già qualcuno.",
          "Un rapper di qui ti cita una tua barra a memoria e ti chiede da dove viene.",
          "Vi presentano a vicenda e vi guardate come si guardano due che fanno lo stesso mestiere."],
  videomaker:["Uno con la camera al collo ti mostra tre secondi girati stasera: sono già meglio dei tuoi video.",
              "Il videomaker ti dice che ti ha ripreso senza chiedere, e che il materiale è tuo se lo vuoi.",
              "«Se ti va, il prossimo video te lo giro io. Costa poco e viene bene.»"],
  fotografo:["Ti passa il telefono con dodici scatti di stasera. Tre sono la tua faccia migliore da un anno.",
             "Uno con due macchine al collo ti dice che ti stava aspettando da mezz'ora.",
             "Vi mettete a guardare le foto insieme, appoggiati a un muro."],
  stylist:["Ti guarda le scarpe prima della faccia, e non è cattiveria: è il mestiere.",
           "«Vestito così sembri di due anni fa. Posso sistemarti in un pomeriggio.»",
           "Ti spiega in due frasi perché quella giacca, nelle foto, non funziona."],
  promoter:["Il promoter ti mette una mano sulla spalla e ti chiede quante date hai fatto quest'anno.",
            "Uno che riempie i locali di qui ti chiede il numero prima ancora di dirti come si chiama.",
            "«Se torni, da qualche parte ti ci metto io. Ma torna.»"],
  manager:["Uno vestito meglio di tutti ti fa tre domande precise e nessun complimento.",
           "Si presenta come manager, ti chiede chi ti segue e resta zitto un po' troppo a lungo.",
           "«Chi ti gestisce? Nessuno? Si sente.»"],
  dj:["Il DJ ti chiama in consolle e ti fa vedere la scaletta della serata.",
      "Uno che fa ballare mezza città ti chiede se hai roba non ancora uscita.",
      "«Mandami il pezzo e stasera la gente lo sente. Semplice così.»"],
  club:["Il padrone del locale ti offre da bere e ti guarda come si guarda un incasso.",
        "Chi ha le chiavi del posto ti chiede quante persone porti tu, non quanto sei bravo.",
        "«A me interessa il sabato pieno, a te un palco. Possiamo lavorare.»"],
  brand:["Due persone di un'agenzia ti fanno domande sui tuoi numeri come se fosse un bilancio.",
         "Ti danno un biglietto e ti dicono che «per il target sei perfetto». Non è un complimento e non è un insulto.",
         "Un marchio ti chiede quanto costa averti addosso per una stagione."],
  ar:["Uno dell'etichetta ti prende da parte e ti dice che ti sta seguendo da tre mesi.",
      "Un A&amp;R ti chiede quante uscite hai in canna. Poi guarda il telefono e sparisce.",
      "«Non è ancora il tuo momento. Ma non è nemmeno un no.»"]
};

/* La prima sera non si diventa soci di nessuno: i mestieri che stanno più in
   alto non ti danno confidenza, per quanto tu sia simpatico. */
const TETTO_PRIMO_GRADO = {ar:0, manager:0, brand:0, club:1};

function scenaIncontri(){
  const a = attiva();
  if(!a) return;
  if(a.daFare == null) a.daFare = quantiIncontri();
  if(a.daFare <= 0){ setTimeout(scenaRitorno, 0); return; }
  a.daFare--;

  const ruolo = ruoloDaIncontrare();
  const p = nuovoContatto(ruolo, a.citta, null);
  const info = ruoloInfo(ruolo);
  const req = REQUISITI[p.reqKey] || REQUISITI.aperto;
  const scena = pick(SCENE_INCONTRO[ruolo] || ["Ti presentano qualcuno che qui ci lavora."]);

  showEvent({
    k:"Incontro · " + info.n.toUpperCase(),
    t:p.n,
    d:'<p>' + scena + '</p>' +
      '<p class="trasnota">' + esc(info.d) + '</p>' +
      '<p class="trasnota">' + esc(info.n) + ' di <b>' + esc((CITTA_BY_ID[a.citta] || {}).n || "") + '</b>' +
      (p.reqKey === "aperto" ? '' : ' · per andare oltre serve ' + esc(req.t)) + '</p>',
    opts:[
      {n:"Ci parli davvero", d:"Dieci minuti veri invece di due frasi. Costa energia, vale un gradino.",
       run(){ return legaContatto(p, 2, true); }},
      {n:"Due parole e il numero", d:"Non approfondisci, ma il contatto ce l'hai.",
       run(){ return legaContatto(p, 1, true); }},
      {n:"Resti sulle tue", d:"Lo saluti e basta. Resta una faccia, non un contatto.",
       run(){ return legaContatto(p, 0, false); }}
    ]
  });
}

function legaContatto(p, punti, numero){
  const a = attiva();
  const info = ruoloInfo(p.ruolo);
  if(!G.gente) G.gente = [];
  if(punti <= 0 && !numero){
    /* non entra nella rete: era una faccia in una serata, e va bene così */
    setTimeout(scenaIncontri, 0);
    return {t:"Hai salutato " + esc(p.n) + " e sei rimasto sulle tue.", c:""};
  }
  const tetto = TETTO_PRIMO_GRADO[p.ruolo] == null ? 1 : TETTO_PRIMO_GRADO[p.ruolo];
  p.rel = Math.min(tetto, punti >= 2 ? 1 : 0);
  p.pt = punti >= 2 ? 1 : 0;
  p.numero = !!numero;
  if(punti >= 2) G.energy = Math.max(0, (G.energy || 0) - 4);
  G.gente.push(p);
  a.conosciuti.push(p.id);
  if(typeof gain === "function") gain("rete", punti >= 2 ? .9 : .4);
  addRep(1);

  /* se ha il numero e fa un mestiere che scrive in chat, si presenta da solo:
     la chat de La Sala non sa che quello sta a Napoli, e non ha bisogno di saperlo */
  try{
    if(p.numero && typeof chatPresentazione === "function" &&
       typeof CHAT_MESTIERI !== "undefined" && CHAT_MESTIERI.indexOf(p.ruolo) >= 0)
      chatPresentazione(p);
  }catch(e){}

  /* la catena: chi ti ha preso in simpatia può richiamarti o presentarti
     qualcun altro. Non è garantito, ed è per questo che due partite non
     raccontano la stessa storia. */
  programmaCatena(p, punti);

  a.righe.push("Conosciuto " + p.n + ", " + info.n.toLowerCase() + " di " +
    ((CITTA_BY_ID[p.citta] || {}).n || "") + ".");
  setTimeout(scenaIncontri, 0);
  return {t:"<b>" + esc(p.n) + "</b> è entrato nella tua rete: " + esc(info.n.toLowerCase()) +
    " di " + esc((CITTA_BY_ID[p.citta] || {}).n || "") + ", " + esc(gradoNome(p)) + ".", c:"good"};
}

/* ============================================================
   IL RITORNO
   ------------------------------------------------------------
   Il riepilogo, poi il calendario. I giorni si consumano qui in fondo e non
   all'inizio: dentro alla trasferta non deve entrare nient'altro — né incontri
   per strada, né chat, né eventi del catalogo. La trasferta È l'evento di quei
   giorni, e due finestre una sopra l'altra non sono atmosfera, sono un fastidio.
   ============================================================ */
let RIENTRO = false;
function passaGiorni(n){
  if(typeof avanzaGiorno !== "function" || n <= 0) return;
  /* i giorni del ritorno non sono giorni normali: qui dentro non nasce un
     invito nuovo e non matura una catena, se no torni da Bologna e trovi tre
     finestre impilate sopra al rapporto di fine settimana */
  RIENTRO = true;
  if(typeof openWeek === "function" && !weekOpen) openWeek();
  const before = weekOpen, costi = (typeof weeklyCosts === "function") ? weeklyCosts() : 0;
  let chiuse = 0;
  const prima = SALTO;
  SALTO = true;
  SALTO_STOP = null;
  for(let i = 0; i < n && !G.ended; i++){ if(avanzaGiorno()) chiuse++; }
  SALTO = prima;
  SALTO_STOP = null;
  RIENTRO = false;
  salva();
  if(chiuse > 0 && typeof weekReport === "function"){
    weekReport(before, costi * chiuse);
    if(typeof openWeek === "function") openWeek();
  } else if(typeof renderGioco === "function") renderGioco();
  /* la giornata del rientro la si vive adesso, una volta sola */
  setTimeout(() => { try{ giornoTrasferte(); }catch(e){} }, 0);
}

function scenaRitorno(){
  const a = attiva(), t = tipoAttivo(), c = cittaAttiva();
  if(!a || !t || !c){ st().attiva = null; return; }
  const s = st(), cs = cittaStato(c.id);
  cs.visite = (cs.visite || 0) + 1;
  cs.ultima = assoluto();
  s.ultimaTrasferta = assoluto();

  /* il producer che ti ha promesso una base: la base arriva davvero, nel
     catalogo, come quelle de La Sala */
  let beat = null;
  if(a.beatPromesso && typeof creaBeat === "function" && typeof mioGenere === "function"){
    try{
      const presi = (G.market || []).map(b => b.n).concat((G.beats || []).map(b => b.n));
      beat = creaBeat(mioGenere(), 42 + c.scena * 2.4 + Math.random() * 14, presi);
      beat.price = Math.max(20, Math.round(beat.price * .45));
      beat.da = c.n;
      G.market.push(beat);
    }catch(e){ beat = null; }
  }

  const nuovi = a.conosciuti.map(personaPerId).filter(Boolean);
  s.storico.unshift({
    tipo:t.id, citta:c.id, abs:assoluto(), riuscito:!!a.riuscito,
    fan:a.resa.fan, hype:a.resa.hype, soldi:a.resa.soldi,
    conosciuti:nuovi.map(p => p.n)
  });
  if(s.storico.length > 40) s.storico.length = 40;

  const listaNuovi = nuovi.length
    ? '<ul class="traslista">' + nuovi.map(p =>
        '<li><b>' + esc(p.n) + '</b> · ' + esc(ruoloInfo(p.ruolo).n.toLowerCase()) + ' · ' +
        esc(gradoNome(p)) + '</li>').join("") + '</ul>'
    : '<p class="trasnota">Nessun contatto nuovo. Capita: certe serate si lavora e basta.</p>';

  const giorni = a.offerta.giorni || 1;
  showEvent({
    k:"Ritorno",
    t:"Da " + c.n + " ti porti a casa",
    d:'<p>' + esc(a.esitoTesto || "") + '</p>' +
      '<div class="trascosti">' +
        '<span><b>+' + (typeof fmt === "function" ? fmt(a.resa.fan) : a.resa.fan) + '</b>fan</span>' +
        '<span><b>+' + a.resa.hype + '</b>hype</span>' +
        '<span><b>+' + eur(a.resa.soldi) + '</b>incassati</span>' +
        '<span><b>' + cs.rep + '</b>reputazione a ' + esc(c.n) + '</span>' +
      '</div>' +
      listaNuovi +
      (beat ? '<p class="trasnota good">Ti è arrivata «' + esc(beat.n) + '», qualità ' + beat.q +
        ': è nel catalogo a ' + beat.price + ' €.</p>' : '') +
      '<p class="trasnota">Il viaggio di ritorno e ' + giorni + (giorni === 1 ? " giorno" : " giorni") +
      ' di calendario.</p>',
    opts:[{n:"Torni a casa", d:"Il paese, la stanza, il quaderno.", run(){
      const gg = giorni;
      st().attiva = null;
      diario("<b>Tornato da " + esc(c.n) + ".</b> " + esc(t.n.toLowerCase()) + ": +" +
        (typeof fmt === "function" ? fmt(a.resa.fan) : a.resa.fan) + " fan, " + eur(a.resa.soldi) +
        (nuovi.length ? ", " + nuovi.length + (nuovi.length === 1 ? " contatto nuovo" : " contatti nuovi") : "") + ".",
        "big");
      notifica({
        eventId:"trasferta:" + a.iid, tier:"alto", title:"Trasferta a " + c.n, family:"Trasferta",
        choice:t.n, result:a.esitoTesto || "",
        effects:["+" + a.resa.fan + " fan", "+" + a.resa.hype + " hype", "+" + a.resa.soldi + " €"]
      });
      try{ if(typeof GAME_TRAVEL !== "undefined") G.currentPlace = GAME_TRAVEL.HOME || "vita"; }catch(e){}
      aggiornaBadge();
      salva();
      setTimeout(() => passaGiorni(gg), 0);
      return {t:"", c:""};
    }}]
  });
}

/* ============================================================
   LE CATENE
   ------------------------------------------------------------
   Una conoscenza che non torna mai è una riga in rubrica. Qui ogni persona che
   ti ha preso in simpatia ha una probabilità di rifarsi viva — settimane dopo,
   non domani — con una delle tre cose che sa fare:
     · «invito»       → ti chiama per un lavoro nella sua città;
     · «presenta»     → ti passa a qualcun altro, che entra nella rete;
     · «occasione»    → una cosa piccola e concreta, subito (una base, un video,
                        un mix, uno scatto, un posto in scaletta).
   Il tipo dipende dal mestiere, il quando è casuale, e la catena può ripartire:
   chi ti presenta qualcuno crea una persona che a sua volta potrà richiamarti.
   È da qui che nascono le storie diverse fra una partita e l'altra.
   ============================================================ */
const CATENE_RUOLO = {
  beatmaker:  {invito:"studio",     presenta:["rapper", "fonico"],      occasione:"beat"},
  fonico:     {invito:"studio",     presenta:["beatmaker", "rapper"],   occasione:"mix"},
  rapper:     {invito:"collabo",    presenta:["beatmaker", "promoter"], occasione:"feat"},
  videomaker: {invito:"shooting",   presenta:["fotografo", "stylist"],  occasione:"video"},
  fotografo:  {invito:"shooting",   presenta:["stylist", "videomaker"], occasione:"scatti"},
  stylist:    {invito:"brandev",    presenta:["brand", "fotografo"],    occasione:"look"},
  promoter:   {invito:"live",       presenta:["club", "dj"],            occasione:"data"},
  club:       {invito:"comparsata", presenta:["dj", "promoter"],        occasione:"data"},
  dj:         {invito:"radioset",   presenta:["promoter", "club"],      occasione:"rotazione"},
  manager:    {invito:"apertura",   presenta:["ar", "promoter"],        occasione:"consiglio"},
  brand:      {invito:"pubblicita", presenta:["manager", "stylist"],    occasione:"consiglio"},
  ar:         {invito:"apertura",   presenta:["manager", "beatmaker"],  occasione:"consiglio"}
};

function programmaCatena(p, punti){
  if(punti <= 0) return;
  const s = st();
  const base = .20 + punti * .13 + Math.min(.18, reputazione() / 400) + Math.min(.12, (G.hype || 0) / 500);
  if(Math.random() > cl(base, 0, .72)) return;
  const cfg = CATENE_RUOLO[p.ruolo] || {};
  const dadi = Math.random();
  const tipo = dadi < .45 ? "invito" : dadi < .78 ? "presenta" : "occasione";
  s.catene.push({
    quando:assoluto() + ri(6, 30),
    personaId:p.id,
    tipo:tipo,
    payload:tipo === "invito" ? (cfg.invito || null)
          : tipo === "presenta" ? pick(cfg.presenta || ["rapper"])
          : (cfg.occasione || "consiglio")
  });
}

/* Quello che ti offre chi si rifà vivo: piccolo, concreto, e sempre una cosa
   che quel mestiere può davvero fare per te. */
const OCCASIONI = {
  beat:{t:"Ti manda una base", d:p => "«Ho fatto una cosa e ho pensato a te. Te la mando, poi vedi.»",
    run(p){
      if(typeof creaBeat !== "function" || typeof mioGenere !== "function")
        return {t:"Ti ha mandato roba da ascoltare.", c:""};
      const presi = (G.market || []).map(b => b.n).concat((G.beats || []).map(b => b.n));
      const b = creaBeat(p.gen || mioGenere(), 40 + (p.fama || 10) * .5 + Math.random() * 16, presi);
      b.price = Math.max(20, Math.round(b.price * (1 - (p.rel || 0) * .15)));
      b.da = p.n;
      G.market.push(b);
      return {t:"«" + b.n + "» è nel catalogo, " + b.price + " €. Te l'ha fatta " + p.n + ".", c:"good"};
    }},
  mix:{t:"Si offre di mixarti un pezzo", d:p => "«Se hai qualcosa di fermo mandamelo, che stasera ho la sala libera.»",
    run(p){
      const s2 = (G.songs || []).find(x => !x.mixed && !x.released);
      if(!s2) return {t:"Non avevi niente da mandargli. Sarà per la prossima.", c:""};
      s2.mixed = true;
      s2.q = cl((s2.q || 0) + 5 + Math.round((p.fama || 10) * .12), 0, 100);
      return {t:"«" + s2.t + "» torna mixato da " + p.n + ". Qualità " + Math.round(s2.q) + ".", c:"good"};
    }},
  feat:{t:"Ti vuole su un suo pezzo", d:p => "«Ho un pezzo che senza una voce come la tua resta a metà.»",
    run(p){
      const f = Math.round(140 + (p.fama || 10) * 12 + (G.fans || 0) * .06);
      G.fans += f;
      G.hype = cl((G.hype || 0) + 4, 0, 100);
      return {t:"Il pezzo è uscito a nome suo con te sopra: +" + (typeof fmt === "function" ? fmt(f) : f) + " fan.", c:"good"};
    }},
  video:{t:"Ti gira un video", d:p => "«Ho una giornata libera e un'idea. Ti costa il pranzo.»",
    run(p){
      G.hype = cl((G.hype || 0) + 6, 0, 100);
      const f = Math.round(90 + (G.fans || 0) * .05);
      G.fans += f;
      return {t:"Il video di " + p.n + " gira meglio del pezzo: +" + (typeof fmt === "function" ? fmt(f) : f) + " fan, hype +6.", c:"good"};
    }},
  scatti:{t:"Ti fa un servizio fotografico", d:p => "«Ti servono foto decenti. Quelle che hai adesso ti fanno male.»",
    run(p){
      G.hype = cl((G.hype || 0) + 4, 0, 100);
      if(G.life) G.life.look = Math.min(4, (G.life.look || 0) + 1);
      return {t:"Foto nuove ovunque. Sembri uno che ha già una carriera. Hype +4.", c:"good"};
    }},
  look:{t:"Ti rifà il guardaroba", d:p => "«Ti metto insieme tre cose che funzionano. Il resto buttalo.»",
    run(p){
      const costo = Math.round(120 + (G.fans || 0) * .004);
      G.money -= costo;
      if(G.life) G.life.look = Math.min(4, (G.life.look || 0) + 1);
      G.hype = cl((G.hype || 0) + 5, 0, 100);
      return {t:"−" + eur(costo) + " e adesso, addosso, sembri quello che dici di essere. Hype +5.", c:"good"};
    }},
  data:{t:"Ti tiene una data", d:p => "«Ho un buco il mese prossimo. Lo tengo per te o lo do a un altro?»",
    run(p){
      const soldi = Math.round(120 + (p.fama || 10) * 9);
      G.money += soldi;
      const f = Math.round(70 + (G.fans || 0) * .03);
      G.fans += f;
      cittaStato(p.citta).rep = cl((cittaStato(p.citta).rep || 0) + 5, 0, 100);
      return {t:"Data fatta: +" + eur(soldi) + " e +" + (typeof fmt === "function" ? fmt(f) : f) + " fan a " +
        ((CITTA_BY_ID[p.citta] || {}).n || "") + ".", c:"good"};
    }},
  rotazione:{t:"Ti mette in scaletta", d:p => "«Stasera ti metto due volte. Se la gente si gira, ti metto sempre.»",
    run(p){
      G.hype = cl((G.hype || 0) + 5, 0, 100);
      const f = Math.round(110 + (G.fans || 0) * .04);
      G.fans += f;
      return {t:"Ti ha messo in scaletta tutta la serata: +" + (typeof fmt === "function" ? fmt(f) : f) + " fan, hype +5.", c:"good"};
    }},
  consiglio:{t:"Ti dice come stanno le cose", d:p => "«Ti do un consiglio che non ti ho dato. Poi fai come vuoi.»",
    run(p){
      if(typeof gain === "function") gain("rete", 1.6);
      addRep(4);
      return {t:"Mezz'ora al telefono con " + p.n + ". Adesso sai cosa non fare. Rete e reputazione su.", c:"good"};
    }}
};

function eseguiCatena(cat){
  const p = personaPerId(cat.personaId);
  if(!p || p.via) return;
  const c = CITTA_BY_ID[p.citta];
  const info = ruoloInfo(p.ruolo);

  if(cat.tipo === "invito"){
    /* non ti richiama se non può ancora permetterselo o se sei già via */
    if(st().attiva) { cat.quando = assoluto() + ri(3, 8); return "rinviata"; }
    const inv = creaInvito({citta:p.citta, tipo:cat.payload, daId:p.id});
    /* se in quel momento non c'era niente da proporti (soglie non ancora
       raggiunte) la chiamata non si perde: riprova fra qualche giorno */
    if(!inv){ cat.quando = assoluto() + ri(8, 20); return "rinviata"; }
    return;
  }

  if(cat.tipo === "presenta"){
    const nuovo = nuovoContatto(cat.payload, p.citta, p.id);
    nuovo.rel = 0; nuovo.pt = 0; nuovo.numero = true;
    if(!G.gente) G.gente = [];
    G.gente.push(nuovo);
    const ni = ruoloInfo(nuovo.ruolo);
    diario("<b>" + esc(p.n) + " ti ha presentato " + esc(nuovo.n) + ".</b> " +
      esc(ni.n.toLowerCase()) + " di " + esc((c || {}).n || "") + ": adesso è nella tua rete.", "good");
    notifica({
      eventId:"catena:presenta", tier:"medio", title:"Una presentazione", family:"Trasferta",
      description:p.n + " · " + info.n,
      result:p.n + " ti ha passato il numero di " + nuovo.n + ", " + ni.n.toLowerCase() + " di " + ((c || {}).n || "") + ".",
      effects:["Contatto nuovo"]
    });
    avviso("<b>" + esc(nuovo.n) + "</b> · te l'ha presentato " + esc(p.n) + ".", "good", "◆", [ni.k, "#0B1220"]);
    try{
      if(typeof chatPresentazione === "function" && typeof CHAT_MESTIERI !== "undefined" &&
         CHAT_MESTIERI.indexOf(nuovo.ruolo) >= 0) chatPresentazione(nuovo);
    }catch(e){}
    /* e la catena continua: anche il nuovo, un giorno, potrà chiamarti */
    programmaCatena(nuovo, 1);
    salva();
    return;
  }

  /* occasione: una cosa piccola, e una scelta piccola. Non blocca la giornata:
     se lo schermo è occupato aspetta il suo turno come gli inviti. */
  const occ = OCCASIONI[cat.payload] || OCCASIONI.consiglio;
  mostraOccasione(p, occ);
}

function mostraOccasione(p, occ, tentativi){
  if(tentativi == null){ setTimeout(() => mostraOccasione(p, occ, 60), 260); return; }
  if(!schermoLibero()){
    if(tentativi <= 0) return;
    setTimeout(() => mostraOccasione(p, occ, tentativi - 1), 500);
    return;
  }
  const info = ruoloInfo(p.ruolo), c = CITTA_BY_ID[p.citta];
  showEvent({
    k:"Ti ha scritto " + p.n.toUpperCase(),
    t:occ.t,
    d:'<p>' + esc(occ.d(p)) + '</p>' +
      '<p class="trasnota">' + esc(p.n) + ' · ' + esc(info.n.toLowerCase()) + ' di ' +
      esc((c || {}).n || "") + ' · ' + esc(gradoNome(p)) + '</p>',
    annulla(){},
    opts:[
      {n:"Accetti", d:"Una cosa in più che non avevi.",
       run(){
         const r = occ.run(p);
         p.pt = (p.pt || 0) + 1;
         if(typeof relSoglia === "function" && p.pt >= relSoglia(p) && (p.rel || 0) < 5){ p.pt = 0; p.rel++; }
         addRep(2);
         salva();
         return r;
       }},
      {n:"Lasci perdere", d:"Adesso non ti va. Non succede niente di grave.",
       run(){
         p.pt = (p.pt || 0) - 1;
         salva();
         return {t:"Hai lasciato cadere la proposta di " + esc(p.n) + ".", c:""};
       }}
    ]
  });
}

/* ============================================================
   IL GIORNO
   ------------------------------------------------------------
   Un solo passaggio al giorno: scadono gli inviti vecchi, scattano le catene
   arrivate a maturazione, e — se il giro ti sta guardando — squilla il telefono.
   ============================================================ */
function probInvito(){
  const s = st();
  const lvl = livelloMio();
  const base = .045
    + Math.min(.10, (G.fans || 0) / 55000)
    + Math.min(.06, (G.hype || 0) / 850)
    + Math.min(.05, ((G.skills || {}).rete || 0) / 460)
    + Math.min(.04, lvl / 320);
  /* il giro che ti conosce già lavora per te: contatti fuori città e
     reputazione locale sono i due moltiplicatori veri */
  const giro = 1
    + Math.min(.85, conosciuti().length * .07)
    + Math.min(.6, repCittaTotale() / 260);
  const freddo = s.rifiutiFila >= 2 ? .5 : 1;
  return cl(base * giro * freddo * (reputazione() / 55), 0, .32);
}
function repCittaTotale(){
  const c = st().citta;
  return Object.keys(c).reduce((a, k) => a + (c[k].rep || 0), 0);
}

function scadenze(){
  const s = st(), oggi = assoluto();
  const scaduti = s.inviti.filter(x => oggi > x.scade);
  if(!scaduti.length) return;
  s.inviti = s.inviti.filter(x => oggi <= x.scade);
  for(const inv of scaduti){
    const c = CITTA_BY_ID[inv.citta], t = TIPI_BY_ID[inv.tipo];
    if(!c || !t) continue;
    addRep(-2);
    s.rifiutiFila = (s.rifiutiFila || 0) + 1;
    diario("<b>Scaduto l'invito da " + esc(c.n) + ".</b> " + esc(t.n) +
      ": non hai risposto e hanno chiamato un altro.", "bad");
    notifica({
      eventId:"trasferta:" + inv.iid, tier:"basso", title:"Invito scaduto", family:"Trasferta",
      result:t.n + " a " + c.n + ": nessuna risposta, il posto è andato a un altro.",
      effects:["Reputazione nel giro in calo"]
    });
  }
  aggiornaBadge();
}

function giornoTrasferte(){
  const s = st(), oggi = assoluto();
  if(RIENTRO) return;
  if(s.ultimoGiorno === oggi) return;
  s.ultimoGiorno = oggi;
  if(G.ended) return;

  scadenze();

  /* le catene mature: una al giorno al massimo, se no torni da un salto di un
     mese e trovi otto persone che ti scrivono insieme */
  const mature = s.catene.filter(x => x.quando <= oggi);
  if(mature.length){
    const cat = mature[0];
    const esito = eseguiCatena(cat);
    if(esito !== "rinviata") s.catene = s.catene.filter(x => x !== cat);
  }

  if(s.attiva) return;                              /* sei già fuori: non ti chiama nessuno */
  if(s.inviti.length >= 3) return;                  /* tre inviti in sospeso bastano */
  if(oggi - s.ultimoInvito < 3) return;             /* non due telefonate di fila */
  if(Math.random() < probInvito()) creaInvito();
  salva();
}

/* ============================================================
   L'APP DEL TELEFONO
   ------------------------------------------------------------
   L'agenda delle trasferte: gli inviti aperti (con il tasto per rispondere), le
   città in cui sei stato e la rete che ti sei fatto fuori casa, divisa per
   città. La disegnamo tutta qui dentro, come fa il centro notifiche di
   eventi-v2, così telefono.js resta quello che è.
   ============================================================ */
function badgeTrasferte(){ return st().inviti.filter(x => !x.letto).length || st().inviti.length; }

function aggiornaBadge(){
  try{
    if(typeof renderTelefono === "function" && document.getElementById("hb-tel")) renderTelefono();
  }catch(e){}
}

function installaApp(){
  try{
    if(typeof HIC !== "undefined" && !HIC.valigia){
      HIC.valigia = '<path d="M9 2h6a2 2 0 0 1 2 2v2h2.5A2.5 2.5 0 0 1 22 8.5v10A2.5 2.5 0 0 1 19.5 21h-15A2.5 2.5 0 0 1 2 18.5v-10A2.5 2.5 0 0 1 4.5 6H7V4a2 2 0 0 1 2-2zm0 4h6V4H9zm2.2 4v8h1.6v-8z"/>';
    }
    if(typeof HUB_APP !== "undefined" && Array.isArray(HUB_APP) && !HUB_APP.some(a => a.id === "trasferte")){
      HUB_APP.splice(2, 0, {id:"trasferte", n:"Trasferte", ic:"valigia", k:"#F97316",
        badge:() => badgeTrasferte()});
    }
    if(typeof HUB_APP_VECCHIO !== "undefined" && Array.isArray(HUB_APP_VECCHIO) &&
       !HUB_APP_VECCHIO.some(a => a.id === "trasferte")){
      HUB_APP_VECCHIO.splice(2, 0, {id:"trasferte", n:"Trasferte", ic:"valigia", k:"#F97316",
        sotto:() => { const n = st().inviti.length;
          return n ? n + (n === 1 ? " invito aperto" : " inviti aperti") : conosciuti().length + " contatti fuori"; },
        vai:() => apriApp()});
    }
    /* il ruolo scritto per esteso anche nell'app Contatti, se no un
       «videomaker» conosciuto a Roma lì dentro si legge in minuscolo e sbagliato */
    if(typeof TEL_RUOLI !== "undefined"){
      for(const r of RUOLI_NUOVI) if(!TEL_RUOLI[r]) TEL_RUOLI[r] = RUOLI[r].n;
    }
  }catch(e){ console.warn("[Trasferte] app non registrata", e); }
}

function schedaCitta(c){
  const cs = cittaStato(c.id);
  const gente = conosciuti(c.id);
  return '<div class="trascitta">' +
    '<div class="trascittatop"><b>' + esc(c.n) + '</b>' +
      '<i>' + cs.visite + (cs.visite === 1 ? " trasferta" : " trasferte") + '</i></div>' +
    '<div class="trasbarra"><span style="width:' + cl(cs.rep, 0, 100) + '%"></span></div>' +
    '<div class="trascittariga">' +
      '<span>' + (typeof fmt === "function" ? fmt(cs.fan) : cs.fan) + ' fan lì</span>' +
      '<span>reputazione ' + Math.round(cs.rep) + '</span>' +
      '<span>' + gente.length + (gente.length === 1 ? " contatto" : " contatti") + '</span>' +
    '</div>' +
  '</div>';
}

function schedaPersona(p){
  const info = ruoloInfo(p.ruolo), req = requisito(p), ok = requisitoOk(p);
  return '<div class="traspersona" style="--k:' + (info.k || "#9AA1B2") + '">' +
    '<b>' + esc(p.n) + '</b>' +
    '<i>' + esc(info.n) + ' · ' + esc(gradoNome(p)) + (p.numero ? ' · hai il numero' : '') + '</i>' +
    (p.reqKey === "aperto" ? '' :
      '<u class="' + (ok ? "ok" : "no") + '">' + (ok ? "sbloccato" : "serve " + esc(req.t)) + '</u>') +
  '</div>';
}

function contenutoApp(){
  const s = st();
  let html = '';

  html += '<div class="trastesta">' +
    '<div><b>' + reputazione() + '</b><span>reputazione nel giro</span></div>' +
    '<div><b>' + conosciuti().length + '</b><span>contatti fuori città</span></div>' +
    '<div><b>' + Object.keys(s.citta).filter(k => s.citta[k].visite > 0).length + '</b><span>città toccate</span></div>' +
  '</div>';

  if(s.attiva){
    const c = CITTA_BY_ID[s.attiva.citta], t = TIPI_BY_ID[s.attiva.tipo];
    html += '<div class="trassez">In corso</div><div class="trasinvito in">' +
      '<b>' + esc(t ? t.n : "") + ' · ' + esc(c ? c.n : "") + '</b>' +
      '<i>Sei fuori città. La trasferta è ancora aperta.</i></div>';
  }

  html += '<div class="trassez">Inviti</div>';
  if(!s.inviti.length){
    html += '<div class="trasvuoto">Nessun invito aperto. Le chiamate arrivano quando fuori dalla tua città ' +
      'qualcuno comincia a sapere chi sei: fan, hype e gente che parla bene di te.</div>';
  } else {
    html += s.inviti.map(inv => {
      const c = CITTA_BY_ID[inv.citta], t = TIPI_BY_ID[inv.tipo];
      if(!c || !t) return '';
      return '<button class="trasinvito" data-tras-inv="' + inv.iid + '" style="--k:' + t.k + '">' +
        '<b>' + esc(t.n) + ' · ' + esc(c.n) + '</b>' +
        '<i>' + (inv.daNome ? "Da " + esc(inv.daNome) + " · " : "") +
          eur(inv.offerta.cachet) + ' · ' + inv.offerta.giorni +
          (inv.offerta.giorni === 1 ? " giorno" : " giorni") + ' · scade ' + quandoTesto(inv.scade) + '</i>' +
        '<u>Rispondi</u></button>';
    }).join("");
  }

  const visitate = CITTA.filter(c => cittaStato(c.id).visite > 0 || cittaStato(c.id).rep > 0);
  html += '<div class="trassez">Le città</div>';
  html += visitate.length
    ? visitate.map(schedaCitta).join("")
    : '<div class="trasvuoto">Non sei ancora uscito dalla tua provincia. La prima città che tocchi ' +
      'comincia a ricordarsi di te: fan locali, reputazione, e da lì in poi ti richiamano più spesso.</div>';

  const fuori = rete();
  html += '<div class="trassez">La rete fuori casa</div>';
  if(!fuori.length){
    html += '<div class="trasvuoto">Nessuno, per ora. Si conosce gente lavorando: nel backstage, sul set, in sala.</div>';
  } else {
    const perCitta = {};
    for(const p of fuori){ (perCitta[p.citta] = perCitta[p.citta] || []).push(p); }
    html += Object.keys(perCitta).map(cid =>
      '<div class="trasgruppo"><span>' + esc((CITTA_BY_ID[cid] || {}).n || cid) + '</span>' +
      perCitta[cid].map(schedaPersona).join("") + '</div>').join("");
  }

  const storia = s.storico.slice(0, 8);
  if(storia.length){
    html += '<div class="trassez">Quello che hai fatto</div>' +
      storia.map(x => {
        const c = CITTA_BY_ID[x.citta], t = TIPI_BY_ID[x.tipo];
        return '<div class="trasriga"><b>' + esc(t ? t.n : "") + ' · ' + esc(c ? c.n : "") + '</b>' +
          '<i>+' + (typeof fmt === "function" ? fmt(x.fan) : x.fan) + ' fan · ' + eur(x.soldi) +
          (x.conosciuti && x.conosciuti.length ? ' · ' + x.conosciuti.map(esc).join(", ") : "") + '</i></div>';
      }).join("");
  }
  return html;
}

function apriApp(){
  let el = document.getElementById("tras-overlay");
  if(!el){
    el = document.createElement("div");
    el.id = "tras-overlay";
    document.body.appendChild(el);
  }
  el.innerHTML =
    '<div class="trascard">' +
      '<div class="trashead"><button class="trasback" data-tras-chiudi="1" aria-label="Chiudi"></button>' +
        '<b>Trasferte</b></div>' +
      '<div class="trasbody">' + contenutoApp() + '</div>' +
    '</div>';
  el.classList.add("on");
}
function chiudiApp(){
  const el = document.getElementById("tras-overlay");
  if(el) el.classList.remove("on");
}

document.addEventListener("click", ev => {
  const app = ev.target.closest && ev.target.closest('[data-app="trasferte"]');
  if(app){
    ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
    apriApp(); return;
  }
  const back = ev.target.closest && ev.target.closest("[data-tras-chiudi]");
  if(back){
    ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
    chiudiApp(); return;
  }
  const inv = ev.target.closest && ev.target.closest("[data-tras-inv]");
  if(inv){
    ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
    const iid = inv.getAttribute("data-tras-inv");
    chiudiApp();
    setTimeout(() => apriInvito(iid), 120);
    return;
  }
}, true);
document.addEventListener("keydown", ev => {
  if(ev.key === "Escape"){
    const el = document.getElementById("tras-overlay");
    if(el && el.classList.contains("on")){ ev.stopPropagation(); chiudiApp(); }
  }
}, true);

/* ============================================================
   INNESTI NELLA REPO
   ============================================================ */

/* 1. I nove mestieri nuovi devono esistere per La Sala e per il telefono, se no
      si trovano fra le mani un `ruolo` che non sanno disegnare e vanno in
      errore appena qualcuno apre i contatti. */
function registraRuoli(){
  if(typeof POSTO_RUOLI === "undefined") return;
  for(const r of RUOLI_NUOVI){
    if(!POSTO_RUOLI[r]) POSTO_RUOLI[r] = {n:RUOLI[r].n, k:RUOLI[r].k, d:RUOLI[r].d};
  }
}

/* 2. La Sala è il posto dietro al bar della TUA città: chi lavora a Napoli non
      ci passa il martedì pomeriggio. Le due funzioni che decidono chi c'è
      lavorano su `G.gente` intero, quindi gliela passiamo senza quelli di fuori
      e gliela restituiamo subito dopo — la loro logica non la tocchiamo. */
function senzaFuori(fn, ctx, args){
  const fuori = (G.gente || []).filter(p => p.fuori);
  if(!fuori.length) return fn.apply(ctx, args);
  const dentro = G.gente.filter(p => !p.fuori);
  G.gente = dentro;
  try{ return fn.apply(ctx, args); }
  finally{ G.gente = G.gente.concat(fuori); }
}
function innestaSala(){
  if(typeof sistemaGente === "function"){
    const orig = sistemaGente;
    window.sistemaGente = function(){ return senzaFuori(orig, this, arguments); };
  }
  if(typeof presentiOggi === "function"){
    const orig = presentiOggi;
    window.presentiOggi = function(){ return senzaFuori(orig, this, arguments); };
  }
}

/* 3. Il battito: una passata al giorno, agganciata dove il giorno cambia
      davvero. avanzaGiorno() è il motore unico (sim.js) e lo usano sia «Fine
      giornata» sia i salti, quindi basta lui. */
function innestaCalendario(){
  if(typeof avanzaGiorno !== "function") return;
  const orig = avanzaGiorno;
  window.avanzaGiorno = function(){
    const out = orig.apply(this, arguments);
    /* dentro a un salto le catene maturano lo stesso ma non aprono finestre:
       ci pensa schermoLibero(), che durante SALTO è falso perché la modale
       del salto o il rapporto sono ancora sopra */
    try{ giornoTrasferte(); }catch(e){ console.warn("[Trasferte] giorno", e); }
    return out;
  };
}

/* 4. Se rientri in una partita salvata con un invito ancora da rispondere, non
      lo perdi: torna a galla appena lo schermo è libero. */
function riprendiInSospeso(){
  const s = st();
  if(s.attiva){
    /* una trasferta interrotta da un refresh riparte dal punto giusto: se
       l'evento principale l'hai gia' giocato non te lo rifacciamo giocare */
    const riprendi = s.attiva.esitoTesto ? scenaIncontri : scenaEvento;
    setTimeout(function ritenta(giri){
      giri = giri == null ? 40 : giri;
      if(!st().attiva) return;
      if(schermoLibero()){ riprendi(); return; }
      if(giri > 0) setTimeout(() => ritenta(giri - 1), 500);
    }, 800);
    return;
  }
  const inv = s.inviti.find(x => !x.letto) || s.inviti[0];
  if(inv) setTimeout(() => apriInvitoQuandoSiPuo(inv.iid), 1200);
}

/* ============================================================
   FOGLIO DI STILE
   ============================================================ */
/* Il foglio vero sta in `css/trasferte.css` ed è linkato da index.html insieme a
   tutti gli altri. Questo è solo la rete di sicurezza per chi carica il modulo
   da solo (una pagina di prova): se il foglio non c'è, se lo tira dietro. */
function stile(){
  if(document.getElementById("trasferte-css")) return;
  for(const l of document.querySelectorAll('link[rel="stylesheet"]'))
    if(String(l.getAttribute("href") || "").indexOf("trasferte.css") >= 0) return;
  const l = document.createElement("link");
  l.id = "trasferte-css";
  l.rel = "stylesheet";
  l.href = "css/trasferte.css?v=1";
  document.head.appendChild(l);
}

/* ============================================================
   AVVIO
   ============================================================ */
st();
registraRuoli();
innestaSala();
innestaCalendario();
installaApp();
stile();
riprendiInSospeso();

window.TRASFERTE = Object.freeze({
  citta:CITTA,
  tipi:TIPI,
  ruoli:RUOLI,
  stato:() => st(),
  reputazione,
  probabilita:probInvito,
  rete,
  apri:apriApp,
  /* per provare senza aspettare che il giro si accorga di te */
  forzaInvito:(citta, tipo) => creaInvito({citta, tipo}),
  giorno:giornoTrasferte,
  debug(){
    const s = st();
    return {
      reputazione:reputazione(),
      probabilitaGiornaliera:Math.round(probInvito() * 1000) / 10 + "%",
      inviti:s.inviti.map(x => x.tipo + "@" + x.citta + " (scade " + quandoTesto(x.scade) + ")"),
      attiva:s.attiva ? s.attiva.tipo + "@" + s.attiva.citta : null,
      catene:s.catene.map(x => x.tipo + ":" + x.payload + " " + quandoTesto(x.quando)),
      cittaAperte:CITTA.filter(cittaAperta).map(c => c.n),
      tipiAperti:CITTA.filter(cittaAperta).length
        ? TIPI.filter(t => tipoAperto(t, CITTA.filter(cittaAperta)[0])).map(t => t.id) : [],
      reteFuori:rete().map(p => p.n + " (" + p.ruolo + "@" + p.citta + ", " + gradoNome(p) + ")"),
      rifiutiFila:s.rifiutiFila,
      trasferteFatte:s.storico.length
    };
  }
});

})();
