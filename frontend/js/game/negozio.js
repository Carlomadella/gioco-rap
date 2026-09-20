/* Lo Shop: le linguette dei reparti, e il reparto Vestiti.

   Attrezzatura e Beat li disegna ui.js (renderGioco) dentro a `#g-shop` e
   `#g-market`, dal 04/09. Qui ci sono le linguette che cambiano reparto e il
   terzo reparto, i Vestiti, che dal 09/09 al 20/09 non c'era: il vecchio
   abbigliamento 2D (ADF_ABBIGLIAMENTO_HIBERNATE_V2, Mycol) vestiva un ritratto
   che non esiste piu', ed era stato congelato in attesa di «un catalogo
   cosmetico coerente con i provider avatar reali». Il catalogo e' arrivato:
   js/creator/guardaroba.js, capi veri del camerino MakeHuman.

   Lo Shop SBLOCCA, il camerino VESTE (il perche' sta in guardaroba.js): qui
   si compra e basta, e un tasto porta nel camerino a provarsi quello che si
   e' comprato. L'economia e' la stessa dell'attrezzatura: `G.money` scende,
   `G.vestiti[raw]` diventa true, si salva. */
"use strict";

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

/* ---- il reparto Vestiti ---- */
const SH_FIT_TINTA = ["#3B2A4A", "#1B1426"];

function shFitCard(v){
  const tuo = guardarobaPosseduto(v.raw);
  const senzaSoldi = !tuo && G.money < v.p;
  return '<button class="shcard shfit' + (tuo ? " owned" : "") +
    '" style="--a:' + SH_FIT_TINTA[0] + ';--b:' + SH_FIT_TINTA[1] + '" data-vestito="' + v.id + '"' +
    (tuo || senzaSoldi ? " disabled" : "") + '>' +
    '<span class="shart"><img src="media/photo/shop/capo-' + v.id + '.png" alt="" loading="lazy">' +
      (tuo ? '<span class="shtag">Tuo</span>' : '<span class="shprice">' + v.p + ' €</span>') +
    '</span>' +
    '<span class="sht">' + v.n + '</span>' +
    '<span class="shs">' + v.d + '</span>' +
  '</button>';
}

/* La testata del reparto: quanti capi hai, e il tasto per andare a metterli
   addosso. Con un avatar Avaturn (o senza avatar) lo dice chiaro, invece di
   vendere cose che non si vedranno mai. */
function shFitTesta(){
  const tuoi = VETRINA_VESTITI.filter(v => guardarobaPosseduto(v.raw)).length;
  if(!guardarobaVestibile()){
    const art = window.ARTIST || {};
    return '<div class="shfitnota">' +
      (art.avatarSource === "avaturn"
        ? "Il tuo artista è un avatar <b>Avaturn</b>: i vestiti di questo reparto si mettono addosso solo nel camerino MakeHuman. Puoi comprarli, ma non li vedrai su di lui."
        : "I vestiti si mettono addosso nel <b>camerino</b> (Il tuo artista, dal menu). Prima serve un artista fatto lì.") +
      '</div>';
  }
  return '<div class="shfitnota">' +
    '<span>' + (tuoi ? "Hai <b>" + tuoi + (tuoi === 1 ? " capo</b>" : " capi</b>") + " di questo reparto. " : "") +
      'Quello che compri qui lo trovi nelle tendine del <b>camerino</b>: è lì che ci si veste.</span>' +
    '<button type="button" class="shbtn" data-camerino="1">Vai a provarlo nel camerino</button>' +
    '</div>';
}

function renderAbbigliamento(){
  const el = $("g-fit"); if(!el || typeof VETRINA_VESTITI === "undefined") return;
  el.innerHTML = shFitTesta() + VETRINA_REPARTI.map(([slot, nome]) => {
    const capi = VETRINA_VESTITI.filter(v => v.slot === slot);
    if(!capi.length) return "";
    const tuoi = capi.filter(v => guardarobaPosseduto(v.raw)).length;
    return '<div class="gsep"><i style="background:linear-gradient(140deg,' + SH_FIT_TINTA[0] + ',#7C5CBF)"></i>' +
      '<b>' + nome + '</b><span>' + capi.length + (capi.length === 1 ? " capo" : " capi") +
      (tuoi ? " · " + tuoi + (tuoi === 1 ? " tuo" : " tuoi") : "") + '</span></div>' +
      '<div class="shgrid">' + capi.map(shFitCard).join("") + '</div>';
  }).join("");

  el.querySelectorAll("[data-vestito]").forEach(btn => {
    btn.onclick = () => {
      const v = VETRINA_VESTITI.find(x => x.id === btn.dataset.vestito);
      if(!v || guardarobaPosseduto(v.raw) || G.money < v.p) return;
      G.money -= v.p; guardarobaPosseduti()[v.raw] = true;
      if(typeof SFX === "object" && SFX.cash) SFX.cash(); else hubTap();
      pushLog("Hai comprato: " + v.n + ". È nel camerino, quando vuoi metterlo.", "good");
      save(); renderGioco();
    };
  });
  const cam = el.querySelector("[data-camerino]");
  if(cam) cam.onclick = () => {
    hubTap();
    if(window.ADF_RPG_V24 && typeof ADF_RPG_V24.openAppearance === "function") ADF_RPG_V24.openAppearance();
    else if(typeof toast === "function") toast("<b>Il camerino non è disponibile.</b>", "bad", "!", ["#B91C1C","#7F1D1D"]);
  };
}
