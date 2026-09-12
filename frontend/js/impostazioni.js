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
  v: 2,
  lingua: "it",
  slot: 1,
  audio: {on:true, musicMenuOn:true, master:80, music:70, sfx:80, beat:85, ui:80, ambient:70, suoni:"morbido", click:true}, /* ADF_AUDIO_SETTINGS_V2 */
  look:  {tema:"notte", accento:"artista", col:"#FF5A36", grana:55, alone:52,
          scala:100, anim:true, compatto:false},
  gioco: {difficolta:"anni-di-fame", preset:"normale", energia:0, spese:1, fan:1, rivali:1, conferme:true}
});

let SET = SET_DEF();
function caricaSet(){
  let r = null;
  try{ r = JSON.parse(localStorage.getItem(SET_KEY) || "null"); }catch(e){ r = null; }
  const d = SET_DEF();
  if(!r || typeof r !== "object"){
    SET = d;
    return false;
  }
  const versioneSalvata = Number(r.v) || 1;
  for(const k in d){
    if(r[k] === undefined) continue;
    if(d[k] && typeof d[k] === "object" && !Array.isArray(d[k]) && r[k] && typeof r[k] === "object")
      d[k] = Object.assign(d[k], r[k]);
    else d[k] = r[k];
  }
  SET = d;

  /* Fino alla v1 il pulsante della landing prometteva di mutare soltanto la
     musica di sottofondo, ma salvava `audio.on=false` e spegneva anche beat
     ed effetti. Siccome la v1 non registrava da quale interfaccia arrivasse
     quel `false`, la compatibilita' privilegia il caso rotto segnalato: una
     sola volta conserva la musica menu spenta e riattiva i canali gameplay.
     Un master spento nuovamente in v2 resta invece spento. */
  if(versioneSalvata < 2){
    const audioLegacySpento = !!(r.audio && r.audio.on === false);
    SET.audio.musicMenuOn = !audioLegacySpento;
    if(audioLegacySpento) SET.audio.on = true;
    SET.v = 2;
    try{ localStorage.setItem(SET_KEY, JSON.stringify(SET)); }catch(e){}
  }
  return true;
}
caricaSet();
function setSalva(){ try{ localStorage.setItem(SET_KEY, JSON.stringify(SET)); }catch(e){} }

/* ==================== SLOT DI SALVATAGGIO ====================
   Lo slot 1 tiene le chiavi storiche: chi giocava prima ritrova la sua carriera
   dov'era, senza migrazioni. Gli altri due appendono il numero. */
function slotKey(base){ return (SET.slot > 1) ? base + "-s" + SET.slot : base; }

/* ==================== AUDIO ====================
   `SET.audio.on` resta il master; `musicMenuOn` controlla soltanto la musica
   pre-game. I volumi tornano come moltiplicatori, così chi suona non deve
   sapere niente delle impostazioni. */
const volMaster = () => (SET.audio.on ? SET.audio.master / 100 : 0);
const volMusic  = () => volMaster() * ((SET.audio.music == null ? 70 : SET.audio.music) / 100);
const volMenuMusic = () => volMusic() * (SET.audio.musicMenuOn === false ? 0 : 1);
const volSfx    = () => volMaster() * (SET.audio.sfx / 100);
const volUi     = () => volMaster() * ((SET.audio.ui == null ? SET.audio.sfx : SET.audio.ui) / 100);
const volBeat   = () => volMaster() * (SET.audio.beat / 100);
const volAmbient= () => volMaster() * ((SET.audio.ambient == null ? 70 : SET.audio.ambient) / 100); /* ADF_AUDIO_LEVELS_V1 */

/* Il tasto con l'altoparlante nella landing appartiene esclusivamente alla
   musica menu. Il master `audio.on` resta il comando generale di gioco. */
function musicaMenuAbilitata(){
  return SET.audio.musicMenuOn !== false;
}
function commutaMusicaMenu(){
  SET.audio.musicMenuOn = !musicaMenuAbilitata();
  setSalva();
  applicaImpostazioni();
  return musicaMenuAbilitata();
}

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
  try{ if(typeof ADF_AUDIO !== "undefined" && ADF_AUDIO.refresh) ADF_AUDIO.refresh(); }catch(e){} /* ADF_AUDIO_REFRESH_V1 */
  /* Un beat diventato inudibile per master/volume/fase non deve continuare a
     mostrare il quadrato di stop fino alla fine del timer. */
  try{
    const beatBloccato = (typeof muted !== "undefined" && muted) ||
      (typeof ADF_AUDIO !== "undefined" && ADF_AUDIO.canPlay && !ADF_AUDIO.canPlay("beat"));
    if(beatBloccato && typeof beatStop === "function") beatStop();
  }catch(e){}
  try{ if(typeof aggiornaTastoAudio === "function") aggiornaTastoAudio(); }catch(e){}
  try{ if(typeof aggiornaMuteLanding === "function") aggiornaMuteLanding(); }catch(e){}

  /* Nella shell il player reale resta nella landing parent, mentre accesso e
     gioco hanno una seconda copia di SET nell'iframe. Il reload diretto e'
     sincrono e aggiorna subito il gain del player proprietario. */
  try{
    const p = window.parent;
    if(p && p !== window && p.ADF_SETTINGS && typeof p.ADF_SETTINGS.reload === "function")
      p.ADF_SETTINGS.reload();
  }catch(e){}
}
function ricaricaImpostazioni(){
  caricaSet();
  applicaImpostazioni();
  return true;
}
window.ADF_SETTINGS = {reload:ricaricaImpostazioni};
applicaImpostazioni();
