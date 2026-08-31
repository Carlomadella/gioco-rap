/* Lingua dell'interfaccia — Anni di Fame. © La Fame Studio.

   Il gioco è scritto in italiano dentro al codice. Qui c'è il vocabolario per
   l'inglese e il traduttore che passa sopra a quello che finisce a schermo:
   un nodo di testo alla volta, sulle frasi intere che conosciamo.
   Le scene scritte (diario, eventi, dialoghi) restano in italiano: sono il tono
   del gioco, si traducono a mano quando è il loro turno.
   Tornare all'italiano ricarica la pagina, così non serve la mappa inversa. */
"use strict";

const LANG = {
  /* --- guscio e menu --- */
  "Menu":"Menu",
  "Menu principale":"Main menu",
  "Impostazioni":"Settings",
  "Audio, aspetto, difficoltà, salvataggi":"Audio, look, difficulty, saves",
  "Nessuna carriera iniziata":"No career yet",
  "Crea il tuo artista":"Create your artist",
  "Artista pronto, carriera da iniziare":"Artist ready, career not started",
  "Otto avatar pronti, o costruisci la faccia da zero.":"Eight ready avatars, or build a face from scratch.",
  "Otto avatar pronti, oppure costruisci la faccia da zero.":"Eight ready avatars, or build a face from scratch.",
  "Inizia la carriera":"Start the career",
  "Riprendi la carriera":"Resume the career",
  "Prima devi creare il tuo artista":"First create your artist",
  "Entra subito: l'artista lo sistemi dopo":"Jump in: you can fix the artist later",
  "Settimana 1 · zero fan, zero contatti":"Week 1 · zero fans, zero contacts",
  "Il tuo artista":"Your artist",
  "Aspetto, città, genere":"Look, city, genre",
  "Come si gioca":"How to play",
  "Energia, settimane, lucidità":"Energy, weeks, focus",
  "Classifiche":"Charts",
  "Chi comanda questa settimana":"Who runs this week",
  "La tua carriera":"Your career",
  "Ricomincia da capo":"Start over",
  "Cancelli la carriera? Tocca ancora":"Delete the career? Tap again",
  "Fase":"Stage", "Settimana":"Week", "Fan":"Fans", "In tasca":"In pocket",
  "Pezzi usciti":"Tracks out", "Sezione ancora da costruire.":"Section still to be built.",
  "Nessuno diventa qualcuno in una settimana. Il gioco è tutto qui: poche mosse alla volta, per anni, finché il nome non gira da solo.":
    "Nobody becomes somebody in a week. That's the whole game: a few moves at a time, for years, until the name travels on its own.",
  "Tre energie a settimana":"Three energies a week",
  "Scrivere, registrare, salire su un palco: ogni mossa costa una o due energie. Ne hai tre. Le rimetti a posto solo chiudendo la settimana.":
    "Writing, recording, taking a stage: every move costs one or two energies. You have three. They only come back when you close the week.",
  "La settimana si chiude":"The week closes",
  "Quando hai finito le mosse chiudi la settimana: gli stream si muovono, i fan arrivano o se ne vanno, l'affitto va pagato lo stesso.":
    "When you're out of moves you close the week: streams move, fans arrive or leave, the rent gets paid anyway.",
  "La lucidità si consuma":"Focus burns out",
  "Lavorare ai pezzi te la alza. I turni al lavoro, le settimane vuote e il tempo che salti te la abbassano. Sotto zero non scrivi più niente di buono.":
    "Working on tracks raises it. Day-job shifts, empty weeks and skipped time lower it. At the bottom nothing good comes out.",
  "Si sale per prove":"You climb through trials",
  "Da sconosciuto a GOAT ci sono sette gradini. Ognuno ha una prova da superare, con dei requisiti veri: fan, pezzi pubblicati, settimane di gavetta.":
    "From unknown to GOAT there are seven steps. Each one has a trial with real requirements: fans, released tracks, weeks of grind.",
  "La Fame Studio · prototipo. La partita è salvata su questo dispositivo: se svuoti i dati del browser, la carriera se ne va con loro.":
    "La Fame Studio · prototype. The game is saved on this device: clear the browser data and the career goes with it.",

  /* --- partita: navigazione e pannelli --- */
  "Settimana":"Week", "Catalogo":"Catalogue", "Classifica":"Chart",
  "Contratti":"Deals", "Lifestyle":"Lifestyle", "Traguardi":"Milestones",
  "Materiale in cartella":"Material on file", "Beat in vendita":"Beats for sale",
  "I tuoi pezzi":"Your tracks", "Attrezzatura":"Gear",
  "Top 10 della settimana":"Top 10 of the week", "Offerte sul tavolo":"Offers on the table",
  "Contratto in corso":"Deal in force", "Le tue spese fisse":"Your fixed costs",
  "Diario":"Diary", "Salta il tempo":"Skip time", "Chiudi la settimana":"Close the week",
  "Il diario è vuoto. Fai qualcosa.":"The diary is empty. Do something.",
  "Strofe scritte":"Verses written", "il quaderno è vuoto":"the notebook is empty",
  "Beat comprati":"Beats bought", "nessuno: i beat si comprano qui sotto":"none: beats are bought below",
  "energia":"energy", "benessere":"wellbeing", "lucidità":"focus",
  "pezzi fuori":"tracks out", "nessun lavoro":"no job", "tuo":"yours",
  "Settimana chiusa":"Week closed", "Avanti":"Next",
  "stream":"streams", "nuovi fan":"new fans", "in cassa":"in the bank",
  "di lifestyle a settimana":"of lifestyle per week", "spese totali":"total costs",
  "vantaggi attivi":"active perks", "gratis":"free", "Sali":"Up", "Scendi":"Down",
  "Dove vivi":"Where you live", "Come ti muovi":"How you get around",
  "Come ti vesti":"How you dress", "Come vivi le notti":"How you spend your nights",
  "Chi hai intorno":"Who's around you",

  /* --- azioni --- */
  "Scrivi barre":"Write bars", "Il foglio, la penna e quello che hai in testa.":"The page, the pen and whatever's in your head.",
  "Cerca un beat":"Find a beat", "Registra il pezzo":"Record the track",
  "Mixa il pezzo":"Mix the track", "Pubblica il pezzo":"Release the track",
  "Promo sui social":"Push it on social", "Freestyle in piazza":"Freestyle in the square",
  "Serata open mic":"Open mic night", "Vai al turno":"Go to your shift",
  "Cerca lavoro":"Look for work", "Stacca la spina":"Pull the plug",
  "Il foglio":"The page", "Scrivi la tua strofa":"Write your verse",
  "Lascia perdere":"Forget it", "Chiudi la strofa":"Close the verse",

  /* --- fasi --- */
  "Sconosciuto":"Unknown", "Rapper esordiente":"Rookie rapper",
  "Rapper emergente":"Rising rapper", "Rapper":"Rapper", "Star":"Star",
  "Man of the Year":"Man of the Year", "GOAT":"GOAT",

  /* --- creatore dell'artista --- */
  "Volto":"Face", "Figura intera":"Full body", "Altezza":"Height", "Peso":"Weight",
  "Corporatura":"Build", "Vestito":"Outfit", "Dove ti fai vedere":"Where you show up",
  "Il fondale del tuo ritratto: quello che si vede dietro di te nelle foto.":
    "The backdrop of your portrait: what's behind you in the pictures.",
  "Identità":"Identity",
  "Il nome con cui ti chiameranno. Puoi cambiarlo, ma i fan si affezionano.":
    "The name they'll call you. You can change it, but fans get attached.",
  "Nome d'arte":"Stage name", "Scrivi il tuo nome":"Write your name",
  "Città di provenienza":"Home city", "non si cambia più":"set for good",
  "Scrivi da dove vieni":"Write where you're from",
  "Com'è la scena dove sei cresciuto":"What the scene you grew up in is like",
  "Corpo e faccia":"Body and face",
  "Cambia solo come appari e come ti descrivono. Nessun bonus, nessun malus.":
    "This only changes how you look and how you're described. No bonus, no penalty.",
  "Carnagione":"Skin tone", "Forma del viso":"Face shape", "Bocca":"Mouth",
  "Espressione":"Expression", "come ti presenti al mondo":"how you face the world",
  "Colore principale":"Main colour", "tinge tutto il gioco":"tints the whole game",
  "Il tuo stile":"Your style",
  "Che artista sei":"What artist you are",
  "Senza Nome":"No Name", "Completa il nome per iniziare":"Fill in the name to start",
  "Casuale":"Random", "Salva artista":"Save artist", "Salvato":"Saved",
  "Otto avatar da rapper":"Eight rapper avatars", "totalmente personalizzabili":"fully customisable",
  "Parti da uno e cambia ogni elemento: capelli, cappelli, occhi, accessori, vestiti, tatuaggi.":
    "Start from one and change every part: hair, hats, eyes, accessories, clothes, tattoos.",

  /* --- cruscotto della partita --- */
  "chi ti segue":"who follows you", "energia rimasta":"energy left", "in cassa":"in the bank",
  "Dettagli":"Details",
  "La tua scalata":"Your climb", "Prossimo passo:":"Next step:", "Serve:":"Needs:",
  "indipendente":"independent", "sotto contratto":"signed",
  "Suoni per gli amici e per nessun altro.":"You play for your friends and nobody else.",
  "Nel tuo giro sanno chi sei.":"Your own circle knows who you are.",
  "I locali ti chiamano loro.":"The venues call you now.",
  "Vivi di questo. Fuori città sanno il tuo nome.":"You live off this. They know your name out of town.",
  "Sei dentro al discorso grande.":"You're in the big conversation.",
  "Quest'anno è stato il tuo.":"This year was yours.",
  "Non è più una carriera. È un nome che resta.":"It's not a career any more. It's a name that stays.",

  /* --- lifestyle: i gradini --- */
  "Da tua madre":"At your mum's", "Stanza in affitto":"Rented room", "Monolocale":"Studio flat",
  "Bilocale in centro":"Two-room flat downtown", "Attico":"Penthouse",
  "A piedi e mezzi":"On foot and buses", "Motorino":"Scooter", "Utilitaria":"Small car",
  "Berlina tedesca":"German saloon", "Macchina da video":"Car for the videos",
  "Quello che hai":"Whatever you own", "Streetwear":"Streetwear", "Roba firmata":"Designer gear",
  "Gioielli veri":"Real jewellery",
  "Casa e studio":"Home and studio", "Qualche serata":"A few nights out",
  "Sempre in giro":"Always out", "Vita da party":"Party life",
  "Da solo":"On your own", "Un amico che aiuta":"A friend who helps",
  "Piccola crew":"Small crew", "Crew e manager":"Crew and manager"
};

/* frasi con dentro dei numeri: si traducono a schema */
const LANG_RE = [
  [/^Anno (\d+) · Settimana (\d+)$/,           "Year $1 · Week $2"],
  [/^Anno (\d+) · settimana (\d+) · (.+) fan$/,"Year $1 · week $2 · $3 fans"],
  [/^Carriera in corso · anno (\d+), settimana (\d+)$/, "Career in progress · year $1, week $2"],
  [/^(\d+)\/(\d+) energia$/,                   "$1/$2 energy"],
  [/^qualità (\d+)$/,                          "quality $1"],
  [/^qualità media (\d+)$/,                    "average quality $1"],
  [/^a turno · (.+)$/,                         "per shift · $1"],
  [/^SERVE (.+)$/,                             "NEEDS $1"],
  [/^· anno (\d+)$/,                           "· year $1"],
  [/^\/(\d+) energia$/,                        "/$1 energy"],
  [/^Anno (\d+)$/,                             "Year $1"],
  [/^Settimana (\d+)$/,                        "Week $1"],
  [/^Benessere naturale: (\d+)$/,              "Natural wellbeing: $1"]
];

function pezzo(k){
  const d = LANG[k];
  if(d != null) return d;
  for(const [re, rep] of LANG_RE) if(re.test(k)) return k.replace(re, rep);
  /* «Sconosciuto» in mezzo a una riga arriva minuscolo: si prova anche così */
  const giu = Object.prototype.hasOwnProperty.call(LANG, k.charAt(0).toUpperCase() + k.slice(1))
    ? LANG[k.charAt(0).toUpperCase() + k.slice(1)] : null;
  if(giu != null) return giu.charAt(0).toLowerCase() + giu.slice(1);
  return null;
}
function traduci(s){
  if(SET.lingua !== "en" || !s) return s;
  const k = s.trim();
  if(!k || k.length > 320) return s;
  const dritto = pezzo(k);
  if(dritto != null) return s.replace(k, dritto);
  /* righe fatte di pezzi separati dal punto: «Anno 1 · Settimana 3 · Sconosciuto» */
  if(k.indexOf(" · ") > 0){
    const parti = k.split(" · ");
    let toccato = false;
    const fuori = parti.map(x => { const t = pezzo(x.trim()); if(t != null){ toccato = true; return t; } return x; });
    if(toccato) return s.replace(k, fuori.join(" · "));
  }
  return s;
}

/* Passata sul documento: solo i nodi di testo, solo le frasi che conosciamo.
   È idempotente — una volta in inglese non corrisponde più a niente. */
let LANG_ATTESA = false;
function passataLingua(radice){
  if(SET.lingua !== "en") return;
  const root = radice || document.body;
  if(!root) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n){
      const p = n.parentNode;
      if(!p) return NodeFilter.FILTER_REJECT;
      const t = p.nodeName;
      if(t === "SCRIPT" || t === "STYLE" || t === "TEXTAREA") return NodeFilter.FILTER_REJECT;
      return n.nodeValue && n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const da = [];
  while(w.nextNode()) da.push(w.currentNode);
  for(const n of da){ const v = traduci(n.nodeValue); if(v !== n.nodeValue) n.nodeValue = v; }
  /* etichette che non sono testo: segnaposto, titoli, aria */
  root.querySelectorAll("[placeholder],[title],[aria-label]").forEach(el => {
    ["placeholder","title","aria-label"].forEach(a => {
      const v = el.getAttribute(a); if(!v) return;
      const t = traduci(v); if(t !== v) el.setAttribute(a, t);
    });
  });
}
function chiediPassata(){
  if(SET.lingua !== "en" || LANG_ATTESA) return;
  LANG_ATTESA = true;
  requestAnimationFrame(() => { LANG_ATTESA = false; passataLingua(); });
}
/* il gioco ridisegna interi pannelli a ogni mossa: si sta dietro guardando il DOM */
function avviaLingua(){
  if(SET.lingua !== "en") return;
  passataLingua();
  try{
    new MutationObserver(chiediPassata).observe(document.body, {childList:true, subtree:true, characterData:true});
  }catch(e){}
}
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", avviaLingua);
else avviaLingua();
