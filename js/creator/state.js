/* Stato dell'artista (A), valori di default, salvataggio su localStorage, etichette. */
"use strict";

/* ================= STATO ================= */
const ART_KEY = "anni-di-fame-artista";
const DEF = () => ({
  name:"", city:"", scene:"citta", genre:"trap", fit:"felpa",
  h:178, w:72, skin:SKINS[1], hair:"corti", color:"#FF5A36",
  glasses:"no", chain:"sottile", beard:"ombra", tattoo:"no",
  hairCol:"#100D0C", face:"ovale", eyeCol:"#3A2A1A", brow:"naturali", mouth:"normale",
  hat:"no", ear:"no", grillz:"no", clothCol:"", mood:"neutro"
});
let A = DEF();
try{ const r = localStorage.getItem(ART_KEY); if(r) A = Object.assign(DEF(), JSON.parse(r)); }catch(e){}

const scene = () => SCENES.find(x => x.id === A.scene) || SCENES[1];
const genre = () => GENRES.find(g => g.id === A.genre) || GENRES[0];
const fit   = () => FITS.find(f => f.id === A.fit) || FITS[0];

function shade(hex, amt){
  const n = parseInt(hex.slice(1),16);
  let r=(n>>16)&255, g=(n>>8)&255, b=n&255;
  if(amt >= 0){ r+=(255-r)*amt; g+=(255-g)*amt; b+=(255-b)*amt; }
  else { r*=(1+amt); g*=(1+amt); b*=(1+amt); }
  return "#" + [r,g,b].map(v => Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,"0")).join("");
}
function buildLabel(){
  const bmi = A.w / Math.pow(A.h/100, 2);
  return bmi < 18.5 ? "molto magra" : bmi < 22 ? "asciutta" : bmi < 26 ? "normale" : bmi < 30 ? "solida" : "robusta";
}
function statureLabel(){
  return A.h >= 192 ? "molto alta" : A.h >= 182 ? "alta" : A.h >= 172 ? "media" : A.h >= 164 ? "bassa" : "molto bassa";
}
