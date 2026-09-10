/* ADF_ABBIGLIAMENTO_HIBERNATE_V2
   Il vecchio sistema di abbigliamento 2D è temporaneamente dormiente.

   La UI e il runtime non devono più comprare, equipaggiare o renderizzare
   quei capi finché non esisterà un catalogo cosmetico coerente con i provider
   avatar reali. I dati storici nei salvataggi non vengono cancellati.

   Restano solo stub innocui per compatibilità e la navigazione delle sezioni
   ancora attive dello Shop: Attrezzatura e Beat. */
"use strict";

window.ADF_ABBIGLIAMENTO_LEGACY_ACTIVE = false;

function renderArmadio(){ return; }
function renderAbbigliamento(){ return; }
function apriArmadio(){ return false; }
function chiudiNegozio(){ return; }
function ngEquipaggia(){ return false; }
function ngCompra(){ return false; }

const shTabs = $("sh-tabs");
if(shTabs){
  shTabs.addEventListener("click", ev => {
    const b = ev.target.closest(".shtab");
    if(!b) return;
    hubTap();
    document.querySelectorAll("#sh-tabs .shtab").forEach(t =>
      t.classList.toggle("on", t === b));
    document.querySelectorAll(".shsec").forEach(s =>
      s.classList.toggle("on", s.dataset.shsec === b.dataset.sh));
  });
}
