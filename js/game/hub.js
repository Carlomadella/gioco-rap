/* L'hub: la città di provincia, la schermata da cui si gioca.

   La mappa è la foto della città (media/photo/mappa_provincia.jpg, ritagliata
   dal concept): spilli e targhette stanno dentro all'immagine, qui sopra ci
   vanno solo le zone da toccare. Tutto il resto è vivo e legge la partita: la
   testata con chi sei e cosa hai, le linguette, l'obiettivo di adesso, le
   notizie e il telefono.
   I luoghi non rifanno il lavoro degli altri file: aprono la partita sulla
   sezione giusta. Quelli chiusi restano in vista e dicono cosa serve —
   il paese deve far vedere il mondo che aspetta. */
"use strict";

/* ================= ICONE ================= */
/* contenuto grezzo di un <svg viewBox="0 0 24 24">: si colora da fuori */
const HIC = {
  energia: '<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>',
  soldi: '<path fill-rule="evenodd" d="M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm9 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>',
  hype: '<path d="M12.6 2c.5 3.2-1.2 4.4-2.4 5.8C8.7 9.4 7.5 10.9 7.5 13a4.5 4.5 0 0 0 9 0c0-2-.9-3.6-2.1-5 .2 1.2-.3 2-1 2.4.5-3.3-.8-6.6-1.8-8.4z"/>',
  gente: '<path d="M9 11.4a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8zM2 19.4c0-3.5 3.1-5.6 7-5.6s7 2.1 7 5.6zm14.4-8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6zm.2 2.2c3 .2 5.4 1.9 5.4 4.6v1.2h-3.7c.1-2.6-.6-4.4-1.7-5.8z"/>',
  pin: '<path d="M12 2a7 7 0 0 1 7 7c0 5.2-7 13-7 13S5 14.2 5 9a7 7 0 0 1 7-7zm0 4.6A2.4 2.4 0 1 0 12 11.4 2.4 2.4 0 0 0 12 6.6z"/>',
  scatola: '<path d="M12 2 21 6.6v10.8L12 22 3 17.4V6.6zM5.8 7.5 12 10.7l6.2-3.2L12 4.3z"/>',
  mirino: '<path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 2.4a7.6 7.6 0 1 0 0 15.2 7.6 7.6 0 0 0 0-15.2zm0 3.2a4.4 4.4 0 1 1 0 8.8 4.4 4.4 0 0 1 0-8.8zm0 2.6a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z"/>',
  barre: '<path d="M4 20V10h4v10zm6 0V4h4v16zm6 0v-7h4v7z"/>',
  chat: '<path d="M4 3.5h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9.6L4 21z"/>'
};
const hsvg = (nome, cls) => '<svg class="' + (cls || "hicon") + '" viewBox="0 0 24 24" aria-hidden="true">' + HIC[nome] + '</svg>';

/* ================= I LUOGHI DELLA PROVINCIA ================= */
/* La mappa è la foto (media/photo/mappa_provincia.jpg): spilli e targhette sono
   dentro all'immagine, disegnati una volta e per sempre. Qui ci sta solo dove
   toccare — x, y, larghezza e altezza in percentuale dell'immagine, prese sulle
   targhette vere. Se un giorno la foto cambia, questi sei numeri si rifanno. */
const HUB_LUOGHI = [
  {id:"studio", n:"Studio", x:38.5, y:21, w:18.7, h:12.3,
   vai:() => hubGioco("settimana")},

  {id:"beatmaker", n:"Beat maker", x:2.1, y:33.7, w:21.5, h:15,
   vai:() => hubGioco("catalogo", "market")},

  {id:"criminali", n:"Attività criminali", x:69.8, y:35, w:26.1, h:14.7,
   vai:() => hubPresto("Attività criminali",
     "Il giro storto della provincia — colpi piccoli, soldi veloci, guai veri — " +
     "è il prossimo pezzo di mondo da aprire.")},

  {id:"vita", n:"Vita quotidiana", x:2.7, y:57.5, w:30.2, h:15,
   vai:() => hubGioco("lifestyle")},

  {id:"club", n:"Club & discoteche", x:60.1, y:62.5, w:24.4, h:11.5, chiuso:true},
  {id:"concerti", n:"Concerti", x:37.6, y:80.2, w:19.4, h:10.5, chiuso:true}
];

/* ================= LE LINGUETTE IN BASSO ================= */
const HUB_TABS = [
  {id:"mappa", n:"Mappa", ic:"pin", vai:() => {}},
  {id:"contatti", n:"Contatti", ic:"gente",
   vai:() => hubPresto("Contatti",
     "Producer, fonici, gente che organizza serate: la rubrica è il cuore del " +
     "gioco che viene. Per adesso i contatti crescono con la statistica «rete».")},
  {id:"inventario", n:"Inventario", ic:"scatola", vai:() => hubGioco("catalogo", "mat")},
  {id:"obiettivi", n:"Obiettivi", ic:"mirino", vai:() => hubGioco("obiettivi")},
  {id:"statistiche", n:"Statistiche", ic:"barre", vai:() => hubGioco("classifica")}
];

/* ================= L'OBIETTIVO DI ADESSO ================= */
/* Uno alla volta, il primo non ancora chiuso: la riga in basso deve dire una
   cosa sola, quella che stai inseguendo adesso. */
const HUB_OBIETTIVI = [
  {n:"Scrivi la tua prima strofa", ora:g => g.bars.length + g.songs.length, max:1},
  {n:"Compra il tuo primo beat",   ora:g => g.beats.length + g.songs.length, max:1},
  {n:"Registra un pezzo",          ora:g => g.songs.length, max:1},
  {n:"Pubblica 3 brani",           ora:g => g.songs.filter(s => s.released).length, max:3},
  {n:"Arriva a 500 fan",           ora:g => g.fans, max:500},
  {n:"Metti da parte 2.000 €",     ora:g => g.money, max:2000},
  {n:"Entra nella top 10",         ora:g => (g.best.chart <= 10 ? 1 : 0), max:1},
  {n:"Arriva a 10.000 fan",        ora:g => g.fans, max:10000},
  {n:"Portati a Milano",           ora:g => (g.phase >= 2 ? 1 : 0), max:1}
];

/* ================= LE NOTIZIE DEL PAESE ================= */
const HUB_NOTIZIE = [
  ["Nuovo freestyle contest in città!", "Partecipa e fatti notare."],
  ["Il locale sulla statale cerca gente", "Serate aperte, paga poco, ci si fa vedere."],
  ["Un producer è tornato in paese", "Dicono che lavori in una sala vera."],
  ["Radio locale: spazio ai nuovi", "Mandano in onda chi ha qualcosa di pronto."],
  ["Rissa fuori dal bar centrale", "In giro c'è aria pesante, occhio."],
  ["Mercatino del disco in piazza", "Vinili, cuffie, roba usata a poco."]
];

/* ================= APERTURE ================= */
/* Il luogo non rifà quello che sa già fare la partita: la apre sulla sezione
   giusta. Così l'hub resta la porta, e il gioco resta dov'è. */
function hubGioco(tab, sotto){
  GO("game");
  renderGioco();
  const nb = document.querySelector('.nb[data-t="' + tab + '"]');
  if(nb) nb.click();
  if(sotto){
    const sb = document.querySelector('.sb[data-s="' + sotto + '"]');
    if(sb) sb.click();
  }
  window.scrollTo({top:0});
}

function hubPresto(titolo, testo){
  showEvent({k:"Non ancora", t:titolo, d:testo, annulla(){},
    opts:[{n:"Va bene", d:"Torni alla mappa", run(){ return null; }}]});
}

function hubChiuso(l){
  hubPresto(l.n, "Questo posto in provincia non c'è. Si apre a <b>Milano</b>, e a Milano " +
    "ci si arriva con più cose insieme: <b>livello 10</b>, <b>fama 50</b>, <b>hype 40</b>.");
}

/* ================= DISEGNO ================= */
/* La foto ci sta dentro intera e senza deformarsi: si prende il lato che
   stringe di più. Le zone da toccare stanno in percentuale dentro alla foto,
   quindi basta che il riquadro sia giusto e sono giuste anche loro. */
function hubMisura(){
  const m = $("hb-map"), f = $("hb-foto");
  if(!m || !f) return;
  const k = Math.min(m.clientWidth / 582, m.clientHeight / 600);
  f.style.width = (582 * k) + "px";
  f.style.height = (600 * k) + "px";
}
window.addEventListener("resize", hubMisura);


function hubRes(k, ic, val){
  return '<span class="hr" style="--k:' + k + '">' + hsvg(ic) + '<b>' + val + '</b></span>';
}

function renderHub(){
  const art = window.ARTIST || {};
  const L = livello();
  const ph = PHASES[G.phase];

  /* chi sei, in testata */
  $("hb-name").textContent = (art.name || "").trim().toUpperCase() || "SENZA NOME";
  $("hb-lvl").textContent = L.lvl;
  $("hb-rank").textContent = ph.n.toUpperCase();

  /* quello che hai: energia, cassa, hype, seguito */
  $("hb-res").innerHTML =
    hubRes("#FACC15", "energia", G.energy + " / " + G.maxEnergy) +
    hubRes("#4ADE80", "soldi", fmt(G.money) + " €") +
    hubRes("#FB923C", "hype", Math.round(G.hype)) +
    hubRes("#60A5FA", "gente", short(G.fans));

  hubMisura();

  /* i luoghi: zone da toccare appoggiate sulle targhette della foto */
  $("hb-pins").innerHTML = HUB_LUOGHI.map(l =>
    '<button class="hspot' + (l.chiuso ? " chiuso" : "") + '" data-l="' + l.id + '" ' +
    'style="--x:' + l.x + '%;--y:' + l.y + '%;--w:' + l.w + '%;--h:' + l.h + '%" ' +
    'aria-label="' + l.n + (l.chiuso ? " — si sblocca a Milano" : "") + '" ' +
    'title="' + l.n + '"></button>').join("");

  /* le linguette */
  $("hb-tabs").innerHTML = HUB_TABS.map((t, i) =>
    '<button class="htab' + (i === 0 ? " on" : "") + '" data-tb="' + t.id + '">' +
    hsvg(t.ic) + '<span>' + t.n + '</span></button>').join("");

  /* l'obiettivo di adesso */
  const ob = HUB_OBIETTIVI.find(o => o.ora(G) < o.max) || HUB_OBIETTIVI[HUB_OBIETTIVI.length - 1];
  const ora = clamp(Math.floor(ob.ora(G)), 0, ob.max);
  $("hb-goal").innerHTML =
    '<span class="hk">Obiettivo attuale</span>' +
    '<span class="hgl"><b>' + ob.n + '</b><i>' + short(ora) + ' / ' + short(ob.max) + '</i></span>' +
    '<span class="hbar"><i style="width:' + Math.round(ora / ob.max * 100) + '%"></i></span>';

  /* le notizie: cambiano da sole col passare delle settimane */
  /* la prima settimana è quella del concept: il contest di freestyle */
  const nz = HUB_NOTIZIE[(G.week - 1 + (G.year - 1) * 4) % HUB_NOTIZIE.length];
  $("hb-news").innerHTML =
    '<span class="hk">Notizie</span>' +
    '<span class="hnw"><span class="hnt"><b>' + nz[0] + '</b><i>' + nz[1] + '</i></span>' +
    '<span class="hth"></span></span>';

  /* il telefono: il pallino rosso è la roba non letta del diario */
  const nuovi = Math.max(0, G.log.length - (G.seenLog || 0));
  $("hb-phone").innerHTML =
    '<span class="hph"><span class="hscr">' + hsvg("chat") + '<span class="hpk">Chat</span></span>' +
    (nuovi ? '<i class="hbdg">' + (nuovi > 9 ? "9+" : nuovi) + '</i>' : '') + '</span>';
}

/* ================= COMANDI ================= */
$("hb-pins").addEventListener("click", ev => {
  const b = ev.target.closest(".hspot"); if(!b) return;
  const l = HUB_LUOGHI.find(x => x.id === b.dataset.l); if(!l) return;
  if(typeof SFX === "object" && SFX.tap) SFX.tap();
  if(l.chiuso) hubChiuso(l); else l.vai();
});

$("hb-tabs").addEventListener("click", ev => {
  const b = ev.target.closest(".htab"); if(!b) return;
  const t = HUB_TABS.find(x => x.id === b.dataset.tb); if(!t) return;
  if(typeof SFX === "object" && SFX.tap) SFX.tap();
  t.vai();
});

$("hb-goal").onclick = () => hubGioco("obiettivi");
$("hb-news").onclick = () => hubGioco("settimana");
$("hb-phone").onclick = () => { GO("game"); renderGioco(); $("g-diary").click(); };
$("hb-logo").onclick = () => GO("menu");

/* La via di ritorno: dalla partita si torna alla mappa. */
$("g-tomappa").onclick = () => { renderHub(); GO("hub"); };

window.HUB = { apri(){ renderHub(); GO("hub"); }, render: renderHub };
