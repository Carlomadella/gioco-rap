/* Il recap di fine giornata — CARLO: «mettere un recap giornaliero con in
   aggiunta gli highlights di cosa è successo durante il giorno».

   Fino a qui il «+1 giorno» girava pagina e basta: il settimo giorno usciva
   il rapporto della settimana (weekReport, fx.js), gli altri sei niente — e
   quello che avevi fatto stava sparso fra i toast e il diario. Adesso,
   quando chiudi una giornata, esce una finestra con:

   - **i numeri del giorno**: soldi, fan, hype e benessere, prima e dopo, e
     l'energia che hai speso;
   - **le mosse** che hai fatto (le conta `avviaAzioneDiretta`, ui.js);
   - **gli highlights**: le righe del diario scritte da stamattina — compresa
     la notte appena passata — scelte per peso (quelle grosse, poi le belle e
     le brutte, poi il resto) e messe in ordine di come sono successe.

   Quando il giorno è il settimo esce il rapporto della settimana, e il recap
   no: due finestre una sull'altra sono un fastidio, e quel rapporto racconta
   già la settimana con le ultime righe del diario. Nemmeno sui salti lunghi
   (+7, +28: lì c'è la riga «N giorni saltati»), né quando la notte si ferma
   su un evento, né in carcere.

   Il recap si spegne dalle Impostazioni («Recap di fine giornata»,
   `SET.gioco.recap`) o dal suo tasto, per chi salta i giorni uno alla volta
   e non vuole una finestra a ogni sera.

   Lo stato sta in `G.giornata`: la fotografia di stamattina (che giorno è, i
   numeri, quante righe aveva scritto il diario) e le mosse. Il diario tiene
   80 righe e scrive in testa, quindi per sapere quali sono di oggi si conta:
   `G.logN` sale di uno a ogni `pushLog` (sim.js). */
"use strict";

const RECAP_HIGHLIGHT_MAX = 5;   /* quante righe del diario si raccontano */
const RECAP_MOSSE_MAX = 40;      /* oltre, una giornata non ne fa: è un tetto di sicurezza */
const RECAP_GIORNI = ["", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

/* ==================== LA FOTOGRAFIA DI STAMATTINA ==================== */
function recapOggi(){
  return (((G.year || 1) - 1) * 52 + ((G.week || 1) - 1)) * 7 + (G.day || 1);
}
function recapLuc(){ return typeof luc === "function" ? luc() : (G.lucidita || 0); }
function recapFoto(){
  G.giornata = {g:recapOggi(), day:G.day || 1, week:G.week || 1, year:G.year || 1,
    soldi:G.money, fan:G.fans, hype:G.hype, ben:G.wellbeing, luc:recapLuc(),
    logN:G.logN || 0, mosse:[]};
  return G.giornata;
}
/* La giornata di oggi: se la fotografia è di un altro giorno (un salvataggio
   di prima, una trasferta che ha fatto passare i giorni per conto suo) se ne
   fa una nuova — quello che è successo prima di adesso non si sa più, e non
   si inventa. */
function recapGiornata(){
  const d = G.giornata;
  if(!d || typeof d !== "object" || d.g !== recapOggi() || !Array.isArray(d.mosse)) return recapFoto();
  return d;
}
/* La chiama `avviaAzioneDiretta` (ui.js) a ogni mossa riuscita. */
function recapMossa(a){
  if(!a || !a.n) return;
  const d = recapGiornata();
  if(d.mosse.length < RECAP_MOSSE_MAX) d.mosse.push(a.n);
}
function recapAcceso(){
  return !(typeof SET === "object" && SET && SET.gioco && SET.gioco.recap === false);
}

/* ==================== CHIUDERE LA GIORNATA ==================== */
/* Prima di girare pagina (`saltaGiorni`, eventi-v2.js): quello che dopo
   `avanzaGiorno()` non si legge più — l'energia rimasta, il giorno che era. */
function recapPrepara(){
  const d = recapGiornata();
  return Object.assign({}, d, {mosse:d.mosse.slice(),
    energia:Math.max(0, Math.round((G.maxEnergy || 100) - (G.energy || 0)))});
}

/* il peso di una riga del diario: le grosse, poi le belle e le brutte */
function recapPeso(c){ return c === "big" ? 3 : (c === "good" || c === "bad") ? 2 : 1; }

/* Le righe del diario scritte dalla fotografia in poi, dalla prima
   all'ultima. Fuori le righe «Nuovo giorno.» del cambio giorno: non sono
   successe, sono il calendario. */
function recapRighe(prep){
  const nuove = Math.max(0, Math.min((G.log || []).length, (G.logN || 0) - (prep.logN || 0)));
  return (G.log || []).slice(0, nuove).reverse()
    .filter(r => r && r.t && !/^<b>Nuovo giorno\.<\/b>/.test(r.t));
}
/* Gli highlights: le più pesanti, a parità le più recenti, poi rimesse in
   ordine di tempo — si leggono come una giornata, non come una classifica. */
function recapHighlights(righe){
  const scelte = righe.map((r, i) => ({r, i, p:recapPeso(r.c)}))
    .sort((a, b) => b.p - a.p || b.i - a.i)
    .slice(0, RECAP_HIGHLIGHT_MAX)
    .sort((a, b) => a.i - b.i);
  return {voci:scelte.map(x => x.r), altre:Math.max(0, righe.length - scelte.length)};
}

/* Il recap come dati: la finestra lo disegna, i test lo leggono. */
function recapDati(prep){
  const righe = recapRighe(prep);
  const h = recapHighlights(righe);
  return {
    titolo:(RECAP_GIORNI[prep.day] || "Giorno " + prep.day) + " · Settimana " + prep.week,
    soldi:Math.round(G.money - prep.soldi),
    fan:Math.round(G.fans - prep.fan),
    hype:Math.round(G.hype - prep.hype),
    ben:Math.round(G.wellbeing - prep.ben),
    luc:Math.round(recapLuc() - prep.luc),
    energia:prep.energia || 0,
    mosse:prep.mosse || [],
    highlights:h.voci,
    altre:h.altre
  };
}

/* ==================== LA FINESTRA ==================== */
function recapSegno(v, unita){
  const n = Math.abs(v).toLocaleString("it-IT");
  return (v > 0 ? "+" : v < 0 ? "−" : "") + n + (unita || "");
}
function recapBox(v, etichetta, unita){
  return '<div class="rbox"><div class="v' + (v > 0 ? " up" : v < 0 ? " down" : "") + '">' +
    recapSegno(v, unita) + '</div><div class="l">' + etichetta + '</div></div>';
}
/* le mosse uguali si contano una volta: «Scrivi barre ×3» */
function recapMosseTesto(mosse){
  const conta = new Map();
  for(const m of mosse) conta.set(m, (conta.get(m) || 0) + 1);
  return Array.from(conta, ([m, n]) => m + (n > 1 ? " ×" + n : "")).join(" · ");
}
function recapHtml(r){
  const vuoto = !r.mosse.length && !r.highlights.length;
  return '<div class="k">Giornata chiusa</div>' +
    '<h2>' + r.titolo + '</h2>' +
    '<div class="rgrid">' +
      recapBox(r.soldi, "in cassa", " €") + recapBox(r.fan, "fan") +
      recapBox(r.hype, "hype") + recapBox(r.ben, "benessere") +
    '</div>' +
    '<p class="rcmosse">' +
      (r.mosse.length
        ? '<b>' + r.mosse.length + (r.mosse.length === 1 ? ' mossa' : ' mosse') + '</b>' +
          (r.energia ? ' · ' + r.energia + ' di energia' : '') + '<span>' + recapMosseTesto(r.mosse) + '</span>'
        : 'Nessuna mossa' + (r.energia ? ' · ' + r.energia + ' di energia' : '') + '.') +
      (r.luc ? ' <i>Lucidità ' + recapSegno(r.luc) + '.</i>' : '') +
    '</p>' +
    (vuoto
      ? '<div class="rcvuoto">Una giornata ferma: niente da raccontare. Domani si riparte.</div>'
      : r.highlights.length
        ? '<div class="rk">Gli highlights</div>' +
          '<div class="rnews rchl">' + r.highlights.map(h =>
            '<div class="' + (h.c === "big" ? "big" : h.c === "good" ? "good" : h.c === "bad" ? "bad" : "") + '">' +
              h.t + '</div>').join("") +
          (r.altre ? '<div class="rcaltre">e ' + r.altre + (r.altre === 1 ? ' altra cosa' : ' altre cose') +
            ', nel diario</div>' : '') +
          '</div>'
        : '') +
    '<div class="rcazioni">' +
      '<button class="solid" type="button" data-recap="avanti">Domani</button>' +
      '<button class="rcspegni" type="button" data-recap="spegni">Non mostrarlo più</button>' +
    '</div>';
}

function recapChiudi(){
  const el = $("recap");
  if(el) el.classList.remove("on");
}
/* Mostra il recap della giornata `prep` (presa da recapPrepara prima del
   cambio giorno). Aspetta che lo schermo sia libero: se in coda c'è una
   finestra, arriva dopo, non sopra. */
function recapMostra(prep){
  if(!prep || !recapAcceso()) return;
  const el = $("recap");
  if(!el) return;
  const r = recapDati(prep);
  const apri = () => {
    $("recap-card").innerHTML = recapHtml(r);
    el.classList.add("on");
  };
  if(typeof afterClear === "function") afterClear(apri, 20);
  else apri();
}

if(typeof $ === "function" && $("recap")){
  $("recap").addEventListener("click", e => {
    const b = e.target.closest("[data-recap]");
    if(!b) return;
    if(b.dataset.recap === "spegni" && typeof SET === "object" && SET && SET.gioco){
      SET.gioco.recap = false;
      if(typeof setSalva === "function") setSalva();
      if(typeof toast === "function")
        toast("Recap spento: lo riaccendi dalle <b>Impostazioni</b>, in Gioco", "", "☾", ["#3A3F49", "#22262E"]);
    }
    recapChiudi();
    if(typeof SFX === "object" && SFX.tap) SFX.tap();
  });
}
