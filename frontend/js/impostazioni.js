/* Impostazioni di gioco — Anni di Fame.
   © La Fame Studio. Tutti i diritti riservati.

   Caricato subito dopo core.js: audio, stato, simulazione e interfaccia leggono
   da qui, quindi SET deve esistere prima di chiunque altro.
   La pannellatura vera e propria sta in js/impostazioni-ui.js, che arriva per
   ultima perché tocca roba definita ovunque. */
"use strict";

const ADF_MARCHIO = "La Fame Studio";
const ADF_ANNO = "2026";
const ADF_COPYRIGHT = "© " + ADF_ANNO + " " + ADF_MARCHIO + " — Anni di Fame. Tutti i diritti riservati.";
const SET_KEY = "adf-impostazioni-v1";
const N_SLOT = 3;

const SET_DEF = () => ({
  v: 1,
  lingua: "it",
  slot: 1,
  audio: {on:true, master:80, sfx:80, beat:85, suoni:"morbido", click:true},
  look:  {tema:"notte", accento:"artista", col:"#FF5A36", grana:55, alone:52,
          scala:100, anim:true, compatto:false},
  gioco: {difficolta:"anni-di-fame", preset:"normale", energia:0, spese:1, fan:1, rivali:1, conferme:true}
});

let SET = SET_DEF();
(function caricaSet(){
  let r = null;
  try{ r = JSON.parse(localStorage.getItem(SET_KEY) || "null"); }catch(e){ r = null; }
  if(!r || typeof r !== "object") return;
  const d = SET_DEF();
  for(const k in d){
    if(r[k] === undefined) continue;
    if(d[k] && typeof d[k] === "object" && !Array.isArray(d[k]) && r[k] && typeof r[k] === "object")
      SET[k] = Object.assign(d[k], r[k]);
    else SET[k] = r[k];
  }
})();
function setSalva(){ try{ localStorage.setItem(SET_KEY, JSON.stringify(SET)); }catch(e){} }

/* ==================== SLOT DI SALVATAGGIO ====================
   Lo slot 1 tiene le chiavi storiche: chi giocava prima ritrova la sua carriera
   dov'era, senza migrazioni. Gli altri due appendono il numero. */
function slotKey(base){ return (SET.slot > 1) ? base + "-s" + SET.slot : base; }

/* ==================== AUDIO ====================
   Un solo interruttore (SET.audio.on) e tre manopole. I volumi tornano come
   moltiplicatori, così chi suona non deve sapere niente delle impostazioni. */
const volMaster = () => (SET.audio.on ? SET.audio.master / 100 : 0);
const volSfx    = () => volMaster() * (SET.audio.sfx / 100);
const volBeat   = () => volMaster() * (SET.audio.beat / 100);

/* ==================== DIFFICOLTÀ ====================
   Tre manopole vere (spese, crescita dei fan, rivali) più le energie in più.
   I preset le muovono tutte insieme; toccarne una passa a «personalizzata». */
const PRESET = {
  facile:   {energia: 1, spese:0.60, fan:1.35, rivali:0.75},
  normale:  {energia: 0, spese:1.00, fan:1.00, rivali:1.00},
  duro:     {energia:-1, spese:1.50, fan:0.75, rivali:1.35}
};
function applicaPreset(id){
  const p = PRESET[id]; if(!p) return;
  Object.assign(SET.gioco, p, {preset:id});
}
const difSpese   = () => 1;
const difFan     = () => 1;
const difRivali  = () => 1;
const difEnergia = () => 0;

/* ==================== ASPETTO ====================
   L'accento normalmente è il colore scelto dall'artista: è roba sua.
   Chi vuole un'interfaccia di un colore fisso lo dice qui e vince lui. */
function coloreAccento(base){
  return SET.look.accento === "fisso" ? SET.look.col : (base || "#FF5A36");
}
const ACCENTI = [
  ["#FF5A36","arancio"], ["#B026FF","viola"], ["#3DC7FF","ghiaccio"], ["#FFC53D","oro"],
  ["#FF4D9D","rosa"], ["#57C98B","verde"], ["#7A5CFF","indaco"], ["#E9E9EE","bianco"]
];

function applicaImpostazioni(){
  const h = document.documentElement;
  h.lang = SET.lingua;
  h.style.setProperty("--grana", SET.look.grana);
  h.style.setProperty("--alone", SET.look.alone);
  h.classList.toggle("ridotto",  !SET.look.anim);
  h.classList.toggle("compatto", !!SET.look.compatto);
  h.classList.toggle("tema-nero",      SET.look.tema === "nero");
  h.classList.toggle("tema-contrasto", SET.look.tema === "contrasto");
  /* la scala dell'interfaccia: tutto il gioco è in pixel, quindi si ingrandisce
     davvero solo zoomando la pagina intera */
  h.style.zoom = (SET.look.scala === 100) ? "" : (SET.look.scala / 100);
  if(SET.look.accento === "fisso") h.style.setProperty("--c1", SET.look.col);
  /* l'audio spento è la stessa cosa del vecchio tasto ♪: chi legge `muted`
     continua a funzionare come prima (fx.js lo dichiara, qui lo si allinea) */
  try{ if(typeof muted !== "undefined") muted = !SET.audio.on; }catch(e){}
  try{ if(typeof aggiornaTastoAudio === "function") aggiornaTastoAudio(); }catch(e){}
}
applicaImpostazioni();
