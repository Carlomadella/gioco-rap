/* Navigazione fra schermate, menu principale e corpo intero (window.ARTIST_BODY). */
"use strict";

/* ================= NAVIGAZIONE ================= */
function miniPortrait(){
  return portrait().replace('class="portrait"', 'class="mini"');
}
function goto(screen){
  document.querySelectorAll(".screen").forEach(x => x.classList.toggle("on", x.id === "s-" + screen));
  /* In partita il tasto per il menu non sta quassù: il marchio a sinistra fa
     già quel mestiere, e la barra deve restare fuori dai piedi mentre giochi. */
  $("nav-back").hidden = (screen === "menu" || screen === "game");
  window.scrollTo({top:0});
  if(screen === "menu") renderMenu();
}
/* Lo stato della partita, se i file del gioco sono già stati caricati.
   nav.js gira prima di game/state.js, quindi al primo giro qui non c'è niente —
   e infatti al primo giro non c'è nemmeno una carriera da mostrare. Quando questa
   torna un oggetto, short() e fmt() ci sono di sicuro: stanno nello stesso file,
   dichiarate prima di window.__G. */
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

  $("mhero").style.setProperty("--c1", A.color);
  $("mhero").classList.toggle("viva", !!viva);
  /* Il ritratto c'è sempre, anche prima che l'artista abbia un nome: senza,
     il menu si apriva su mezzo riquadro vuoto. Finché è solo un abbozzo lo si
     tiene indietro, in penombra, così non sembra una carriera già cominciata. */
  $("m-port").innerHTML = portrait();
  $("m-port").classList.toggle("abbozzo", !nm);
  $("m-name").textContent = nm || "Crea il tuo artista";
  $("m-tag").textContent = viva
    ? "Carriera in corso · anno " + g.year + ", settimana " + g.week
    : nm ? "Artista pronto, carriera da iniziare" : "Nessuna carriera iniziata";
  $("m-meta").textContent = nm
    ? (A.city.trim() || scene().n) + " · " + genre().n + " · " + fit().n
    : "Otto avatar pronti, oppure costruisci la faccia da zero.";
  $("m-play-a").textContent = viva ? "Riprendi la carriera" : nm ? "Inizia la carriera" : "Crea il tuo artista";
  $("m-play-b").textContent = viva
    ? "Anno " + g.year + " · settimana " + g.week + " · " + short(g.fans) + " fan"
    : nm ? "Settimana 1 · zero fan, zero contatti" : "Entra subito: l'artista lo sistemi dopo";

  /* Il cerchio in alto a destra: la faccia dell'artista dell'utente, sempre.
     Anche senza nome A ha un aspetto completo, quindi c'è sempre qualcosa da mostrare. */
  const av = $("nav-avatar");
  av.innerHTML = miniPortrait();
  av.title = nm ? nm + " — apri il tuo artista" : "Il tuo artista";

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
window.ARTIST = A;
window.ARTIST_PORTRAIT = portrait;

/* figura intera in piedi, per le scene giocabili — piedi a y=0, testa in alto */
window.ARTIST_BODY = function(){
  /* Figura intera: sistema di riferimento con i piedi a y=0 e la testa in cima.
     La testa è la stessa del ritratto, rimpicciolita: stesso livello di dettaglio. */
  const T = portrait(true);
  const f = fit();
  const cloth = A.clothCol || (f.accent ? A.color : f.top);
  const clothD = shade(cloth,-0.36), clothL = shade(cloth,0.14), clothX = shade(cloth,-0.55);
  const pant = A.fit === "tuta" ? shade(cloth,-0.30) : "#1E212B";
  const pantD = shade(pant,-0.34), pantL = shade(pant,0.16);
  const skin = A.skin, sh = shade(skin,-0.30);
  const scarpa = "#F2F2F5", scarpaD = "#C9C9D4";
  const pose = (window.__POSE === "fermo");

  /* corporatura e statura */
  const g = 0.88 + (A.w - 45)/95 * 0.40;      // larghezza
  const st = 0.94 + (A.h - 155)/50 * 0.12;    // allungamento
  const W = v => (v*g).toFixed(1);
  const H = v => (v*st).toFixed(1);

  const SPALLE = -H(300), VITA = -H(210), ANCHE = -H(186), GINOCCHIO = -H(96), PIEDE = -4;
  const TESTA_Y = -H(300);

  const braccioAlto =
    '<path d="M' + W(46) + ',' + SPALLE + ' C' + W(62) + ',' + -H(296) + ' ' + W(72) + ',' + -H(330) +
      ' ' + W(66) + ',' + -H(372) + ' L' + W(50) + ',' + -H(370) + ' C' + W(54) + ',' + -H(338) +
      ' ' + W(48) + ',' + -H(316) + ' ' + W(36) + ',' + -H(306) + ' Z" fill="' + clothL + '"/>' +
    '<path d="M' + W(48) + ',' + -H(372) + ' C' + W(46) + ',' + -H(384) + ' ' + W(54) + ',' + -H(390) +
      ' ' + W(62) + ',' + -H(388) + ' C' + W(70) + ',' + -H(386) + ' ' + W(70) + ',' + -H(372) +
      ' ' + W(62) + ',' + -H(368) + ' C' + W(56) + ',' + -H(366) + ' ' + W(50) + ',' + -H(367) + ' Z" fill="' + skin + '"/>' +
    '<rect x="' + W(51) + '" y="' + -H(410) + '" width="' + W(13) + '" height="' + H(34) + '" rx="' + W(6) + '" fill="#2E323C"/>' +
    '<ellipse cx="' + W(58) + '" cy="' + -H(414) + '" rx="' + W(11) + '" ry="' + H(11) + '" fill="#5A6170"/>';

  const braccioGiu = (segno, tinta) => {
    const x = v => W(segno*v);
    return '<path d="M' + x(46) + ',' + SPALLE + ' C' + x(64) + ',' + -H(292) + ' ' + x(70) + ',' +
      -H(258) + ' ' + x(66) + ',' + -H(214) + ' L' + x(48) + ',' + -H(212) + ' C' + x(52) + ',' +
      -H(252) + ' ' + x(48) + ',' + -H(276) + ' ' + x(36) + ',' + -H(288) + ' Z" fill="' + tinta + '"/>' +
      '<path d="M' + x(66) + ',' + -H(214) + ' C' + x(72) + ',' + -H(210) + ' ' + x(72) + ',' +
      -H(190) + ' ' + x(62) + ',' + -H(186) + ' C' + x(52) + ',' + -H(184) + ' ' + x(48) + ',' +
      -H(196) + ' ' + x(50) + ',' + -H(210) + ' Z" fill="' + skin + '"/>' +
      '<path d="M' + x(50) + ',' + -H(206) + ' C' + x(44) + ',' + -H(202) + ' ' + x(45) + ',' +
      -H(194) + ' ' + x(52) + ',' + -H(193) + '" fill="none" stroke="' + skin + '" stroke-width="' + W(6) + '" stroke-linecap="round"/>' +
      '<path d="M' + x(64) + ',' + -H(196) + ' C' + x(58) + ',' + -H(193) + ' ' + x(54) + ',' + -H(193) + ' ' + x(51) + ',' + -H(195) + '" ' +
      'fill="none" stroke="' + shade(skin,-0.24) + '" stroke-width="' + W(1.6) + '" opacity=".7"/>';
  };

  return '<g>' +
    // ombra a terra
    '<ellipse cx="0" cy="0" rx="' + W(64) + '" ry="9" fill="#000" opacity=".45"/>' +

    // gambe
    '<path d="M-' + W(40) + ',' + ANCHE + ' C-' + W(44) + ',' + GINOCCHIO + ' -' + W(38) + ',' +
      -H(40) + ' -' + W(36) + ',' + PIEDE + ' L-' + W(9) + ',' + PIEDE + ' C-' + W(10) + ',' +
      -H(46) + ' -' + W(12) + ',' + GINOCCHIO + ' -' + W(8) + ',' + ANCHE + ' Z" fill="' + pantD + '"/>' +
    '<path d="M' + W(40) + ',' + ANCHE + ' C' + W(44) + ',' + GINOCCHIO + ' ' + W(38) + ',' +
      -H(40) + ' ' + W(36) + ',' + PIEDE + ' L' + W(9) + ',' + PIEDE + ' C' + W(10) + ',' +
      -H(46) + ' ' + W(12) + ',' + GINOCCHIO + ' ' + W(8) + ',' + ANCHE + ' Z" fill="' + pant + '"/>' +
    // pieghe
    '<g stroke="' + pantD + '" stroke-width="' + W(2.4) + '" fill="none" opacity=".75">' +
      '<path d="M-' + W(30) + ',' + -H(110) + ' C-' + W(24) + ',' + -H(104) + ' -' + W(18) + ',' + -H(106) + ' -' + W(13) + ',' + -H(112) + '"/>' +
      '<path d="M' + W(30) + ',' + -H(110) + ' C' + W(24) + ',' + -H(104) + ' ' + W(18) + ',' + -H(106) + ' ' + W(13) + ',' + -H(112) + '"/></g>' +
    // scarpe
    '<path d="M-' + W(38) + ',' + -H(26) + ' L-' + W(8) + ',' + -H(26) + ' L-' + W(8) + ',' + -H(6) +
      ' C-' + W(16) + ',' + H(2) + ' -' + W(46) + ',' + H(2) + ' -' + W(48) + ',' + -H(8) + ' Z" fill="' + scarpa + '"/>' +
    '<path d="M-' + W(48) + ',' + -H(8) + ' C-' + W(46) + ',' + H(2) + ' -' + W(16) + ',' + H(2) +
      ' -' + W(8) + ',' + -H(6) + ' L-' + W(8) + ',' + -H(1) + ' C-' + W(18) + ',' + H(5) + ' -' + W(46) + ',' + H(5) + ' -' + W(48) + ',' + -H(2) + ' Z" fill="' + scarpaD + '"/>' +
    '<path d="M' + W(38) + ',' + -H(26) + ' L' + W(8) + ',' + -H(26) + ' L' + W(8) + ',' + -H(6) +
      ' C' + W(16) + ',' + H(2) + ' ' + W(46) + ',' + H(2) + ' ' + W(48) + ',' + -H(8) + ' Z" fill="' + scarpa + '"/>' +
    '<path d="M' + W(48) + ',' + -H(8) + ' C' + W(46) + ',' + H(2) + ' ' + W(16) + ',' + H(2) +
      ' ' + W(8) + ',' + -H(6) + ' L' + W(8) + ',' + -H(1) + ' C' + W(18) + ',' + H(5) + ' ' + W(46) + ',' + H(5) + ' ' + W(48) + ',' + -H(2) + ' Z" fill="' + scarpaD + '"/>' +
    '<g fill="' + cloth + '"><rect x="-' + W(44) + '" y="' + -H(20) + '" width="' + W(8) + '" height="' + H(9) + '" rx="2"/>' +
      '<rect x="' + W(36) + '" y="' + -H(20) + '" width="' + W(8) + '" height="' + H(9) + '" rx="2"/></g>' +

    // braccio dietro
    braccioGiu(-1, clothD) +

    // busto: spalle larghe, vita più stretta, orlo della felpa
    '<path d="M-' + W(46) + ',' + SPALLE + ' C-' + W(30) + ',' + -H(312) + ' ' + W(30) + ',' + -H(312) +
      ' ' + W(46) + ',' + SPALLE + ' C' + W(52) + ',' + -H(266) + ' ' + W(48) + ',' + -H(226) +
      ' ' + W(46) + ',' + VITA + ' L-' + W(46) + ',' + VITA + ' C-' + W(48) + ',' + -H(226) +
      ' -' + W(52) + ',' + -H(266) + ' -' + W(46) + ',' + SPALLE + ' Z" fill="' + cloth + '" ' +
      'stroke="' + clothX + '" stroke-width="' + W(1.6) + '"/>' +
    // ombra sul lato sinistro
    '<path d="M-' + W(46) + ',' + SPALLE + ' C-' + W(36) + ',' + -H(308) + ' -' + W(22) + ',' + -H(311) +
      ' -' + W(14) + ',' + -H(311) + ' L-' + W(18) + ',' + VITA + ' L-' + W(46) + ',' + VITA +
      ' C-' + W(48) + ',' + -H(226) + ' -' + W(52) + ',' + -H(266) + ' -' + W(46) + ',' + SPALLE + ' Z" fill="' + clothD + '" opacity=".45"/>' +
    // luce sulla spalla destra
    '<path d="M' + W(46) + ',' + SPALLE + ' C' + W(36) + ',' + -H(308) + ' ' + W(24) + ',' + -H(311) +
      ' ' + W(16) + ',' + -H(311) + ' L' + W(22) + ',' + -H(280) + ' C' + W(34) + ',' + -H(288) +
      ' ' + W(42) + ',' + -H(292) + ' ' + W(48) + ',' + -H(284) + ' Z" fill="' + clothL + '" opacity=".5"/>' +
    // orlo
    '<path d="M-' + W(46) + ',' + VITA + ' L' + W(46) + ',' + VITA + ' L' + W(45) + ',' + -H(198) +
      ' L-' + W(45) + ',' + -H(198) + ' Z" fill="' + clothX + '"/>' +
    // pieghe del busto
    '<g stroke="' + clothD + '" stroke-width="' + W(2.2) + '" fill="none" opacity=".55">' +
      '<path d="M-' + W(30) + ',' + -H(238) + ' C-' + W(22) + ',' + -H(232) + ' -' + W(10) + ',' + -H(234) + ' -' + W(4) + ',' + -H(240) + '"/>' +
      '<path d="M' + W(8) + ',' + -H(232) + ' C' + W(18) + ',' + -H(228) + ' ' + W(28) + ',' + -H(232) + ' ' + W(34) + ',' + -H(238) + '"/></g>' +

    // collo
    '<path d="M-' + W(14) + ',' + -H(318) + ' L' + W(14) + ',' + -H(318) + ' L' + W(16) + ',' + -H(296) +
      ' L-' + W(16) + ',' + -H(296) + ' Z" fill="' + sh + '"/>' +

    // colletto
    '<path d="M-' + W(20) + ',' + -H(302) + ' C-' + W(12) + ',' + -H(288) + ' ' + W(12) + ',' + -H(288) +
      ' ' + W(20) + ',' + -H(302) + ' L' + W(26) + ',' + -H(296) + ' C' + W(14) + ',' + -H(276) +
      ' -' + W(14) + ',' + -H(276) + ' -' + W(26) + ',' + -H(296) + ' Z" fill="' + clothD + '"/>' +

    // braccio davanti
    (pose ? braccioGiu(1, clothL) : braccioAlto) +

    // catena
    (A.chain === "no" ? "" :
      '<path d="M-' + W(24) + ',' + -H(300) + ' C-' + W(12) + ',' + -H(272) + ' ' + W(12) + ',' + -H(272) +
      ' ' + W(24) + ',' + -H(300) + '" fill="none" stroke="' + (A.chain === "doppia" ? "#E8E8F0" : "#F0C24A") +
      '" stroke-width="' + W(A.chain === "grossa" ? 6 : 4) + '" stroke-linecap="round"/>' +
      (A.chain === "grossa" ? '<circle cx="0" cy="' + -H(268) + '" r="' + W(9) + '" fill="#F0C24A"/>' : "")) +

    // testa: la stessa del ritratto, rimpicciolita
    '<g transform="translate(0,' + (st*(-297.5)).toFixed(1) + ') scale(' + (0.70*st).toFixed(3) + ')">' +
      T.defs + T.testa + '</g>' +
    '</g>';
};
window.GO = goto;
document.addEventListener("click", ev => {
  const v = ev.target.closest("[data-vista]");
  if(!v) return;
  vistaCorpo = v.dataset.vista === "intero";
  renderArtista();
});
$("nav-avatar").onclick = () => goto("profile");
$("nav-back").onclick = () => goto("menu");
$("to-menu").onclick = () => goto("menu");
$("brand").onclick = () => goto("menu");

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
  try{ localStorage.removeItem(SAVE_KEY); }catch(e){}
  location.reload();
};
$("m-play").onclick = () => {
  if(!A.name.trim()){ A.name = "Nuovo Artista"; $("name").value = A.name; firstRun = false; applyMode(); renderArtista(); renderMenu(); }
  window.ARTIST = A; goto("game"); if(window.GAME) window.GAME.enter();
};
document.addEventListener("click", e => {
  const b = e.target.closest("[data-go]");
  if(!b) return;
  if(b.dataset.go === "profile") goto("profile");
  else if(b.dataset.go === "regole") $("m-regole").scrollIntoView({behavior:"smooth", block:"start"});
  else alert("Sezione ancora da costruire.");
});

applyMode();
renderArtista();
renderOpzioni();
renderFondali();
renderMenu();
goto("menu");
/* Il menu si ridisegna a caricamento finito: i dati della partita stanno nei file
   del gioco, che vengono dopo questo, e al primo giro non erano ancora arrivati. */
document.addEventListener("DOMContentLoaded", renderMenu);
