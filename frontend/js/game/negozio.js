/* I vestiti (punto 47, e punto 7 che lo corregge): due schermate separate,
   non una sola.

   - Il guardaroba (`#negozio`, dalla linguetta «Vestiti» della plancia) è
     SOLO equip: mostra i capi che hai già sbloccato, punto. Prima mischiava
     dentro anche i capi da comprare — sembrava un negozio travestito da
     armadio, ed era il bug del punto 7.
   - Il negozio vero (Shop → Abbigliamento, `#g-fit`, dentro al pannello dello
     schermata di gioco) è dove i capi NON posseduti si comprano. Da lì in
     poi, o da un evento in game, mai dal guardaroba.

   Il capo con cui hai creato il personaggio è sempre tuo gratis: possiede =
   quello che hai comprato più quello che indossi adesso, così un salvataggio
   vecchio non si ritrova a dover ricomprare quello che ha già addosso. */
"use strict";

const NG_PREZZI = {
  tshirt:60, canotta:70, felpa:140, tuta:160, street:220, bomber:280,
  black:320, piumino:340, varsity:420, elegante:480, pelle:560
};

const ngPosseduto = id => id === (window.ARTIST || {}).fit || !!(G.vestiti && G.vestiti[id]);
const ngIndossato = id => id === (window.ARTIST || {}).fit;

/* `shop`: true nello Shop (mostra anche i capi da comprare), false nel
   guardaroba (mostra solo equip — un capo non posseduto non compare proprio). */
function ngCard(f, shop){
  const posseduto = ngPosseduto(f.id), indossato = ngIndossato(f.id);
  const prezzo = NG_PREZZI[f.id] || 200;
  const anteprima = cropRitratto({fit:f.id}, CROP.busto, true);
  const azione = indossato ? '<span class="ngtag">Indossato</span>'
    : posseduto ? '<button class="ngbtn" data-indossa="' + f.id + '">Indossa</button>'
    : shop ? '<button class="ngbtn buy' + (G.money < prezzo ? " no" : "") + '" data-compra="' +
        f.id + '">' + fmt(prezzo) + ' € · Compra</button>'
    : "";
  return '<div class="ngcard' + (indossato ? " on" : "") + '">' +
    '<div class="ngprev">' + anteprima + '</div>' +
    '<b class="ngn">' + f.n + '</b>' + azione + '</div>';
}

function renderArmadio(){
  if(!G.vestiti) G.vestiti = {};
  const posseduti = FITS.filter(f => ngPosseduto(f.id));
  $("ng-grid").innerHTML = posseduti.map(f => ngCard(f, false)).join("") ||
    '<p class="ngvuoto">Non hai ancora altro nel guardaroba. Nuovi capi si comprano allo Shop sulla mappa, sotto «Abbigliamento», o arrivano da un evento.</p>';
}

function renderAbbigliamento(){
  if(!G.vestiti) G.vestiti = {};
  const el = $("g-fit"); if(!el) return;
  el.innerHTML = FITS.map(f => ngCard(f, true)).join("");
}

function apriArmadio(){
  hubTap();
  renderArmadio();
  $("negozio").classList.add("on");
}
function chiudiNegozio(){ $("negozio").classList.remove("on"); }

function ngEquipaggia(id){
  if(!G.vestiti) G.vestiti = {};
  /* il capo che stavi indossando (magari mai comprato — quello di partenza)
     resta tuo per sempre appena lo lasci, altrimenti sparirebbe dal
     guardaroba nel momento stesso in cui indossi qualcos'altro */
  const prima = (window.ARTIST || {}).fit;
  if(prima && prima !== id) G.vestiti[prima] = true;
  window.ARTIST.fit = id;
  try{ localStorage.setItem(CHIAVE_ARTISTA(), JSON.stringify(window.ARTIST)); }catch(e){}
  renderArmadio();
  renderAbbigliamento();
  if(typeof renderHub === "function") renderHub();
}

function ngCompra(id){
  const prezzo = NG_PREZZI[id] || 200;
  if(G.money < prezzo) return;
  hubTap();
  G.money -= prezzo;
  G.vestiti[id] = true;
  ngEquipaggia(id);
  save();
}

$("ng-grid").addEventListener("click", ev => {
  const ind = ev.target.closest("[data-indossa]");
  if(ind){ hubTap(); ngEquipaggia(ind.dataset.indossa); }
});
$("g-fit").addEventListener("click", ev => {
  const ind = ev.target.closest("[data-indossa]");
  if(ind){ hubTap(); ngEquipaggia(ind.dataset.indossa); return; }
  const buy = ev.target.closest("[data-compra]");
  if(buy) ngCompra(buy.dataset.compra);
});
$("ng-x").onclick = () => { hubTap(); chiudiNegozio(); };
document.addEventListener("keydown", e => {
  if(e.key === "Escape" && $("negozio").classList.contains("on")) chiudiNegozio();
});
