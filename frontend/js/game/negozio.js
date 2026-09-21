/* Lo Shop: i Vestiti, coi filtri per tipologia.

   Dal 21/09/2026 lo Shop vende solo vestiti (CARLO: «i beat non devono stare
   nello shop», «l'attrezzatura non serve se andiamo in studio a registrare»).
   Fino a quel giorno c'erano tre reparti dietro tre linguette — Attrezzatura
   e Beat li disegnava ui.js dentro a `#g-shop` e `#g-market` — e i Vestiti
   erano il terzo. I beat si cercano allo Studio, nella stanza «Il beat», che
   pesca dallo stesso banco (`G.market`); l'attrezzatura da casa non esiste
   piu': si registra in Studio, e quello che aveva addosso (il bonus sulla
   qualita', i 50 € di sala «senza microfono») e' uscito da actions.js.

   Il reparto Vestiti e' del 20/09: il vecchio abbigliamento 2D
   (ADF_ABBIGLIAMENTO_HIBERNATE_V2, Mycol) vestiva un ritratto che non esiste
   piu', ed era stato congelato in attesa di «un catalogo cosmetico coerente
   con i provider avatar reali». Il catalogo e' js/creator/guardaroba.js, capi
   veri del camerino MakeHuman.

   Lo Shop SBLOCCA, il camerino VESTE (il perche' sta in guardaroba.js): qui
   si compra e basta, e un tasto porta nel camerino a provarsi quello che si
   e' comprato. L'economia: `G.money` scende, `G.vestiti[raw]` diventa true,
   si salva.

   I filtri («creami dei pulsanti tipo filtri che se schiacciati fanno vedere
   solo quella tipologia», CARLO 21/09): le pastiglie in `#sh-filtri`, una
   per tendina del camerino (VETRINA_REPARTI) piu' «Tutti»; quella schiacciata
   mostra solo i capi di quel tipo. Non si salva: si riapre lo Shop su
   «Tutti».

   I capi che si sbloccano («Capi che si sbloccano», CARLO, 21/09): non tutto
   e' in vendita dal primo giorno. Il catalogo dice su alcuni capi cosa serve
   (`req` in guardaroba.js: il primo contratto, tot fan, una trasferta a
   Milano) e shFitRequisito() guarda la partita: se manca qualcosa la card e'
   bloccata e dice cosa serve, invece di sparire. Il contratto vale anche se
   poi l'etichetta ha rescisso: e' «dopo il PRIMO contratto», e G.goals.g6
   ricorda che l'hai firmato.

   Le offerte (js/game/negozio-offerte.js, «Le offerte della settimana»): il
   prezzo di un capo lo chiede a shFitPrezzo(), che e' quello di listino o
   quello dell'offerta del lunedi'/del banco dell'usato; la sezione «Questa
   settimana» sta in testa al reparto, solo col filtro «Tutti». */
"use strict";

/* ---- il reparto Vestiti ---- */
const SH_FIT_TINTA = ["#3B2A4A", "#1B1426"];
let SH_FIT_FILTRO = "tutti";   /* la pastiglia schiacciata: "tutti" o uno slot */
const SH_CITTA = {milano:"Milano"};   /* le citta' che sbloccano capi (trasferte.js) */

/* Cosa manca per comprare un capo: null se e' sbloccato, se no la frase da
   scrivere sulla card. Un capo senza `req` e' sempre in vendita. */
function shFitRequisito(v){
  const r = v.req; if(!r) return null;
  if(r.contratto && !(G.contract || (G.goals && G.goals.g6))) return "dopo il primo contratto";
  if(r.fan && (Number(G.fans) || 0) < r.fan) return "a " + fmt(r.fan) + " fan";
  if(r.citta){
    const c = G.trasferte && G.trasferte.citta && G.trasferte.citta[r.citta];
    if(!(c && c.visite > 0)) return "dopo una trasferta a " + (SH_CITTA[r.citta] || r.citta);
  }
  return null;
}
const shFitSbloccato = v => !shFitRequisito(v);

/* il prezzo di oggi: quello dell'offerta se c'e' (negozio-offerte.js), se no
   il listino */
function shFitPrezzo(v){
  const o = typeof offertaDi === "function" ? offertaDi(v) : null;
  return o ? o.p : v.p;
}

/* le pastiglie dei filtri: Tutti, poi le tendine del camerino nell'ordine di
   VETRINA_REPARTI, ognuna col numero di capi (e quanti tuoi) */
function shFitFiltri(){
  const el = $("sh-filtri"); if(!el) return;
  const voci = [["tutti", "Tutti", VETRINA_VESTITI]].concat(
    VETRINA_REPARTI.map(([slot, nome]) => [slot, nome, VETRINA_VESTITI.filter(v => v.slot === slot)])
  ).filter(([, , capi]) => capi.length);
  if(!voci.some(([id]) => id === SH_FIT_FILTRO)) SH_FIT_FILTRO = "tutti";
  el.innerHTML = voci.map(([id, nome, capi]) => {
    const tuoi = capi.filter(v => guardarobaPosseduto(v.raw)).length;
    return '<button type="button" class="shtab' + (SH_FIT_FILTRO === id ? " on" : "") +
      '" data-filtro="' + id + '" aria-pressed="' + (SH_FIT_FILTRO === id) + '">' + nome +
      '<small>' + (tuoi ? tuoi + "/" : "") + capi.length + '</small></button>';
  }).join("");
  el.querySelectorAll("[data-filtro]").forEach(btn => {
    btn.onclick = () => {
      if(SH_FIT_FILTRO === btn.dataset.filtro) return;
      SH_FIT_FILTRO = btn.dataset.filtro;
      hubTap();
      renderAbbigliamento();
    };
  });
}

function shFitCard(v){
  const tuo = guardarobaPosseduto(v.raw);
  const addosso = typeof stileAddosso === "function" && stileAddosso().some(x => x.raw === v.raw);
  const manca = tuo ? null : shFitRequisito(v);
  const off = (tuo || manca || typeof offertaDi !== "function") ? null : offertaDi(v);
  const prezzo = off ? off.p : v.p;
  const senzaSoldi = !tuo && !manca && G.money < prezzo;
  return '<button class="shcard shfit' + (tuo ? " owned" : "") + (manca ? " locked" : "") + (off ? " off" : "") +
    '" style="--a:' + SH_FIT_TINTA[0] + ';--b:' + SH_FIT_TINTA[1] + '" data-vestito="' + v.id + '"' +
    (tuo || manca || senzaSoldi ? " disabled" : "") + '>' +
    '<span class="shart"><img src="media/photo/shop/capo-' + v.id + '.png" alt="" loading="lazy">' +
      (tuo ? '<span class="shtag">Tuo</span>'
        : off ? '<span class="shprice off"><s>' + v.p + '</s> ' + prezzo + ' €</span>'
        : '<span class="shprice">' + v.p + ' €</span>') +
    '</span>' +
    '<span class="sht">' + v.n + '</span>' +
    '<span class="shs">' + v.d + '</span>' +
    /* «Lo stile che conta» (21/09): cosa da' addosso, e di che tema e' */
    '<span class="shstile' + (addosso ? " on" : "") + '">' +
      (addosso ? "Addosso \u00b7 " : "") + "+1 " + v.b + (v.t ? " \u00b7 " + v.t : "") +
    '</span>' +
    /* bloccato: cosa serve; in offerta: quale, e fino a quando */
    (manca ? '<span class="shreq">Bloccato \u00b7 ' + manca + '</span>' : "") +
    (off ? '<span class="shoff">' + off.riga + '</span>' : "") +
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
  /* «Lo stile che conta» (21/09): quello che i capi addosso stanno dando, e
     cosa manca al look (stile.js) */
  const riga = typeof stileRiga === "function" ? stileRiga() : "";
  const manca = typeof stileLookManca === "function" ? stileLookManca() : null;
  /* «Capi che si sbloccano» (21/09): quanti aspettano ancora la carriera */
  const bloccati = VETRINA_VESTITI.filter(v => !guardarobaPosseduto(v.raw) && shFitRequisito(v)).length;
  return '<div class="shfitnota">' +
    '<span>' + (tuoi ? "Hai <b>" + tuoi + (tuoi === 1 ? " capo</b>" : " capi</b>") + " di questo reparto. " : "") +
      'Quello che compri qui lo trovi nelle tendine del <b>camerino</b>: è lì che ci si veste. ' +
      'Ogni capo addosso vale <b>un punto di hype</b> a settimana o <b>di presenza</b> sul palco.' +
      (bloccati ? ' <b>' + bloccati + (bloccati === 1 ? " capo</b> si sblocca" : " capi</b> si sbloccano") + ' con la carriera: la card dice cosa serve.' : "") +
      (riga ? '<br><b class="shlook">' + riga + '</b>' : "") +
      (manca ? '<br>' + manca : "") + '</span>' +
    '<button type="button" class="shbtn" data-camerino="1">Vai a provarlo nel camerino</button>' +
    '</div>';
}

function renderAbbigliamento(){
  const el = $("g-fit"); if(!el || typeof VETRINA_VESTITI === "undefined") return;
  shFitFiltri();
  const reparti = SH_FIT_FILTRO === "tutti" ? VETRINA_REPARTI : VETRINA_REPARTI.filter(([slot]) => slot === SH_FIT_FILTRO);
  /* «Le offerte della settimana»: in testa, solo su «Tutti» (negozio-offerte.js) */
  const offerte = SH_FIT_FILTRO === "tutti" && typeof offerteSezione === "function" ? offerteSezione() : "";
  el.innerHTML = shFitTesta() + offerte + reparti.map(([slot, nome]) => {
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
      if(!v || guardarobaPosseduto(v.raw) || shFitRequisito(v)) return;
      const prezzo = shFitPrezzo(v);
      if(G.money < prezzo) return;
      G.money -= prezzo; guardarobaPosseduti()[v.raw] = true;
      if(typeof SFX === "object" && SFX.cash) SFX.cash(); else hubTap();
      pushLog("Hai comprato: " + v.n + (prezzo < v.p ? " a " + prezzo + " € invece di " + v.p : "") +
        ". È nel camerino, quando vuoi metterlo.", "good");
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
