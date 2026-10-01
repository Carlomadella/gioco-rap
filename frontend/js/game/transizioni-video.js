/* Le transizioni video: il filmato di cinque secondi che parte quando tocchi
   un posto sulla mappa, prima che la sua pagina si apra — o quando fai una
   delle due mosse che ne hanno uno, prima che si veda com'è andata.

   I video stanno in media/video/Transizioni di scena/ — dodici, pronti dal
   05/09 — e fino al 16/09 nessuna riga di codice li caricava: viaggiavano nel
   pacchetto per gli store da peso morto. Il punto ne chiede cinque, e sono
   questi: lo Studio (il primo, 16/09), poi la Sala, Casa, stacca la spina e
   registra (20/09). Gli altri sette aspettano una decisione.

   Come funziona: `transizioneVideo("studio", () => apriStudio(...))`. Il
   filmato copre lo schermo, alla fine si apre la pagina sotto e il filmato
   sfuma. Tre regole, tutte per non far aspettare chi gioca:
   - con le animazioni spente (SET.look.anim, o «riduci movimento» del
     sistema) il video non parte proprio;
   - la mappa resta lì finché il video non sta DAVVERO andando: se dopo un
     secondo e mezzo non è partito (rete lenta, file mancante, formato che il
     browser non legge) si apre la pagina e basta — mai uno schermo nero
     davanti a un tasto appena premuto. Ma nell'attesa la mappa non risponde:
     una copertura trasparente prende i tocchi, se no due tocchi svelti aprono
     due posti uno sopra l'altro;
   - un tocco, un clic o Esc lo saltano (anche nell'attesa: il secondo tocco
     apre la pagina subito).
   Il filmato si prepara (`preload`) quando il puntatore passa sul cartello,
   così al clic è quasi sempre già in cache: caricarli tutti all'avvio sarebbe
   un download da molti MB per chi magari non entra mai in quel posto. */
"use strict";

const TRANSIZIONI_VIDEO = {
  studio:   "media/video/Transizioni di scena/01_studio_definitivo.mp4",
  /* la strada, il portone, la stanza coi computer: il cartello «La Sala» */
  sala:     "media/video/Transizioni di scena/02_ingresso_sala_definitivo.mp4",
  /* la via di notte, le scale, il salotto: il cartello «Casa» */
  casa:     "media/video/Transizioni di scena/03_ritorno_casa_definitivo.mp4",
  /* il divano e la tele: la mossa «Stacca la spina», da dovunque parta
     (la porta di Casa, l'agenda del telefono, la card della sera) */
  stacca:   "media/video/Transizioni di scena/04_stacca_la_spina_definitivo.mp4",
  /* il microfono, il foglio, il banco: la prima take in Cabina */
  registra: "media/video/Transizioni di scena/05_registra_pezzo_definitivo.mp4",
  /* il Circolo la sera (js/game/circolo.js, circoloEntra): di giorno si
     entra dal retro col video della Sala, dalle 21:00 dalla porta del club */
  club:     "media/video/Transizioni di scena/08_ingresso_club_definitivo.mp4",
  /* sali sul palco del Circolo: fra il tasto e il primo dei tre momenti */
  palco:    "media/video/Transizioni di scena/11_live_definitivo.mp4"
};

/* Alcune entrate sono volutamente “a diapositive” invece che video: usano
   lo stesso overlay, gli stessi tasti di skip e lo stesso fallback delle
   transizioni mp4, ma mostrano tre immagini a schermo pieno in sequenza. */
const TRANSIZIONI_SCENE = {
  fabbrica: [
    "media/video/Transizioni di scena/fabbrica_01_arrivo.webp",
    "media/video/Transizioni di scena/fabbrica_02_spogliatoio.webp",
    "media/video/Transizioni di scena/fabbrica_03_timbratura.webp"
  ],
  /* Arrivo al turno: strada -> spogliatoio -> ingresso in cucina. */
  pizzeria: [
    "media/video/Transizioni di scena/pizzeria_01_arrivo.webp",
    "media/video/Transizioni di scena/pizzeria_02_spogliatoio.webp",
    "media/video/Transizioni di scena/pizzeria_03_cucina.webp"
  ]
};
/* I cartelli della mappa hanno un id loro (`data-l`): qui si dice quale
   filmato preparare quando il puntatore ci passa sopra. */
const TRANSIZIONI_CARTELLI = {studio:"studio", beat:"sala", vita:"casa", fabbrica:"fabbrica", pizzeria:"pizzeria"};
/* Finito un filmato, si prepara quello che può venire subito dopo dentro
   alla pagina appena aperta: in Cabina si registra, a Casa si stacca la
   spina. Un download che parte a pagina ferma, non sotto al dito. */
const TRANSIZIONI_DOPO = {studio:"registra", casa:"stacca"};
/* quanto si aspetta il video prima di lasciar perdere, in millisecondi */
const TRANSIZIONE_ATTESA = 1500;

let TVID_CORRENTE = null;

function transizioneVideoElemento(){
  let box = document.getElementById("tvid");
  if(box) return box;
  box = document.createElement("div");
  box.id = "tvid"; box.className = "tvid";
  /* prende il fuoco quando copre lo schermo: se no resta sul tasto appena
     premuto, e un Invio subito dopo il clic lo preme di nuovo sotto al
     filmato (seconda take pagata come seconda sessione, mossa fatta due
     volte) */
  box.tabIndex = -1;
  const v = document.createElement("video");
  v.playsInline = true; v.setAttribute("playsinline", "");
  v.preload = "auto";
  box.appendChild(v);
  document.body.appendChild(box);
  return box;
}

function transizioneSceneElemento(){
  let box = document.getElementById("tscene");
  if(box) return box;

  box = document.createElement("div");
  box.id = "tscene";
  box.className = "tscene";
  box.tabIndex = -1;

  const a = document.createElement("img");
  const b = document.createElement("img");
  a.className = "tscene-img on";
  b.className = "tscene-img";
  a.alt = ""; b.alt = "";
  box.append(a, b);
  document.body.appendChild(box);

  if(!document.getElementById("tscene-css")){
    const s = document.createElement("style");
    s.id = "tscene-css";
    s.textContent =
      ".tscene{position:fixed;inset:0;z-index:170;background:#000;opacity:0;pointer-events:none;overflow:hidden;transition:opacity .24s ease}" +
      ".tscene.on{opacity:1;pointer-events:auto}.tscene.attesa{opacity:0;pointer-events:auto}.tscene.via{opacity:0;pointer-events:none}" +
      ".tscene-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transform:scale(1.015);transition:opacity .28s ease,transform 1.45s ease}" +
      ".tscene-img.on{opacity:1;transform:scale(1)}";
    document.head.appendChild(s);
  }
  return box;
}

function transizioneScenePrepara(id){
  const slides = TRANSIZIONI_SCENE[id];
  if(!slides || TVID_CORRENTE) return;
  slides.forEach(src => {
    const img = new Image();
    img.decoding = "async";
    img.src = encodeURI(src);
  });
}

function transizioneScene(id, poi){
  const slides = TRANSIZIONI_SCENE[id];
  const anim = !(typeof SET === "object" && SET && SET.look && SET.look.anim === false);
  let ridotto = false;
  try{ ridotto = window.matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(e){}
  if(!slides || !slides.length || !anim || ridotto || TVID_CORRENTE){ poi(); return; }

  const box = transizioneSceneElemento();
  const imgs = Array.from(box.querySelectorAll(".tscene-img"));
  let chiuso = false, attivo = 0, indice = 0, timer = 0, attesa = 0;

  const sgancia = () => {
    clearTimeout(timer); clearTimeout(attesa);
    box.removeEventListener("click", fine);
    document.removeEventListener("keydown", tasto, true);
    document.removeEventListener("keyup", tasto, true);
  };
  const fine = () => {
    if(chiuso) return;
    chiuso = true; sgancia();
    try{ poi(); }catch(e){ console.error(e); }
    box.classList.remove("on", "attesa");
    box.classList.add("via");
    setTimeout(() => {
      box.classList.remove("via");
      TVID_CORRENTE = null;
    }, 260);
  };
  const tasto = e => {
    if(e.key === "Escape" || e.key === "Enter" || e.key === " "){
      e.preventDefault();
      if(e.type === "keydown") fine();
    }else if(e.key === "Tab") e.preventDefault();
  };
  const mostra = n => {
    const prossimo = 1 - attivo;
    imgs[prossimo].src = encodeURI(slides[n]);
    imgs[prossimo].classList.add("on");
    imgs[attivo].classList.remove("on");
    attivo = prossimo;
  };
  const avanti = () => {
    if(chiuso) return;
    indice += 1;
    if(indice >= slides.length){ fine(); return; }
    mostra(indice);
    timer = setTimeout(avanti, 1350);
  };
  const carica = src => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = encodeURI(src);
  });

  TVID_CORRENTE = id;
  box.classList.remove("via", "on");
  box.classList.add("attesa");
  box.addEventListener("click", fine);
  document.addEventListener("keydown", tasto, true);
  document.addEventListener("keyup", tasto, true);
  try{ box.focus({preventScroll:true}); }catch(e){}

  /* Se uno degli asset manca non lasciamo mai il giocatore davanti al nero:
     si entra normalmente nel posto, come per un mp4 che non parte. */
  attesa = setTimeout(fine, TRANSIZIONE_ATTESA);
  Promise.all(slides.map(carica)).then(() => {
    if(chiuso) return;
    clearTimeout(attesa);
    imgs[0].src = encodeURI(slides[0]);
    imgs[0].classList.add("on");
    imgs[1].classList.remove("on");
    attivo = 0; indice = 0;
    box.classList.remove("attesa");
    box.classList.add("on");
    timer = setTimeout(avanti, 1350);
  }).catch(fine);
}

/* Mette in coda il download del filmato, senza farlo partire. Non mentre un
   altro sta andando: l'elemento video è uno solo, e cambiargli `src` a metà
   filmato lo taglia lì — succedeva con la precarica dello Studio (quattro
   secondi dopo l'avvio) se in quei quattro secondi toccavi la Sala. */
function transizioneVideoPrepara(id){
  if(TRANSIZIONI_SCENE[id]){ transizioneScenePrepara(id); return; }
  const src = TRANSIZIONI_VIDEO[id]; if(!src || TVID_CORRENTE) return;
  const v = transizioneVideoElemento().querySelector("video");
  const url = encodeURI(src);
  if(v.dataset.src === url) return;
  v.dataset.src = url; v.src = url; v.load();
}

function transizioneVideo(id, poi){
  if(TRANSIZIONI_SCENE[id]){ transizioneScene(id, poi); return; }
  const src = TRANSIZIONI_VIDEO[id];
  const anim = !(typeof SET === "object" && SET && SET.look && SET.look.anim === false);
  /* «riduci movimento» del sistema (iOS e Android ce l'hanno fra le opzioni
     di accessibilità): il resto del gioco lo rispetta, il video pure */
  let ridotto = false;
  try{ ridotto = window.matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(e){}
  if(!src || !anim || ridotto || TVID_CORRENTE){ poi(); return; }

  const box = transizioneVideoElemento();
  const v = box.querySelector("video");
  /* l'audio del gioco è una manopola sola, nelle impostazioni: il video la
     rispetta come tutto il resto */
  const audioOn = typeof SET === "object" && SET && SET.audio && SET.audio.on;
  v.muted = !audioOn;
  try{ v.volume = (typeof volSfx === "function") ? Math.max(0, Math.min(1, volSfx())) : 1; }catch(e){}

  let chiuso = false, timer = 0, avviato = false;
  const fine = () => {
    if(chiuso) return; chiuso = true;
    clearTimeout(timer);
    v.removeEventListener("ended", fine);
    v.removeEventListener("error", fine);
    v.removeEventListener("playing", partito);
    box.removeEventListener("click", fine);
    document.removeEventListener("keydown", tasto, true);
    document.removeEventListener("keyup", tasto, true);
    try{ poi(); }catch(e){ console.error(e); }
    /* la pagina è già aperta sotto: il filmato, se c’era, sfuma sopra di lei */
    box.classList.remove("on", "attesa");
    if(avviato) box.classList.add("via");
    setTimeout(() => {
      box.classList.remove("via");
      try{ v.pause(); }catch(e){}
      TVID_CORRENTE = null;
      /* solo a dissolvenza finita: cambiare `src` mentre il filmato sfuma
         lo farebbe sparire di colpo */
      if(TRANSIZIONI_DOPO[id]) transizioneVideoPrepara(TRANSIZIONI_DOPO[id]);
    }, 260);
  };
  /* Esc, Invio e spazio saltano il filmato; Tab non gira per la pagina sotto.
     Tutto in cattura e con il default fermato: Invio preme il tasto a fuoco
     già al keydown, lo spazio al keyup. */
  const tasto = e => {
    if(e.key === "Escape" || e.key === "Enter" || e.key === " "){ e.preventDefault(); if(e.type === "keydown") fine(); }
    else if(e.key === "Tab") e.preventDefault();
  };
  const partito = () => {
    /* `playing` torna a ogni ripresa dopo un buffering: la rete di sicurezza
       si arma una volta sola, se no ogni inciampo la fa ripartire da capo */
    if(avviato) return;
    avviato = true; clearTimeout(timer);
    /* solo adesso il filmato copre la mappa: prima non c’era niente da vedere */
    box.classList.remove("attesa");
    box.classList.add("on");
    /* rete di sicurezza: se `ended` non arriva (stream troncato, o un
       telefono che non ce la fa) si chiude comunque poco dopo la durata
       dichiarata */
    const dur = isFinite(v.duration) && v.duration > 0 ? v.duration : 6;
    timer = setTimeout(fine, dur * 1000 + 800);
  };

  transizioneVideoPrepara(id);
  TVID_CORRENTE = id;
  try{ v.currentTime = 0; }catch(e){}
  box.classList.remove("via");
  /* trasparente, ma prende i tocchi: la mappa sotto non risponde più */
  box.classList.add("attesa");
  v.addEventListener("ended", fine);
  v.addEventListener("error", fine);
  v.addEventListener("playing", partito);
  box.addEventListener("click", fine);
  document.addEventListener("keydown", tasto, true);
  document.addEventListener("keyup", tasto, true);
  try{ box.focus({preventScroll:true}); }catch(e){}
  /* se non parte in tempo si apre la pagina e basta */
  timer = setTimeout(() => { if(!avviato) fine(); }, TRANSIZIONE_ATTESA);
  const p = v.play();
  if(p && p.catch) p.catch(() => fine());
}

/* Il puntatore sul cartello della mappa: si comincia a scaricare il filmato
   di quel posto. Sul telefono l'hover non c'è, ma il touchstart arriva un
   attimo prima del click e qualcosa recupera. Per lo Studio, che è il posto
   dove si va di più, il filmato si prepara comunque qualche secondo dopo
   l’avvio, a pagina ferma: col dito non c’è nessun «passarci sopra», e un
   secondo e mezzo di attesa non basta a un download freddo. */
const TRANSIZIONI_PRECARICA = ["studio"];
(() => {
  setTimeout(() => TRANSIZIONI_PRECARICA.forEach(transizioneVideoPrepara), 4000);
  const pins = document.getElementById("hb-pins"); if(!pins) return;
  const prepara = ev => {
    const b = ev.target.closest && ev.target.closest(".pspot");
    if(b && TRANSIZIONI_CARTELLI[b.dataset.l]) transizioneVideoPrepara(TRANSIZIONI_CARTELLI[b.dataset.l]);
  };
  pins.addEventListener("pointerover", prepara);
  pins.addEventListener("touchstart", prepara, {passive:true});
})();
