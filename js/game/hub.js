/* La plancia: la schermata da cui si gioca.

   La mappa è la foto del concept (media/photo/mappa_citta.jpg): i luoghi con le
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
  dado:'<path d="M12 2 21 6.6v10.8L12 22 3 17.4V6.6zM5.8 7.5 12 10.7l6.2-3.2L12 4.3z"/>'
};
const hsvg = (n, cls) => '<svg class="' + (cls || "hicon") + '" viewBox="0 0 24 24" aria-hidden="true">' + HIC[n] + '</svg>';
const spoglia = t => String(t).replace(/<[^>]*>/g, "");

/* ================= I LUOGHI ================= */
/* Le targhette sono dentro alla foto: qui c'è solo dove si tocca, in
   percentuale dell'immagine (830×677), e cosa succede quando si tocca. */
const HUB_LUOGHI = [
  {id:"studio", n:"Studio", x:12.17, y:9.16, w:18.07, h:16.69,
   vai:() => hubGioco("settimana")},
  {id:"club", n:"Club & discoteche", x:61.81, y:12.11, w:19.76, h:9.31,
   chiuso:"Si apre a <b>Milano</b>, e a Milano ci si arriva con più cose insieme: " +
     "<b>livello 10</b>, <b>fama 50</b>, <b>hype 40</b>."},
  {id:"concerti", n:"Concerti & live", x:73.86, y:31.02, w:18.19, h:9.31,
   chiuso:"I concerti veri arrivano con <b>Milano</b>: qui i locali sono due, e chiamano " +
     "chi conoscono. Il palco che hai adesso è la piazza e l'open mic della settimana."},
  {id:"beat", n:"Beat maker", x:5.30, y:39.14, w:18.31, h:14.77,
   vai:() => hubGioco("catalogo", "market")},
  {id:"vita", n:"Vita quotidiana", x:37.83, y:50.96, w:19.52, h:14.77,
   vai:() => hubGioco("lifestyle")},
  {id:"crimin", n:"Attività criminali", x:72.77, y:50.96, w:20.24, h:18.17,
   vai:() => hubPresto("Attività criminali",
     "Il giro storto della provincia — colpi piccoli, soldi veloci, guai veri — " +
     "è il prossimo pezzo di mondo da aprire.")},
  {id:"sponsor", n:"Sponsor & brand", x:6.87, y:74.59, w:19.28, h:9.31,
   chiuso:"I brand pagano dove c'è gente: si aprono a <b>Milano</b>."},
  {id:"business", n:"Business", x:38.80, y:80.21, w:16.75, h:9.16,
   chiuso:"Investire viene dopo: si apre a <b>Milano</b>."},
  {id:"shop", n:"Shop", x:74.58, y:81.24, w:16.27, h:9.16,
   chiuso:"I negozi che contano stanno a <b>Milano</b>. Qui c'è quello che passa il paese: " +
     "l'attrezzatura la trovi nel catalogo."}
];

/* ================= GLI EVENTI DI OGGI ================= */
/* Non sono cartelli finti: ognuno fa partire un'azione vera della settimana,
   con il suo costo e i suoi rischi. Il colpo rapido è l'unico che ancora non
   c'è, e lo dice invece di far finta. */
const HUB_EVENTI = [
  {id:"free", ic:"mic", k:"#A855F7", n:"Freestyle al bar centrale",
   d:"Freestyle contest aperto a tutti.", ora:"21:00",
   righe:[["hype", "Hype in piazza"], ["gente", "Gente nuova"]]},
  {id:"beat", ic:"nota", k:"#38BDF8", n:"Producer session",
   d:"Incontra un producer in studio.", ora:"22:30",
   righe:[["gente", "Nuovo contatto"], ["cursori", "Tre beat"]]},
  {id:"stacca", ic:"corona", k:"#FACC15", n:"Piccolo party",
   d:"Party in appartamento.", ora:"00:00",
   righe:[["cuore", "Ti rimette su"], ["dado", "Evento casuale"]]},
  {id:"colpo", ic:"maschera", k:"#EF4444", n:"Colpo rapido",
   d:"Lavoro illegale. Rischio basso.", ora:"01:30", presto:true,
   righe:[["soldi", "Soldi veloci"], ["rischio", "Rischio vero"]]}
];

/* ================= LE APP DEL TELEFONO ================= */
const HUB_APP = [
  {id:"contatti", n:"Contatti", ic:"gente", k:"#38BDF8",
   sotto:g => Math.round(g.skills.rete) + " di rete",
   vai:() => hubPresto("Contatti",
     "Producer, fonici, gente che organizza serate: la rubrica vera è il prossimo " +
     "pezzo di gioco. Per adesso la tua rete è una statistica, e cresce quando esci.")},
  {id:"obiettivi", n:"Obiettivi", ic:"mirino", k:"#EF4444",
   sotto:g => GOALS.filter(x => !g.goals[x.id]).length + " aperti",
   vai:() => hubGioco("obiettivi")},
  {id:"notizie", n:"Notizie", ic:"giornale", k:"#60A5FA",
   sotto:() => HUB_NOTIZIE.length + " questa settimana", vai:() => hubNotizie()},
  {id:"inventario", n:"Inventario", ic:"zaino", k:"#F59E0B",
   sotto:g => (g.bars.length + g.beats.length + g.songs.length + Object.keys(g.gear).length) + " cose",
   vai:() => hubGioco("catalogo", "mat")},
  {id:"statistiche", n:"Statistiche", ic:"barre", k:"#4ADE80",
   vai:() => { hubGioco("settimana"); const d = $("g-dett");
     if(d && d.getAttribute("aria-expanded") !== "true") d.click(); }},
  {id:"classifiche", n:"Classifiche", ic:"coppa", k:"#FACC15",
   vai:() => hubGioco("classifica")},
  {id:"agenda", n:"Agenda", ic:"agenda", k:"#F87171",
   sotto:() => ACTIONS.filter(a => !a.avail || a.avail()).length + " mosse oggi",
   vai:() => hubGioco("settimana")},
  {id:"impostazioni", n:"Impostazioni", ic:"ingranaggio", k:"#9AA1B2",
   vai:() => { if(window.IMPOSTAZIONI) window.IMPOSTAZIONI(); }}
];

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
  "L'energia finisce: chiudi la settimana quando non hai più mosse.",
  "La lucidità si consuma. Se scende troppo, quello che scrivi non regge.",
  "Il beat giusto è metà del pezzo. Ascoltali prima di comprare."
];

/* ================= APERTURE ================= */
/* Il luogo non rifà quello che sa già fare la partita: la apre sulla sezione
   giusta. Così la plancia resta la porta, e il gioco resta dov'è. */
function hubGioco(tab, sotto){
  GO("game");
  renderGioco();
  const nb = document.querySelector('.nb[data-t="' + tab + '"]');
  if(nb) nb.click();
  if(sotto){
    const sb = document.querySelector('.sb[data-s="' + sotto + '"]');
    if(sb) sb.click();
  }
  window.scrollTo({top:0});
}

function hubPresto(titolo, testo){
  showEvent({k:"Non ancora", t:titolo, d:testo, annulla(){},
    opts:[{n:"Va bene", d:"Torni alla mappa", run(){ return null; }}]});
}

function hubChiuso(l){
  showEvent({k:"Chiuso", t:l.n, d:l.chiuso, annulla(){},
    opts:[{n:"Ho capito", d:"Torni alla mappa", run(){ return null; }}]});
}

function hubNotizie(){
  showEvent({k:"Notizie della settimana", t:"Cosa gira in paese",
    d:HUB_NOTIZIE.map(n => "• " + n.t).join("<br>"), annulla(){},
    opts:[{n:"Chiudi", d:"Torni alla mappa", run(){ return null; }}]});
}

/* L'azione vera dietro a un evento di oggi: si apre nella partita, con il suo
   costo, la sua conferma e le sue scene. Qui si guarda solo se si può fare. */
function hubAzione(id){
  hubGioco("settimana");
  const t = document.querySelector('.tile[data-id="' + id + '"]');
  if(t) t.click();
}
function hubPronta(id){
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

/* ================= LA MISURA DELLA PLANCIA ================= */
/* Disegnata a 1536×1024 e rimpicciolita tutta insieme: le proporzioni restano
   quelle del concept e le zone da toccare restano sui cartelli.
   Se la schermata non è ancora a video le misure sono zero: in quel caso non si
   tocca niente e si riprova al giro dopo, se no resterebbe tutto nero. */
function hubScala(){
  const palco = $("hb-palco"), pl = $("hb-plancia");
  if(!palco || !pl) return;
  const w = palco.clientWidth, h = palco.clientHeight;
  if(w < 40 || h < 40) return;
  const k = Math.max(Math.min(w / 1536, h / 1024), .42);
  pl.style.transform = "scale(" + k.toFixed(4) + ")";
  pl.style.left = Math.max(0, Math.round((w - 1536 * k) / 2)) + "px";
  pl.style.top = Math.max(0, Math.round((h - 1024 * k) / 2)) + "px";
  palco.style.overflow = (1536 * k > w + 1 || 1024 * k > h + 1) ? "auto" : "hidden";
}
window.addEventListener("resize", hubScala);

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

/* le sei abilità: quattro sono statistiche vere, due vengono da quello che hai
   in mano (attrezzatura e mestiere al mixer). Nessuna è inventata. */
function skillRighe(){
  return rigaSkill("mic", "Rap", G.skills.flow) +
    rigaSkill("matita", "Scrittura", G.skills.scrittura) +
    rigaSkill("cursori", "Produzione", gearBonus() * 2.5, "Cresce con l'attrezzatura che compri") +
    rigaSkill("manopole", "Mixing", mixGain() * 3.2, "Cresce con monitor, cuffie e mestiere") +
    rigaSkill("faccia", "Carisma", G.skills.presenza) +
    rigaSkill("gente", "Networking", G.skills.rete);
}

/* la fan base, detta come la direbbe uno del giro */
function fanBase(){
  const f = G.fans;
  return f < 500 ? "Locale" : f < 5000 ? "Provinciale" : f < 50000 ? "Regionale"
    : f < 500000 ? "Nazionale" : "Internazionale";
}

/* l'ora della sera: la settimana si consuma con l'energia */
function hubOra(){
  const usate = clamp(G.maxEnergy - G.energy, 0, 8);
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
      rigaStat("soldi", "#4ADE80", "Soldi", fmt(G.money) + " €") +
      rigaStat("energia", "#FACC15", "Energia", G.energy + " / " + G.maxEnergy) +
      rigaStat("fama", "#FBBF24", "Fama", short(G.fans)) +
      rigaStat("hype", "#FB923C", "Hype", Math.round(G.hype)) +
      rigaStat("gente", "#60A5FA", "Network", Math.round(G.skills.rete)) +
      rigaStat("cuore", "#EF4444", "Benessere", Math.round(G.wellbeing), G.wellbeing) +
      rigaStat("testa", "#A855F7", "Lucidità", Math.round(luc()), luc()) +
    '</div>' +
    '<div class="psk"><span class="pk">Skill</span>' + skillRighe() + '</div>' +
    '<div class="pdue">' +
      '<div><span class="pk">Stile musicale</span><div class="v">' +
        (typeof genre === "function" ? genre().n : "—") + '</div></div>' +
      '<div><span class="pk">Fan base</span><div class="v">' + fanBase() + '</div></div>' +
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
      rigaStat("cursori", "#38BDF8", "Produzione", "cresce con l'attrezzatura") +
      rigaStat("manopole", "#4ADE80", "Mixing", "cresce mixando") +
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

  hubScala();

  /* ---- fascia in alto ---- */
  $("hb-citta").textContent = (art.city || "").trim() || "Città di provincia";
  $("hb-fase").textContent = ph.n;
  $("hb-week").textContent = G.week;
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
    '" data-l="' + l.id + '" style="--x:' + l.x + '%;--y:' + l.y + '%;--w:' + l.w + '%;--h:' + l.h + '%" ' +
    'aria-label="' + l.n + (l.chiuso ? " — chiuso" : "") + '" title="' + l.n + '"></button>').join("") +
    '<button class="pfrec" data-f="-1" aria-label="Luogo precedente" ' +
      'style="--x:34.82%;--y:93.5%;--w:5.06%;--h:4.28%"></button>' +
    '<button class="pfrec" data-f="1" aria-label="Luogo successivo" ' +
      'style="--x:56.02%;--y:93.5%;--w:5.06%;--h:4.28%"></button>';

  /* ---- gli eventi di oggi ---- */
  $("hb-eventi").innerHTML = HUB_EVENTI.map(e => {
    const st = e.presto ? {ok:true, perche:""} : hubPronta(e.id);
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

  /* ---- il telefono ---- */
  const nuovi = Math.max(0, G.log.length - (G.seenLog || 0));
  const msg = G.log.slice(0, 2);
  $("hb-tel").innerHTML =
    '<span class="ptt">Il tuo telefono</span>' +
    '<div class="pmsg">' +
      '<div class="pmsghead">' + hsvg("chat") + '<b>Messaggi</b>' +
        (nuovi ? '<span class="pnuovi">' + nuovi + ' nuovi</span>' : '') + '</div>' +
      (msg.length ? msg.map(m =>
        '<button class="pmr" data-diario="1">' +
          '<span class="pmav">' + hsvg("persona") + '</span>' +
          '<span class="pmtx"><b>Diario</b><i>' + spoglia(m.t) + '</i></span>' +
          '<span class="pmrt">' + m.w + (nuovi ? '<u></u>' : '') + '</span>' +
        '</button>').join("")
        : '<div class="pmr"><span class="pmtx"><i>Ancora niente. Muoviti, e qualcosa succede.</i></span></div>') +
    '</div>' +
    '<button class="plargo" data-diario="1">Vedi tutti i messaggi</button>' +
    '<div class="papp">' + HUB_APP.map(a =>
      '<button class="pap" data-app="' + a.id + '" style="--k:' + a.k + '">' + hsvg(a.ic) +
      '<span><b>' + a.n + '</b>' + (a.sotto ? '<i>' + a.sotto(G) + '</i>' : '') + '</span></button>').join("") +
    '</div>' +
    '<div class="pnews"><h4>Notizie della settimana</h4>' +
      HUB_NOTIZIE.map(n => '<p style="--k:' + n.k + '">' + hsvg(n.ic) + n.t + '</p>').join("") +
    '</div>' +
    '<button class="plargo" data-news="1">Vedi tutte le notizie</button>';

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
    if(q) q.focus({preventScroll:true});
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
  if(b.dataset.v === "vestiti"){ GO("profile"); return; }
  HUB_VISTA = b.dataset.v;
  renderHub();
});

$("hb-eventi").addEventListener("click", ev => {
  const b = ev.target.closest(".pev"); if(!b || b.disabled) return;
  const e = HUB_EVENTI.find(x => x.id === b.dataset.e); if(!e) return;
  hubTap();
  if(e.presto) hubPresto(e.n,
    "I lavori sporchi arrivano con le attività criminali: è il prossimo pezzo di " +
    "mondo da aprire, insieme al giro storto sulla mappa.");
  else hubAzione(e.id);
});

$("hb-tel").addEventListener("click", ev => {
  const app = ev.target.closest("[data-app]");
  if(app){
    const a = HUB_APP.find(x => x.id === app.dataset.app);
    if(a){ hubTap(); a.vai(); }
    return;
  }
  if(ev.target.closest("[data-diario]")){ GO("game"); renderGioco(); $("g-diary").click(); return; }
  if(ev.target.closest("[data-news]")){ hubTap(); hubNotizie(); }
});

$("hb-logo").onclick = () => GO("menu");

/* La via di ritorno dalla partita. Prima si accende la schermata, poi si
   disegna: al contrario le misure sarebbero zero e resterebbe tutto nero. */
$("g-tomappa").onclick = () => { GO("hub"); renderHub(); };

window.HUB = { apri(){ GO("hub"); renderHub(); }, render: renderHub, scala: hubScala };
