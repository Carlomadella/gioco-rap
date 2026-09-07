/* GLI ELEMENTI DELLO STUDIO — il punto 4 di CARLO, la seconda metà:

     «aggiungi le foto di background dei posti senza HTML, poi ricrea la
      schermata **identica** alle foto con elementi HTML»

   Il telaio l'ha già fatto `studio.js`: la foto a schermo intero, la fascia
   in alto, le tre colonne, la riga in basso, le otto linguette. Quello che
   mancava per arrivare *identici* ai riferimenti sono le cose che stanno
   **dentro** ai pannelli, e che nelle foto sono la schermata vera:

     `studio_creazione_beat`   le tre schede dei beat sul banco — copertina,
                               bpm, tasto ascolta, onda, prezzo
     `registrazione_pezzo`     l'elenco delle take, con la barra a tacche e
                               la migliore segnata
     `studio_mixaggio`         i tre cursori del banco (voce, bassi, aria) e
                               il carattere che ne esce
     `studio_uscita_pezzo`     il QUANDO — stanotte, venerdì, nel cassetto —
                               la stima degli stream e la cassaforte

   Sta in un file suo per la regola 9 di `implementazioni.md` («quando non
   sono fix […] non modificare troppo i file già presenti ma crea un file
   nuovo collegato ai già presenti»): `studio.js` resta il telaio e le otto
   sezioni, qui ci sono i pezzi che ci vanno dentro. Le sezioni chiamano
   queste funzioni per nome, e il file si carica subito dopo il suo.

   **L'economia non si tocca lo stesso.** Le tre cose nuove sono scelte, non
   regali:
     - la prima take è il tiro di dado che `registra` faceva già da solo
       (`rnd(-5,6)`), solo che adesso lo vedi. Le altre le paghi in energia.
     - i cursori partono tutti al centro, e al centro il mix vale esattamente
       quello che valeva prima. Da lì si guadagna o si perde qualche punto a
       seconda di quanto è coerente quello che hai fatto.
     - il QUANDO non regala hype: venerdì lo dà perché aspetti dei giorni. */
"use strict";

/* ==================== I MATTONCINI NUOVI ====================
   Quattro forme che nei riferimenti tornano in più di una schermata, quindi
   stanno qui una volta sola e non dentro alla sezione che le usa per prima:
   l'onda, la barra a tacche, il tasto tondo di ascolto e il cursore. */

/* Un generatore ripetibile: la stessa onda per lo stesso beat, sempre. Se
   cambiasse a ogni disegno la pagina «respirerebbe» a ogni click, ed è il
   genere di movimento che si nota senza capire perché dà fastidio. */
function stElemRng(seed){
  let x = (seed >>> 0) || 7;
  return () => (x = (x * 1664525 + 1013904223) >>> 0) / 4294967296;
}

/* L'onda accanto al tasto di ascolto. Nei riferimenti è la forma d'onda del
   beat: barre sottili, alte al centro, tutte diverse. Non è un'immagine —
   sono `n` `<i>` con un'altezza a testa, così si stringe con la colonna. */
function stOnda(seed, n){
  const r = stElemRng(seed);
  const q = 26;                          /* quante barre: bastano per leggerla */
  const tot = n || q;
  let out = "";
  for(let i = 0; i < tot; i++){
    /* una campana in mezzo più il caso: senza la campana sembra un istogramma,
       con solo la campana sembra un disegno */
    const p = i / (tot - 1);
    const campana = 0.45 + 0.55 * Math.sin(Math.PI * p);
    const h = Math.round(clamp(campana * (32 + r() * 68), 12, 100));
    out += '<i style="height:' + h + '%"></i>';
  }
  return '<span class="stonda" aria-hidden="true">' + out + '</span>';
}

/* La barra a tacche delle take: quattordici caselle, accese fin dove arriva
   la qualità. Nei riferimenti è così che si confrontano tre take a colpo
   d'occhio — un numero da solo lo devi leggere, questa la vedi. */
function stTacche(q, tot){
  const n = tot || 14;
  const piene = Math.round(clamp(q, 0, 100) / 100 * n);
  let out = "";
  for(let i = 0; i < n; i++) out += '<i' + (i < piene ? ' class="on"' : '') + '></i>';
  return '<span class="sttacche" aria-hidden="true">' + out + '</span>';
}

/* Il tasto tondo con il triangolo: sulle schede dei beat e su ogni take. */
function stPlay(attr, etichetta){
  return '<button type="button" class="stplay"' + (attr || "") +
    ' aria-label="' + studioEsc(etichetta || "Ascolta") + '">' +
    '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M7 4.6 15.4 10 7 15.4z"/></svg></button>';
}

/* Il cursore del banco: nome con l'icona, la pista con le tacche, i due capi
   e sotto la frase che dice cosa hai appena scelto. L'`input` vero sta sotto
   e si prende il dito, la tastiera e le frecce; quello che si vede è la
   pista disegnata, perché un range di serie non somiglia al riferimento su
   nessun browser. */
function stCursore(o){
  const pos = o.v / (o.max || 4) * 100;
  let tacche = "";
  for(let i = 0; i <= (o.max || 4); i++)
    tacche += '<i style="left:' + (i / (o.max || 4) * 100) + '%"></i>';
  return '<div class="stcurs' + (o.v === Math.round((o.max || 4) / 2) ? "" : " mosso") + '">' +
    '<p class="stcursk">' + stIco(o.ic) + studioEsc(o.n) + '</p>' +
    '<div class="stcurspista">' +
      '<span class="stcursfondo"></span>' +
      '<span class="stcurspieno" style="width:' + pos + '%"></span>' +
      '<span class="stcurstacche">' + tacche + '</span>' +
      '<span class="stcursnodo" style="left:' + pos + '%"></span>' +
      '<input type="range" min="0" max="' + (o.max || 4) + '" step="1" value="' + o.v +
        '" data-curs="' + studioEsc(o.k) + '" aria-label="' + studioEsc(o.n) + '">' +
    '</div>' +
    '<p class="stcurscapi"><span>' + studioEsc(o.sx) + '</span><span>' + studioEsc(o.dx) + '</span></p>' +
    '<p class="stcursnota">' + studioEsc(o.nota) + '</p>' +
  '</div>';
}

/* La barra lunga in fondo al foglio di `scrittura_barre`: icona, nome in
   stampatello, la barra, il numero su cento e a destra una frase. La usa il
   Testo per l'ispirazione, ed è l'unico posto della pagina dove un numero
   che non decidi tu si vede come barra invece che come cifra. */
function stBarraLunga(ic, n, v, su, frase){
  const p = clamp(v / su * 100, 0, 100);
  return '<div class="stbarrona">' + stIco(ic) +
    '<span class="stbarronak">' + studioEsc(n) + '</span>' +
    '<span class="stbarronap"><i style="width:' + p + '%"></i></span>' +
    '<span class="stbarronav">' + Math.round(v) + '<em>/' + su + '</em></span>' +
    (frase ? '<span class="stbarronaq">«' + studioEsc(frase) + '»</span>' : "") +
  '</div>';
}

/* Il riquadro giallo con il triangolo: nel riferimento della promo è «Hai
   già postato 2 volte oggi: la gente comincia a scorrere oltre». Serve
   quando una cosa si può ancora fare ma rende meno — che è diverso dal
   «non si può», e va detto in un modo diverso dal rosso. */
function stAvviso(html){
  return '<p class="stavviso">' + stIco("allarme") + '<span>' + html + '</span></p>';
}

/* ==================== COMPRARE UN BEAT DAL BANCO ====================
   La stessa cosa da tutte e due le parti: a La Sala il beat te lo mette sul
   tavolo la persona che l'ha fatto, allo Studio i tre del giro stanno al
   centro della sezione Beat. Prezzo, cartella e il punto di rapporto a chi
   te l'ha offerto sono identici, quindi è una funzione sola: scritta due
   volte, la seconda copia sarebbe invecchiata da sola. Chi chiama si
   ridisegna per conto suo — La Sala e lo Studio non hanno la stessa pagina. */
function prendiBeatDalBanco(b){
  const i = (G.market || []).indexOf(b);
  if(i < 0 || G.money < b.price) return false;
  G.money -= b.price;
  G.market.splice(i, 1);
  G.beats.push({n:b.n, q:b.q, gen:beatGen(b), seed:beatSeed(b)});
  const chi = (G.gente || []).find(x => x.beatOff === b.n);
  if(chi){ delete chi.beatOff; chi.pt += 1; }
  pushLog("Preso il beat «" + b.n + "» (q" + b.q + ") per " + b.price +
    " €. È nella tua cartella.", "");
  toast("«" + b.n + "» è tuo", "good", "♪", ["#4ADE80", "#166534"]);
  SFX.tap(); save(); renderGioco();
  return true;
}

/* ==================== BEAT — le tre schede sul banco ====================
   `studio_creazione_beat`: in mezzo alla schermata ci sono i beat del giro,
   uno accanto all'altro. Copertina, nome, genere, bpm e qualità, il tasto
   per ascoltarli con l'onda di fianco, e il prezzo grosso in fondo — rosso
   con il triangolo quando non ce li hai, che nel riferimento è «troppo
   caro» sul terzo.

   Sono `G.market`, gli stessi tre che `offriBeat()` mette sul tavolo e che
   allo Shop si comprano da una riga di elenco: qui hanno la faccia che
   hanno nella foto. */
function studioBeatScelto(){
  const l = G.market || [];
  const s = (G.studio || {}).compra;
  return l.find(b => beatSeed(b) === s) || l[0] || null;
}

/* La scheda è un `div` con `role="button"`, non un `<button>`: dentro ci sta
   il tasto tondo per ascoltare, e un bottone dentro a un bottone è HTML che
   non esiste — il browser lo sfascia, tira fuori quello interno e la scheda
   si spezza in due. Con `role` e `tabindex` la scheda resta una cosa sola,
   si prende col dito e si prende con la tastiera (vedi il `keydown` in fondo
   al file). */
function studioBeatScheda(b, on){
  const info = beatInfo(b);
  const caro = G.money < b.price;
  return '<div class="stbcard' + (on ? " on" : "") +
      '" role="button" tabindex="0" aria-pressed="' + (on ? "true" : "false") +
      '" data-bcard="' + beatSeed(b) + '">' +
    '<span class="stbcov">' + cover(beatSeed(b), "", "", "") + '</span>' +
    '<span class="stbnome">' + studioEsc(b.n) + '</span>' +
    '<span class="stbgen">' + studioEsc(genBeat(beatGen(b)).n.toLowerCase()) + '</span>' +
    '<span class="stbdati">' + info.bpm + ' bpm<em>|</em>q' + b.q + '</span>' +
    '<span class="stbriga">' +
      stPlay(' data-bplay="' + beatSeed(b) + '"', "Ascolta «" + b.n + "»") +
      stOnda(beatSeed(b) + b.q) +
    '</span>' +
    '<span class="stbprezzo">' +
      '<b class="' + (caro ? "caro" : "") + '">' + fmt(b.price) + ' €</b>' +
      (caro ? '<em>' + stIco("allarme") + 'troppo caro</em>' : "") +
    '</span>' +
  '</div>';
}

function studioBeatBanco(){
  const l = G.market || [];
  if(!l.length) return "";
  const scelto = studioBeatScelto();
  return '<div class="stbcards">' +
    l.map(b => studioBeatScheda(b, b === scelto)).join("") + '</div>';
}

function studioBeatSegna(seed){
  if(!G.studio) G.studio = {};
  G.studio.compra = seed;
  SFX.tap(); renderStudio();
}
function studioBeatAscolta(seed, btn){
  const b = (G.market || []).find(x => beatSeed(x) === seed) ||
            (G.beats || []).find(x => beatSeed(x) === seed);
  if(b && typeof beatSuona === "function") beatSuona(b, btn);
}
function studioBeatCompra(){
  const b = studioBeatScelto();
  if(!b) return;
  if(G.money < b.price){
    toast("Ti servono " + fmt(b.price) + " €, ne hai " + fmt(G.money),
      "bad", "!", ["#3A3F49", "#22262E"]);
    return;
  }
  if(prendiBeatDalBanco(b)) renderStudio();
}

/* ==================== CABINA — le take ====================
   `registrazione_pezzo`: in mezzo allo schermo ci sono le take, una sotto
   l'altra, con la barra a tacche e la migliore segnata «← buona». È la cosa
   che mancava di più: la cabina era un tasto solo, e registrare un pezzo era
   un tiro di dado che non vedevi.

   Adesso lo vedi, e resta lo stesso dado. `registra` tirava `rnd(-5,6)` e se
   lo teneva: la **prima take è quel tiro lì**, identico, gratis. Le altre le
   chiedi tu e le paghi in energia — che è quello che dice il riferimento,
   «UN'ALTRA TAKE · 12 energia». Chi non ci pensa registra come ha sempre
   registrato; chi ha energia da spendere può insistere. */
const STUDIO_TAKE_ENERGIA = 12;
const STUDIO_TAKE_MAX = 6;

/* ---- CHE COSA INCIDI ----
   Nel riferimento la colonna di destra non è un promemoria: le due strofe e
   i tre beat hanno il pallino, e si sceglie. Prima incideva sempre la
   migliore di ognuno (`bestBar()`, `bestBeat()`), e la strofa che tenevi da
   parte per un altro pezzo ti spariva sotto al naso alla prima
   registrazione. È la stessa strada del provino da mixare e del pezzo che
   esce: lo Studio sceglie, `actions.js` esegue.

   Le strofe non hanno un seme come i beat — sono `{q, txt, tema}` e basta —
   quindi gliene si mette uno la prima volta che servono. Le partite vecchie
   se lo prendono al primo giro senza accorgersi di niente. */
function studioBarraSeme(b){
  if(b.sd == null) b.sd = Math.floor(Math.random() * 1e9);
  return b.sd;
}
function studioStrofa(){
  const l = (G.bars || []).slice().sort((a, b) => b.q - a.q);
  const s = (G.studio || {}).strofa;
  return l.find(x => studioBarraSeme(x) === s) || l[0] || null;
}
function studioBeatSuCui(){
  const l = (G.beats || []).slice().sort((a, b) => b.q - a.q);
  const s = (G.studio || {}).incide;
  return l.find(x => beatSeed(x) === s) || l[0] || null;
}
function studioScegliStrofa(seed){
  studioDati().strofa = seed;
  SFX.tap(); save(); renderStudio();
}
function studioScegliIncide(seed){
  studioDati().incide = seed;
  SFX.tap(); save(); renderStudio();
}

/* A cosa sono attaccate le take: se cambi strofa o beat non sono più le tue
   e si buttano da sole. Senza questa riga tenevi la take buona di un pezzo e
   te la ritrovavi su un altro. */
function studioTakeChiave(){
  const b = studioStrofa(), bt = studioBeatSuCui();
  if(!b || !bt) return "";
  return (b.tema || "-") + "/" + b.q + "|" + bt.n + "/" + bt.q;
}

function studioTake(){
  const k = studioTakeChiave();
  if(!k) return null;
  const d = studioDati();
  if(!d.take || d.take.k !== k)
    d.take = {k, l:[Math.round(rnd(-5, 6))], s:0};
  return d.take;
}

/* La qualità di una take: quella del pezzo più il suo scarto. È la stessa
   riga che sta in `actions.js`, e deve restare la stessa — se qui si vede un
   numero e poi ne esce un altro, la schermata è una presa in giro. */
function studioTakeQ(d){
  const b = studioStrofa(), bt = studioBeatSuCui();
  if(!b || !bt) return 0;
  const base = songQ(b, bt) +
    (typeof studioAiutoFonico === "function" ? studioAiutoFonico() : 0) +
    (typeof studioAiutoFeat === "function" ? studioAiutoFeat() : 0);
  return clamp(Math.round(base + d), 5, 100);
}

function studioTakeMigliore(t){
  let best = 0;
  t.l.forEach((d, i) => { if(d > t.l[best]) best = i; });
  return best;
}

function studioTakeElenco(){
  const t = studioTake();
  if(!t) return "";
  const buona = studioTakeMigliore(t);
  return '<div class="sttake">' + t.l.map((d, i) => {
    const q = studioTakeQ(d);
    return '<div class="sttakeriga' + (t.s === i ? " on" : "") +
        '" role="button" tabindex="0" aria-pressed="' + (t.s === i ? "true" : "false") +
        '" data-take="' + i + '">' +
      stPlay(' data-tplay="' + i + '"', "Riascolta la take " + (i + 1)) +
      '<span class="sttaken">Take ' + (i + 1) + '</span>' +
      stTacche(q) +
      '<span class="sttakeq">q' + q + '</span>' +
      (i === buona && t.l.length > 1
        ? '<span class="sttakeb">← buona</span>'
        : '<span class="sttakeb"></span>') +
    '</div>';
  }).join("") + '</div>';
}

function studioTakeScegli(i){
  const t = studioTake();
  if(!t || !t.l[i] && t.l[i] !== 0) return;
  t.s = i;
  SFX.tap(); save(); renderStudio();
}

function studioTakeAncora(){
  const t = studioTake();
  if(!t) return;
  if(t.l.length >= STUDIO_TAKE_MAX){
    toast("Sei alla " + STUDIO_TAKE_MAX + "ª take: quella buona ce l'hai già.",
      "bad", "!", ["#3A3F49", "#22262E"]);
    return;
  }
  if(G.energy < STUDIO_TAKE_ENERGIA){
    toast("Ti serve energia: " + STUDIO_TAKE_ENERGIA + ", ne hai " + Math.round(G.energy),
      "bad", "!", ["#3A3F49", "#22262E"]);
    return;
  }
  G.energy -= STUDIO_TAKE_ENERGIA;
  t.l.push(Math.round(rnd(-5, 6)));
  /* la take nuova si sceglie da sola solo se è meglio di quella che avevi:
     se no ti cancellava sotto al dito la take buona per una peggiore */
  if(t.l[t.l.length - 1] > t.l[t.s]) t.s = t.l.length - 1;
  SFX.rec ? SFX.rec() : SFX.tap();
  save(); renderStudio(); renderGioco();
}

/* Quella che si tiene, e le altre si buttano. La chiama `registra` al posto
   del suo `rnd(-5,6)`: una riga sola, con la guardia `typeof` come già fa
   per il fonico e per il feat. */
function studioTakePresa(){
  const d = G.studio && G.studio.take;
  if(!d || !d.l || !d.l.length) return rnd(-5, 6);
  const v = d.l[d.s] != null ? d.l[d.s] : d.l[0];
  delete G.studio.take;
  return v;
}

/* ==================== TESTO — il tema si sceglie ====================
   `scrittura_barre`: a sinistra c'è «TEMA · Scegli da dove partire», e sono
   righe con il pallino. Il gioco i temi ce li ha da sempre (`TEMI`, in
   `writer.js`) ma te ne tirava uno a caso e te lo chiamava «tema della
   settimana». Da qui lo scegli, e il foglio si apre su quello: è il tema che
   `analizza()` conta poi parola per parola, quindi sceglierlo è una mossa
   vera e non una preferenza. Chi non sceglie niente resta con il tiro a
   caso, come prima. */
function studioTemaScelto(){
  const t = (G.studio || {}).tema;
  return (typeof TEMI !== "undefined" && TEMI.find(x => x.t === t)) || null;
}
function studioScegliTema(t){
  const d = studioDati();
  d.tema = (d.tema === t) ? null : t;
  SFX.tap(); save(); renderStudio();
}

/* Quanto ti viene bene oggi: è `qVeloce()`, cioè la qualità con cui
   uscirebbe una strofa buttata giù adesso — benessere, casa, turni fatti e
   scrittura, tutti insieme. Nel riferimento è la barra «ISPIRAZIONE 65/100»,
   e questo è il numero che ci sta sotto per davvero. */
function studioIspirazione(){
  return typeof qVeloce === "function" ? Math.round(qVeloce()) : 0;
}
function studioIspirazioneFrase(v){
  return v >= 70 ? "Oggi le parole vengono da sole."
    : v >= 50 ? "Le parole giuste arrivano se le aspetti."
    : v >= 32 ? "Si scrive, ma bisogna tirarle fuori."
    : "Il foglio resta bianco più del solito.";
}

/* ==================== IL BANCO — i tre cursori ====================
   `studio_mixaggio`: voce, bassi, aria, con le tacche, i due capi scritti
   sotto e una frase per ognuno che dice cosa hai fatto. In fondo il
   riquadro del risultato: «→ q78 · carattere: SECCO».

   Partono tutti e tre al centro, e **al centro il mix vale quello che valeva
   prima**: `mixGain()` non cambia di un punto se non li tocchi. Da lì si
   guadagna fino a tre punti se quello che hai fatto sta in piedi, e se ne
   perdono fino a tre se hai spinto tutto insieme — che al banco è la cosa
   più facile da fare e la prima che si sente. */
const STUDIO_CURSORI = [
  {k:"voce",  ic:"mic",   n:"Voce",  sx:"indietro", dx:"avanti",
   note:["Voce indietro: il beat si mangia le barre.",
         "Voce un passo dietro al beat.",
         "Voce al centro.",
         "Voce avanti: si capiscono le barre.",
         "Voce avanti: si capiscono le barre, il beat resta indietro."]},
  {k:"bassi", ic:"casse", n:"Bassi", sx:"meno", dx:"più",
   note:["Bassi tolti: suona magro.",
         "Bassi trattenuti.",
         "Bassi al centro.",
         "Bassi spinti.",
         "Bassi al massimo: in cuffia rimbomba."]},
  {k:"aria",  ic:"polso", n:"Aria",  sx:"chiusa", dx:"aperta",
   note:["Niente aria: suona addosso.",
         "Poca aria: suona vicino, suona piccolo.",
         "Aria al centro.",
         "Aria aperta: il pezzo respira.",
         "Tutta aria: il pezzo si allontana."]}
];

/* I caratteri: si leggono dall'alto e vince il primo che torna. L'ordine è
   quello che conta — «secco» e «pesante» sono tutti e due voce/bassi avanti
   con poca aria, ma se hai spinto la voce quello che senti è il secco. */
const STUDIO_CARATTERI = [
  {t:(v,b,a) => v >= 3 && a <= 1,            n:"SECCO",     q:3},
  {t:(v,b,a) => b >= 3 && a <= 1,            n:"PESANTE",   q:2},
  {t:(v,b,a) => a >= 3 && b >= 3,            n:"GONFIO",    q:-2},
  {t:(v,b,a) => a >= 3 && v <= 1,            n:"LONTANO",   q:-3},
  {t:(v,b,a) => a >= 3,                      n:"APERTO",    q:1},
  {t:(v,b,a) => v <= 1 && b >= 3,            n:"IMPASTATO", q:-3},
  {t:(v,b,a) => v >= 3 && b <= 1,            n:"SOTTILE",   q:0},
  {t:(v,b,a) => v <= 1,                      n:"INDIETRO",  q:-2},
  {t:(v,b,a) => b <= 1 && a <= 1,            n:"SPOGLIO",   q:-1},
  {t:() => true,                             n:"PULITO",    q:0}
];

function studioBanco(){
  const d = studioDati();
  if(!d.banco) d.banco = {voce:2, bassi:2, aria:2};
  return d.banco;
}
function studioBancoMuovi(k, v){
  const b = studioBanco();
  if(!(k in b)) return;
  b[k] = clamp(Math.round(Number(v) || 0), 0, 4);
  save(); renderStudio();
}
function studioBancoCarattere(){
  const b = studioBanco();
  return STUDIO_CARATTERI.find(c => c.t(b.voce, b.bassi, b.aria)) ||
    STUDIO_CARATTERI[STUDIO_CARATTERI.length - 1];
}
/* Quello che `mixGain()` somma. Tutto al centro fa zero: chi non tocca
   niente mixa come si mixava prima che questi cursori esistessero. */
function studioBancoGuadagno(){
  return studioBancoCarattere().q;
}

function studioBancoCursori(){
  const b = studioBanco();
  return '<div class="stcursi">' + STUDIO_CURSORI.map(c => stCursore({
    k:c.k, ic:c.ic, n:c.n, v:b[c.k], max:4,
    sx:c.sx, dx:c.dx, nota:c.note[b[c.k]]
  })).join("") + '</div>';
}

/* «ASCOLTA»: il provino com'è adesso, con i cursori dove li hai messi. Non è
   una finta — `beatSuona` suona più pulito e più aperto quanto più il pezzo
   è buono, quindi il mix che stai facendo si sente davvero. */
function studioBancoAscolta(btn){
  const s = typeof studioDaMixare === "function" ? studioDaMixare() : null;
  const q = s ? clamp(s.q + (typeof mixGain === "function" ? mixGain() : 0), 5, 100) : 40;
  if(typeof beatSuona !== "function") return;
  beatSuona({n:(s && s.t) || "provino", q, gen:(s && s.gen) || mioGenere(),
    seed:(s && s.seed) || 7}, btn);
}

/* ==================== FUORI — il quando ====================
   `studio_uscita_pezzo`: a sinistra tre righe — stanotte, venerdì, tienilo
   nel cassetto — e sono tutte e tre vere.

     stanotte   esce adesso, ed è quello che il gioco faceva già
     venerdì    il pezzo si mette in coda e esce da solo quando arriva il
                giorno. L'hype in più non è un regalo: lo paghi aspettando,
                e nel frattempo non hai niente fuori
     cassetto   resta tuo e non esce. Sparisce dalla coda — anche da quella
                della plancia — e torna quando lo ritiri dalla cassaforte */
const STUDIO_QUANDO = [
  {id:"subito",  n:"stanotte",           d:"subito"},
  {id:"venerdi", n:"venerdì",       d:""},
  {id:"cassetto", n:"tienilo nel cassetto", d:""}
];

const STUDIO_VENERDI = 5;                     /* lunedì è 1, come in agenda.js */
const STUDIO_VENERDI_HYPE = 4;

function studioOggiAssoluto(){
  const sett = typeof totalWeeks === "function" ? totalWeeks() : (G.week || 1);
  return (sett - 1) * 7 + (G.day || 1);
}
function studioGiorniAVenerdi(){
  return (STUDIO_VENERDI - (G.day || 1) + 7) % 7;
}
function studioQuando(){
  const d = studioDati();
  if(!d.quando) d.quando = "subito";
  return d.quando;
}
function studioQuandoScegli(id){
  studioDati().quando = id;
  SFX.tap(); save(); renderStudio();
}

/* «fra 1 g», «oggi», «fra 4 g»: la riga di destra della seconda scelta. */
function studioVenerdiTesto(){
  const g = studioGiorniAVenerdi();
  return g === 0 ? "è oggi" : g === 1 ? "fra 1 g" : "fra " + g + " g";
}

/* La stima degli stream della prima settimana. Non è un numero inventato per
   riempire la riga: è `songWeekly()` di `sim.js` con l'età a zero, presa ai
   due capi dei suoi tiri di dado. Quello che leggi qui è quello che succede
   davvero lunedì. */
function studioStreamStima(s){
  if(!s) return null;
  const q = s.mixed ? s.q : clamp(s.q - 8, 5, 100);
  const push = G.contract ? G.contract.push : 1;
  const scoperta = Math.pow(Math.max(0, q - 26) / 74, 2.6) * (35 + G.hype * 13) * push;
  const fan = G.fans * (0.5 + q / 170);
  return {
    min: Math.round((fan * 0.26 + scoperta) * 0.8),
    max: Math.round((fan * 0.5 + scoperta) * 1.25)
  };
}

/* I pezzi pronti che non sono in cassaforte: sono questi quelli che escono. */
function studioPronti(){
  return ready().filter(s => !s.tenuto);
}
function studioTenuti(){
  return (G.songs || []).filter(s => !s.released && s.tenuto);
}
function studioInCoda(){
  return (G.songs || []).filter(s => !s.released && s.esce != null);
}

/* Mandarlo fuori: una sola porta per tutte e tre le scelte, perché è una
   scelta sola. `subito` passa dall'azione di sempre — lo Studio decide, le
   azioni fanno — le altre due sono roba dello Studio e restano qui. */
function studioMandaFuori(){
  const s = typeof studioDaPubblicare === "function" ? studioDaPubblicare() : null;
  if(!s) return;
  const q = studioQuando();

  if(q === "subito"){
    if(typeof studioAzione === "function") studioAzione("pubblica");
    return;
  }

  if(q === "cassetto"){
    s.tenuto = true;
    delete s.esce;
    pushLog("«" + s.t + "» messo da parte. Non esce: resta in cassaforte.", "");
    toast("«" + s.t + "» in cassaforte", "good", "◆", TINTA_SUONO);
    SFX.tap(); save(); renderStudio(); renderGioco();
    return;
  }

  const g = studioGiorniAVenerdi();
  s.esce = studioOggiAssoluto() + g;
  delete s.tenuto;
  pushLog("«" + s.t + "» è in coda per venerdì" +
    (g ? " — " + studioVenerdiTesto() + "." : ", cioè stanotte."), "");
  toast("«" + s.t + "» esce venerdì", "good", "▶", TINTA_SUONO);
  SFX.tap(); save(); renderStudio(); renderGioco();
}

/* Toglierlo dalla coda o dalla cassaforte: la seconda metà della scelta, se
   no una cosa messa da parte non torna più. */
function studioRiprendi(seed){
  const s = (G.songs || []).find(x => x.seed === seed);
  if(!s) return;
  delete s.tenuto;
  delete s.esce;
  studioDati().esce = seed;
  studioDati().quando = "subito";
  SFX.tap(); save(); renderStudio(); renderGioco();
}

/* Il giorno in cui il pezzo in coda esce da solo. La chiama `avanzaGiorno()`
   di `sim.js`, subito dopo che la settimana ha girato: così `totalWeeks()` è
   già quella nuova e il pezzo risulta uscito nella settimana giusta. È la
   stessa cosa che fa l'azione `pubblica`, più l'hype dell'attesa. */
function studioUscitePronte(){
  const oggi = studioOggiAssoluto();
  for(const s of (G.songs || [])){
    if(s.released || s.esce == null) continue;
    if(oggi < s.esce) continue;
    delete s.esce;
    if(s.tenuto) continue;                    /* messo in cassaforte nel frattempo */
    if(!s.mixed) s.q = clamp(s.q - 8, 5, 100);
    s.released = true;
    s.week = typeof totalWeeks === "function" ? totalWeeks() : (G.week || 1);
    const cap = typeof hypeCap === "function" ? hypeCap() : 100;
    G.hype = clamp(G.hype + 6 + s.q * 0.12 + STUDIO_VENERDI_HYPE, 0, cap);
    pushLog("<b>«" + s.t + "» è uscito</b>, di venerdì come avevi deciso" +
      (s.mixed ? "." : ", ma non era mixato: qualità " + s.q + "."), "good");
  }
}

/* ==================== I COMANDI ====================
   Lo Studio ha già il suo ascoltatore delegato su `#studio` (studio.js) e
   quello continua a fare il suo lavoro. Questo è il secondo, per le cose
   nuove: sta qui e non là perché sono queste le righe che il file nuovo si
   porta dietro, e perché due ascoltatori sullo stesso contenitore non si
   danno fastidio — chi non riconosce niente lascia passare. */
if($("studio")){
  $("studio").addEventListener("click", e => {
    const bp = e.target.closest("[data-bplay]");
    if(bp){ studioBeatAscolta(Number(bp.dataset.bplay), bp); return; }
    const bc = e.target.closest("[data-bcard]");
    if(bc){ studioBeatSegna(Number(bc.dataset.bcard)); return; }
    /* `data-stcompra` e non `data-compra`: quel nome ce l'ha già il
       guardaroba (`negozio.js`), e soprattutto ce l'ha `eventi-v2.js`, che
       ascolta i click **su tutto il documento** e a ogni `[data-compra]`
       spara `after_clothes_action`. Chiamare così il tasto dello Studio
       voleva dire che comprare un beat raccontava al motore degli eventi che
       ti eri comprato una felpa — in silenzio, senza che si rompesse niente
       di visibile. I nomi degli attributi qui dentro sono globali quanto le
       variabili: si guardano prima. */
    if(e.target.closest("[data-stcompra]")){ studioBeatCompra(); return; }

    const tp = e.target.closest("[data-tplay]");
    if(tp){
      const t = studioTake(), bt = studioBeatSuCui();
      if(t && bt) beatSuona({n:bt.n, q:studioTakeQ(t.l[Number(tp.dataset.tplay)] || 0),
        gen:beatGen(bt), seed:beatSeed(bt)}, tp);
      return;
    }
    const tk = e.target.closest("[data-take]");
    if(tk){ studioTakeScegli(Number(tk.dataset.take)); return; }
    if(e.target.closest("[data-ancora]")){ studioTakeAncora(); return; }

    const asc = e.target.closest("[data-ascolta]");
    if(asc){ studioBancoAscolta(asc); return; }

    const qd = e.target.closest("[data-quando]");
    if(qd){ studioQuandoScegli(qd.dataset.quando); return; }
    if(e.target.closest("[data-manda]")){ studioMandaFuori(); return; }
    const rp = e.target.closest("[data-riprendi]");
    if(rp){ studioRiprendi(Number(rp.dataset.riprendi)); return; }
    const tm = e.target.closest("[data-tema]");
    if(tm){ studioScegliTema(tm.dataset.tema); return; }
    const sf = e.target.closest("[data-strofa]");
    if(sf){ studioScegliStrofa(Number(sf.dataset.strofa)); return; }
    const ic = e.target.closest("[data-incide]");
    if(ic){ studioScegliIncide(Number(ic.dataset.incide)); return; }
    /* «cambia copertina» dalla schermata di Fuori: porta alla sezione della
       copertina **con quel pezzo già scelto**, se no ci arrivi e devi
       ritrovartelo in una lista */
    const vs = e.target.closest("[data-vesti]");
    if(vs){
      studioDati().cover = Number(vs.dataset.vesti);
      STUDIO_SEZ = "cover";
      SFX.tap(); renderStudio();
      return;
    }
  });

  /* i cursori del banco: `input` e non `click`, se no si muovono solo quando
     lasci il dito e la frase sotto arriva in ritardo su quello che vedi */
  $("studio").addEventListener("input", e => {
    const c = e.target.closest("[data-curs]");
    if(c) studioBancoMuovi(c.dataset.curs, c.value);
  });

  /* Le schede dei beat e le righe delle take sono `div` con `role="button"`
     (dentro ci sta il tasto di ascolto, e i bottoni non si annidano): la
     tastiera gliela si rimette a mano, se no si prendono solo col dito.
     Invio e barra spaziatrice, come farebbe un bottone vero. */
  $("studio").addEventListener("keydown", e => {
    if(e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
    const t = e.target.closest('[role="button"]');
    if(!t || !$("studio").contains(t)) return;
    e.preventDefault();
    t.click();
  });
}
