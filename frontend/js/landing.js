/* La landing — Anni di Fame.

   Punto 27: la landing è una pagina sua. Prima era una `<section>` dentro allo
   stesso documento del gioco, e «andare a giocare» voleva dire togliere una
   classe: tutto il gioco era già lì, caricato, anche quando stavi solo
   guardando la copertina. Adesso le pagine sono tre — `pagine/landing.html`,
   `pagine/accesso.html`, `pagine/gioco.html` — e per passare dall'una
   all'altra si cambia pagina davvero.

   Qui dentro c'è quello che la landing sa fare da sola: leggere il salvataggio
   per dire a che punto sei, far girare le sei scene, e mandarti dove hai
   chiesto. Il gioco vero non è caricato: di suo questa pagina conosce solo la
   faccia dell'artista (js/creator/portrait.js) e lo stato salvato
   (js/game/state.js), che si leggono senza far partire niente.

   Quello che disegna il menu di avvio — continua, nuova partita, slot — sta
   in js/avvio.js, come prima. */
"use strict";

/* ==================== LE ALTRE DUE PAGINE ====================
   Dove stanno e come ci si va lo dice js/pagine.js, che è l'unico posto dove
   i nomi dei file sono scritti. */
function vaiAlGioco(q){ vaiA("gioco", q); }
function vaiAllAccesso(){ vaiA("accesso"); }
window.vaiAlGioco = vaiAlGioco;

/* Il pallino Account rappresenta una sessione realmente valida:
   - rosso senza token;
   - verde solo dopo conferma di /api/io.
   La pagina Account e la landing usano così la stessa verità del server. */
function impostaStatoAccountLanding(connesso){
  const b = $("nav-accesso");
  if(!b) return false;
  b.classList.toggle("connesso", !!connesso);
  b.setAttribute("aria-label", connesso ? "Account — connesso" : "Account — non connesso");
  b.title = connesso ? "Account connesso" : "Account non connesso";
  return !!connesso;
}

async function aggiornaStatoAccountLanding(){
  try{
    if(!window.ONLINE || typeof ONLINE.sessione !== "function" || !ONLINE.sessione())
      return impostaStatoAccountLanding(false);

    const dati = await ONLINE.io();
    return impostaStatoAccountLanding(!!(dati && !dati.errore));
  }catch(e){
    return impostaStatoAccountLanding(false);
  }
}
window.ADF_ACCOUNT_STATUS = { refresh: aggiornaStatoAccountLanding };

/* Login/logout avvengono nell'iframe Account: localStorage è condiviso ma
   l'evento storage arriva agli altri contesti, quindi la landing rimasta viva
   sotto il frame aggiorna il pallino appena cambia la sessione. */
window.addEventListener("storage", e => {
  if(!e.key || e.key.indexOf("adf-online-sessione") === 0)
    aggiornaStatoAccountLanding();
});

/* ==================== LA CARRIERA, LETTA DA FUORI ==================== */
/* Lo stato della partita: qui c'è sempre, perché game/state.js viene prima di
   questo file. Resta la prudenza di sempre — se un domani non ci fosse, la
   landing deve mostrare «nessuna carriera», non rompersi. */
function partita(){
  try{ return typeof window.__G === "function" ? window.__G() : null; }catch(e){ return null; }
}
const faseNome = g => { try{ return PHASES[g.phase].n; }catch(e){ return "—"; } };
function carrieraIniziata(g){
  return !!g && (g.week > 1 || g.year > 1 || g.fans > 0 ||
    (g.songs && g.songs.length > 0) || (g.bars && g.bars.length > 0));
}
function statBox(k, v, sub, cls){
  return '<div class="mstat' + (cls ? ' ' + cls : '') + '"><div class="k">' + k + '</div><div class="v">' + v +
    (sub ? '<small>' + sub + '</small>' : '') + '</div></div>';
}

function renderMenu(){
  const nm = A.name.trim();
  const g = partita();
  const viva = nm && carrieraIniziata(g);

  $("mhero").style.setProperty("--c1", (typeof coloreAccento === "function" ? coloreAccento(A.color) : A.color));
  $("mhero").classList.toggle("viva", !!viva);
  document.body.classList.toggle("carriera-viva", !!viva);
  /* Il ritratto e il nome sulla landing non ci sono più: la schermata è la
     foto, e basta. Restano nel profilo e nella plancia, dove servono. */
  $("m-tag").textContent = viva
    ? "Carriera in corso · anno " + g.year + ", settimana " + g.week
    : nm ? "Artista pronto, carriera da iniziare" : "Nessuna carriera iniziata";
  $("m-play-a").textContent = viva ? "Riprendi la carriera" : nm ? "Inizia la carriera" : "Crea il tuo artista";
  if($("m-voce-a")){
    $("m-voce-a").textContent = viva ? "Riprendi la carriera" : "Inizia la carriera";
    $("m-voce-b").textContent = viva
      ? "Anno " + g.year + " · settimana " + g.week
      : nm ? "La prima settimana comincia qui" : "Prima crea il tuo artista";
  }
  $("m-play-b").textContent = viva
    ? "Anno " + g.year + " · settimana " + g.week + " · " + short(g.fans) + " fan"
    : nm ? "Settimana 1 · zero fan, zero contatti" : "Entra subito: l'artista lo sistemi dopo";

  /* Il cerchio in alto a destra: la faccia dell'artista dell'utente, sempre.
     Anche senza nome A ha un aspetto completo, quindi c'è sempre qualcosa da mostrare. */
  const av = $("nav-avatar");
  if(av){
    av.innerHTML = "";
    av.title = nm ? nm + " — apri il tuo artista" : "Il tuo artista";
  }

  /* la scheda della carriera: c'è solo se una partita è davvero cominciata */
  $("m-corso").hidden = !viva;
  if(viva){
    const usciti = g.songs.filter(s => s.released).length;
    $("m-stats").innerHTML =
        statBox("Fase", faseNome(g), "", "fase")
      + statBox("Settimana", g.week, "· anno " + g.year)
      + statBox("Fan", short(g.fans))
      + statBox("In tasca", fmt(g.money), "€")
      + statBox("Pezzi usciti", usciti);
    const ult = g.log && g.log[0];
    $("m-last").innerHTML = ult ? "<b>" + ult.w + "</b> · " + ult.t : "";
  }
}

/* ==================== I COMANDI ==================== */
$("nav-avatar").onclick = () => vaiAlProfilo();
$("brand").onclick = () => renderMenu();          // già qui: si aggiorna e basta

/* Punto 15: muta/smuta soltanto la musica di sottofondo, in alto a sinistra.
   Il master `SET.audio.on` resta indipendente: fermare Dream Catcher non deve
   lasciare senza beat la carriera quando si entra nello Studio. */
function aggiornaMuteLanding(){
  const b = $("landing-mute");
  if(!b) return;
  const on = typeof musicaMenuAbilitata === "function"
    ? musicaMenuAbilitata()
    : (!SET.audio || SET.audio.musicMenuOn !== false);
  /* le due icone si scambiano da css/shell.css, in base a questo attributo */
  b.setAttribute("aria-pressed", on ? "false" : "true");
  b.setAttribute("aria-label", on ? "Muta la musica di sottofondo" : "Riattiva la musica di sottofondo");
}
if($("landing-mute")){
  $("landing-mute").onclick = () => {
    const musicaOn = typeof commutaMusicaMenu === "function"
      ? commutaMusicaMenu()
      : true;
    aggiornaMuteLanding();
    /* applicaImpostazioni() aggiorna solo i volumi (ADF_AUDIO.refresh): se il
       contesto audio si era sospeso da solo, o la traccia si era fermata,
       il volume torna giusto ma resta muto lo stesso. Riattivando, ci si
       assicura anche che il contesto sia sveglio e la musica stia girando
       davvero, non solo che il volume sia quello giusto sulla carta. */
    if(musicaOn && SET.audio.on){
      try{ if(window.ADF_AUDIO && ADF_AUDIO.unlock) ADF_AUDIO.unlock(); }catch(e){}
      try{
        if(window.ADF_AUDIO && ADF_AUDIO.music && !ADF_AUDIO.music.playing)
          ADF_AUDIO.music.ensureMenu();
      }catch(e){}
    }
  };
  aggiornaMuteLanding();
}

/* Il profilo (il creatore dell'artista) sta nella pagina del gioco: ci si
   arriva chiedendolo, non cambiando una classe. Chi decide se si può è
   avvio.js, che sa quale slot è pieno. */
function vaiAlProfilo(){
  /* Regola landing:
     - senza CONTINUA non esiste un artista modificabile;
     - con CONTINUA si modifica SEMPRE lo stesso slot scelto da Continua. */
  const slot = typeof window.ADF_PREPARA_ARTISTA_CONTINUA === "function"
    ? window.ADF_PREPARA_ARTISTA_CONTINUA()
    : null;

  if(!slot){
    landDillo("Nessuna partita salvata");
    return;
  }

  if(window.ADF_RPG_V24 && typeof window.ADF_RPG_V24.openAppearance === "function"){
    window.ADF_RPG_V24.openAppearance();
    return;
  }

  /* Fallback di compatibilità: la pagina gioco rilegge lo slot appena attivato. */
  vaiAlGioco("vai=profilo");
}
window.vaiAlProfilo = vaiAlProfilo;

/* Ricominciare cancella la carriera: si chiede conferma sul bottone stesso,
   così non serve una finestra di sistema che blocca tutto. */
let resetArmato = 0;
$("m-reset").onclick = function(){
  if(!resetArmato){
    resetArmato = setTimeout(() => { resetArmato = 0; this.textContent = "Ricomincia da capo";
      this.classList.remove("armato"); }, 4000);
    this.textContent = "Cancelli la carriera? Tocca ancora";
    this.classList.add("armato");
    return;
  }
  clearTimeout(resetArmato); resetArmato = 0;
  try{ localStorage.removeItem(CHIAVE_PARTITA()); }catch(e){}
  location.reload();
};

document.addEventListener("click", e => {
  const b = e.target.closest("[data-go]");
  if(!b) return;
  const g = partita();
  const viva = A.name.trim() && carrieraIniziata(g);
  if(b.dataset.go === "gioca") $("m-play").click();
  else if(b.dataset.go === "profile") vaiAlProfilo();
  else if(b.dataset.go === "accesso") vaiAllAccesso();
  else if(b.dataset.go === "regole") $("m-regole").scrollIntoView({behavior:"smooth", block:"start"});
  /* Le classifiche stanno dentro alla partita: se una carriera c'è, si entra
     lì; se non c'è, non si finge che ci sia una schermata da aprire. */
  else if(b.dataset.go === "classifiche"){
    if(viva) vaiAlGioco("vai=classifiche");
    else landDillo("Le classifiche si aprono quando la carriera è cominciata");
  }
  else if(b.dataset.go === "carriera"){
    if(viva) $("m-corso").scrollIntoView({behavior:"smooth", block:"start"});
    else landDillo(A.name.trim() ? "La carriera non è ancora cominciata" : "Prima crea il tuo artista");
  }
  else if(b.dataset.go === "studio"){
    landDillo("Anni di Fame è di La Fame Studio · 2026");
    if(typeof IMPOSTAZIONI === "function") setTimeout(IMPOSTAZIONI, 700);
  }
  else landDillo("Sezione ancora da costruire");
});

/* ==================== LE SEI SCENE ====================
   Sei scene che si danno il cambio ogni otto secondi. Passando sopra a una
   voce del menu si richiama la sua, e quando il mouse se ne va riparte il
   giro: è il concept, ed è anche il modo più semplice per far vedere sei
   posti del gioco senza chiedere niente a chi guarda. */
const LAND_NOMI = [
  "Provincia — dove comincia la storia",
  "Il garage — dove si aggiusta tutto",
  "Lo specchio — chi vuoi essere",
  "L'info point — come ci si muove",
  "Il negozio di dischi — chi sta girando",
  "La cabina — chi ti cerca"
];
let landOra = 0, landGiro = null;

function landScena(i, daHover){
  const scene = document.querySelectorAll(".land-scene");
  if(!scene.length) return;
  landOra = (i + scene.length) % scene.length;
  scene.forEach((s, j) => s.classList.toggle("on", j === landOra));
  document.querySelectorAll(".land-voce").forEach(v =>
    v.classList.toggle("on", Number(v.dataset.scena) === landOra));
  const nome = $("land-scena-nome");
  if(nome) nome.textContent = LAND_NOMI[landOra];
  clearTimeout(landGiro);
  if(!daHover) landGiro = setTimeout(() => landScena(landOra + 1), 8000);
}
function landRiprendi(){
  clearTimeout(landGiro);
  landGiro = setTimeout(() => landScena(landOra + 1), 8000);
}
/* il messaggio breve: dice la verità invece di aprire una schermata finta */
let landToastT = 0;
function landDillo(testo){
  const t = $("land-toast");
  if(!t){ alert(testo); return; }
  t.textContent = testo;
  t.classList.add("on");
  clearTimeout(landToastT);
  landToastT = setTimeout(() => t.classList.remove("on"), 2200);
}

document.querySelectorAll(".land-voce").forEach(v => {
  v.addEventListener("mouseenter", () => landScena(Number(v.dataset.scena), true));
  v.addEventListener("mouseleave", landRiprendi);
});
window.addEventListener("keydown", e => {
  if(e.key === "ArrowRight") landScena(landOra + 1);
  if(e.key === "ArrowLeft") landScena(landOra - 1);
});
/* il movimento del mouse sposta la foto di pochi pixel: basta per non farla
   sembrare un fondale incollato */
const landApp = document.querySelector(".land");
if(landApp) landApp.addEventListener("pointermove", e => {
  const x = (e.clientX / innerWidth - .5) * 8, y = (e.clientY / innerHeight - .5) * 8;
  const s = document.querySelectorAll(".land-scene")[landOra];
  if(s){ s.style.setProperty("--px", x + "px"); s.style.setProperty("--py", y + "px"); }
});

/* La landing è l'unica schermata di questa pagina: la classe che prima metteva
   goto("menu") va messa qui, una volta sola. */
document.body.classList.add("su-menu");
landScena(0);
renderMenu();
aggiornaStatoAccountLanding();
document.addEventListener("DOMContentLoaded", () => { renderMenu(); aggiornaStatoAccountLanding(); });
