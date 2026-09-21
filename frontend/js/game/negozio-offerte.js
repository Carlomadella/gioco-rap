/* Le offerte della settimana: l'offerta del lunedi' e il banco dell'usato.

   «Le offerte della settimana — un capo a meta' prezzo che gira ogni lunedi',
   come i beat del banco, piu' un banco dell'usato con capi scontati che vanno
   e vengono.» (CARLO, «Shop (20/09/2026)» 3.)

   Fino al 21/09 lo Shop aveva un listino e basta: un capo costava sempre
   uguale, e non c'era mai un motivo per tornarci a guardare. Adesso ogni
   settimana cambia qualcosa:

   - **l'offerta del lunedi'**: un capo della vetrina a meta' prezzo
     (OFF_SCONTO_LUNEDI), scelto fra quelli che puoi comprare — non tuoi, non
     bloccati dalla carriera. Vale tutta la settimana, il lunedi' dopo ne
     arriva un altro. Come i tre beat di `offriBeat()`: si tira a sorte e si
     salva, cosi' non gira ogni volta che apri lo Shop;
   - **il banco dell'usato**: fino a OFF_USATO_MAX capi con lo sconto scritto
     sopra (uno di OFF_USATO_SCONTI), ognuno con una scadenza sua, da una a
     tre settimane. Al lunedi' escono quelli scaduti e quelli che intanto hai
     comprato, ed entrano i nuovi fino a un numero tirato a sorte fra uno e
     il massimo: e' questo il «vanno e vengono». Usato o no, il capo e' lo
     stesso: nel camerino non si vede la differenza.

   Il giro lo fa `offerteSettimana()`, chiamata da `advanceWeek()` (sim.js)
   subito dopo `G.week++`, cioe' al lunedi'; in piu' lo Shop la chiama da solo
   se trova una settimana diversa da quella salvata (un salvataggio vecchio,
   o la prima partita: le offerte ci sono dal primo giorno), e in quel caso
   salva subito. Dal lunedi' il diario dice cosa c'e' in offerta, cosi' uno
   sa quando vale la pena passare.

   Quello che si salva: `G.offerte = {sett, capo, usato:[{id, p, fino}]}` (piu'
   `daSalvare`, solo fra un'estrazione del render e l'apertura dello Shop).
   `sett` e' la settimana assoluta (totalWeeks), `capo` l'id del capo a meta'
   prezzo (o null se non c'e' piu' niente da scontare), `usato` i capi del
   banco con il loro prezzo gia' arrotondato ai 5 € e la settimana in cui
   escono; lo sconto scritto sulla card si ricava dal prezzo. Il prezzo
   che lo Shop mostra e fa pagare lo chiede a `offertaDi(v)` (via shFitPrezzo
   di negozio.js): il capo ha un'offerta solo se e' ancora comprabile — se
   nel frattempo e' diventato tuo, o si e' ribloccato (i fan possono anche
   scendere), l'offerta non c'e'.

   File nuovo, come chiede la regola dei punti che non sono fix: negozio.js
   disegna le card e incassa, qui sta solo cosa e' in offerta e perche'. */
"use strict";

const OFF_SCONTO_LUNEDI = 0.5;          /* l'offerta del lunedi': meta' prezzo */
const OFF_USATO_MAX = 3;                /* quanti capi al massimo sul banco dell'usato */
const OFF_USATO_SCONTI = [0.25, 0.3, 0.4];   /* gli sconti dell'usato, uno a caso */
const OFF_USATO_SETTIMANE = 3;          /* un capo usato resta al massimo tre settimane */

/* ai 5 €, come i prezzi del listino */
const offArrotonda = p => Math.max(5, Math.round(p / 5) * 5);

function offerteStato(){
  if(!G.offerte || typeof G.offerte !== "object") G.offerte = {};
  const s = G.offerte;
  if(typeof s.sett !== "number") s.sett = 0;
  if(s.capo === undefined) s.capo = null;
  if(!Array.isArray(s.usato)) s.usato = [];
  return s;
}

/* i capi su cui un'offerta ha senso: non tuoi, non bloccati dalla carriera */
function offerteCandidati(){
  if(typeof VETRINA_VESTITI === "undefined") return [];
  return VETRINA_VESTITI.filter(v => !guardarobaPosseduto(v.raw) &&
    !(typeof shFitRequisito === "function" && shFitRequisito(v)));
}

/* Il giro del lunedi'. Torna true se la settimana e' cambiata (e quindi ha
   tirato a sorte), false se le offerte erano gia' di questa settimana.
   `avvisa` mette una riga nel diario: lo fa advanceWeek, non lo Shop. */
function offerteSettimana(avvisa){
  const s = offerteStato();
  const w = typeof totalWeeks === "function" ? totalWeeks() : 0;
  if(s.sett === w) return false;
  s.sett = w;
  const liberi = offerteCandidati();

  /* il capo a meta' prezzo: uno che non sta gia' sul banco dell'usato */
  const scelta = liberi.filter(v => !s.usato.some(u => u.id === v.id));
  s.capo = scelta.length ? scelta[Math.floor(Math.random() * scelta.length)].id : null;

  /* l'usato: via chi e' scaduto, chi hai comprato, chi si e' bloccato; poi
     dentro i nuovi, fino a un numero che cambia ogni settimana */
  s.usato = s.usato.filter(u => u.fino > w && u.id !== s.capo && liberi.some(v => v.id === u.id));
  const quanti = 1 + Math.floor(Math.random() * OFF_USATO_MAX);
  const pool = liberi.filter(v => v.id !== s.capo && !s.usato.some(u => u.id === v.id));
  while(s.usato.length < quanti && pool.length){
    const v = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    const sconto = OFF_USATO_SCONTI[Math.floor(Math.random() * OFF_USATO_SCONTI.length)];
    s.usato.push({id:v.id, p:offArrotonda(v.p * (1 - sconto)),
      fino:w + 1 + Math.floor(Math.random() * OFF_USATO_SETTIMANE)});
  }

  if(avvisa && typeof pushLog === "function"){
    const capo = s.capo && VETRINA_VESTITI.find(v => v.id === s.capo);
    const usati = s.usato.length ? s.usato.length + (s.usato.length === 1 ? " capo usato" : " capi usati") + " sul banco" : "";
    if(capo) pushLog("Allo Shop: <b>" + capo.n + "</b> a metà prezzo fino a domenica" + (usati ? ", e " + usati : "") + ".", "");
    else if(usati) pushLog("Allo Shop: " + usati + ", niente a metà prezzo questa settimana.", "");
  }
  return true;
}

/* Se le offerte salvate sono di un'altra settimana (un salvataggio di prima
   del 21/09, o `G.offerte` che manca) si tira a sorte adesso. Con `salva`
   si salva anche: lo fa l'apertura dello Shop dalla mappa (hub.js), che e'
   un'azione di chi gioca — se no ricaricando la pagina senza fare altro
   l'offerta sarebbe un'altra. Il render invece NON salva mai: il primo
   `renderGioco()` di una partita nuova gira anche quando il salvataggio di
   prima era illeggibile e il cartello «Riprova a caricarla» non e' ancora
   comparso, e un `save()` li' scriverebbe la partita nuova sopra a quella
   rotta (trovato dal giro di fine task del 21/09). */
function offerteAggiorna(salva){
  if(typeof totalWeeks !== "function") return false;
  const s = offerteStato();
  const nuova = s.sett !== totalWeeks();
  if(nuova) offerteSettimana(false);
  /* un'estrazione fatta dal render resta segnata (`daSalvare`) finche'
     un'apertura dello Shop non la salva */
  if(salva && (nuova || s.daSalvare)){ delete s.daSalvare; if(typeof save === "function") save(); }
  else if(nuova) s.daSalvare = true;
  return nuova;
}

/* L'offerta su un capo, oggi: null se e' a listino. Se c'e':
   `p` il prezzo, `tipo` "lunedi" o "usato", `sconto` in percento, `riga`
   quello che la card scrive sotto. */
function offertaDi(v){
  if(typeof G === "undefined" || !G || !v) return null;
  const s = offerteStato();
  offerteAggiorna();
  if(guardarobaPosseduto(v.raw) || (typeof shFitRequisito === "function" && shFitRequisito(v))) return null;
  if(s.capo === v.id){
    return {p:offArrotonda(v.p * OFF_SCONTO_LUNEDI), tipo:"lunedi", sconto:Math.round(OFF_SCONTO_LUNEDI * 100),
      riga:"Offerta del lunedì · metà prezzo fino a domenica"};
  }
  const u = s.usato.find(x => x.id === v.id);
  if(u){
    const sett = u.fino - (typeof totalWeeks === "function" ? totalWeeks() : 0);
    /* lo sconto scritto sulla card e' quello VERO, dal prezzo arrotondato,
       ai 5 punti: 140 al 40% fa 85 e si scrive −40%, ma 40 al 30% fa 30 ed
       e' un −25%, e va scritto −25% — chi fa il conto deve trovarlo giusto */
    const sconto = Math.round((1 - u.p / v.p) * 100 / 5) * 5;
    return {p:u.p, tipo:"usato", sconto,
      riga:"Usato · −" + sconto + "% · " +
        (sett <= 1 ? "solo questa settimana" : "ancora " + sett + " settimane")};
  }
  return null;
}

/* La sezione «Questa settimana» in testa al reparto: l'offerta del lunedi' e
   il banco dell'usato, con le stesse card del listino (shFitCard). Se non c'e'
   niente — hai comprato tutto quello che si poteva scontare — lo dice. */
function offerteSezione(){
  if(typeof shFitCard !== "function" || typeof VETRINA_VESTITI === "undefined") return "";
  const s = offerteStato();
  offerteAggiorna();
  const capo = s.capo && VETRINA_VESTITI.find(v => v.id === s.capo && offertaDi(v));
  const usato = s.usato.map(u => VETRINA_VESTITI.find(v => v.id === u.id)).filter(v => v && offertaDi(v));
  const sep = (nome, nota) => '<div class="gsep"><i style="background:linear-gradient(140deg,#B45309,#F59E0B)"></i>' +
    '<b>' + nome + '</b><span>' + nota + '</span></div>';
  let out = "";
  if(capo) out += sep("L'offerta del lunedì", "un capo a metà prezzo, fino a domenica") +
    '<div class="shgrid">' + shFitCard(capo) + '</div>';
  if(usato.length) out += sep("Il banco dell'usato", usato.length === 1 ? "un capo scontato, finché c'è" : usato.length + " capi scontati, finché ci sono") +
    '<div class="shgrid">' + usato.map(shFitCard).join("") + '</div>';
  if(!out) out = '<div class="shoffnota">Questa settimana niente in offerta: hai già tutto quello che si poteva scontare. Il lunedì cambia.</div>';
  return '<div class="shofferte">' + out + '</div>';
}
