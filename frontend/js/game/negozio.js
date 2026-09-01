/* Il negozio di vestiti (punto 47): dalla linguetta «Vestiti» della plancia,
   sbloccato dall'inizio — non è il catalogo dell'attrezzatura da studio (quello
   resta nel catalogo/Shop di mappa), è dove compri e indossi i capi di FITS
   (js/creator/data.js). Il capo con cui hai creato il personaggio è sempre tuo
   gratis: possiede = quello che hai comprato più quello che indossi adesso,
   così un salvataggio vecchio non si ritrova a dover ricomprare quello che ha
   già addosso. */
"use strict";

const NG_PREZZI = {
  tshirt:60, canotta:70, felpa:140, tuta:160, street:220, bomber:280,
  black:320, piumino:340, varsity:420, elegante:480, pelle:560
};

const ngPosseduto = id => id === (window.ARTIST || {}).fit || !!(G.vestiti && G.vestiti[id]);
const ngIndossato = id => id === (window.ARTIST || {}).fit;

function renderNegozio(){
  if(!G.vestiti) G.vestiti = {};
  $("ng-grid").innerHTML = FITS.map(f => {
    const posseduto = ngPosseduto(f.id), indossato = ngIndossato(f.id);
    const prezzo = NG_PREZZI[f.id] || 200;
    const anteprima = cropRitratto({fit:f.id}, CROP.busto, true);
    return '<div class="ngcard' + (indossato ? " on" : "") + '">' +
      '<div class="ngprev">' + anteprima + '</div>' +
      '<b class="ngn">' + f.n + '</b>' +
      (indossato ? '<span class="ngtag">Indossato</span>'
        : posseduto ? '<button class="ngbtn" data-indossa="' + f.id + '">Indossa</button>'
        : '<button class="ngbtn buy' + (G.money < prezzo ? " no" : "") + '" data-compra="' +
          f.id + '">' + fmt(prezzo) + ' € · Compra</button>') +
    '</div>';
  }).join("");
}

function apriNegozio(){
  hubTap();
  renderNegozio();
  $("negozio").classList.add("on");
}
function chiudiNegozio(){ $("negozio").classList.remove("on"); }

function ngEquipaggia(id){
  window.ARTIST.fit = id;
  try{ localStorage.setItem(CHIAVE_ARTISTA(), JSON.stringify(window.ARTIST)); }catch(e){}
  renderNegozio();
  if(typeof renderHub === "function") renderHub();
}

$("ng-grid").addEventListener("click", ev => {
  const ind = ev.target.closest("[data-indossa]");
  if(ind){ hubTap(); ngEquipaggia(ind.dataset.indossa); return; }
  const buy = ev.target.closest("[data-compra]");
  if(buy){
    const id = buy.dataset.compra, prezzo = NG_PREZZI[id] || 200;
    if(G.money < prezzo) return;
    hubTap();
    G.money -= prezzo;
    G.vestiti[id] = true;
    ngEquipaggia(id);
    save();
  }
});
$("ng-x").onclick = () => { hubTap(); chiudiNegozio(); };
document.addEventListener("keydown", e => {
  if(e.key === "Escape" && $("negozio").classList.contains("on")) chiudiNegozio();
});
