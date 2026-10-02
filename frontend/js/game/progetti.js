/* Mixtape e album — CARLO, «Studio (16/09/2026)»: «fai in modo che si possano
   creare mixtape e album».

   Fino a qui un pezzo usciva da solo, uno alla volta, e la cassaforte (il
   «tienilo da parte» di Fuori) era una promessa: «quando ne avrai altri tre,
   è un disco». Il disco adesso c'è. Si fa nello Studio, nella linguetta
   **Disco**, con i pezzi che hai già:

   - i pezzi **incisi e non usciti** — sul banco o in cassaforte — escono
     tutti insieme, il giorno del disco;
   - i **singoli già fuori** possono entrarci (pochi: due nel mixtape, quattro
     nell'album), e quando il disco esce **tornano a girare** — la stessa
     curva rilanciata delle parti 2 (`rilancio`, seguiti.js).

   Le due forme non sono la stessa cosa con un numero diverso:

   - il **mixtape** è corto e gratis, porta meno hype, tiene viva la gente fra
     un disco e l'altro;
   - l'**album** è lungo e costa (mastering e distribuzione), ma quando esce
     muove l'hype, porta gente nuova subito, e spinge tutte le sue tracce per
     settimane (`progettoSpinta`, letta da `songWeekly()` di sim.js).

   Quanto vale un disco lo dice il **voto**: la media delle qualità, meno i
   riempitivi (le tracce sotto q40 si sentono). E la **coesione**: se più di
   metà delle tracce parla della stessa cosa (il tema scelto al Testo), il
   disco ha una faccia e rende di più.

   Come un pezzo, il disco può uscire stanotte o venerdì (+hype). In coda le
   sue tracce stanno ferme: non escono da sole e non si ritirano dalla
   cassaforte — si ritira il disco intero, da qui.

   Lo stato: `G.progetti` sono i dischi (usciti o in coda), `G.studio.disco`
   la bozza che stai mettendo in fila. Ogni traccia di un disco porta
   `s.progetto`, l'id del disco: così un pezzo sta in un disco solo. */
"use strict";

const PROGETTO_TIPI = {
  mixtape:{n:"Mixtape", il:"il mixtape", nel:"nel mixtape", un:"un mixtape", min:4, max:8, singoli:2, costo:0,
    hype:6, hypeQ:0.10, spinta:1.15, rilancio:0.3, fanQuota:0.01, fanTraccia:0.2,
    d:"corto e gratis: tiene viva la gente fra un disco e l'altro"},
  album:{n:"Album", il:"l'album", nel:"nell'album", un:"un album", min:8, max:16, singoli:4, costo:350,
    hype:12, hypeQ:0.20, spinta:1.35, rilancio:0.5, fanQuota:0.03, fanTraccia:0.6,
    d:"il disco vero: costa, ma muove tutto per settimane"}
};
const PROGETTO_RIEMPITIVO = 40;       /* sotto questa qualità una traccia si sente che è lì per fare numero */
const PROGETTO_RIEMPITIVO_MALUS = 3;  /* punti di voto che toglie ognuna */
const PROGETTO_COESIONE = 0.6;        /* la quota di tracce sullo stesso tema perché il disco «abbia una faccia» */
const PROGETTO_COESIONE_HYPE = 4;
const PROGETTO_COESIONE_SPINTA = 0.1;
const PROGETTO_SPINTA_SETTIMANE = 8;  /* quanto dura la spinta del disco sulle sue tracce */
const PROGETTO_TITOLO_MAX = 26;       /* lo stesso tetto dei titoli dei pezzi */
const PROGETTO_GRIGIO = ["#3A3F49", "#22262E"];  /* il «no» dello Studio (studioAzione) */

/* ==================== LO STATO ==================== */
function progetti(){
  if(!Array.isArray(G.progetti)) G.progetti = [];
  return G.progetti;
}
function progettoTipo(id){ return PROGETTO_TIPI[id] || PROGETTO_TIPI.mixtape; }
function progettoDi(s){
  if(!s || s.progetto == null) return null;
  return progetti().find(p => p.id === s.progetto) || null;
}
function progettoPezzo(seed){
  return (G.songs || []).find(x => x.seed === seed) || null;
}
function progettoInCoda(){
  return progetti().find(p => !p.released) || null;
}
/* la bozza: tipo, titolo, le tracce in ordine (i seed), quando */
function discoBozza(){
  if(!G.studio) G.studio = {};
  const d = G.studio.disco;
  if(!d || typeof d !== "object") G.studio.disco = {tipo:"mixtape", t:"", tracce:[], quando:"subito"};
  const b = G.studio.disco;
  if(!Array.isArray(b.tracce)) b.tracce = [];
  if(!PROGETTO_TIPI[b.tipo]) b.tipo = "mixtape";
  if(b.quando !== "venerdi") b.quando = "subito";
  if(b.seed == null) b.seed = Math.floor(Math.random() * 1e9);
  if(!b.sugg) b.sugg = typeof title === "function" ? title() : "Senza titolo";
  return b;
}

/* ==================== LE TRACCE ==================== */
/* Chi può entrare in un disco: un pezzo col suo seed, che non sta già in un
   altro disco. Inciso e non uscito, o un singolo già fuori. */
function discoPuoEntrare(s){
  return !!(s && s.seed != null && s.progetto == null);
}
function discoTracce(){
  const b = discoBozza();
  /* una traccia sparita (un salvataggio a metà) o finita in un altro disco
     si lascia cadere, senza dirlo: non c'è più niente da dire */
  const lista = b.tracce.map(progettoPezzo).filter(discoPuoEntrare);
  b.tracce = lista.map(s => s.seed);
  return lista;
}
function discoDisponibili(){
  const dentro = new Set(discoBozza().tracce);
  const liberi = (G.songs || []).filter(s => discoPuoEntrare(s) && !dentro.has(s.seed));
  return {
    incisi: liberi.filter(s => !s.released).slice().reverse(),
    singoli: liberi.filter(s => s.released).sort((a, b) => (b.week || 0) - (a.week || 0))
  };
}
function discoSingoli(tracce){ return tracce.filter(s => s.released).length; }

function discoAggiungi(seed){
  const b = discoBozza(), s = progettoPezzo(seed);
  if(!discoPuoEntrare(s) || b.tracce.includes(seed)) return false;
  const t = progettoTipo(b.tipo), tracce = discoTracce();
  if(tracce.length >= t.max){
    if(typeof toast === "function") toast(t.un.charAt(0).toUpperCase() + t.un.slice(1) + " sta in <b>" + t.max + " tracce</b>", "bad", "!", PROGETTO_GRIGIO);
    return false;
  }
  if(s.released && discoSingoli(tracce) >= t.singoli){
    if(typeof toast === "function")
      toast(t.nel.charAt(0).toUpperCase() + t.nel.slice(1) + " entrano al massimo <b>" + t.singoli + " singoli</b> già fuori", "bad", "!", PROGETTO_GRIGIO);
    return false;
  }
  b.tracce.push(seed);
  return true;
}
function discoTogli(seed){
  const b = discoBozza();
  b.tracce = b.tracce.filter(x => x !== seed);
}
function discoSposta(seed, verso){
  const b = discoBozza(), i = b.tracce.indexOf(seed), j = i + verso;
  if(i < 0 || j < 0 || j >= b.tracce.length) return;
  b.tracce[i] = b.tracce[j]; b.tracce[j] = seed;
}
function discoScegliTipo(id){
  if(!PROGETTO_TIPI[id]) return;
  discoBozza().tipo = id;
}

/* ==================== QUANTO VALE ==================== */
/* La qualità con cui la traccia esce: un provino non mixato perde 8 punti,
   come quando esce da solo. Un singolo già fuori è quello che è. */
function discoQTraccia(s){
  return s.released || s.mixed ? s.q : clamp(s.q - 8, 5, 100);
}
function discoVoto(tracce){
  if(!tracce.length) return {voto:0, media:0, riempitivi:0};
  const qs = tracce.map(discoQTraccia);
  const media = qs.reduce((a, q) => a + q, 0) / qs.length;
  const riempitivi = qs.filter(q => q < PROGETTO_RIEMPITIVO).length;
  return {voto:clamp(Math.round(media - riempitivi * PROGETTO_RIEMPITIVO_MALUS), 5, 100),
    media:Math.round(media), riempitivi};
}
/* Il tema che torna di più, e quante tracce ci stanno sopra. I pezzi senza
   tema (salvataggi vecchi, strofe veloci) contano nel totale: un disco con
   metà tracce senza faccia non ha una faccia. */
function discoCoesione(tracce){
  const conta = {};
  for(const s of tracce) if(s.tema) conta[s.tema] = (conta[s.tema] || 0) + 1;
  let tema = "", n = 0;
  for(const k of Object.keys(conta)) if(conta[k] > n){ tema = k; n = conta[k]; }
  const quota = tracce.length ? n / tracce.length : 0;
  return {tema, n, quota, ok:tracce.length > 0 && quota >= PROGETTO_COESIONE};
}
/* la gente dei feat famosi sulle tracce nuove: lo stesso conto di un pezzo
   che esce da solo (featHypeUscita, actions.js) */
function discoFeatHype(tracce){
  if(typeof featHypeUscita !== "function") return 0;
  return tracce.filter(s => !s.released).reduce((n, s) => n + featHypeUscita(s), 0);
}
function discoHype(tipo, voto, coesione, venerdi, feat){
  const t = progettoTipo(tipo);
  return Math.round(t.hype + voto * t.hypeQ + (coesione.ok ? PROGETTO_COESIONE_HYPE : 0) + (feat || 0) +
    (venerdi ? (typeof STUDIO_VENERDI_HYPE !== "undefined" ? STUDIO_VENERDI_HYPE : 4) : 0));
}
/* la gente che arriva il giorno del disco, oltre a quella degli ascolti */
function discoFanSubito(tipo, voto, n){
  const t = progettoTipo(tipo);
  const dif = typeof difFan === "function" ? difFan() : 1;
  return Math.round((G.fans * t.fanQuota * (voto / 70) + voto * n * t.fanTraccia) * dif);
}
/* Quanto costa chiuderlo adesso. Un disco ritirato dalla coda il mastering
   l'ha già pagato: richiuso nella stessa forma non si ripaga. */
function discoCosto(b){
  b = b || discoBozza();
  return b.pagato === b.tipo ? 0 : progettoTipo(b.tipo).costo;
}
/* Perché non si può ancora: null se si può. */
function discoManca(){
  if(progettoInCoda()) return "c'è già un disco in coda";
  const b = discoBozza(), t = progettoTipo(b.tipo), tracce = discoTracce();
  if(tracce.length < t.min)
    return "servono almeno " + t.min + " tracce" + (tracce.length ? " (ne hai " + tracce.length + ")" : "");
  if(tracce.length > t.max) return "al massimo " + t.max + " tracce";
  if(discoSingoli(tracce) > t.singoli) return "al massimo " + t.singoli + " singoli già fuori";
  if(!tracce.some(s => !s.released)) return "ci vuole almeno un pezzo nuovo";
  const costo = discoCosto(b);
  if(costo && G.money < costo) return "servono " + costo + " € per il mastering";
  return null;
}

/* ==================== FUORI ==================== */
function discoOggi(){
  return typeof studioOggiAssoluto === "function" ? studioOggiAssoluto() : 0;
}
/* Il disco si chiude: dalla bozza nasce il disco vero, paga il mastering e le
   tracce gli vengono legate. Stanotte esce subito; venerdì aspetta in coda,
   con le tracce nuove ferme in cassaforte. */
function discoChiudi(){
  if(discoManca()) return null;
  const b = discoBozza(), t = progettoTipo(b.tipo), tracce = discoTracce();
  const titolo = (b.t || "").trim().slice(0, PROGETTO_TITOLO_MAX) || b.sugg;
  const p = {id:"d" + Date.now().toString(36) + Math.floor(Math.random() * 1e4),
    tipo:b.tipo, t:titolo, seed:b.seed, img:b.img || "", tracce:tracce.map(s => s.seed),
    released:false, week:0, venerdi:b.quando === "venerdi"};
  G.money -= discoCosto(b);
  for(const s of tracce){
    s.progetto = p.id;
    if(!s.released){
      /* in coda per conto suo, o in automatico: adesso esce col disco */
      delete s.esce; delete s.esceAuto;
      s.tenuto = true;
      if(typeof studioSvuotaBanco === "function") studioSvuotaBanco(s);
    }
  }
  progetti().push(p);
  G.studio.disco = null;
  if(p.venerdi){
    const g = typeof studioGiorniAVenerdi === "function" ? studioGiorniAVenerdi() : 0;
    p.esce = discoOggi() + g;
    pushLog(t.il.charAt(0).toUpperCase() + t.il.slice(1) + " <b>«" + p.t + "»</b> è in coda per venerdì" +
      (g && typeof studioVenerdiTesto === "function" ? " — " + studioVenerdiTesto() + "." : ", cioè stanotte."), "");
    if(typeof toast === "function") toast("«" + p.t + "» esce venerdì", "good", "▶",
      typeof TINTA_SUONO !== "undefined" ? TINTA_SUONO : undefined);
    /* oggi è venerdì: resta in coda per oggi ed esce stanotte, quando la
       giornata gira — come un pezzo (studioUscitePronte) */
  } else {
    progettoEsce(p);
  }
  return p;
}

/* Il disco esce: le tracce nuove escono tutte nello stesso giorno, i singoli
   tornano a girare, e l'hype e la gente arrivano adesso. */
function progettoEsce(p){
  if(!p || p.released) return;
  const t = progettoTipo(p.tipo);
  const tracce = p.tracce.map(progettoPezzo).filter(Boolean);
  const settimana = typeof totalWeeks === "function" ? totalWeeks() : (G.week || 1);
  const v = discoVoto(tracce), c = discoCoesione(tracce);
  const feat = discoFeatHype(tracce);
  const singoli = tracce.filter(s => s.released);
  let nuove = 0;
  /* prima le tracce nuove: una parte 2 che esce col disco rilancia il suo
     primo (seguiti.js), e il disco deve vedere quel rilancio, non coprirlo */
  for(const s of tracce){
    s.progetto = p.id;
    delete s.tenuto; delete s.esce; delete s.esceAuto;
    if(s.released) continue;
    if(!s.mixed) s.q = clamp(s.q - 8, 5, 100);
    s.released = true; s.week = settimana;
    if(typeof anteprimeAllUscita === "function") anteprimeAllUscita(s);
    if(typeof seguitoUscita === "function") seguitoUscita(s);
    nuove++;
  }
  /* poi i singoli: tornano a girare, e vince la spinta più forte fra quella
     che gli resta di un rilancio di prima (remastered, parte 2) e quella del
     disco — mettere un pezzo in un disco non lo fa mai girare di meno */
  for(const s of singoli){
    let resto = 0;
    if(s.rilancio != null && s.rilancioForza){
      const da = settimana - s.rilancio;
      resto = s.rilancioForza * (da <= 1 ? 1 : Math.exp(-da / 7.5));
    }
    s.rilancio = settimana;
    s.rilancioForza = Math.max(t.rilancio, resto);
  }
  p.released = true; p.week = settimana; delete p.esce;
  p.voto = v.voto; p.coeso = c.ok; p.tema = c.ok ? c.tema : "";
  const hype = discoHype(p.tipo, v.voto, c, p.venerdi, feat);
  const fan = discoFanSubito(p.tipo, v.voto, tracce.length);
  G.hype = clamp(G.hype + hype, 0, typeof hypeCap === "function" ? hypeCap() : 100);
  G.fans += fan;
  pushLog("<b>È uscito " + t.il + " «" + p.t + "»</b>: " +
    tracce.length + " tracce" + (nuove < tracce.length ? ", " + (tracce.length - nuove) + (tracce.length - nuove === 1 ? " già nota" : " già note") : "") +
    ", voto " + v.voto + (c.ok ? ", tutto su «" + c.tema + "»" : "") +
    ". +" + hype + " hype" + (fan ? ", " + fmt(fan) + " persone nuove che ti seguono" : "") + ".", "big");
  if(typeof toast === "function")
    toast("«" + p.t + "» è fuori", "good", "◆", typeof TINTA_SUONO !== "undefined" ? TINTA_SUONO : undefined);
}

/* La chiama `avanzaGiorno()` (sim.js), accanto alle uscite dei pezzi. */
function progettiUscitePronti(){
  const oggi = discoOggi();
  for(const p of progetti()) if(!p.released && p.esce != null && oggi >= p.esce) progettoEsce(p);
}

/* Ritirare il disco dalla coda: torna bozza, le tracce nuove restano in
   cassaforte (da lì si rimettono sul banco), il mastering non si rimborsa. */
function discoRitira(){
  const p = progettoInCoda();
  if(!p) return;
  for(const seed of p.tracce){
    const s = progettoPezzo(seed);
    if(s && s.progetto === p.id) delete s.progetto;
  }
  G.progetti = progetti().filter(x => x !== p);
  G.studio.disco = {tipo:p.tipo, t:p.t, tracce:p.tracce.slice(), quando:"venerdi", seed:p.seed,
    pagato:progettoTipo(p.tipo).costo ? p.tipo : null};
  pushLog("Il disco «" + p.t + "» è tornato in studio." +
    (progettoTipo(p.tipo).costo ? " Il mastering è pagato: resta pagato." : ""), "");
}

/* ==================== NELLA SIM ==================== */
/* Le tracce di un disco uscito girano di più per qualche settimana: la gente
   lo ascolta dall'inizio alla fine, non un pezzo alla volta. La legge
   `songWeekly()`, come la spinta della promo. */
function progettoSpinta(s){
  const p = progettoDi(s);
  if(!p || !p.released || typeof totalWeeks !== "function") return 1;
  const da = totalWeeks() - p.week;
  if(da < 0) return 1;
  const k = progettoTipo(p.tipo).spinta + (p.coeso ? PROGETTO_COESIONE_SPINTA : 0);
  return 1 + (k - 1) * Math.exp(-da / PROGETTO_SPINTA_SETTIMANE);
}

/* ==================== NELLA DISCOGRAFIA ==================== */
function progettoEsc(t){
  return typeof studioEsc === "function" ? studioEsc(t)
    : String(t == null ? "" : t).replace(/[&<>"]/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"}[c]));
}
/* sotto al titolo del pezzo: da quale disco viene */
function progettoRigaPezzo(s){
  const p = progettoDi(s);
  if(!p || !p.released) return "";
  return " · dal" + (p.tipo === "album" ? "l'album" : " mixtape") + " «" + progettoEsc(p.t) + "»";
}
/* i dischi usciti, sopra all'elenco dei pezzi */
function progettiDiscografia(){
  const usciti = progetti().filter(p => p.released).sort((a, b) => (b.week || 0) - (a.week || 0));
  if(!usciti.length) return "";
  const artista = (window.ARTIST || {}).name || "";
  return '<div class="pdischi">' + usciti.map(p => {
    const tracce = p.tracce.map(progettoPezzo).filter(Boolean);
    const ascolti = tracce.reduce((n, s) => n + (s.streams || 0), 0);
    return '<div class="pdisco">' +
      '<span class="pcov">' + (typeof cover === "function" ? cover(p.seed, p.t, artista, p.img) : "") + '</span>' +
      '<span class="pnm"><i>' + progettoTipo(p.tipo).n + '</i><b>' + progettoEsc(p.t) + '</b>' +
        '<span>' + tracce.length + ' tracce · voto ' + (p.voto || 0) + ' · ' + short(ascolti) + ' ascolti</span></span>' +
      '</div>';
  }).join("") + '</div>';
}

/* ==================== NELLO STUDIO: LA LINGUETTA «DISCO» ==================== */
function discoRigaTraccia(s, i, n){
  /* niente <b> qui: dentro a .stchi i grassetti sono blocchi e vanno a capo */
  const stato = s.released ? "singolo, già fuori" : (s.mixed ? "mixato" : '<em class="pgrezzo">grezzo, −8</em>');
  const tasto = (attr, testo, etichetta, spento) =>
    '<button type="button" class="ptasto"' + attr + (spento ? " disabled" : "") +
    ' aria-label="' + etichetta + '">' + testo + '</button>';
  return '<div class="ptraccia' + (s.released ? " singolo" : "") + '">' +
    '<span class="pnum">' + (i + 1) + '</span>' +
    '<span class="stmini">' + stCover(s) + '</span>' +
    '<span class="stchi"><b>' + progettoEsc(s.t) + '</b><span>q' + discoQTraccia(s) + ' · ' + stato +
      (s.tema ? ' · ' + progettoEsc(s.tema) : '') + '</span></span>' +
    tasto(' data-dsu="' + s.seed + '"', "↑", "Sposta su", i === 0) +
    tasto(' data-dgiu="' + s.seed + '"', "↓", "Sposta giù", i === n - 1) +
    tasto(' data-dtogli="' + s.seed + '"', "✕", "Togli dal disco") +
    '</div>';
}

function studioSezDisco(){
  const coda = progettoInCoda();
  const b = discoBozza(), t = progettoTipo(b.tipo);
  const fuori = progetti().filter(p => p.released);

  const sx = stPan("Che disco",
      Object.keys(PROGETTO_TIPI).map(id => {
        const x = PROGETTO_TIPI[id];
        return stScelta({attr:coda ? "" : ' data-dtipo="' + id + '"', on:(coda ? coda.tipo : b.tipo) === id,
          n:x.n, d:"da " + x.min + " a " + x.max + " tracce",
          v:!x.costo ? "gratis" : !coda && b.pagato === id ? "pagato" : x.costo + " €"});
      }).join("") +
      '<p class="stpiede">' + progettoTipo(coda ? coda.tipo : b.tipo).d + '.</p>') +
    (coda ? "" : stPan("Quando", [
        stScelta({attr:' data-dquando="subito"', on:b.quando === "subito", n:"Stanotte", d:"esce appena lo chiudi"}),
        stScelta({attr:' data-dquando="venerdi"', on:b.quando === "venerdi", n:"Venerdì",
          d:typeof studioVenerdiTesto === "function" ? studioVenerdiTesto() : "", v:"+hype"})
      ].join("")));

  let mid;
  if(coda){
    const tracce = coda.tracce.map(progettoPezzo).filter(Boolean);
    mid = stPan("",
      '<div class="stfianco">' +
        '<span class="stcopertina">' + stCover(coda) + '</span>' +
        '<div>' +
          stTitolo(coda.t, progettoTipo(coda.tipo).n + ' · ' + tracce.length + ' tracce · <span class="oro">in coda per venerdì</span>') +
          '<p class="stnota">Le tracce nuove sono ferme in cassaforte fino all\'uscita. ' +
            'Se lo ritiri torna qui da finire' +
            (progettoTipo(coda.tipo).costo ? ', e il mastering resta pagato' : '') + '.</p>' +
          stAzioni(stSecondo(' data-dritira="1"', "Ritiralo dalla coda", "rinnova")) +
        '</div>' +
      '</div>' +
      '<div class="ptracce">' + tracce.map((s, i) =>
        '<div class="ptraccia muta"><span class="pnum">' + (i + 1) + '</span>' +
        '<span class="stmini">' + stCover(s) + '</span>' +
        '<span class="stchi"><b>' + progettoEsc(s.t) + '</b><span>q' + discoQTraccia(s) + '</span></span></div>').join("") +
      '</div>');
  } else {
    const tracce = discoTracce();
    const v = discoVoto(tracce), c = discoCoesione(tracce), manca = discoManca();
    const venerdi = b.quando === "venerdi";
    const anteprima = {seed:b.seed, t:(b.t || "").trim() || b.sugg, img:b.img || ""};
    mid = stPan("",
      '<div class="stfianco">' +
        '<span class="stcopertina">' + stCover(anteprima) + '</span>' +
        '<div>' +
          '<label class="ptitolo"><span>Il titolo</span>' +
            '<input type="text" data-dtitolo="1" maxlength="' + PROGETTO_TITOLO_MAX + '" autocomplete="off"' +
            ' value="' + progettoEsc(b.t || "") + '" placeholder="' + progettoEsc(b.sugg) + '"></label>' +
          /* lo stesso link dei tasti copertina di Fuori: in .stazioni sarebbe
             appiccicato in fondo, come il tasto d'oro */
          '<p class="stazlink"><button type="button" class="stlink" data-dcopertina="1">' +
            stIco("rinnova") + 'generane un\'altra</button></p>' +
          '<p class="stnota">Le tracce si scelgono dall\'elenco dei pezzi («metti»). ' +
            'I pezzi nuovi escono tutti il giorno del disco; i singoli già fuori ' +
            '(al massimo ' + t.singoli + ') <b>tornano a girare</b>.</p>' +
        '</div>' +
      '</div>' +
      (tracce.length
        ? '<div class="ptracce">' + tracce.map((s, i) => discoRigaTraccia(s, i, tracce.length)).join("") + '</div>'
        : studioVuoto("Ancora nessuna traccia: si scelgono dall'elenco dei pezzi, con «metti».")) +
      (tracce.length ? stEsito(
        '<div class="stnumeri">' +
          '<div><b>Voto</b>' +
            '<span class="stvoce">Media ' + stNum("q" + v.media) + '</span>' +
            (v.riempitivi ? '<span class="stvoce">Riempitivi ' + stNum("−" + v.riempitivi * PROGETTO_RIEMPITIVO_MALUS) + '</span>' : '') +
            stFreccia() + ' ' + stOro(v.voto) + '</div>' +
          '<div><b>Uscita</b>' +
            '<span class="stvoce">Tracce ' + stNum(tracce.length + "/" + t.min + "–" + t.max) + '</span>' +
            '<span class="stvoce">Coesione ' + stNum(c.tema ? c.n + " su «" + progettoEsc(c.tema) + "»" : "nessuna") +
              (c.ok ? " ✓" : "") + '</span>' +
            '<span class="stvoce">Hype ' + stNum("+" + discoHype(b.tipo, v.voto, c, venerdi, discoFeatHype(tracce))) + '</span>' +
            '<span class="stvoce">Fan subito ' + stNum("+" + fmt(discoFanSubito(b.tipo, v.voto, tracce.length))) + '</span>' +
          '</div>' +
        '</div>') : "") +
      (manca ? '<p class="stnota pmanca">Non ancora: ' + progettoEsc(manca) + '.</p>' : "") +
      stAzioni(stPrimo(' data-dfuori="1"',
        (venerdi ? "Mettilo in coda per venerdì" : "Fallo uscire") + (discoCosto(b) ? " · " + discoCosto(b) + " €" : ""),
        "invio", !!manca)));
  }

  /* a destra: i pezzi che possono entrare, e i dischi già fatti */
  let dx = "";
  if(!coda){
    const disp = discoDisponibili();
    const riga = s => stScelta({attr:' data-dagg="' + s.seed + '"', senzaPallino:true,
      mini:stCover(s), n:s.t,
      d:"q" + discoQTraccia(s) + (s.released ? " · fuori" : s.tenuto ? " · in cassaforte" : s.mixed ? " · mixato" : " · grezzo"),
      v:"metti", vCls:"calmo"});
    dx = stSotto("Incisi, non usciti") +
      (disp.incisi.length ? disp.incisi.map(riga).join("")
        : studioVuoto("Niente: i pezzi nuovi si incidono in <b>Cabina</b>.")) +
      (disp.singoli.length ? stSotto("Singoli già fuori") + disp.singoli.map(riga).join("") : "");
  }
  if(fuori.length)
    dx += stSotto("I tuoi dischi") + fuori.slice().reverse().map(p => stScelta({
      mini:stCover(p), n:p.t, senzaPallino:true,
      d:progettoTipo(p.tipo).n + " · voto " + (p.voto || 0)})).join("");
  return {sx, mid, dx:dx ? stPan("", dx, "cartella") : ""};
}

/* ==================== I COMANDI ==================== */
if(typeof $ === "function" && $("studio")){
  $("studio").addEventListener("click", e => {
    const el = sel => e.target.closest(sel);
    let x, fatto = true;
    if((x = el("[data-dtipo]"))) discoScegliTipo(x.dataset.dtipo);
    else if((x = el("[data-dquando]"))) discoBozza().quando = x.dataset.dquando;
    else if((x = el("[data-dagg]"))) discoAggiungi(Number(x.dataset.dagg));
    else if((x = el("[data-dtogli]"))) discoTogli(Number(x.dataset.dtogli));
    else if((x = el("[data-dsu]"))) discoSposta(Number(x.dataset.dsu), -1);
    else if((x = el("[data-dgiu]"))) discoSposta(Number(x.dataset.dgiu), 1);
    else if(el("[data-dcopertina]")) discoBozza().seed = Math.floor(Math.random() * 1e9);
    else if(el("[data-dritira]")) discoRitira();
    else if(el("[data-dfuori]")){
      const manca = discoManca();
      if(manca){ toast("Non ancora: " + manca, "bad", "!", PROGETTO_GRIGIO); return; }
      discoChiudi();
      if(typeof renderGioco === "function") renderGioco();
    }
    else fatto = false;
    if(!fatto) return;
    if(typeof SFX === "object" && SFX.tap) SFX.tap();
    save(); renderStudio();
  });
  /* il titolo si scrive senza ridisegnare: ridisegnando a ogni lettera si
     perdeva il cursore */
  $("studio").addEventListener("input", e => {
    const t = e.target.closest("[data-dtitolo]");
    if(t) discoBozza().t = t.value.slice(0, PROGETTO_TITOLO_MAX);
  });
  $("studio").addEventListener("change", e => {
    if(e.target.closest("[data-dtitolo]")) save();
  });
}
