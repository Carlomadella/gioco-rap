/* IL CIRCOLO — le quattro stanze (01/10/2026).

   I cartelli della foto aprono una pagina ciascuno, disegnata sul suo
   riferimento in `media/photo/schermate_luoghi/schermate_luoghi_con_elementi_HTML/`:

     Bancone    bancone.png    la gente che non conosci, l'atmosfera, quattro
                               modi di avvicinarla (circolo-incontri.js) —
                               rifatto il 02/10/2026 sul riferimento nuovo,
                               le quattro mosse come card con la foto
     Sala       sala.png       tutta la gente presente: la scheda, il rapporto,
                               le mosse di posto.js, chi c'è stasera
     Palco      open_mic.png   solo il live: l'ordine della serata, i momenti
                               giocati (circolo.js), le tue statistiche live
     Backstage  backstage.png  l'artista della serata, la gente del giro, i
                               tuoi fan, le occasioni e quello che si sblocca

   Qui si disegna e basta: le regole stanno in circolo.js (il palco, i
   momenti, la gente che guarda) e in circolo-incontri.js (le mosse nuove).
   Le foto delle stanze sono ritagli dei riferimenti, in
   `media/photo/circolo/stanze/`; la Sala usa il fondale del Circolo,
   sfocato, come nel suo riferimento. */
"use strict";

const CC_STANZE = {
  bancone:  {n:"Bancone", ic:"gente", sotto:"Parla con le persone e conosci nuovi contatti."},
  sala:     {n:"Sala", ic:"bolla", sotto:"Costruisci rapporti con la scena locale."},
  palco:    {n:"Palco", ic:"mic", sotto:"Il live: tre momenti, e la gente decide."},
  backstage:{n:"Backstage", ic:"stella", sotto:"Artisti della serata e opportunità speciali"}
};
function circoloStanza(id, f){
  return id === "bancone" ? ccBancone(f)
    : id === "sala" ? ccSala(f)
    : id === "palco" ? ccPalcoStanza(f)
    : ccBackstage(f);
}

/* ---------- i pezzi che tornano ---------- */
/* «← Il Circolo / Sala»: si torna alla foto coi cartelli. Il Bancone, sul suo
   riferimento nuovo, ha lo spillo al posto della freccia e niente sbarra, in
   un riquadro solo (`spillo`). */
function ccBriciole(id, spillo){
  const fermo = circoloStato().serata;
  return '<nav class="cc-briciole' + (spillo ? " spillo" : "") + '">' +
    '<button type="button" class="cc-indietro" data-cc-esci="1"' + (fermo ? ' disabled title="Sei sul palco: prima finisci la serata"' : "") + ' aria-label="Torna al Circolo">' +
      '<s>' + ccIco(spillo ? "spillo" : "freccia") + '</s><b>Il Circolo</b></button>' +
    (spillo ? "" : '<span>/</span>') + '<i>' + CC_STANZE[id].n + '</i></nav>';
}
function ccTitolo(id, cls){
  const s = CC_STANZE[id];
  return '<header class="cc-stit' + (cls ? " " + cls : "") + '"><i>' + ccIco(s.ic) + '</i><div><h2>' + s.n + '</h2><p>' + s.sotto + '</p></div></header>';
}
/* l'ultima cosa successa con una mossa di qui */
function ccDettoRiga(){
  const d = CIRCOLO.detto;
  return d ? '<p class="cc-detto ' + (d.cls || "") + '">' + d.t + '</p>' : "";
}
function ccRelBadge(p){
  if(circoloSconosciuto(p)) return '<span class="cc-rb grigio"><i></i>Sconosciuto</span>';
  const n = relNome(p);
  const cls = p.rel >= 2 ? "verde" : p.rel >= 1 ? "giallo" : "grigio";
  return '<span class="cc-rb ' + cls + '"><i></i>' + n.charAt(0).toUpperCase() + n.slice(1) + '</span>';
}
function ccNome(p){ return circoloSconosciuto(p) ? "???" : ccEsc(p.n); }
/* una riga di una persona: faccia, nome, ruolo, due righe, e a destra
   quello che le si legge addosso */
function ccRigaPersona(p, on, destra, dataset){
  const r = POSTO_RUOLI[p.ruolo] || {d:""};
  return '<button type="button" class="cc-pers' + (on ? " on" : "") + '" ' + (dataset || 'data-cc-chi="' + p.id + '"') + '>' +
    '<span class="cc-pfoto">' + ccFaccia(p) + '</span>' +
    '<span class="cc-ptx"><b>' + ccNome(p) + '</b><em>' + ccRuolo(p) + '</em><i>' + ccEsc(r.d) + '</i></span>' +
    (destra || "") + '</button>';
}
/* La foto della stanza: un div suo con lo stile scritto nell'HTML. Non in
   una variabile CSS: un `url()` dentro a una variabile Chrome lo risolve
   rispetto al foglio di stile (`css/media/…`, che non esiste), non rispetto
   alla pagina — la stessa trappola di luoghi-foto.js. */
function ccSfondo(url){
  return '<div class="cc-sfondo" aria-hidden="true" style="background-image:url(&quot;' + url + '&quot;)"></div>';
}
function ccVuoto(t){ return '<div class="cc-vuoto">' + t + '</div>'; }
/* il dialogo di posto.js (la situazione e le risposte), dove serve */
function ccDialogo(p){
  if(typeof POSTO_PARLA === "undefined" || !POSTO_PARLA || POSTO_PARLA.p.id !== p.id) return "";
  const sit = POSTO_PARLA.sit;
  return '<div class="cc-dialogo2"><p>' + sit.t + '</p>' +
    sit.o.map((o, i) => '<button type="button" class="cc-risp" data-cc-risp="' + i + '"><span>' + o[0] + '</span></button>').join("") +
  '</div>';
}

/* ==================== IL BANCONE ==================== */
const CC_BAN_ICO = {attacca:"bolla", bevi:"boccale", ascolta:"orecchio", presentati:"mano"};
/* i nomi per intero: l'audit delle immagini orfane li cerca così */
const CC_BAN_FOTO = {attacca:"bancone-attacca.jpg", bevi:"bancone-bevi.jpg", ascolta:"bancone-ascolta.jpg", presentati:"bancone-presentati.jpg"};
/* una mossa del Bancone come card del riferimento: la foto ritagliata dal
   riferimento (media/photo/circolo/stanze/, CC_BAN_FOTO), l'icona,
   il nome, cosa fa, e sotto l'orologio col prezzo e il tasto tondo. Se non
   si può, al posto del prezzo c'è il perché. */
function ccCartaBancone(m){
  return '<button type="button" class="cc-bcarta' + (m.puo ? "" : " no") + '" data-cc-ban="' + m.id + '"' + (m.puo ? "" : " disabled") + ' title="' + ccEsc(m.puo ? m.d : m.perche) + '">' +
    '<span class="cc-bcfoto" aria-hidden="true" style="background-image:url(&quot;' + CIRCOLO_FOTO + 'stanze/' + CC_BAN_FOTO[m.id] + '&quot;)"></span>' +
    '<i>' + ccIco(CC_BAN_ICO[m.id]) + '</i><b>' + m.n + '</b><em>' + ccEsc(m.d) + '</em>' +
    '<span class="cc-bcpiede"><u>' + (m.puo ? ccIco("orologio") + ccEsc(m.costo) : ccEsc(m.perche + ".")) + '</u>' + (m.puo ? '<s>' + ccIco("freccia") + '</s>' : "") + '</span></button>';
}
function ccBancone(f){
  const chi = circoloPresenti().slice().sort((a, b) => (circoloSconosciuto(b) ? 1 : 0) - (circoloSconosciuto(a) ? 1 : 0));
  let p = chi.find(x => x.id === CIRCOLO.scelto) || chi[0] || null;
  if(typeof POSTO_PARLA !== "undefined" && POSTO_PARLA) p = POSTO_PARLA.p;
  if(p) CIRCOLO.scelto = p.id;
  const atm = circoloAtmosfera(), atmN = circoloAtmosferaNome(atm);
  const fra = f ? Math.max(0, circoloMin(f.a) - circoloOra()) : 0;
  const lista = chi.length ? chi.map(x => {
    const u = circoloUmore(x);
    return ccRigaPersona(x, p && x.id === p.id,
      '<span class="cc-umore ' + u.cls + '"><i>' + ccIco("faccia") + '</i>' + u.n + '</span><s>' + ccIco("freccia") + '</s>');
  }).join("") : ccVuoto(f ? "Al bancone non c’è nessuno, adesso." : "Il Circolo è chiuso. Riapre alle 13:00: di pomeriggio ci trovi la gente del giro.");
  const dialogo = p ? ccDialogo(p) : "";
  const azioni = dialogo ||
    '<div class="cc-bgriglia">' + circoloBanconeMosse(p).map(ccCartaBancone).join("") + '</div>';
  return '<div class="cc-bancone">' +
    '<section class="cc-bsx">' +
      '<div class="cc-bfoto" style="background-image:url(&quot;' + CIRCOLO_FOTO + 'stanze/bancone.jpg&quot;)">' + ccBriciole("bancone", true) + '</div>' +
      '<div class="cc-bpan">' +
        '<h3 class="cc-h">' + (dialogo ? "Con " + ccNome(p) : "Azioni disponibili") +
          (dialogo || !f || (typeof circoloQui === "function" && !circoloQui()) ? "" : ' <small>Cosa vuoi fare?</small>') + '</h3>' +
        azioni + ccDettoRiga() +
      '</div>' +
    '</section>' +
    '<section class="cc-bdx">' +
      '<div class="cc-bhead">' + ccTitolo("bancone", "piccolo") +
        '<div class="cc-atm"><h4>Atmosfera del locale</h4>' +
          '<div class="cc-atmbar"><span style="width:' + atm + '%"></span></div><em>' + atmN[0] + '</em>' +
          '<p><i>' + ccIco("gente") + '</i><span><b>' + (atm >= 82 ? "Locale pieno" : atm >= 45 ? "Gente in giro" : atm > 0 ? "Poca gente" : "Chiuso") + '</b>' + atmN[1] + '</span></p>' +
        '</div>' +
      '</div>' +
      '<div class="cc-lista2"><h3 class="cc-h">Persone al bancone <span class="cc-conta">' + chi.length + '</span>' +
        (f ? '<small class="cc-agg">' + ccIco("aggiorna") + 'Si aggiorna tra ' + (typeof GAME_TIME !== "undefined" && GAME_TIME.formatDuration ? GAME_TIME.formatDuration(fra) : fra + " min") + '</small>' : "") + '</h3>' +
        '<div class="cc-scorri">' + lista + '</div></div>' +
    '</section>' +
  '</div>';
}

/* ==================== LA SALA ==================== */
const CC_CITAZIONI = {
  beatmaker:{aperto:"Qui si parla di musica vera. Se hai qualcosa da dire, fammelo sentire.",
    diffidente:"Prima ascolto cosa fai. Poi, forse, ti faccio sentire qualcosa.",
    gasato:"I miei beat girano in tutta la provincia. Tu ci stai dietro?",
    pratico:"Beat buoni, prezzi onesti. Il resto sono chiacchiere."},
  rapper:{aperto:"Più siamo, più il giro cresce. Non è una gara.",
    diffidente:"Ne ho visti tanti salire e scendere da quel palco.",
    gasato:"Il Circolo lo conosco meglio di chiunque. Chiedi pure.",
    pratico:"Parliamo di pezzi, non di sogni."},
  fonico:{aperto:"Un pezzo mixato bene è un altro pezzo. Te lo faccio sentire.",
    diffidente:"Dietro al mixer si sente tutto. Anche chi fa finta.",
    gasato:"Senza di me questo locale suonerebbe come un garage.",
    pratico:"Portami le tracce pulite e ci capiamo."},
  videomaker:{aperto:"Ogni artista ha una faccia: io cerco quella giusta.",
    diffidente:"Prima vedo come stai sul palco, poi ti filmo.",
    gasato:"I video migliori della scena li ho girati io.",
    pratico:"Un giorno di riprese, un video che dura. Si fa così."},
  giornalista:{aperto:"Scrivo di chi suona qui. Magari un giorno di te.",
    diffidente:"Le storie belle le scopro da sola, non me le vendono.",
    gasato:"Un mio articolo e domani ti conoscono tutti.",
    pratico:"Dammi una notizia vera e la scrivo."},
  strada:{aperto:"Qui la gente parla molto. Io preferisco ricordarmi chi mantiene la parola.",
    diffidente:"Se devo dirti qualcosa, te la dico quando serve. Non prima.",
    gasato:"Conosco più facce di quante ne voglia vedere tutte insieme.",
    pratico:"Le cose semplici funzionano: orario giusto, posto giusto, poche parole."},
  vita:{aperto:"Alla fine ci si incontra sempre negli stessi posti.",
    diffidente:"Prima capisco con chi sto parlando, poi mi apro.",
    gasato:"La provincia è piccola: se giri abbastanza, conosci tutti.",
    pratico:"Parliamo chiaro e ci capiamo prima."}
};
function ccCitazione(p){
  const c = CC_CITAZIONI[p.ruolo] || CC_CITAZIONI.vita;
  return circoloSconosciuto(p) ? "Ti guarda, ma non ha ancora detto niente." : (p.scoperto ? c[p.car] : c.aperto);
}
function ccSala(f){
  const tutti = circoloPresenti();
  const filtro = CIRCOLO.filtro || "tutti";
  const chi = tutti.filter(p => filtro === "tutti" ? true : filtro === "conosciuti" ? !circoloSconosciuto(p) : circoloSconosciuto(p));
  let p = null;
  if(typeof POSTO_PARLA !== "undefined" && POSTO_PARLA) p = POSTO_PARLA.p;
  /* anche chi stasera arriva più tardi («Chi c'è stasera»): la scheda si apre
     su di lui, le mosse dicono che adesso non è qui (problemi-riscontrati,
     voce 88) */
  const stasera = typeof presentiOggi === "function" ? presentiOggi(8) : [];
  if(!p) p = (G.gente || []).find(x => x.id === CIRCOLO.scelto && (tutti.indexOf(x) >= 0 || stasera.indexOf(x) >= 0)) || chi[0] || tutti[0] || null;
  const arriva = p && tutti.indexOf(p) < 0;
  if(p) CIRCOLO.scelto = p.id;
  const chip = (id, n) => '<button type="button" class="cc-chip' + (filtro === id ? " on" : "") + '" data-cc-filtro="' + id + '">' + n + '</button>';
  const lista = chi.length ? chi.map(x => ccRigaPersona(x, p && x.id === p.id, ccRelBadge(x))).join("")
    : ccVuoto(f ? (tutti.length ? "Nessuno, con questo filtro." : "Non c’è nessuno, adesso.") : "Il Circolo è chiuso. Riapre alle 13:00.");

  /* la scheda in mezzo */
  let scheda = ccVuoto("Scegli qualcuno dalla lista.");
  if(p){
    const soglia = typeof relSoglia === "function" ? relSoglia(p) : 3;
    const perc = p.rel >= 5 ? 100 : Math.max(0, Math.min(100, Math.round(Number(p.pt || 0) / soglia * 100)));
    const rel = relNome(p);
    const gen = p.gen && typeof BEAT_GEN !== "undefined" && BEAT_GEN[p.gen] ? BEAT_GEN[p.gen].n : "";
    const azioni = ccDialogo(p) || (arriva
      ? '<p class="cc-sotto">' + ccNome(p) + ' arriva più tardi, stasera: adesso non è in sala.</p>'
      : '<div class="cc-salaz">' + ccVociSala(p) + ccBeatSulTavolo(p) + '</div>');
    scheda =
      '<div class="cc-shero">' +
        '<div class="cc-shtx"><h3>' + ccNome(p) + '</h3><em>' + ccRuolo(p) + '</em>' +
          '<q>' + ccEsc(ccCitazione(p)) + '</q>' +
          '<ul><li>' + ccIco("info") + 'Città di provincia</li>' +
            (gen ? '<li>' + ccIco("nota") + ccEsc(gen) + '</li>' : "") +
            '<li>' + ccIco("gente") + (p.fama >= 30 ? "Conosce molti nella scena locale" : "Gira nel giro da poco") + '</li>' +
            (p.strada && p.strada.known ? '<li>' + ccIco("rischio") + 'Sai che è collegato alla Strada' +
              (typeof stradaFiduciaEtichetta==="function" ? ' · fiducia: ' + stradaFiduciaEtichetta(p) : '') + '</li>' : "") +
            (p.scoperto ? '<li>' + ccIco("faccia") + 'Carattere: ' + (CIRCOLO_CARATTERE[p.car] || p.car) + '</li>' : "") +
          '</ul></div>' +
        '<div class="cc-shfoto">' + ccFaccia(p) + '</div>' +
      '</div>' +
      '<div class="cc-srel"><h4 class="cc-h4">Livello di rapporto</h4>' +
        '<div class="cc-srelbar"><b>' + ccIco("mano") + (circoloSconosciuto(p) ? "Sconosciuto" : rel.charAt(0).toUpperCase() + rel.slice(1)) + '</b>' +
          '<span><i style="width:' + perc + '%"></i></span><em>' + (p.rel >= 5 ? "al massimo" : perc + " / 100") + '</em></div>' +
        '<p>' + (circoloSconosciuto(p) ? "Non vi siete mai parlati: si comincia da due parole."
          : p.rel >= 3 ? ccEsc(p.n) + " ti considera uno della sua cerchia: puoi chiedergli molto."
          : p.rel >= 1 ? ccEsc(p.n) + " ti conosce. Più ci parli, più cose puoi chiedergli."
          : ccEsc(p.n) + " sa chi sei, ma niente di più.") + '</p></div>' +
      '<div class="cc-sazioni"><h4 class="cc-h4">Azioni disponibili</h4>' + azioni + ccDettoRiga() + '</div>';
  }

  /* a destra: chi c'è stasera e cosa ti può dare la sala */
  const facce = stasera.map(x => '<button type="button" class="cc-sface' + (p && x.id === p.id ? " on" : "") + '" data-cc-chi="' + x.id + '">' +
    '<span>' + ccFaccia(x) + '</span><b>' + ccNome(x) + '</b><em>' + ccRuolo(x) + '</em>' + ccRelBadge(x) + '</button>').join("");
  const opp = (ic, n, d, ok) => '<li class="' + (ok ? "ok" : "") + '"><i>' + ccIco(ic) + '</i><b>' + n + '</b><em>' + d + '</em><s>' + ccIco(ok ? "freccia" : "lucchetto") + '</s></li>';
  const ha = (ruolo, rel) => (G.gente || []).some(x => !x.via && x.ruolo === ruolo && x.rel >= rel);
  return '<div class="cc-sala">' + ccSfondo(LUOGHI_FOTO_DIR + LUOGHI_FOTO.circolo.f) +
    '<section class="cc-ssx">' + ccBriciole("sala") + ccTitolo("sala") +
      '<div class="cc-pan2"><h3 class="cc-h">Persone nella sala <span class="cc-conta">' + tutti.length + '</span></h3>' +
        '<div class="cc-chips">' + chip("tutti", "Tutti") + chip("conosciuti", "Conosciuti") + chip("nuovi", "Da conoscere") + '</div>' +
        '<div class="cc-scorri">' + lista + '</div></div>' +
    '</section>' +
    '<section class="cc-smid">' + scheda + '</section>' +
    '<section class="cc-sdx">' +
      '<div class="cc-pan2"><h3 class="cc-h">Chi c’è stasera <span class="cc-conta">' + ccIco("gente") + stasera.length + '</span></h3>' +
        '<p class="cc-sotto">Persone che passano dalla sala, stasera.</p>' +
        '<div class="cc-sfacce">' + (facce || ccVuoto("Stasera non c’è nessuno che conosci.")) + '</div></div>' +
      '<div class="cc-pan2"><h3 class="cc-h">Opportunità dalla sala</h3><p class="cc-sotto">Costruire rapporti qui può sbloccare:</p>' +
        '<ul class="cc-opp">' +
          opp("nota", "Nuovi beat", "Un beatmaker ti fa sentire i suoi (da contatto).", ha("beatmaker", 1)) +
          opp("feat", "Feat e collaborazioni", "Un pezzo con un rapper (da collaboratore).", ha("rapper", 3)) +
          opp("video", "Video e contenuti", "Un videomaker ti gira il video (da amico).", ha("videomaker", 2)) +
          opp("mix", "Un mix vero", "Un fonico ti mixa il pezzo (da amico).", ha("fonico", 2)) +
          opp("intervista", "Visibilità mediatica", "Un giornalista scrive di te (da contatto).", ha("giornalista", 1)) +
        '</ul></div>' +
    '</section>' +
  '</div>';
}
/* le mosse della Sala come righe: a destra quello che serve, o il tempo */
function ccVociSala(p){
  /* uno sconosciuto non ha nome, neanche sotto alle mosse */
  const ignoto = circoloSconosciuto(p);
  const voci = (typeof vociDi === "function" ? vociDi(p) : []).map(v => ignoto
    ? Object.assign({}, v, {sotto:String(v.sotto || "").split(p.n).join("lui")}) : v);
  return voci.map(v => {
    if(v.tipo === "feat" && v.puo && !circoloPalcoAcceso())
      v = Object.assign({}, v, {puo:false, sotto:"Il feat nasce sul palco: torna dopo le 21:00, quando lui è in sala"});
    else if(v.tipo === "feat" && v.puo) v = Object.assign({}, v, {sotto:"Ti chiede di salire con lui, stasera"});
    return '<button type="button" class="cc-srow' + (v.puo ? "" : " no") + '" data-cc-az="' + v.tipo + '" data-p="' + v.p + '"' + (v.puo ? "" : " disabled") + '>' +
      '<i>' + ccIco(CC_AZ_ICO[v.tipo] || "parla") + '</i><b>' + v.n + '</b><em>' + ccEsc(v.puo ? v.sotto : "") + '</em>' +
      '<u>' + ccEsc(v.puo ? (v.costo || "gratis") : v.sotto) + '</u></button>';
  }).join("");
}

/* ==================== IL PALCO ==================== */
const CC_LINEUP = ["Kalla", "Jinx", "Droppa", "Yung Ferro", "Mirko B", "Sabbia", "Lince", "Tara"];
const CC_TURNO = 20;                 /* minuti a testa, all'open mic */
function ccScaletta(f){
  const g = ccNumeroGiorno();
  const rap = circoloStasera().filter(p => p.ruolo === "rapper" && !circoloSconosciuto(p)).map(p => ({n:p.n, p:p}));
  const altri = CC_LINEUP.filter(n => !rap.some(r => r.n === n));
  const nomi = rap.concat(altri.map((n, i) => ({n:altri[(g + i * 3) % altri.length]})))
    .filter((x, i, a) => a.findIndex(y => y.n === x.n) === i).slice(0, 4);
  nomi.splice(2, 0, {n:"Tu", tu:true});
  const s = circoloStato().serata;
  const fatto = typeof adfOggi === "function" && (adfOggi("openmic") > 0 || adfOggi("live") > 0);
  const ora = f && f.palco ? Math.floor((circoloOra() - circoloMin("21:00")) / CC_TURNO) : -1;
  return nomi.map((x, i) => {
    let stato;
    if(x.tu) stato = s ? "Sul palco ora" : fatto ? "Fatto, stasera" : !f || !f.palco ? "La lista si apre alle 21:00"
      : ora < i ? "Tra " + (i - Math.max(0, ora)) + (i - Math.max(0, ora) === 1 ? " turno" : " turni") + " · Il tuo turno" : "Tocca a te";
    else stato = !f || !f.palco ? "In lista" : (s && i < 2) || ora > i ? "Fatto" : ora === i && !s ? "Sta esibendosi ora…" : "Tra " + (i - Math.max(0, ora)) + " turni";
    return {n:x.tu ? "Tu" : x.n, tu:!!x.tu, stato:stato, on:x.tu || (ora === i && !s), p:x.p};
  });
}
function ccPalcoStanza(f){
  const s = circoloStato().serata;
  const e = typeof LUOGO !== "undefined" && LUOGO && LUOGO.esito;
  const palco = f && f.palco;
  const scaletta = ccScaletta(f).map((x, i) =>
    '<li class="' + (x.on ? "on" : "") + (x.tu ? " tu" : "") + '"><b class="cc-num">' + (i + 1) + '</b>' +
      '<span class="cc-sfoto">' + (x.p ? ccFaccia(x.p) : x.tu ? ccIco("persona") : '<img class="cc-volto" src="' + CIRCOLO_FOTO + 'volti/' + CC_VOLTI[CC_VOLTI_LUI[(i + ccNumeroGiorno()) % CC_VOLTI_LUI.length]] + '" alt="" loading="lazy">') + '</span>' +
      '<span><b>' + ccEsc(x.n) + '</b><em>' + x.stato + '</em></span></li>').join("");

  /* il momento: l'esito, la serata a metà, o la scelta per salire */
  let momento;
  if(e){
    momento = '<h3 class="cc-h">Com’è andata</h3><div class="cc-esito"><p>' + (e.msg || "") + '</p>' +
      (e.extra ? '<p class="cc-extra">' + e.extra + '</p>' : "") + '</div>' +
      '<button type="button" class="cc-opz" data-continua="1"><b>Continua</b><em>Torni fra la gente.</em></button>';
  } else if(s){
    const m = ccMomento(s.ids[s.passo]);
    momento = '<h3 class="cc-h">Il momento</h3>' + (s.detto ? '<p class="cc-mdetto">' + s.detto + '</p>' : "") +
      '<p class="cc-msit">' + m.t + '</p>' +
      m.o.map((o, i) => '<button type="button" class="cc-opz" data-cc-momento="' + i + '"><b>' + o.n + '</b><em>' + ccDetto(o) + '</em></button>').join("");
  } else {
    const sali = (id, n, d) => {
      const st = ccPalcoStato(id);
      const costo = id === "openmic" ? CIRCOLO_OPENMIC.e + " energie · " + CIRCOLO_OPENMIC.min + " min" : (typeof lfCosto === "function" ? lfCosto("live") : "");
      return '<button type="button" class="cc-opz' + (st.ok ? "" : " no") + '" data-cc-palco="' + id + '"' + (st.ok ? "" : " disabled") + '>' +
        '<b>' + n + '</b><em>' + ccEsc(st.ok ? d : st.perche + ".") + '</em>' + (st.ok ? '<u>' + costo + '</u>' : "") + '</button>';
    };
    momento = '<h3 class="cc-h">Il momento</h3><p class="cc-msit">' + (palco
      ? "Il palco è acceso. Tre momenti: quello che scegli fa salire o scendere la gente, e la gente fa la serata."
      : "Il palco è spento. " + (f && f.id === "aftershow" ? "Si riaccende domani alle 21:00." : "Si accende alle 21:00.")) + '</p>' +
      sali("live", "Live", "Suona i tuoi pezzi: fan, soldi, presenza.") +
      sali("openmic", "Open Mic", "Tre minuti, senza requisiti: per chi un pezzo fuori non ce l’ha ancora.");
  }

  /* i tre momenti e la gente */
  const passo = s ? s.passo : e ? 3 : -1;
  const passi = CC_PASSI.map((n, i) => '<li class="' + (passo > i ? "fatto" : passo === i ? "ora" : "") + '"><i>' + (passo > i ? ccIco("spunta") : "") + '</i><b>' + n + '</b></li>').join("");
  const finita = !s && e && CIRCOLO.pubblico != null;
  const pub = s ? s.pubblico : finita ? CIRCOLO.pubblico : 50;
  const nomePub = pub < 30 ? "Freddo" : pub < 55 ? "Tiepido" : pub < 75 ? "Caldo" : "In delirio";
  const seg = Array.from({length:16}, (_, i) => '<i class="' + (i < Math.round(pub / 100 * 16) ? (i < 5 ? "r" : i < 10 ? "g" : "v") : "") + '"></i>').join("");

  /* le statistiche live: le abilità che il palco usa */
  const sk = G.skills || {};
  const stat = (ic, n, v, d) => '<div class="cc-stat"><i>' + ccIco(ic) + '</i><span><b>' + n + '</b><strong>' + Math.round(v) + '</strong></span>' +
    '<div class="cc-statbar"><span style="width:' + Math.max(0, Math.min(100, v)) + '%"></span></div><em>' + d + '</em></div>';
  /* le ricompense: il live vero o l'open mic, da 0,55 a 1,45 di resa */
  const tipo = s ? s.tipo : ccPalcoStato("live").ok || !ccPalcoStato("openmic").ok ? "live" : "openmic";
  const ritmo = typeof RITMO === "number" ? RITMO : 0.4;
  const pres = typeof presenzaSulPalco === "function" ? presenzaSulPalco() : (sk.presenza || 0);
  const hype = Number(G.hype || 0);
  const fanDa = tipo === "live" ? Math.round((8 + pres * 1.4 + hype * 0.7) * ritmo * 0.55) : Math.round((4 + pres * 0.5) * ritmo * 0.55);
  const fanA = tipo === "live" ? Math.round((30 + pres * 1.4 + hype * 0.7) * ritmo * 1.45) : Math.round((14 + pres * 0.5) * ritmo * 1.45);
  const euroDa = tipo === "live" ? Math.round((20 + hype * 1.4) * ritmo * 0.55) : 0;
  const euroA = tipo === "live" ? Math.round((60 + hype * 1.4) * ritmo * 1.45) : 0;
  const ric = (ic, n, v, cls) => '<div class="cc-ric ' + (cls || "") + '"><i>' + ccIco(ic) + '</i><span><b>' + n + '</b><em>' + v + '</em></span></div>';

  return '<div class="cc-palco2">' + ccSfondo(CIRCOLO_FOTO + "stanze/palco.jpg") +
    '<section class="cc-psx">' + ccBriciole("palco") +
      '<div class="cc-pan2 cc-scaletta"><h3 class="cc-h">Ordine della serata</h3>' +
        '<p class="cc-sotto">5 partecipanti · ' + (s ? (s.tipo === "live" ? "Live" : "Open Mic") : "Open Mic e Live") + '</p><ol>' + scaletta + '</ol></div>' +
    '</section>' +
    '<section class="cc-pmid">' +
      '<ol class="cc-passi">' + passi + '</ol>' +
      '<div class="cc-reaz"><i>' + ccIco("gente") + '</i><div><h4>Reazione del pubblico</h4><div class="cc-seg">' + seg + '</div></div><b>' + (s || finita ? nomePub : "—") + '</b></div>' +
    '</section>' +
    '<section class="cc-pdx"><h2 class="cc-ptit">' + (s ? (s.tipo === "live" ? "Il live" : "Open mic") : "Il palco") + '</h2>' +
      '<div class="cc-pan2 cc-momento2">' + momento + '</div></section>' +
    '<section class="cc-pgiu">' +
      '<div class="cc-pan2"><h3 class="cc-h">Le tue statistiche live</h3><div class="cc-stats">' +
        stat("mic", "Carisma", sk.presenza || 0, "Quanto il pubblico si connette con te.") +
        stat("barre", "Rap", sk.flow || 0, "L’impatto delle tue barre e la credibilità.") +
        stat("intervista", "Scrittura", sk.scrittura || 0, "Pezzi che la gente ricorda.") +
        stat("fiato", "Energia", G.energy || 0, "Quanto resti efficace fino alla chiusura.") +
      '</div></div>' +
      '<div class="cc-pan2"><h3 class="cc-h">Ricompense possibili <small>' + (tipo === "live" ? "Live" : "Open Mic") + '</small></h3><div class="cc-rics">' +
        ric("gente", "Fan", "+" + fanDa + " / +" + fanA) +
        ric("soldi", "Soldi", euroA ? "€ " + euroDa + " / € " + euroA : "—", euroA ? "" : "spento") +
        ric("mic", "Carisma", "sale col palco") +
        ric("mano", "La gente", "chi ti conosce guarda") +
      '</div><p class="cc-nota">' + ccIco("info") + 'Le ricompense dipendono da come va la serata e dalla reazione del pubblico.</p></div>' +
    '</section>' +
  '</div>';
}

/* ==================== IL BACKSTAGE ==================== */
const CC_BS_ICO = {presentati:"bolla", networking:"gente", contatto:"numero", collab:"nota", osserva:"occhio"};
const CC_OSPITE_VOLTO = [7, 3, 6, 5, 4];
function ccOspiteFaccia(o){
  const i = CC_OSPITI.indexOf(o);
  return '<img class="cc-volto" src="' + CIRCOLO_FOTO + 'volti/' + CC_VOLTI[CC_OSPITE_VOLTO[i % CC_OSPITE_VOLTO.length]] + '" alt="" loading="lazy" decoding="async">';
}
function ccFanFaccia(fan){
  return '<img class="cc-volto" src="' + CIRCOLO_FOTO + 'volti/' + CC_VOLTI[fan.volto] + '" alt="" loading="lazy" decoding="async">';
}
function ccBackstage(f){
  const aperto = circoloBackstageAperto();
  const o = circoloOspite();
  const gente = circoloBackstageGente();
  const fans = circoloFan();
  const oggi = circoloOggi();
  /* chi è scelto: l'artista, uno del giro o un fan */
  let sel = CIRCOLO.bsSel || "ospite";
  const fan = fans.find(x => x.id === sel);
  if(sel === "ospite" && !o) sel = gente[0] ? gente[0].id : fans[0] ? fans[0].id : null;
  if(sel && sel !== "ospite" && !fan && !gente.some(p => p.id === sel)) sel = o ? "ospite" : gente[0] ? gente[0].id : fans[0] ? fans[0].id : null;
  CIRCOLO.bsSel = sel;
  const fino = (i) => ["01:00", "02:00", "01:30", "03:00"][i % 4];
  const riga = (id, foto, n, ruolo, d, ora) => '<button type="button" class="cc-pers' + (sel === id ? " on" : "") + '" data-cc-bs="' + id + '">' +
    '<span class="cc-pfoto">' + foto + '</span><span class="cc-ptx"><b>' + n + '</b><em>' + ruolo + '</em><i>' + d + '</i></span>' +
    (ora ? '<span class="cc-fino"><em>Qui fino alle</em><b><i></i>' + ora + '</b></span>' : "") + '</button>';
  const persone = (o ? riga("ospite", ccOspiteFaccia(o), ccEsc(o.n), ccIco("fuoco") + ccEsc(o.r), ccEsc(o.d), o.fino) : "") +
    gente.map((p, i) => riga(p.id, ccFaccia(p), ccEsc(p.n), ccRuolo(p), ccEsc((POSTO_RUOLI[p.ruolo] || {d:""}).d), fino(i))).join("");
  const fanRighe = fans.map(x => riga(x.id, ccFanFaccia(x), ccEsc(x.n), "Ti segue", oggi.fan[x.id] ? "Ci hai già parlato, stasera." : "È venuto per te.", "")).join("");

  /* la scheda di chi è scelto */
  let scheda;
  if(!aperto){
    scheda = ccVuoto("Il backstage apre con la serata, alle 21:00. Prima ci sono solo le casse e il fonico che prova i cavi.");
  } else if(fan || (sel && fans.some(x => x.id === sel))){
    const x = fan || fans.find(y => y.id === sel);
    const fatto = oggi.fan[x.id];
    scheda = '<div class="cc-bscard">' +
      '<div class="cc-bsfoto">' + ccFanFaccia(x) + '</div>' +
      '<div class="cc-bstx"><h3>' + ccEsc(x.n) + '</h3><em class="cc-fan">' + ccIco("cuore") + 'Ti segue</em>' +
        '<p class="cc-fsi"><b>Cosa funziona:</b> ' + ccEsc(x.si) + '</p>' +
        '<p class="cc-fno"><b>Cosa no:</b> ' + ccEsc(x.no) + '</p></div>' +
      '<div class="cc-bsaz">' +
        (fatto ? '<p class="cc-sotto">' + (fatto === "foto" ? "Avete fatto la foto." : "Ti ha detto il perché, e te lo sei segnato.") + '</p>'
          : '<button type="button" class="cc-bsrow" data-cc-fan="' + x.id + '" data-fan="foto"><i>' + ccIco("foto") + '</i><span><b>Ringrazia e fate una foto</b><em>La posta stanotte: un punto di hype, qualche fan.</em></span><s>' + ccIco("freccia") + '</s></button>' +
            '<button type="button" class="cc-bsrow" data-cc-fan="' + x.id + '" data-fan="critica"><i>' + ccIco("orecchio") + '</i><span><b>Chiedi cosa cambierebbe</b><em>La critica, nel dettaglio: ti insegna qualcosa.</em></span><s>' + ccIco("freccia") + '</s></button>') +
        ccDettoRiga() + '</div></div>';
  } else if(sel === "ospite" && o){
    scheda = '<div class="cc-bscard">' +
      '<div class="cc-bsfoto">' + ccOspiteFaccia(o) + '</div>' +
      '<div class="cc-bstx"><h3>' + ccEsc(o.n) + ' <span class="cc-fuoco">' + ccIco("fuoco") + '</span></h3><em>' + ccEsc(o.r) + '</em>' +
        '<p class="cc-disp"><i></i>' + (oggi.ospite.notato ? "Ti ha notato" : "Disponibile ora") + '</p><p>' + ccEsc(o.bio) + '</p>' +
        '<div class="cc-tag">' + o.tag.map(t => '<span>' + ccEsc(t) + '</span>').join("") + '</div></div>' +
      '<div class="cc-bsaz">' + circoloBackstageMosse("ospite").map(m => ccRigaBs(m)).join("") + ccDettoRiga() + '</div></div>';
  } else if(sel){
    const p = (G.gente || []).find(x => x.id === sel);
    scheda = '<div class="cc-bscard">' +
      '<div class="cc-bsfoto">' + ccFaccia(p) + '</div>' +
      '<div class="cc-bstx"><h3>' + ccEsc(p.n) + '</h3><em>' + ccRuolo(p) + '</em>' + ccRelBadge(p) +
        '<p>' + ccEsc(ccCitazione(p)) + '</p></div>' +
      '<div class="cc-bsaz">' + circoloBackstageMosse(p.id).map(m => ccRigaBs(m)).join("") + ccDettoRiga() + '</div></div>';
  } else {
    scheda = ccVuoto("Stasera nel backstage non c’è nessuno che conosci.");
  }

  const occ = circoloOccasioni();
  const prob = circoloOspiteProb();
  const prestigio = o ? o.fama : 0;
  const rischio = o ? Math.round((1 - prob) * 100) : 0;
  const livello = v => v >= 70 ? "Alto" : v >= 40 ? "Medio" : "Basso";
  return '<div class="cc-back">' + ccSfondo(CIRCOLO_FOTO + "stanze/backstage.jpg") +
    '<section class="cc-bksx">' + ccBriciole("backstage") + ccTitolo("backstage", "grande") +
      '<p class="cc-bkdesc">Qui nascono i contatti, le collaborazioni e le opportunità più importanti. Parla con gli artisti, con la gente del giro e con chi è venuto per te.</p>' +
      '<div class="cc-pan2"><h3 class="cc-h">Persone presenti</h3><div class="cc-scorri">' +
        (aperto ? (persone || ccVuoto("Nessuno del giro, stasera.")) +
          (fans.length ? '<h4 class="cc-h4 cc-fanh">' + ccIco("cuore") + 'I tuoi fan</h4>' + fanRighe
            : '<p class="cc-sotto cc-fanh">I tuoi fan arrivano quando hai un pezzo fuori.</p>')
          : ccVuoto("Apre con la serata, alle 21:00.")) +
      '</div></div>' +
    '</section>' +
    '<section class="cc-bkmid">' + scheda + '</section>' +
    '<section class="cc-bkdx">' +
      '<div class="cc-pan2"><h3 class="cc-h">' + ccIco("stella") + 'Occasioni della serata</h3><ul class="cc-occ">' +
        (occ.length ? occ.map(x => '<li><i>' + ccIco(x.ic) + '</i><span><b>' + x.n + '</b><em>' + ccEsc(x.d) + '</em></span><u>' + x.p + '</u></li>').join("")
          : '<li class="vuota"><span><em>' + (aperto ? "Stasera niente di speciale: costruisci rapporti." : "Le occasioni arrivano con la serata.") + '</em></span></li>') +
      '</ul></div>' +
      '<div class="cc-pan2"><h3 class="cc-h">' + ccIco("lucchetto") + 'Possibili sblocchi</h3><ul class="cc-occ">' +
        circoloSblocchi().map(x => '<li class="' + (x.ok ? "ok" : "chiuso") + '"><i>' + ccIco(x.ic) + '</i><span><b>' + ccEsc(x.n) + '</b><em>' + x.d + '</em></span>' + (x.ok ? "" : '<s>' + ccIco("lucchetto") + '</s>') + '</li>').join("") +
      '</ul></div>' +
      '<div class="cc-pan2"><h3 class="cc-h">' + ccIco("bilancia") + 'Rischio / Prestigio</h3>' +
        '<div class="cc-rp"><b>' + ccIco("stella") + 'Prestigio</b><span><i class="v" style="width:' + prestigio + '%"></i></span><em class="v">' + (o ? livello(prestigio) : "—") + '</em></div>' +
        '<div class="cc-rp"><b>' + ccIco("rischio") + 'Rischio</b><span><i class="r" style="width:' + rischio + '%"></i></span><em class="r">' + (o ? livello(rischio) : "—") + '</em></div>' +
        '<p class="cc-sotto">Comportati in modo professionale. Qui le opportunità sono reali, ma anche la concorrenza è alta.</p></div>' +
    '</section>' +
  '</div>';
}
function ccRigaBs(m){
  return '<button type="button" class="cc-bsrow' + (m.puo ? "" : " no") + '" data-cc-bsm="' + m.id + '"' + (m.puo ? "" : " disabled") + '>' +
    '<i>' + ccIco(CC_BS_ICO[m.id] || "bolla") + '</i><span><b>' + m.n + '</b><em>' + ccEsc(m.puo ? m.d + " · " + m.costo : m.perche + ".") + '</em></span>' +
    '<s>' + ccIco("freccia") + '</s></button>';
}
