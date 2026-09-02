/* Il telefono della plancia.

   Sotto i 1180px di finestra resta quello di sempre: una colonna che scorre
   con i messaggi, la griglia di app e le notizie (renderTelefonoVecchio,
   HUB_APP_VECCHIO — non li tocca nessuno, byte per byte quello che c'era).

   Dai 1180px in su diventa un iPhone vero: schermata home con widget veri,
   griglia di icone, dock, e ogni app che si apre a schermo pieno dentro alla
   cornice, con la sua interfaccia e un modo per tornare alla home (il
   pallino/barra in basso, o Esc). hub.js chiama solo renderTelefono(). */
"use strict";

HIC.camera = '<path d="M4 7h3l1.6-2.2h6.8L17 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zm8 3a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8zm0 2.2a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4zM17 8.4a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8z"/>';

const TEL_SOGLIA = 1180;
const telPC = () => window.innerWidth >= TEL_SOGLIA;
const tronca = (s, n) => (s && s.length > n) ? s.slice(0, n - 1) + "…" : (s || "");

/* Messaggi = persone che ti scrivono. Il diario generale G.log NON è una
   casella messaggi: esiti, skip ed eventi di sistema appartengono a Diario /
   Notifiche. Questa separazione evita che ogni evento sembri un DM. */
function telMessaggiDiretti(){
  if(typeof chatAttivi !== "function" || !G.chat) return [];
  return chatAttivi().map(c => {
    const t = G.chat[c.id];
    if(!t || !Array.isArray(t.msgs) || !t.msgs.length) return null;
    const ultimo = t.msgs[t.msgs.length - 1];
    return {
      id:c.id, n:c.n,
      t:String((ultimo && ultimo.testo) || ""),
      w:Number((ultimo && ultimo.s) || 0),
      nonLetti:Number(t.nonLetti || 0)
    };
  }).filter(Boolean).sort((a,b) => b.w - a.w);
}
function telMessaggiNonLetti(){
  return telMessaggiDiretti().reduce((n,m) => n + m.nonLetti, 0);
}

let TEL_APP = null;        /* id dell'app aperta, null = sei alla home */
let TEL_ORIGIN = null;     /* da dove parte l'animazione di apertura */
let TEL_INVTAB = "bars";   /* linguetta aperta dentro Inventario */
let TEL_MODO_PC = telPC();

/* ================= LE APP — VECCHIO (sotto i 1180px, invariato) ================= */
const HUB_APP_VECCHIO = [
  {id:"contatti", n:"Contatti", ic:"gente", k:"#38BDF8",
   sotto:g => (g.gente || []).filter(p => !p.via && p.rel >= 1).length + " conosciuti",
   vai:() => apriPosto()},
  {id:"obiettivi", n:"Obiettivi", ic:"mirino", k:"#EF4444",
   sotto:g => GOALS.filter(x => !g.goals[x.id]).length + " aperti",
   vai:() => hubGioco("obiettivi")},
  {id:"notizie", n:"Notizie", ic:"giornale", k:"#60A5FA",
   sotto:() => HUB_NOTIZIE.length + " questa settimana", vai:() => hubNotizie()},
  {id:"inventario", n:"Inventario", ic:"zaino", k:"#F59E0B",
   sotto:g => (g.bars.length + g.beats.length + g.songs.length + Object.keys(g.gear).length) + " cose",
   vai:() => hubGioco("catalogo", "mat")},
  {id:"statistiche", n:"Statistiche", ic:"barre", k:"#4ADE80",
   vai:() => { hubGioco("settimana"); const d = $("g-dett");
     if(d && d.getAttribute("aria-expanded") !== "true") d.click(); }},
  {id:"classifiche", n:"Classifiche", ic:"coppa", k:"#FACC15",
   vai:() => hubGioco("classifica")},
  {id:"agenda", n:"Agenda", ic:"agenda", k:"#F87171",
   sotto:() => ACTIONS.filter(a => !a.avail || a.avail()).length + " mosse oggi",
   vai:() => hubGioco("settimana")},
  {id:"impostazioni", n:"Impostazioni", ic:"ingranaggio", k:"#9AA1B2",
   vai:() => { if(window.IMPOSTAZIONI) window.IMPOSTAZIONI(); }}
];

/* ================= LE APP — NUOVO (home dell'iPhone) ================= */
/* Badge = un numero rosso sull'icona, solo dove ha senso «novità»: messaggi
   non letti, obiettivi ancora aperti, notizie della settimana. Il resto
   dell'app si vede aprendola, non prima. */
const HUB_APP = [
  {id:"messaggi", n:"Messaggi", ic:"chat", k:"#7C3AED",
   badge:() => telMessaggiNonLetti()},
  {id:"contatti", n:"Contatti", ic:"gente", k:"#38BDF8"},
  /* punto 66: mamma e il migliore amico scrivono da subito, il resto arriva con la fama */
  {id:"chat", n:"Chat", ic:"duebolle", k:"#25D366", badge:() => chatNonLetti()},
  {id:"lafamegram", n:"LaFamegram", ic:"camera", k:"#D62976"},
  {id:"notizie", n:"Notizie", ic:"giornale", k:"#60A5FA", badge:() => HUB_NOTIZIE.length},
  {id:"obiettivi", n:"Obiettivi", ic:"mirino", k:"#EF4444",
   badge:g => GOALS.filter(x => !g.goals[x.id]).length},
  {id:"inventario", n:"Inventario", ic:"zaino", k:"#F59E0B"},
  {id:"statistiche", n:"Statistiche", ic:"barre", k:"#4ADE80"},
  {id:"classifiche", n:"Classifiche", ic:"coppa", k:"#FACC15"},
  {id:"agenda", n:"Agenda", ic:"agenda", k:"#F87171"},
  {id:"impostazioni", n:"Impostazioni", ic:"ingranaggio", k:"#9AA1B2"}
];
const TEL_DOCK = ["messaggi", "contatti", "lafamegram", "classifiche"];
const TEL_RUOLI = {beatmaker:"Beatmaker", rapper:"Rapper", fonico:"Fonico", giornalista:"Giornalista"};

/* ================= DATI CONDIVISI (widget + app) ================= */
/* Stessa classifica che vedi nella scheda «Classifica» della partita
   (ui.js): qui si legge soltanto, non si tocca G.chartPrev — lo aggiorna
   già la scheda quando la apri. */
function telClassifica(){
  const art = window.ARTIST || {};
  const my = G.songs.filter(x => x.released).reduce((a, x) => a + (x.last || 0), 0);
  sistemaRivali();
  const all = G.rivals.map(r => ({n:r.n, p:r.p, r}))
    .concat([{n:(art.name || "Tu").trim(), p:my, me:true}]);
  all.sort((a, b) => b.p - a.p);
  const pos = all.findIndex(x => x.me) + 1;
  return {all, pos, delta:(G.chartPrev || 99) - pos};
}

/* ================= LAFAMEGRAM — IL FEED (punti 52, 53) =================
   Il vero motore è sul server (`GET /api/feed`, backend/database/archivio.js
   `feed()`): post del mondo più, se hai un artista, chi ti ha appena
   passato e chi hai passato tu — non finti a caso, presi dagli stream veri
   di chi li scrive. Qui si tiene solo l'ultima risposta e si ridisegna
   quando arriva; se il server non risponde (o non è acceso) si torna ai
   post presi dal diario, stessa forma, senza che si veda la giuntura —
   la regola del ponte (online.js) vale anche qui. */
let TEL_FEED = null;
let TEL_FEED_IN_CORSO = false;
function telAggiornaFeed(){
  if(TEL_FEED_IN_CORSO || typeof ONLINE === "undefined") return;
  TEL_FEED_IN_CORSO = true;
  ONLINE.feed(24).then(r => {
    TEL_FEED_IN_CORSO = false;
    if(!r || r.errore || !Array.isArray(r.post) || !r.post.length) return;
    TEL_FEED = r.post.map(p => ({
      n:p.n, t:spoglia(p.t), w:"Settimana " + p.s, like:Math.max(0, Math.round(p.like || 0)),
      mia:false
    }));
    if(telPC() && (!TEL_APP || TEL_APP === "lafamegram")) renderTelefono();
  });
}

/* Post presi dalla vita vera della carriera (il diario) più un paio di
   voci della piazza, prese dalle notizie — il ripiego locale, e quello che
   si vede finché il feed vero non è ancora arrivato. */
function telPostLocale(){
  const art = window.ARTIST || {};
  const nome = (art.name || "Tu").trim() || "Tu";
  const buoni = G.log.filter(m => m.c === "good").slice(0, 6);
  const base = (buoni.length ? buoni : G.log.slice(0, 4)).map((m, i) => ({
    n:nome, t:spoglia(m.t), w:m.w, mia:true,
    like:Math.round(35 + G.hype * 4 + (6 - i) * 14)
  }));
  HUB_NOTIZIE.slice(0, 2).forEach((n, i) => base.push({
    n:"La Voce del Giro", t:n.t, w:"in giro", mia:false, like:Math.round(18 + i * 9)
  }));
  return base.length ? base
    : [{n:nome, t:"Ancora niente qui. Pubblica un pezzo e fatti sentire.", w:"—", mia:true, like:0}];
}
/* I post scritti di tuo pugno (punto 52: «generati e caricati dagli
   utenti», non solo automatici) stanno per conto loro in G — davanti a
   tutto il resto, sempre, che sia arrivato il feed vero o no: è roba tua,
   non deve sparire quando risponde il server. Restano sul dispositivo
   finché il server non ha un posto dove metterli (serve un endpoint che
   ancora non c'è, vedi la nota nel file delle implementazioni). */
function telScrivi(testo){
  const t = spoglia(String(testo || "")).trim().slice(0, 220);
  if(!t) return false;
  const art = window.ARTIST || {};
  G.lafamegramMiei.unshift({
    n:(art.name || "Tu").trim() || "Tu", t, w:"adesso",
    like:Math.round(8 + G.hype * 0.6 + rnd(0, 12)), mia:true
  });
  if(G.lafamegramMiei.length > 30) G.lafamegramMiei.length = 30;
  save();
  return true;
}
/* Quello che il resto di telefono.js chiama: i tuoi post scritti a mano,
   poi il feed vero se c'è già risposto, il ripiego locale se no. L'ordine
   è cronologico (come un feed vero, punto 53) — chi vuole il post più in
   vista lo cerca da sé (telPostTop), non è detto sia il primo della lista. */
function telPost(){
  if(TEL_FEED === null) telAggiornaFeed();
  const base = (TEL_FEED && TEL_FEED.length) ? TEL_FEED : telPostLocale();
  /* i tuoi post, poi quelli che nascono dagli incontri per strada (punto
     54 — la foto col fan, il pezzo del giornalista...), poi il resto */
  const miei = G.lafamegramMiei || [], eventi = G.lafamegramEventi || [];
  return miei.concat(eventi, base);
}
const telPostTop = () => telPost().slice().sort((a, b) => b.like - a.like)[0];

function golPremio(rw){
  const bits = [];
  if(rw.hype) bits.push("+" + rw.hype + " hype");
  if(rw.money) bits.push("+" + fmt(rw.money) + " €");
  if(rw.wellbeing) bits.push("+" + rw.wellbeing + " benessere");
  return bits.length ? bits.join(" · ") : "aperto";
}

/* ================= RENDER — INGRESSO UNICO ================= */
function renderTelefono(){
  if(!telPC()){ TEL_APP = null; renderTelefonoVecchio(); return; }
  renderTelefonoHome();
}

function renderTelefonoVecchio(){
  const nuovi = Math.max(0, G.log.length - (G.seenLog || 0));
  const msg = G.log.slice(0, 2);
  $("hb-tel").className = "ptelscr";
  $("hb-tel").innerHTML =
    '<span class="ptt">Il tuo telefono</span>' +
    '<div class="pmsg">' +
      '<div class="pmsghead">' + hsvg("chat") + '<b>Messaggi</b>' +
        (nuovi ? '<span class="pnuovi">' + nuovi + ' nuovi</span>' : '') + '</div>' +
      (msg.length ? msg.map(m =>
        '<button class="pmr" data-diario="1">' +
          '<span class="pmav">' + hsvg("persona") + '</span>' +
          '<span class="pmtx"><b>Diario</b><i>' + spoglia(m.t) + '</i></span>' +
          '<span class="pmrt">' + m.w + (nuovi ? '<u></u>' : '') + '</span>' +
        '</button>').join("")
        : '<div class="pmr"><span class="pmtx"><i>Ancora niente. Muoviti, e qualcosa succede.</i></span></div>') +
    '</div>' +
    '<button class="plargo" data-diario="1">Vedi tutti i messaggi</button>' +
    '<div class="papp">' + HUB_APP_VECCHIO.map(a =>
      '<button class="pap" data-app="' + a.id + '" style="--k:' + a.k + '">' + hsvg(a.ic) +
      '<span><b>' + a.n + '</b>' + (a.sotto ? '<i>' + a.sotto(G) + '</i>' : '') + '</span></button>').join("") +
    '</div>' +
    '<div class="pnews"><h4>Notizie della settimana</h4>' +
      HUB_NOTIZIE.map(n => '<p style="--k:' + n.k + '">' + hsvg(n.ic) + n.t + '</p>').join("") +
    '</div>' +
    '<button class="plargo" data-news="1">Vedi tutte le notizie</button>';
}

/* ================= RENDER — HOME NUOVA ================= */
function renderTelefonoHome(){
  const el = $("hb-tel");
  el.className = "ptelscr";
  const messaggiDiretti = telMessaggiDiretti();
  const nuoviMsg = telMessaggiNonLetti();
  const ultimoMsg = messaggiDiretti[0] || null;
  const cl = telClassifica();
  const top = telPostTop();

  const widgets =
    '<button class="twid twid-lg" data-app="lafamegram">' +
      '<span class="twhead">' + hsvg("fama") + 'LaFamegram · più hype</span>' +
      '<span class="twbody"><b>' + top.n + '</b><i>' + tronca(top.t, 52) + '</i></span>' +
      '<span class="twfoot">' + hsvg("cuore") + ' ' + top.like + '</span></button>' +
    '<div class="twrow">' +
      '<button class="twid" data-app="classifiche">' +
        '<span class="twhead">' + hsvg("coppa") + 'Classifica</span>' +
        '<span class="twnum">#' + cl.pos + '</span>' +
        '<span class="twfoot' + (cl.delta > 0 ? ' up' : cl.delta < 0 ? ' dn' : '') + '">' +
          (cl.delta > 0 ? '▲ ' + cl.delta : cl.delta < 0 ? '▼ ' + (-cl.delta) : '— stabile') +
        '</span></button>' +
      '<button class="twid" data-app="messaggi">' +
        '<span class="twhead">' + hsvg("chat") + 'Messaggi</span>' +
        '<span class="twbody"><i>' + (ultimoMsg ? tronca(spoglia(ultimoMsg.t), 38) : "Nessun messaggio diretto") + '</i></span>' +
        (nuoviMsg ? '<span class="twfoot up">' + nuoviMsg + ' nuovi</span>' : '') +
      '</button>' +
    '</div>';

  const inDock = id => TEL_DOCK.indexOf(id) >= 0;
  const iconaApp = a => {
    const n = a.badge ? a.badge(G) : 0;
    return '<button class="tapp" data-app="' + a.id + '" style="--k:' + a.k + '">' +
      '<span class="tappic">' + hsvg(a.ic) + (n ? '<i class="tbadge">' + (n > 9 ? "9+" : n) + '</i>' : '') + '</span>' +
      '<span class="tapplbl">' + a.n + '</span></button>';
  };
  const griglia = HUB_APP.filter(a => !inDock(a.id)).map(iconaApp).join("");
  const dock = TEL_DOCK.map(id => iconaApp(HUB_APP.find(a => a.id === id))).join("");

  el.innerHTML =
    '<div class="thome">' +
      '<div class="twidgets">' + widgets + '</div>' +
      '<div class="tgrid">' + griglia + '</div>' +
      '<div class="tdock">' + dock + '</div>' +
    '</div>' +
    (TEL_APP ? schermataWrap(TEL_APP) : '');
}

function schermataWrap(id){
  const a = HUB_APP.find(x => x.id === id);
  return '<div class="tscreen" style="--ox:' + (TEL_ORIGIN ? TEL_ORIGIN.x : "50%") +
    ';--oy:' + (TEL_ORIGIN ? TEL_ORIGIN.y : "50%") + ';transform-origin:var(--ox) var(--oy)">' +
    '<div class="tscreenhead"><button class="tback" data-home="1" aria-label="Home"></button>' +
      '<b>' + (a ? a.n : "") + '</b></div>' +
    '<div class="tscreenbody">' + schermataApp(id) + '</div>' +
    '<button class="tgest" data-home="1" aria-label="Torna alla home"></button>' +
  '</div>';
}

function schermataApp(id){
  if(id === "messaggi") return schermataMessaggi();
  if(id === "contatti") return schermataContatti();
  if(id === "notizie") return schermataNotizie();
  if(id === "obiettivi") return schermataObiettivi();
  if(id === "inventario") return schermataInventario();
  if(id === "statistiche") return schermataStatistiche();
  if(id === "classifiche") return schermataClassifiche();
  if(id === "agenda") return schermataAgenda();
  if(id === "impostazioni") return schermataImpostazioni();
  if(id === "lafamegram") return schermataLafamegram();
  if(id === "chat") return TEL_CHAT_APERTA ? schermataChatThread() : schermataChat();
  return "";
}

/* ---- Messaggi: solo messaggi di persone, mai il diario G.log ---- */
function schermataMessaggi(){
  const msg = telMessaggiDiretti();
  if(!msg.length) return '<div class="tempty">Nessun messaggio diretto. Gli eventi automatici li trovi in Notifiche.</div>';
  return '<div class="tlist">' + msg.map(m =>
    '<button class="tli" data-chat="' + m.id + '">' +
    '<span class="tliav">' + hsvg("persona") + '</span>' +
    '<span class="tlitx"><b>' + m.n + '</b><i style="white-space:normal">' + spoglia(m.t) + '</i></span>' +
    (m.nonLetti ? '<span class="ttag on">' + m.nonLetti + ' nuovi</span>' : '') +
    '</button>').join("") + '</div>';
}

/* ---- Contatti: la rete vera, con grado e ruolo ---- */
function schermataContatti(){
  const vivi = (G.gente || []).filter(p => !p.via);
  if(!vivi.length) return '<div class="tempty">Nessun contatto ancora. Passa dalla Sala, dietro al bar centrale.</div>' +
    '<button class="tbtn" data-posto="1">Vai alla Sala</button>';
  return '<div class="tlist">' + vivi.map(p =>
    '<button class="tli" data-posto="1">' +
      '<span class="tliav" style="--k:' + p.col + '">' + hsvg("persona") + '</span>' +
      '<span class="tlitx"><b>' + p.n + '</b><i>' + (TEL_RUOLI[p.ruolo] || p.ruolo) + ' · ' + REL_NOMI[p.rel] + '</i></span>' +
      '<span class="tliv">' + hsvg("fama") + Math.round(p.fama) + '</span></button>').join("") +
    '</div><button class="tbtn" data-posto="1">Vai alla Sala</button>';
}

/* ---- Notizie ---- */
function schermataNotizie(){
  return '<div class="tlist">' + HUB_NOTIZIE.map(n =>
    '<div class="tli static"><span class="tliav" style="--k:' + n.k + '">' + hsvg(n.ic) + '</span>' +
    '<span class="tlitx"><b style="white-space:normal">' + n.t + '</b></span></div>').join("") + '</div>';
}

/* ---- Obiettivi ---- */
function schermataObiettivi(){
  return '<div class="tlist">' + GOALS.map(g2 => {
    const fatto = !!G.goals[g2.id];
    return '<div class="tli static' + (fatto ? " fatto" : "") + '">' +
      '<span class="tliav">' + hsvg("mirino") + '</span>' +
      '<span class="tlitx"><b>' + g2.n + '</b><i style="white-space:normal">' + g2.d + '</i></span>' +
      '<span class="ttag' + (fatto ? " on" : "") + '">' + (fatto ? "fatto" : golPremio(g2.rw)) + '</span></div>';
  }).join("") + '</div>';
}

/* ---- Inventario: quattro linguette, come nel catalogo vero ---- */
function schermataInventario(){
  const tabs = [["bars", "Bars", G.bars.length], ["beats", "Beat", G.beats.length],
    ["songs", "Pezzi", G.songs.length], ["gear", "Attrezz.", GEAR.filter(x => G.gear[x.id]).length]];
  const nav = '<div class="tsub">' + tabs.map(([id, n, c]) =>
    '<button class="tsubb' + (TEL_INVTAB === id ? " on" : "") + '" data-inv="' + id + '">' +
    n + ' (' + c + ')</button>').join("") + '</div>';
  let corpo = '<div class="tempty">Niente qui ancora.</div>';
  if(TEL_INVTAB === "bars" && G.bars.length) corpo = '<div class="tlist">' + G.bars.map(b =>
    '<div class="tli static"><span class="tliav">' + hsvg("matita") + '</span>' +
    '<span class="tlitx"><b>' + (b.tema || "Barre") + '</b><i>' + tronca(spoglia(b.txt || ""), 58) + '</i></span>' +
    '<span class="tliv">' + Math.round(b.q) + '</span></div>').join("") + '</div>';
  else if(TEL_INVTAB === "beats" && G.beats.length) corpo = '<div class="tlist">' + G.beats.map(b =>
    '<div class="tli static"><span class="tliav">' + hsvg("nota") + '</span>' +
    '<span class="tlitx"><b>' + b.n + '</b><i>' + (b.gen || "") + '</i></span>' +
    '<span class="tliv">' + Math.round(b.q) + '</span></div>').join("") + '</div>';
  else if(TEL_INVTAB === "songs" && G.songs.length) corpo = '<div class="tlist">' + G.songs.map(s =>
    '<div class="tli static"><span class="tliav">' + hsvg("mic") + '</span>' +
    '<span class="tlitx"><b>' + s.t + '</b><i>' + (s.released ? short(s.streams || 0) + " stream" : "In lavorazione") +
    '</i></span><span class="tliv">' + Math.round(s.q) + '</span></div>').join("") + '</div>';
  else if(TEL_INVTAB === "gear"){
    const posseduta = GEAR.filter(g2 => G.gear[g2.id]);
    if(posseduta.length) corpo = '<div class="tlist">' + posseduta.map(g2 =>
      '<div class="tli static"><span class="tliav">' + hsvg("manopole") + '</span>' +
      '<span class="tlitx"><b>' + g2.n + '</b><i>' + g2.d + '</i></span></div>').join("") + '</div>';
  }
  return nav + corpo;
}

/* ---- Statistiche: gli stessi numeri della testata e dei dettagli ---- */
function schermataStatistiche(){
  const lb = lifeBonus();
  const righe = [
    ["energia", "#FACC15", "Energia", G.energy + " / " + G.maxEnergy, G.energy / G.maxEnergy * 100],
    ["cuore", "#EF4444", "Benessere", Math.round(G.wellbeing), G.wellbeing],
    ["luna", "#818CF8", "Lucidità", Math.round(luc()), luc()],
    ["hype", "#FB923C", "Hype", Math.round(G.hype), null],
    ["fama", "#FBBF24", "Fan", short(G.fans), null],
    ["soldi", "#4ADE80", "Soldi", fmt(G.money) + " €", null],
    ["gente", "#60A5FA", "Network", Math.round(G.skills.rete), null]
  ];
  const stat = righe.map(([ic, k, n, v, barra]) => rigaStat(ic, k, n, v, barra)).join("");
  const extra = '<div class="tnote"><b>' + fmt(weeklyCosts()) + ' €</b> a settimana di spese' +
    (lb.hype ? ', +' + lb.hype + ' hype dal lifestyle' : '') +
    (G.obligation ? '<br>Devi consegnare ' +
      (G.obligation.need - G.songs.filter(x => x.released && x.week > G.obligation.from).length) +
      ' uscite in ' + G.obligation.left + ' settimane.' : '') + '</div>';
  return extra + '<div class="tlist tlist-stat">' + stat + '</div>';
}

/* ---- Classifiche: la stessa classifica della scheda, top 10 ---- */
function schermataClassifiche(){
  const cl = telClassifica();
  const righe = cl.all.slice(0, 10).map((x, i) => {
    const pos = i + 1;
    return '<div class="tli static' + (x.me ? " me" : "") + '">' +
      '<span class="tlipos">' + pos + '</span>' +
      '<span class="tlitx"><b>' + (x.me ? ((window.ARTIST || {}).name || "Tu") : x.n) + '</b>' +
      (x.me ? '' : '<i>' + (x.r.eta ? x.r.eta + ' anni · ' : '') + x.r.city + ' · ' + x.r.gen + '</i>') + '</span>' +
      '<span class="tliv">' + short(x.p) + '</span></div>';
  }).join("");
  return '<div class="tnote"><b>Sei ' + cl.pos + 'º</b>' +
    (cl.delta > 0 ? ', su di ' + cl.delta : cl.delta < 0 ? ', giù di ' + (-cl.delta) : ', stabile') +
    ' rispetto alla settimana scorsa.</div><div class="tlist">' + righe + '</div>';
}

/* ---- Agenda: gli eventi di stasera più le mosse disponibili ---- */
function schermataAgenda(){
  const oggi = HUB_EVENTI.map(e => {
    const st = (e.presto || e.posto || e.strada) ? {ok:true} : hubPronta(e.id);
    return '<button class="tli" data-evento="' + e.id + '"' + (st.ok ? '' : ' disabled') + '>' +
      '<span class="tliav" style="--k:' + e.k + '">' + hsvg(e.ic) + '</span>' +
      '<span class="tlitx"><b>' + e.n + '</b><i>' + e.d + '</i></span>' +
      '<span class="tliv">' + e.ora + '</span></button>';
  }).join("");
  const mosse = ACTIONS.filter(a => !a.avail || a.avail()).map(a => {
    const pronto = hubPronta(a.id);
    return '<button class="tli" data-azione="' + a.id + '"' + (pronto.ok ? '' : ' disabled') + '>' +
      '<span class="tlitx"><b>' + a.n + '</b><i>' + (pronto.ok ? a.d : pronto.perche) + '</i></span>' +
      '<span class="tliv">' + a.e + '⚡</span></button>';
  }).join("");
  return '<div class="tnote"><b>Stasera</b></div><div class="tlist">' + oggi + '</div>' +
    '<div class="tnote" style="margin-top:12px"><b>Le tue mosse</b></div><div class="tlist">' + mosse + '</div>';
}

/* ---- Impostazioni: le cose rapide, il resto nel pannello vero ---- */
function schermataImpostazioni(){
  return '<div class="tlist">' +
    '<button class="tli" data-toggleaudio="1"><span class="tliav">' + hsvg("nota") + '</span>' +
      '<span class="tlitx"><b>Audio</b><i>' + (SET.audio.on ? "Acceso" : "Spento") + '</i></span>' +
      '<span class="ttag' + (SET.audio.on ? " on" : "") + '">' + (SET.audio.on ? "on" : "off") + '</span></button>' +
    '<div class="tli static"><span class="tliav">' + hsvg("scudo") + '</span>' +
      '<span class="tlitx"><b>Difficoltà</b><i>' + SET.gioco.preset + '</i></span></div>' +
    '<div class="tli static"><span class="tliav">' + hsvg("giornale") + '</span>' +
      '<span class="tlitx"><b>Lingua</b><i>' + (SET.lingua === "en" ? "Inglese" : "Italiano") + '</i></span></div>' +
    '</div><button class="tbtn" data-impostazioni="1">Apri tutte le impostazioni</button>';
}

/* ---- LaFamegram: il finto Instagram, oggi con post veri della carriera ---- */
function schermataLafamegram(){
  return '<div class="tigscrivi">' +
      '<textarea id="tig-testo" maxlength="220" placeholder="A cosa stai pensando?"></textarea>' +
      '<button class="tbtn" id="tig-pubblica">Pubblica</button>' +
    '</div>' +
    '<div class="tig">' + telPost().map(p =>
    '<div class="tigpost' + (p.mia ? " mia" : "") + '">' +
      '<div class="tighead"><span class="tigav">' + hsvg("camera") + '</span><b>' + p.n + '</b>' +
        '<span class="tigw">' + p.w + '</span></div>' +
      '<div class="tigcap">' + p.t + '</div>' +
      '<div class="tigfoot">' + hsvg("cuore") + '<b>' + p.like + '</b></div>' +
    '</div>').join("") + '</div>';
}

/* ================= APRI / CHIUDI ================= */
function telApriApp(a, ev){
  const scr = $("hb-tel").getBoundingClientRect();
  if(ev && ev.currentTarget){
    const ic = ev.currentTarget.getBoundingClientRect();
    TEL_ORIGIN = {
      x:((ic.left + ic.width / 2 - scr.left) / scr.width * 100).toFixed(1) + "%",
      y:((ic.top + ic.height / 2 - scr.top) / scr.height * 100).toFixed(1) + "%"
    };
  } else TEL_ORIGIN = null;
  if(a.id === "lafamegram") telAggiornaFeed();   /* si riapre, si aggiorna: un feed vivo */
  TEL_APP = a.id;
  hubTap();
  renderTelefono();
}
function telHome(){
  const scr = document.querySelector(".tscreen");
  hubTap();
  TEL_CHAT_APERTA = null;
  if(scr){ scr.classList.add("tout"); setTimeout(() => { TEL_APP = null; renderTelefono(); }, 160); }
  else { TEL_APP = null; renderTelefono(); }
}

/* ================= COMANDI ================= */
$("hb-tel").addEventListener("click", ev => {
  if(ev.target.closest("[data-home]")){ telHome(); return; }
  const app = ev.target.closest("[data-app]");
  if(app){
    const a = (telPC() ? HUB_APP : HUB_APP_VECCHIO).find(x => x.id === app.dataset.app);
    if(!a) return;
    if(telPC()) telApriApp(a, ev); else { hubTap(); a.vai(); }
    return;
  }
  if(ev.target.closest("[data-diario]")){ GO("game"); renderGioco(); $("g-diary").click(); return; }
  if(ev.target.closest("[data-news]")){ hubTap(); hubNotizie(); return; }
  if(ev.target.closest("[data-posto]")){ hubTap(); apriPosto(); return; }
  if(ev.target.closest("#tig-pubblica")){
    const ta = $("tig-testo");
    if(ta && telScrivi(ta.value)){ hubTap(); renderTelefono(); }
    return;
  }
  if(ev.target.closest("[data-impostazioni]")){ if(window.IMPOSTAZIONI) window.IMPOSTAZIONI(); return; }
  if(ev.target.closest("[data-toggleaudio]")){
    SET.audio.on = !SET.audio.on; setSalva();
    if(typeof applicaImpostazioni === "function") applicaImpostazioni();
    renderTelefono(); return;
  }
  const inv = ev.target.closest("[data-inv]");
  if(inv){ TEL_INVTAB = inv.dataset.inv; hubTap(); renderTelefono(); return; }
  const chatOpen = ev.target.closest("[data-chat]");
  if(chatOpen){ TEL_APP = "chat"; TEL_CHAT_APERTA = chatOpen.dataset.chat; hubTap(); renderTelefono(); return; }
  if(ev.target.closest("[data-chathome]")){ TEL_CHAT_APERTA = null; hubTap(); renderTelefono(); return; }
  const chatOpt = ev.target.closest("[data-chatopt]");
  if(chatOpt){ hubTap(); chatRispondi(TEL_CHAT_APERTA, +chatOpt.dataset.chatopt); return; }
  const chatTu = ev.target.closest("[data-chattu]");
  if(chatTu){ hubTap(); chatIniziaTu(TEL_CHAT_APERTA, +chatTu.dataset.chattu); return; }
  const evb = ev.target.closest("[data-evento]");
  if(evb && !evb.disabled){
    const e = HUB_EVENTI.find(x => x.id === evb.dataset.evento); if(!e) return;
    hubTap();
    if(e.posto) apriPosto();
    else if(e.strada) apriStrada();
    else if(e.presto) hubPresto(e.n, "Sta arrivando.");
    else hubAzione(e.id);
    return;
  }
  const azb = ev.target.closest("[data-azione]");
  if(azb && !azb.disabled){ hubTap(); hubAzione(azb.dataset.azione); }
});

document.addEventListener("keydown", ev => {
  if(ev.key === "Escape" && TEL_APP && telPC()) telHome();
});
window.addEventListener("resize", () => {
  const ora = telPC();
  if(ora !== TEL_MODO_PC){ TEL_MODO_PC = ora; TEL_APP = null; renderTelefono(); }
});

/* un feed vivo vuol dire che si muove anche se non lo riapri tu: un giro
   ogni due minuti, solo mentre il telefono nuovo è quello a video */
setInterval(() => { if(telPC()) telAggiornaFeed(); }, 120000);
