/* Sputa — la seconda app del telefono per postare (15/09/2026).

   LaFamegram e' il finto Instagram: foto, promo dei pezzi, storie. Questa e'
   il finto X, e si chiama come si chiama la cosa che ci fai — sputare barre.
   Solo testo, 140 caratteri, niente foto: il posto dove il giro ciarla, i
   rivali sparano e tu rispondi.

   Cosa c'e' nel feed:
   - le **barre tue** (`G.sputaMiei`), che restano sul dispositivo come i
     post di LaFamegram scritti a mano;
   - le **barre dei rivali** (`G.rivals`, rivals.js): ognuno ne sputa una o
     due a settimana, tirate a sorte ma **col dado fisso** — il seme e' il
     rivale piu' la settimana — cosi' riaprendo l'app trovi le stesse, e
     quelle di un giorno che deve ancora venire non ci sono ancora. Parlano
     del pezzo appena uscito se ce l'hanno (`hot`), dell'etichetta se ce
     l'hanno (`deal`), della loro citta', e di te quando il tuo nome gira
     abbastanza da farsi notare.

   Cosa da':
   - la **prima barra del giorno** fa girare il nome: +1 hype, e basta. Le
     altre del giorno non danno niente — la gente scorre oltre — quindi non
     c'e' un giro da sfruttare: e' la stessa idea della promo di LaFamegram
     (`promoDailyMult`), tenuta piu' semplice;
   - il **fuoco** sotto alle barre degli altri e' un tuo gesto e resta
     segnato (`G.sputaFuoco`), ma non muove numeri: si legge, non si paga;
   - **Rispondi** ti mette «@Nome» nel foglio: la risposta e' una barra tua
     come le altre, col nome davanti. Non costa energia: e' il telefono,
     non lo studio. */
"use strict";

/* la bolla con le tre righe: barre corte, niente foto */
HIC.sputa = '<path d="M4 3.5h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9.6L4 21zM7 7v1.8h10V7zm0 3.4v1.8h10v-1.8zm0 3.4v1.8h6v-1.8z"/>';

const SPUTA_MAX = 140;          /* caratteri per barra */
const SPUTA_MIEI_MAX = 40;      /* quante tue se ne tengono */
const SPUTA_HYPE_PRIMA = 1;     /* la prima barra del giorno */

/* ---- quello che sputano i rivali ----
   `{n}` e' il rivale, `{ult}` il suo ultimo pezzo, `{citta}` la sua citta',
   `{tu}` sei tu. Ogni voce e' una barra intera: corta, in prima persona,
   con la boria di chi ha un pezzo che gira. */
const SPUTA_BARRE = {
  nuovo:[
    "«{ult}» fuori ovunque. Chi non l'ha ancora sentita non è del giro.",
    "{ult}. Tre giorni e già la cantano sotto casa mia.",
    "Mi scrivono in cento per «{ult}». Rispondo a nessuno, sto già sul prossimo.",
    "«{ult}» l'ho scritta in una notte. Voi in un anno non tirate fuori una barra così.",
    "Il numero di «{ult}» non ve lo dico. Guardatelo da soli, fa male.",
    "«{ult}» in macchina, finestrini giù, {citta} sa già le parole."
  ],
  flex:[
    "Non faccio feat. Faccio classifica.",
    "Studio alle tre di notte, letto alle sette, palco alle dieci. Il resto è chiacchiera.",
    "C'è chi posta e c'è chi pubblica. Io pubblico.",
    "Mi chiedono un consiglio. Il consiglio è: non chiedere consigli.",
    "Quando ero nessuno non scrivevate. Adesso non leggo.",
    "Un beat, una penna, zero scuse.",
    "Il quartiere lo porto nel nome, non nella bio.",
    "Se il tuo pezzo lo capisce tua madre non è un pezzo, è una lettera.",
    "Vi sento parlare. Non vi sento nei club.",
    "Ho detto no a più soldi di quanti ne abbiate visti."
  ],
  citta:[
    "{citta} non aspetta nessuno. Nemmeno me. Per questo corro.",
    "Da {citta} con niente in tasca e tutto nella testa.",
    "Hanno detto che {citta} non fa rap. {citta} fa me.",
    "Stasera {citta}. Se non ci sei non ci sei."
  ],
  deal:[
    "Ho firmato. Chi dice che mi sono venduto non ha mai letto un contratto.",
    "L'etichetta mette i soldi, io metto le barre. Il nome sulla copertina è il mio.",
    "Un anno fa mandavo demo. Oggi le ricevo."
  ],
  tu:[
    "Sento parlare di {tu}. Sentiremo se dura.",
    "{tu} sale, dicono. Da dove sono io si vede piccolo.",
    "Tutti a dire {tu}, {tu}. Un pezzo non fa una carriera.",
    "{tu}, se leggi: il posto in classifica lo tieni caldo per me.",
    "Ho ascoltato {tu}. Una volta. Mi è bastata."
  ]
};

/* un dado con il seme in mano: stessi numeri a ogni chiamata con lo stesso
   seme, cosi' le barre dei rivali non cambiano ogni volta che riapri l'app */
function sputaDado(seme){
  let s = (seme >>> 0) || 1;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function sputaEsc(t){
  return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function sputaNomeTuo(){
  const art = window.ARTIST || {};
  return (art.name || "Tu").trim() || "Tu";
}
function sputaMiei(){
  if(!Array.isArray(G.sputaMiei)) G.sputaMiei = [];
  return G.sputaMiei;
}
function sputaFuoco(){
  if(!G.sputaFuoco || typeof G.sputaFuoco !== "object") G.sputaFuoco = {};
  return G.sputaFuoco;
}
const sputaSettimana = () => typeof totalWeeks === "function" ? totalWeeks() : Number(G.week || 1);

/* «oggi», «ieri», «3 giorni fa», «2 settimane fa»: quando e' stata sputata
   una barra, rispetto a adesso — la settimana e il giorno stanno sulla barra */
function sputaQuando(sett, giorno){
  const ds = sputaSettimana() - sett;
  if(ds <= 0){
    const dg = Number(G.day || 1) - giorno;
    return dg <= 0 ? "oggi" : dg === 1 ? "ieri" : dg + " giorni fa";
  }
  return ds === 1 ? "la settimana scorsa" : ds + " settimane fa";
}

/* ---- il tuo nome gira? Allora i rivali ti nominano ---- */
function sputaTiNominano(){
  /* senza un nome vero non c'e' niente da nominare: «Ho ascoltato Tu» no */
  if(!((window.ARTIST || {}).name || "").trim()) return false;
  const chart = (G.best && G.best.chart) || 99;
  return Number(G.hype || 0) >= 40 || chart <= 20 || Number(G.fans || 0) >= 5000;
}

/* il numero fisso di un rivale: dal nome, non da `r.seed`, perche' quello
   rivals.js lo rifa' a ogni pezzo nuovo (e' il seme della copertina) e le
   barre si rifacevano da capo, settimana scorsa compresa, col fuoco rimasto
   su id spariti (15/09/2026) */
function sputaSemeRivale(r){
  const s = String(r.n || "");
  let h = 2166136261;
  for(let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/* le barre di un rivale in una settimana: una o due, decise dal dado fisso */
function sputaBarreRivale(r, sett){
  const dado = sputaDado(sputaSemeRivale(r) + sett * 7919);
  const quante = dado() < .45 ? 2 : 1;
  const out = [];
  const nome = sputaNomeTuo();
  const citta = r.city || "qui";
  for(let i = 0; i < quante; i++){
    const giorno = 1 + Math.floor(dado() * 7);
    /* di che parla: il pezzo nuovo prima di tutto, poi il resto a sorte */
    let pool;
    const x = dado();
    if(r.hot > 0 && i === 0) pool = "nuovo";
    else if(sputaTiNominano() && x < .22) pool = "tu";
    else if(r.deal && x < .4) pool = "deal";
    else if(x < .62) pool = "citta";
    else pool = "flex";
    const frasi = SPUTA_BARRE[pool];
    const t = frasi[Math.floor(dado() * frasi.length)]
      .replace(/\{ult\}/g, r.ult || "il pezzo nuovo")
      .replace(/\{citta\}/g, citta)
      .replace(/\{tu\}/g, nome);
    /* il fuoco cresce con la gente che ha: un rivale da un milione ne
       prende a migliaia, uno da trecento qualche decina */
    const fuoco = Math.round(Math.max(8, (Number(r.p) || 300) / 45) * (0.6 + dado() * 0.9) *
      (r.hot > 0 ? 1.6 : 1));
    out.push({id:"r" + sputaSemeRivale(r) + ":" + sett + ":" + i, n:r.n, r, t,
      sett, giorno, fuoco, aTe:pool === "tu"});
  }
  return out;
}

/* il feed: le tue barre e quelle dei rivali di questa settimana e della
   scorsa, per ordine di tempo — ma di questa settimana solo i giorni gia'
   passati, se no un rivale ti risponde giovedi' a una cosa di domenica */
function sputaFeed(){
  const sett = sputaSettimana(), oggi = Number(G.day || 1);
  const mie = sputaMiei().map(p => Object.assign({mia:true}, p));
  const altre = [];
  (G.rivals || []).forEach(r => {
    sputaBarreRivale(r, sett).forEach(b => { if(b.giorno <= oggi) altre.push(b); });
    if(sett > 1) sputaBarreRivale(r, sett - 1).forEach(b => altre.push(b));
  });
  /* dal piu' recente: settimana, poi giorno; a pari data le tue prima */
  return mie.concat(altre).sort((a, b) =>
    (b.sett - a.sett) || (b.giorno - a.giorno) || ((b.mia ? 1 : 0) - (a.mia ? 1 : 0)));
}

/* ---- sputare una barra ---- */
function sputaScrivi(testo){
  const t = spoglia(String(testo || "")).replace(/\s+/g, " ").trim().slice(0, SPUTA_MAX);
  if(!t) return false;
  const prima = typeof adfOggi === "function" ? adfOggi("sputa") === 0 : false;
  const fuoco = Math.round(4 + Number(G.hype || 0) * 0.5 + Number(G.fans || 0) / 900 + rnd(0, 9));
  sputaMiei().unshift({id:"m" + Date.now(), n:sputaNomeTuo(), t, sett:sputaSettimana(),
    giorno:Number(G.day || 1), fuoco, mia:true});
  if(sputaMiei().length > SPUTA_MIEI_MAX) sputaMiei().length = SPUTA_MIEI_MAX;
  if(typeof adfSegnaOggi === "function") adfSegnaOggi("sputa");
  if(prima){
    /* fino al tetto della fase, e mai sotto a dove stavi: un +1 che
       ti riportava al tetto se eri sopra era un meno */
    const tetto = typeof hypeCap === "function" ? hypeCap() : 100;
    const sale = G.hype < tetto;
    if(sale) G.hype = Math.min(tetto, Number(G.hype || 0) + SPUTA_HYPE_PRIMA);
    if(typeof toast === "function")
      toast(sale
        ? "<b>Prima barra del giorno.</b> Il nome gira: +" + SPUTA_HYPE_PRIMA + " hype."
        : "<b>Prima barra del giorno.</b> Il nome gira, ma qui sei già al tetto: serve il passo dopo.",
        "good", "🔥", ["#F97316", "#7C2D12"]);
  }
  save();
  /* la fascia con l'hype e' della plancia, non della schermata di gioco:
     senza renderHub il fumetto diceva +1 e il numero in alto restava fermo */
  if(typeof renderHub === "function") renderHub();
  if(typeof renderGioco === "function") renderGioco();
  return true;
}
function sputaFuocoTocca(id){
  const f = sputaFuoco();
  if(f[id]) delete f[id]; else f[id] = 1;
  if(typeof hubTap === "function") hubTap();
  save(); renderTelefono();
}

/* ---- la schermata ---- */
function sputaBarraHTML(p){
  const acceso = !p.mia && !!sputaFuoco()[p.id];
  const testa = p.mia
    ? '<span class="tspav tspav-tu">' + hsvg("persona") + '</span>'
    : '<span class="tspav">' + (p.r && typeof faccia === "function" ? faccia(p.r, 26) : hsvg("persona")) + '</span>';
  return '<article class="tspost' + (p.mia ? " mia" : "") + (p.aTe ? " ate" : "") + '">' +
    '<div class="tsphead">' + testa + '<b>' + sputaEsc(p.n) + '</b>' +
      '<span class="tspw">' + sputaQuando(p.sett, p.giorno) + '</span></div>' +
    '<div class="tspcap">' + sputaEsc(p.t) + '</div>' +
    '<div class="tspfoot">' +
      (p.mia
        ? '<span class="tspfuoco on">' + hsvg("hype") + '<b>' + Math.round(p.fuoco || 0) + '</b></span>'
        : '<button type="button" class="tspfuoco' + (acceso ? " on" : "") + '" data-sputa-fuoco="' +
            sputaEsc(p.id) + '" aria-pressed="' + (acceso ? "true" : "false") + '">' +
            hsvg("hype") + '<b>' + (Math.round(p.fuoco || 0) + (acceso ? 1 : 0)) + '</b></button>' +
          '<button type="button" class="tsprisp" data-sputa-rispondi="' + sputaEsc(p.n) + '">Rispondi</button>') +
    '</div>' +
  '</article>';
}
function schermataSputa(){
  const oggi = typeof adfOggi === "function" ? adfOggi("sputa") : 0;
  const alTetto = Number(G.hype || 0) >= (typeof hypeCap === "function" ? hypeCap() : 100);
  const feed = sputaFeed();
  return '<div class="tsputa">' +
    '<div class="tspscrivi">' +
      '<textarea id="tsp-testo" maxlength="' + SPUTA_MAX + '" placeholder="Sputa una barra."></textarea>' +
      '<div class="tspriga">' +
        '<span class="tspconto"><i id="tsp-conto">0</i>/' + SPUTA_MAX + '</span>' +
        '<button type="button" class="tbtn tspbtn" id="tsp-pubblica">Sputa</button>' +
      '</div>' +
      '<div class="tnote tspnota">' +
        (oggi === 0
          ? (alTetto
              ? 'La <b>prima barra del giorno</b> fa girare il nome — ma sei già al tetto dell\'hype di questa fase: per salire serve il passo dopo.'
              : 'La <b>prima barra del giorno</b> fa girare il nome: +' + SPUTA_HYPE_PRIMA + ' hype. Le altre le legge chi passa.')
          : 'Oggi hai già sputato <b>' + oggi + (oggi === 1 ? ' barra' : ' barre') + '</b>: la gente scorre oltre.') +
      '</div>' +
    '</div>' +
    (feed.length
      ? '<div class="tsp">' + feed.map(sputaBarraHTML).join("") + '</div>'
      : '<div class="tempty">Silenzio. Il giro non ha ancora niente da dire — comincia tu.</div>') +
  '</div>';
}

/* ---- l'app sul telefono ---- */
/* Sta nella griglia, dopo le otto della foto, con la piastrella nera e il
   glifo dorato come Notifiche: la foto non la prevedeva, e si vede uguale. */
if(typeof HUB_APP !== "undefined" && !HUB_APP.some(a => a.id === "sputa"))
  HUB_APP.push({id:"sputa", n:"Sputa", ic:"sputa", k:"#F97316"});
if(typeof HUB_APP_VECCHIO !== "undefined" && !HUB_APP_VECCHIO.some(a => a.id === "sputa"))
  HUB_APP_VECCHIO.splice(3, 0, {id:"sputa", n:"Sputa", ic:"sputa", k:"#F97316",
    sotto:g => { const n = (g.sputaMiei || []).length; return n + (n === 1 ? " barra tua" : " barre tue"); },
    vai:() => telVaiApp("sputa")});

/* i tocchi: il fuoco, «Rispondi», il tasto e il contatore dei caratteri */
if($("hb-tel")){
  $("hb-tel").addEventListener("click", ev => {
    const f = ev.target.closest("[data-sputa-fuoco]");
    if(f){ sputaFuocoTocca(f.dataset.sputaFuoco); return; }
    const r = ev.target.closest("[data-sputa-rispondi]");
    if(r){
      const ta = $("tsp-testo");
      if(!ta) return;
      if(typeof hubTap === "function") hubTap();
      const a = "@" + r.dataset.sputaRispondi.replace(/\s+/g, "") + " ";
      if(ta.value.indexOf(a) !== 0) ta.value = a + ta.value.replace(/^@\S+\s*/, "");
      ta.focus();
      const conto = $("tsp-conto"); if(conto) conto.textContent = ta.value.length;
      /* il foglio sta in cima: se eri in fondo al feed ti ci porta */
      ta.scrollIntoView({block:"nearest", behavior:"smooth"});
      return;
    }
    if(ev.target.closest("#tsp-pubblica")){
      const ta = $("tsp-testo");
      if(ta && sputaScrivi(ta.value)){
        if(typeof hubTap === "function") hubTap();
        renderTelefono();
      }
      return;
    }
  });
  $("hb-tel").addEventListener("input", ev => {
    if(ev.target && ev.target.id === "tsp-testo"){
      const conto = $("tsp-conto");
      if(conto) conto.textContent = ev.target.value.length;
    }
  });
}
