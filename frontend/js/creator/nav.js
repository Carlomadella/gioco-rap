/* Navigazione fra le schermate del gioco e corpo intero (window.ARTIST_BODY).

   Punto 27: la landing non è più una di queste schermate. Sta in una pagina
   sua (`pagine/landing.html`, js/landing.js) e `goto("menu")` non toglie più
   una classe: cambia pagina. Tutto il resto — mappa, profilo — resta com'era,
   perché sono schermate della stessa partita e vivono nello stesso documento. */
"use strict";

/* ================= NAVIGAZIONE ================= */
function miniPortrait(){
  return portrait().replace('class="portrait"', 'class="mini"');
}
/* La landing sta fuori di qui: chi chiede "menu" sta chiedendo di uscire. */
function vaiAllaLanding(){ vaiA("landing"); }
function goto(screen){
  if(screen === "menu"){ vaiAllaLanding(); return; }
  const target = $("s-" + screen);
  document.querySelectorAll(".screen").forEach(x => x.classList.toggle("on", x.id === "s-" + screen));
  /* Da smistare, punto 1: `.screen.on` ha la sua animazione (shell.css), ma
     il nodo resta lo stesso ad ogni giro — senza forzare un reflow il
     browser a volte non la fa ripartire, se il cambio di classe avviene
     tutto nello stesso istante di script (come qui). */
  if(target){ target.style.animation = "none"; void target.offsetWidth; target.style.animation = ""; }
  /* In partita il tasto per il menu non sta quassù: il marchio a sinistra fa
     già quel mestiere, e la barra deve restare fuori dai piedi mentre giochi. */
  $("nav-back").hidden = (screen === "hub");
  /* L'hub ha una testata sua, con il marchio e le risorse: la barra di sopra
     sparisce, se no ce ne sono due una sull'altra. */
  document.body.classList.toggle("in-hub", screen === "hub");
  window.scrollTo({top:0});
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

/* Il creatore si accende com'era: quello che stava qui sotto — la carriera
   in corso, le sei scene, il menu della landing — è andato in js/landing.js,
   che è l'unico posto dove quella roba esiste ancora. Chi decide su quale
   schermata aprirsi è js/gioco-ingresso.js, in fondo alla pagina. */
applyMode();
renderArtista();
renderOpzioni();
renderFondali();
