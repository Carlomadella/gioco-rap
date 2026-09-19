/* I LUOGHI CON LA FOTO — Casa, la Palestra, il Live Club, lo «stacca la
   spina», e la foto sotto alla Piazza.

   Il punto 5 di CARLO («aggiungi le foto di background dei posti senza HTML,
   poi ricrea la schermata identica alle foto con elementi HTML») era chiuso
   per lo Studio e aperto per tutti gli altri: le sue foto di riferimento
   stavano in `media/photo/schermate_luoghi/` e nessuna pagina le caricava.
   Casa, Palestra e Live Club erano una finestra con due risposte, «stacca la
   spina» e la palestra finivano nella scenetta disegnata di `scene-art.js`,
   e la Piazza — che una pagina ce l'aveva — aveva un cielo disegnato.

   Adesso ognuno di quei posti è una pagina come lo Studio: la foto riempie
   lo schermo, la fascia in alto dice dove sei e cosa hai, e sopra alla foto
   ci sta quello che nella foto di riferimento ci sta davvero. Il telaio è
   quello di `studio.css` — stessi colori, stessi pannelli, stessi tasti,
   perché sono le stesse foto fatte dalla stessa mano — e le regole del §2 di
   `documentazione/pagine-azioni/README.md` valgono anche qui.

   Cosa NON fa questo file: non rifà l'economia. Le mosse sono quelle di
   `actions.js` e partono da `avviaAzioneDiretta()`, come dalla mappa; qui si
   sceglie e si guarda com'è andata. Quando una di quelle mosse finiva nella
   scena a pagina piena (`mostraScena`, ui.js) adesso finisce qui, sulla sua
   foto: la scenetta disegnata era il ripiego, la foto è la scelta.

   È un file nuovo accanto a quelli che c'erano, come chiede il punto sui
   file già presenti: `hub.js` cambia solo i tre `vai` dei cartelli,
   `menu-sistema.js` e `tempo-controlli.js` imparano che la pagina esiste. */
"use strict";

const LUOGHI_FOTO_DIR = "media/photo/schermate_luoghi/";
/* Una riga per posto: la foto, dove si ritaglia quando lo schermo ha un'altra
   proporzione (`pos`), e le tre voci della fascia in alto — il nome del
   posto in oro, quello della stanza in bianco, il sottotitolo in corsivo.
   Le foto «con elementi HTML» di Casa e Palestra sono pulite (gli elementi
   nella foto non ci sono: sono quelle che si usano come fondale); quella
   della Casa «definitiva» ha le targhette stampate dentro e resta il
   riferimento, non il fondale. */
const LUOGHI_FOTO = {
  casa:     {f:"schermate_luoghi_con_elementi_HTML/casa_di_provincia.png", pos:"center 62%",
             k:"Casa", bar:"La cucina", d:"casa tua, com'è adesso"},
  /* lo «stacca la spina» ha due foto del divano, una di giorno e una di
     sera: si prende quella dell'ora in cui ci si siede (`giorno` fino alle
     18, `GAME_TIME.band()`), che è la sola ragione per cui esistono tutte e
     due */
  stacca:   {f:"schermate luoghi_senza_HTML/casa_divano_sera.png",
             giorno:"schermate luoghi_senza_HTML/casa_divano_giorno.png", pos:"center 55%",
             k:"Casa", bar:"Stacca la spina", d:"prenditi una pausa"},
  palestra: {f:"schermate_luoghi_con_elementi_HTML/palestra.png", pos:"center 55%",
             k:"Palestra", bar:"La sala pesi", d:"il fisico che si vede sotto le luci"},
  live:     {f:"schermate luoghi_senza_HTML/live_club.png", pos:"center 42%",
             k:"Live Club", bar:"Stasera", d:"palco piccolo, la gente ti vede in faccia"},
  /* la Piazza ha già la sua pagina (piazza.js): qui c'è solo la foto da
     metterle sotto, vedi in fondo */
  piazza:   {f:"schermate luoghi_senza_HTML/piazza_freestyle.png", pos:"center 40%"}
};

/* Le mosse che hanno una pagina con la foto: quando partono — da qui, dai
   cartelli, dalle card di «Eventi e attività di oggi», dall'agenda — l'esito
   si legge sulla foto del loro posto, non più nella scenetta disegnata. */
const LUOGO_MOSSE = {stacca:"stacca", palestra_pesi:"palestra", palestra_cardio:"palestra", live:"live"};

/* Lo stato della pagina aperta. `scelta` è la riga accesa (Pesi o Cardio, il
   palco o la piazza); `esito` è la mossa appena fatta, con quello che ha
   detto; `prima` è la fotografia dei numeri un attimo prima di premere, per
   scrivere «+12» invece di rileggere il diario. `da` dice da dove si è
   arrivati, perché «Continua» torni lì. */
let LUOGO = null;

/* ==================== ICONE ====================
   Quelle dello Studio (`stIco`, studio.js) più le poche che mancavano: il
   letto e il divano della Casa, il manubrio, il palco. Stesso viewBox 20×20,
   stessa mano. */
const LF_ICONE = {
  letto:"M2 15V6h2v5h6V7h6a2 2 0 0 1 2 2v6h-2v-2H4v2zm3-7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z",
  divano:"M4 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2a2 2 0 0 1 2 2v4h-1v2h-2v-2H5v2H3v-2H2v-4a2 2 0 0 1 2-2zm2 0h8V6H6zM4 10v2h12v-2z",
  manubrio:"M2 8h2V6h2v8H4v-2H2zm14 0h2v4h-2v2h-2V6h2zm-8 1h4v2H8z",
  palco:"M10 2a3 3 0 0 1 3 3v4a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3zM5 9h2a3 3 0 0 0 6 0h2a5 5 0 0 1-4 4.9V16h3v2H6v-2h3v-2.1A5 5 0 0 1 5 9z",
  cuore:"M10 17s-7-4.2-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 17 8c0 4.8-7 9-7 9z",
  gente:"M7 9.5a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6zM1.5 16c0-2.9 2.5-4.6 5.5-4.6s5.5 1.7 5.5 4.6zm12-6.4a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6zm.2 1.8c2.4.2 4.3 1.6 4.3 3.8v.8h-3c.1-2-.4-3.5-1.3-4.6z"
};
function lfIco(nome){
  const d = LF_ICONE[nome];
  if(d) return '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="' + d + '"/></svg>';
  return typeof stIco === "function" ? stIco(nome) : "";
}
const lfEsc = s => typeof studioEsc === "function" ? studioEsc(s) : String(s == null ? "" : s);

/* ==================== APRI E CHIUDI ==================== */
function apriLuogo(id, opz){
  if(typeof G === "undefined" || !G || !LUOGHI_FOTO[id] || id === "piazza") return;
  LUOGO = {id:id, da:(opz && opz.da) || "mappa", scelta:null, esito:null, prima:null};
  if(id === "palestra") LUOGO.scelta = "palestra_pesi";
  /* al Live Club la riga accesa è il palco se hai un pezzo fuori; se no la
     piazza, che è l'unica cosa che puoi fare davvero */
  if(id === "live") LUOGO.scelta = hubPronta("live").ok ? "live" : "free";
  $("luogo").classList.add("on");
  renderLuogo();
}
/* Si esce dal bottone globale «Torna alla mappa» (menu-sistema.js la chiama)
   e da «Continua» quando la pagina è arrivata da una mossa. */
function chiudiLuogo(){
  $("luogo").classList.remove("on");
  LUOGO = null;
}

/* ==================== IL DISEGNO ==================== */
function renderLuogo(){
  const root = $("luogo");
  if(!root || !root.classList.contains("on") || !LUOGO) return;
  const L = LUOGHI_FOTO[LUOGO.id];
  root.dataset.luogo = LUOGO.id;

  const scena = $("lf-scena");
  const fascia = typeof GAME_TIME !== "undefined" && GAME_TIME.band ? GAME_TIME.band() : "sera";
  const foto = L.giorno && (fascia === "mattina" || fascia === "pomeriggio") ? L.giorno : L.f;
  scena.style.backgroundImage = 'url("' + LUOGHI_FOTO_DIR + foto + '")';
  scena.style.backgroundPosition = L.pos;

  $("lf-k").textContent = L.k;
  $("lf-nome").innerHTML = lfEsc(L.bar) +
    '<i><span class="stpunto"></span>' + lfEsc(L.d) + '</i>';
  $("lf-risorse").innerHTML = typeof studioRisorse === "function" ? studioRisorse() : "";

  const parti =
    LUOGO.id === "casa"     ? lfCasa() :
    LUOGO.id === "stacca"   ? lfStacca() :
    LUOGO.id === "palestra" ? lfPalestra() :
    lfLive();
  const wrap = $("lf-wrap");
  /* la Casa non ha colonne: ha le porte sopra alla foto, e basta */
  wrap.className = "lfwrap" + (parti.porte ? " lfporte" : "");
  wrap.innerHTML = parti.porte ||
    '<div class="lfcol lfsx">' + (parti.sx || "") + '</div>' +
    '<div class="lfcol lfmid">' + (parti.mid || "") + '</div>' +
    '<div class="lfcol lfdx">' + (parti.dx || "") + '</div>';

  /* la riga in basso: l'ultima cosa successa, come nello Studio e nei
     riferimenti. Anche nella Casa: è l'unica riga di testo della pagina, e
     dice cosa hai appena fatto prima di scegliere la porta. */
  const banda = $("lf-banda");
  const ultima = ((G.log || [])[0] || {}).t || "";
  banda.hidden = !ultima;
  banda.innerHTML = '<span class="stbolla">' + lfIco("bolla") + '</span>' +
    '<span class="stdetto">' + ultima + '</span>';
}

/* Un pannello: lo stesso mattone dello Studio (`stPan`), con un ripiego se
   studio.js non fosse caricato. */
function lfPan(titolo, corpo, icona, piede){
  if(typeof stPan === "function") return stPan(titolo, corpo, icona, piede);
  return '<section class="stpan">' + (titolo ? '<h3 class="stpank">' + lfEsc(titolo) + '</h3>' : "") +
    corpo + (piede ? '<p class="stpiede">' + lfEsc(piede) + '</p>' : "") + '</section>';
}
/* Una riga «etichetta … valore» nei pannelli laterali. */
function lfRiga(n, v, cls){
  return '<div class="lfriga' + (cls ? " " + cls : "") + '"><span>' + n + '</span><b>' + v + '</b></div>';
}
/* Quanto costa una mossa, letto da `actions.js` — non scritto a mano qui. */
function lfCosto(id){
  const a = (typeof ACTIONS !== "undefined" ? ACTIONS : []).find(x => x.id === id);
  if(!a) return "";
  const e = a.dyn ? a.dyn() : a.e;
  const c = a.money ? a.money() : 0;
  return (e ? e + (e === 1 ? " energia" : " energie") : "gratis") + (c ? " · " + fmt(c) + " €" : "");
}
/* Il tasto d'oro con sotto il perché non si può, se non si può. Oltre a
   quello che dice `hubPronta` (energia, soldi, cosa serve) qui si guarda
   anche l'orario del posto (`GAME_HOURS`, orari.js): il club apre alle otto
   di sera, e «Apre alle 20:00» scritto sotto al tasto vale più della finestra
   che altrimenti esce dopo averlo premuto. */
function lfTasto(id, testo, icona){
  let st = hubPronta(id);
  if(st.ok && typeof GAME_HOURS !== "undefined" && GAME_HOURS.actionStatus){
    const ore = GAME_HOURS.actionStatus(id);
    if(ore && !ore.open) st = {ok:false, perche:ore.label || "Adesso è chiuso"};
  }
  return '<div class="stazioni">' +
    '<button type="button" class="stprimo" data-vai="' + id + '"' + (st.ok ? "" : " disabled") + '>' +
      (icona ? lfIco(icona) : "") + lfEsc(testo) + '</button></div>' +
    (st.ok ? "" : '<p class="stperche">' + lfEsc(st.perche) + '.</p>');
}
/* L'esito di una mossa: quello che ha detto, i numeri, e «Continua». */
function lfEsito(){
  const e = LUOGO.esito;
  return '<div class="lfesito">' +
    '<p class="lfdetto">' + (e.msg || "") + '</p>' +
    (e.extra ? '<p class="lfextra">' + e.extra + '</p>' : "") +
    '<div class="stazioni"><button type="button" class="stprimo" data-continua="1">Continua</button></div>' +
    '</div>';
}

/* ---------- LA CASA: le porte sopra alla foto ----------
   Il riferimento (`casa_di provincia_definitiva`) ha tre targhette che
   indicano un punto della stanza: il letto di là, il tavolo, il divano.
   Sono bottoni che si vedono — costano energia — messi dove sta la cosa
   nella foto. Le percentuali sono dello schermo, non della foto: con
   `cover` la foto si ritaglia, e una targhetta che deve restare leggibile
   vale più di una che sta al pixel giusto (§3 delle pagine-azioni). La
   quarta porta, i conti, nel riferimento non c'è: era la seconda risposta
   della vecchia finestra e non si butta. */
function lfCasa(){
  const porta = (id, cls, ic, n, d) =>
    '<button type="button" class="lfporta ' + cls + '" data-porta="' + id + '">' +
      '<span class="lfpico">' + lfIco(ic) + '</span>' +
      '<span class="lfptesto"><b>' + n + '</b>' + (d ? '<i>' + d + '</i>' : "") + '</span>' +
    '</button>';
  const stacca = hubPronta("stacca");
  return {porte:
    porta("scrivi", "lfp-tavolo", "matita", "Scrivi una barra", "Il foglio, al tavolo") +
    porta("dormi", "lfp-camera", "letto", "Vai in camera", "Recupera energia") +
    porta("stacca", "lfp-divano", "divano", "Stacca la spina",
      stacca.ok ? "Una serata senza pensare a niente" : "Per oggi basta: torna domani") +
    porta("conti", "lfp-conti", "soldi", "I conti di casa", "Quanto ti costa vivere così")
  };
}

/* ---------- STACCA LA SPINA ----------
   Il riferimento è una scena senza scelte, che si guarda: il titolone, la
   riga «Dormi, mangi, vedi gente normale», i due numeri, Continua. Prima di
   premere i numeri sono quelli che la mossa promette (`give()`), dopo sono
   quelli veri. Il documento delle pagine-azioni la voleva lasciare scena, e
   la ragione resta buona: dentro non c'è niente da decidere. Per questo un
   tasto solo, e niente colonne. */
function lfStacca(){
  const n = typeof adfOggi === "function" ? adfOggi("stacca") : 0;
  const e = LUOGO.esito, p = LUOGO.prima;
  let ben, rete, nota;
  if(e){
    const dWell = p ? Math.round(G.wellbeing - p.well) : null;
    const dRete = p ? Math.round((G.skills.rete - p.rete) * 10) / 10 : null;
    ben = dWell == null ? "—" : (dWell >= 0 ? "+" : "") + dWell;
    rete = dRete == null || dRete === 0 ? "—" : "+" + String(dRete).replace(".", ",");
    nota = (e.msg || "") + (e.extra || "");
  } else {
    ben = n === 0 ? "+10–14" : n === 1 ? "+3–5" : "—";
    rete = n === 0 ? "+0,4" : "—";
    nota = n === 0 ? "Una sera senza pensare a niente: hai rivisto gente che non c’entra niente con la musica."
      : n === 1 ? "La seconda volta oggi recupera meno: il corpo ha già avuto la sua parte."
      : "Per oggi hai recuperato abbastanza. Torna domani.";
  }
  const mid =
    '<div class="lfcentro">' +
      '<h2 class="lftitolone"><span>Stacca</span><b>la spina</b></h2>' +
      '<p class="lfsotto">Dormi, mangi, vedi gente normale.</p>' +
      '<div class="lfnumeri">' +
        '<div class="lfnum"><i class="verde">' + lfIco("cuore") + '</i><div><span>Benessere</span><b>' + ben + '</b></div></div>' +
        '<div class="lfnum"><i class="azz">' + lfIco("gente") + '</i><div><span>Rete</span><b>' + rete + '</b></div></div>' +
      '</div>' +
      '<p class="lfnota">' + nota + '</p>' +
      (e ? '<div class="stazioni"><button type="button" class="stprimo" data-continua="1">Continua</button></div>'
         : lfTasto("stacca", "Stacca la spina · " + lfCosto("stacca"), "divano")) +
    '</div>';
  return {mid:mid};
}

/* ---------- LA PALESTRA ----------
   La foto di riferimento è pulita: nessun elemento sopra. La scelta fra
   Pesi e Cardio stava nel cartello della mappa (punto 9) e adesso sta qui, in
   mezzo; a sinistra la serie — `palestraMoltiplicatore()` esisteva già e non
   si vedeva da nessuna parte, che è il guadagno che il documento delle
   pagine-azioni chiedeva — e a destra com'è messa la giornata. */
function lfPalestra(){
  const streak = typeof palestraStreakOra === "function" ? palestraStreakOra() : 0;
  const molt = typeof palestraMoltiplicatore === "function" ? palestraMoltiplicatore() : 1;
  const sessioni = (G.palestra && G.palestra.sessioni) || 0;
  const giaOggi = typeof adfOggi === "function" && adfOggi("palestra") > 0;

  const sx = lfPan("La serie",
    lfRiga("Giorni di fila", typeof palestraTesto === "function" ? lfEsc(palestraTesto()) : streak) +
    lfRiga("Sedute fatte", sessioni) +
    lfRiga("Bonus presenza", "+" + Math.round((molt - 1) * 100) + "%", molt > 1 ? "oro" : "") +
    '<p class="stnota lfnotasotto">Ogni giorno di fila alza il guadagno di presenza del 5%, fino a dieci. Salti due giorni e la serie riparte.</p>',
    "polso");

  const righe = [
    {id:"palestra_pesi", n:"Pesi", d:"Ferro pesante, poche ripetizioni.", v:"+benessere · +presenza"},
    {id:"palestra_cardio", n:"Cardio leggero", d:"Una corsa, la testa che si svuota.", v:"+lucidità · +benessere"}
  ].map(r => {
    const st = hubPronta(r.id);
    return stScelta({attr:' data-scelta="' + r.id + '"', on:LUOGO.scelta === r.id,
      n:r.n, d:r.d + ' <span class="oro">' + lfCosto(r.id) + '</span>',
      v:st.ok ? r.v : st.perche, vCls:st.ok ? "" : "calmo"});
  }).join("");
  const scelta = LUOGO.scelta || "palestra_pesi";
  const mid = LUOGO.esito
    ? lfPan("Com’è andata", lfEsito(), "spunta")
    : lfPan("Che allenamento fai?",
        '<p class="stnota">Il fisico che si vede sotto le luci, o la testa che si svuota prima di scrivere.</p>' +
        righe +
        lfTasto(scelta, scelta === "palestra_pesi" ? "Fai i pesi" : "Fai il cardio", "manubrio"),
        "manubrio");

  const dx = lfPan("Oggi",
    (giaOggi
      ? '<div class="stvuoto"><b>Ci sei già stato oggi.</b> Il corpo non recupera due volte lo stesso giorno: una seconda seduta toglie benessere invece di darne.</div>'
      : '<div class="stvuoto"><b>Prima seduta di oggi.</b> ' +
        (streak >= 1 ? "La serie continua se vieni anche oggi." : "Da qui parte una serie.") + '</div>') +
    lfRiga("Energia", Math.round(G.energy)) +
    lfRiga("In cassa", fmt(G.money) + " €", "oro"),
    "orologio");
  return {sx:sx, mid:mid, dx:dx};
}

/* ---------- IL LIVE CLUB ----------
   Il riferimento ha la scaletta a sinistra, «stasera» a destra e in mezzo la
   serata. La scaletta sono i tuoi pezzi fuori, quelli che porti sul palco;
   «stasera» è chi c'è (la gente della Sala che conosci) e quanto rende. In
   mezzo si sceglie: il palco, che vuole un pezzo pubblicato, o la piazza.
   I momenti da giocare durante la serata (quello che parla sopra, la traccia
   che parte storta) nel riferimento ci sono e qui non ancora: sono il
   minigioco della Piazza rifatto per il palco, e vanno in una task loro. */
function lfLive(){
  const fuori = (G.songs || []).filter(s => s.released).slice().sort((a, b) => (b.q || 0) - (a.q || 0));
  const sx = lfPan("La scaletta",
    fuori.length
      ? fuori.slice(0, 4).map((s, i) => stScelta({senzaPallino:true, n:(i + 1) + ". " + s.t,
          d:s.feat ? "con " + lfEsc(s.feat) : (s.tema ? lfEsc(s.tema) : "il tuo pezzo"),
          mini:typeof cover === "function" ? cover(s.seed || 7, s.t, (window.ARTIST || {}).name || "", s.img) : "",
          v:"q" + Math.round(s.q || 0)})).join("")
      : '<div class="stvuoto"><b>Nessun pezzo fuori.</b> Il palco vero aspetta un pezzo pubblicato. La piazza no: lì c’è solo il beat e la gente che passa.</div>',
    "barre", fuori.length ? fuori.length + (fuori.length === 1 ? " pezzo fuori" : " pezzi fuori") : "");

  const palco = hubPronta("live"), piazza = hubPronta("free");
  const giaOggi = typeof adfOggi === "function" && adfOggi("live") > 0;
  const stima = Math.round((20 + G.hype * 1.4 + 40) * (typeof RITMO === "number" ? RITMO : 0.4) * (giaOggi ? 0.45 : 1));
  const righe =
    stScelta({attr:' data-scelta="live"', on:LUOGO.scelta === "live", n:"Serata open mic",
      d:'Il palco, con i tuoi pezzi. <span class="oro">' + lfCosto("live") + '</span>',
      v:palco.ok ? "~" + fmt(stima) + " € · fan" : palco.perche, vCls:palco.ok ? "" : "calmo"}) +
    stScelta({attr:' data-scelta="free"', on:LUOGO.scelta === "free", n:"Freestyle in piazza",
      d:'Solo il beat e la gente che passa. <span class="oro">' + lfCosto("free") + '</span>',
      v:piazza.ok ? "presenza · fan" : piazza.perche, vCls:piazza.ok ? "" : "calmo"});
  const scelta = LUOGO.scelta || (palco.ok ? "live" : "free");
  const mid = LUOGO.esito
    ? lfPan("Com’è andata", lfEsito(), "spunta")
    : lfPan("Che serata fai?",
        '<p class="stnota">Il palco vero vuole un pezzo pubblicato. La piazza no.</p>' +
        righe +
        lfTasto(scelta, scelta === "live" ? "Sali sul palco" : "Vai in piazza", scelta === "live" ? "palco" : "mic"),
        "palco");

  /* chi c'è: la gente della Sala che conosci davvero (almeno un contatto),
     tre a serata, sempre gli stessi dentro la settimana — lo stesso criterio
     di `presentiOggi()` in posto.js */
  const sett = typeof totalWeeks === "function" ? totalWeeks() : (G.week || 1);
  const chi = (G.gente || []).filter(p => !p.via && p.rel >= 1)
    .sort((a, b) => ((b.id.charCodeAt(1) * 31 + sett * 17) % 97) - ((a.id.charCodeAt(1) * 31 + sett * 17) % 97))
    .slice(0, 3);
  const dx = lfPan("Stasera",
    '<div class="stsottotit">Chi c’è</div>' +
    (chi.length
      ? '<ul class="lflista">' + chi.map(p => '<li>' + lfEsc(p.n) + ' <i>(' + lfEsc(p.ruolo) + ')</i></li>').join("") + '</ul>'
      : '<p class="stnota">Nessuno che conosci. La Sala è dove si conosce la gente.</p>') +
    '<div class="stsottotit">Incasso</div>' +
    lfRiga("Stimato", palco.ok ? "~" + fmt(stima) + " €" : "—", "oro") +
    (giaOggi ? '<p class="stnota lfnotasotto">Il palco lo conoscevano già: stasera rende meno.</p>' : ""),
    "cartella");
  return {sx:sx, mid:mid, dx:dx};
}

/* ==================== LE MOSSE ====================
   Da qui parte una mossa di actions.js, come dai cartelli. Prima si fotografa
   com'eri, per scrivere i numeri veri nell'esito. */
function luogoVai(id){
  if(!LUOGO) return;
  LUOGO.prima = {well:G.wellbeing, rete:(G.skills && G.skills.rete) || 0,
    pres:(G.skills && G.skills.presenza) || 0, money:G.money, fans:G.fans};
  LUOGO.esito = null;
  if(typeof SFX === "object" && SFX.tap) SFX.tap();
  avviaAzioneDiretta(id);
  renderLuogo();
}

/* Quando il gioco si ridisegna (`renderGioco`, ui.js) si ridisegna anche
   la pagina aperta: l'energia nella fascia, l'ora, «ci sei già stato oggi».
   Lo Studio lo ottiene con un `renderStudio()` scritto a mano dopo ogni
   `renderGioco()` — otto posti, in cinque file — e il README delle
   pagine-azioni dice perché è la cosa da non rifare. Qui si incarta
   `renderGioco` una volta sola, come sotto si incarta `mostraScena`. */
if(typeof renderGioco === "function"){
  const lfRenderGiocoOriginale = renderGioco;
  window.renderGioco = function(){
    const r = lfRenderGiocoOriginale.apply(this, arguments);
    try{ renderLuogo(); }catch(e){ console.error("[Anni di Fame] luoghi-foto: renderLuogo", e); }
    return r;
  };
}

/* L'esito di una mossa che ha una pagina con la foto. `mostraScena` (ui.js)
   è dove quelle mosse finivano — la scenetta disegnata a pagina piena —
   e qui la si incarta, come fa già interruzioni.js: se la mossa è una di
   quelle di LUOGO_MOSSE si apre (o si aggiorna) la sua pagina e l'esito si
   legge lì; tutte le altre continuano come prima. */
if(typeof mostraScena === "function"){
  const lfScenaOriginale = mostraScena;
  window.mostraScena = function(a, sc, msg, extra){
    const id = a && LUOGO_MOSSE[a.id];
    if(!id) return lfScenaOriginale.apply(this, arguments);
    /* arrivata da fuori (una card degli eventi, l'agenda): la pagina si apre
       adesso, e «Continua» la richiude */
    if(!LUOGO || LUOGO.id !== id) apriLuogo(id, {da:"mossa"});
    LUOGO.esito = {a:a.id, msg:String(msg == null ? "" : msg), extra:String(extra == null ? "" : extra)};
    renderLuogo();
  };
}

/* «Continua» dopo una mossa: si torna da dove si era venuti. Lo «stacca la
   spina» aperto dalla Casa torna in cucina; la palestra e il club restano
   sulla loro pagina, pronti per la prossima volta; quello che era arrivato
   da una card chiude e basta. */
function luogoContinua(){
  if(!LUOGO) return;
  if(typeof SFX === "object" && SFX.tap) SFX.tap();
  if(LUOGO.da === "mossa"){ chiudiLuogo(); return; }
  if(LUOGO.id === "stacca"){ apriLuogo("casa"); return; }
  LUOGO.esito = null; LUOGO.prima = null;
  renderLuogo();
}

/* Le porte della Casa. «Vai in camera» è la notte di `saltaGiorni(1)` — la
   stessa del tasto «Salta avanti» — e chiede conferma come lui, perché
   chiude la giornata; l'agenda, se ha un appuntamento, lo dice lei. */
function luogoPorta(id){
  if(typeof SFX === "object" && SFX.tap) SFX.tap();
  if(id === "scrivi"){ avviaAzioneDiretta("scrivi"); return; }
  if(id === "stacca"){ apriLuogo("stacca", {da:"casa"}); return; }
  if(id === "conti"){
    apriPannello("Le spese fisse", "lifestyle", "Quanto ti costa vivere come vivi, e cosa ti dà in cambio.");
    return;
  }
  if(id === "dormi"){
    if(G.ended) return;
    showEvent({k:"Casa", t:"Vai in camera",
      d:"Una notte: domani parti con l’energia piena. Non scrivi, non registri, non ti fai vedere da nessuno." +
        (typeof avvisoAgenda === "function" ? avvisoAgenda() : ""),
      annulla(){},
      opts:[
        {n:"Dormi", d:"Chiudi la giornata", run(){ saltaGiorni(1); renderLuogo(); return null; }},
        {n:"Non ancora", d:"Resti in cucina", run(){ return null; }}
      ]});
  }
}

if($("luogo")){
  $("luogo").addEventListener("click", e => {
    const porta = e.target.closest("[data-porta]");
    if(porta){ luogoPorta(porta.dataset.porta); return; }
    const sc = e.target.closest("[data-scelta]");
    if(sc && LUOGO){ LUOGO.scelta = sc.dataset.scelta; if(SFX.tap) SFX.tap(); renderLuogo(); return; }
    const vai = e.target.closest("[data-vai]");
    if(vai && !vai.disabled){ luogoVai(vai.dataset.vai); return; }
    if(e.target.closest("[data-continua]")){ luogoContinua(); }
  });
}

/* ==================== LA PIAZZA: LA FOTO SOTTO ====================
   La pagina c'è già (piazza.js) e funziona: qui le si mette sotto la foto del
   sottopasso, che è quella del riferimento `freestyle_in_piazza`. Il fondale
   disegnato resta dentro alla sua card — è la scena che si anima con la
   folla — ma tutto intorno adesso c'è la piazza vera. La classe la legge
   `luoghi-foto.css`; la foto va scritta qui, nello stile dell'elemento, e
   non in una variabile CSS: un `url()` dentro a una variabile Chrome lo
   risolve rispetto al foglio di stile (`css/media/…`, che non esiste), non
   rispetto alla pagina. Il velo sta nello stesso `background`, così scorre
   insieme alla pagina e non serve un elemento in più. Quando la piazza si
   chiude, la pagina del Live Club che sta sotto si ridisegna: i numeri sono
   cambiati. */
const LF_PIAZZA_VELO = "linear-gradient(180deg,rgba(3,6,11,.78) 0%,rgba(3,6,11,.30) 22%,rgba(3,6,11,.42) 60%,rgba(3,6,11,.86) 100%)";
if(typeof apriPiazza === "function"){
  const lfPiazzaOriginale = apriPiazza;
  window.apriPiazza = function(){
    const r = lfPiazzaOriginale.apply(this, arguments);
    const p = $("piazza"), L = LUOGHI_FOTO.piazza;
    if(p){
      p.classList.add("lffoto");
      p.style.backgroundImage = LF_PIAZZA_VELO + ', url("' + LUOGHI_FOTO_DIR + L.f + '")';
      p.style.backgroundPosition = "center, " + L.pos;
    }
    return r;
  };
}
if(typeof chiudiPiazza === "function"){
  const lfChiudiPiazzaOriginale = chiudiPiazza;
  window.chiudiPiazza = function(){
    const r = lfChiudiPiazzaOriginale.apply(this, arguments);
    renderLuogo();
    return r;
  };
}
