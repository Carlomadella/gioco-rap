/* L'hub: la città di provincia, la schermata da cui si gioca.

   È la mappa disegnata in citta-art.js più tutto quello che ci sta sopra:
   la testata con chi sei e cosa hai, i luoghi come punti da toccare, le
   linguette in basso, l'obiettivo di adesso, le notizie e il telefono.
   I luoghi non fanno il lavoro degli altri file: aprono la partita sulla
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
  mic: '<path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11h2a5 5 0 0 0 10 0h2a7 7 0 0 1-6 6.9V21h-2v-3.1A7 7 0 0 1 5 11z"/>',
  nota: '<path d="M20 3v11.4a3.3 3.3 0 1 1-2-3V7.7l-7 1.5v7.8a3.3 3.3 0 1 1-2-3V6.5z"/>',
  maschera: '<path d="M3.6 4h16.8v5.6c0 4.9-3.8 8.8-8.4 8.8S3.6 14.5 3.6 9.6zm4.2 4.4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm8.4 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM8 14.4c1.1 1.3 2.5 2 4 2s2.9-.7 4-2z"/>',
  casa: '<path d="M12 3.2 21.6 11H19v9h-5v-5.6h-4V20H5v-9H2.4z"/>',
  lucchetto: '<path d="M7 10V8a5 5 0 0 1 10 0v2h1.2c.9 0 1.6.7 1.6 1.6v7.2c0 .9-.7 1.6-1.6 1.6H5.8c-.9 0-1.6-.7-1.6-1.6v-7.2c0-.9.7-1.6 1.6-1.6zm2 0h6V8a3 3 0 0 0-6 0z"/>',
  pin: '<path d="M12 2a7 7 0 0 1 7 7c0 5.2-7 13-7 13S5 14.2 5 9a7 7 0 0 1 7-7zm0 4.6A2.4 2.4 0 1 0 12 11.4 2.4 2.4 0 0 0 12 6.6z"/>',
  scatola: '<path d="M12 2 21 6.6v10.8L12 22 3 17.4V6.6zM5.8 7.5 12 10.7l6.2-3.2L12 4.3z"/>',
  mirino: '<path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 2.4a7.6 7.6 0 1 0 0 15.2 7.6 7.6 0 0 0 0-15.2zm0 3.2a4.4 4.4 0 1 1 0 8.8 4.4 4.4 0 0 1 0-8.8zm0 2.6a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z"/>',
  barre: '<path d="M4 20V10h4v10zm6 0V4h4v16zm6 0v-7h4v7z"/>',
  chat: '<path d="M4 3.5h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9.6L4 21z"/>'
};
const hsvg = (nome, cls) => '<svg class="' + (cls || "hicon") + '" viewBox="0 0 24 24" aria-hidden="true">' + HIC[nome] + '</svg>';

/* ================= I LUOGHI DELLA PROVINCIA ================= */
/* x e y sono percentuali dentro alla mappa: il punto dove sta lo spillo.
   al = da che parte si appoggia la targhetta (c centro, l sinistra, r destra). */
const HUB_LUOGHI = [
  {id:"studio", n:"Studio", c:"#A855F7", ic:"mic", x:45.5, y:22, al:"c",
   d:"Registra, mixa e<br>pubblica i tuoi pezzi.",
   vai:() => hubGioco("settimana")},

  {id:"beatmaker", n:"Beat maker", c:"#4ADE80", ic:"nota", x:6, y:35.5, al:"l",
   d:"Crea i tuoi beat<br>e migliora le skill.",
   vai:() => hubGioco("catalogo", "market")},

  {id:"criminali", n:"Attività criminali", c:"#EF4444", ic:"maschera", x:84, y:37.5, al:"r",
   d:"Piccoli rischi,<br>piccoli guadagni.",
   vai:() => hubPresto("Attività criminali",
     "Il giro storto della provincia — colpi piccoli, soldi veloci, guai veri — " +
     "è il prossimo pezzo di mondo da aprire.")},

  {id:"vita", n:"Vita quotidiana", c:"#38BDF8", ic:"casa", x:15, y:61.5, al:"l",
   d:"Gestisci la tua vita<br>e le tue relazioni.",
   vai:() => hubGioco("lifestyle")},

  {id:"club", n:"Club & discoteche", x:72, y:67, al:"c", chiuso:"Sblocca a Milano"},
  {id:"concerti", n:"Concerti", x:47, y:83.5, al:"c", chiuso:"Sblocca a Milano"}
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

  /* il paese: disegnato una volta sola, non a ogni ritorno sulla mappa */
  const art2 = $("hb-art");
  if(!art2.firstChild) art2.innerHTML = arteCitta(CITTA_SEME);

  /* il titolo sopra la mappa */
  const citta = (art.city || "").trim();
  $("hb-city").textContent = citta || "Città di provincia";
  $("hb-rank2").textContent = ph.n;
  $("hb-claim").textContent = G.week === 1 && G.year === 1
    ? "La tua storia inizia qui."
    : "Anno " + G.year + " · settimana " + G.week + ".";

  /* i luoghi */
  const pins = $("hb-pins");
  pins.innerHTML = HUB_LUOGHI.map(l => {
    const stile = 'style="--x:' + l.x + '%;--y:' + l.y + '%' + (l.c ? ';--c:' + l.c : '') + '"';
    if(l.chiuso)
      return '<button class="hpin chiuso al-' + l.al + '" data-l="' + l.id + '" ' + stile + '>' +
        '<span class="hcard"><span class="hci">' + hsvg("lucchetto") + '</span>' +
        '<span class="hct"><b>' + l.n + '</b><i>' + l.chiuso + '</i></span></span></button>';
    return '<button class="hpin al-' + l.al + '" data-l="' + l.id + '" ' + stile + '>' +
      '<span class="hmark"><svg viewBox="0 0 28 36" aria-hidden="true">' +
        '<path d="M14 .8c7 0 12.6 5.4 12.6 12C26.6 21.4 14 35.6 14 35.6S1.4 21.4 1.4 12.8C1.4 6.2 7 .8 14 .8z"/>' +
        '</svg><span class="hmi">' + hsvg(l.ic, "hicon mini") + '</span></span>' +
      '<span class="hcard"><span class="hci">' + hsvg(l.ic) + '</span>' +
      '<span class="hct"><b>' + l.n + '</b><i>' + l.d + '</i></span></span></button>';
  }).join("");

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
  const nz = HUB_NOTIZIE[(G.week + G.year * 3) % HUB_NOTIZIE.length];
  $("hb-news").innerHTML =
    '<span class="hk">Notizie</span>' +
    '<span class="hnw"><span class="hth">' +
      '<svg viewBox="0 0 60 40" aria-hidden="true">' +
        '<rect width="60" height="40" fill="#1B1030"/>' +
        '<rect y="26" width="60" height="14" fill="#0C0716"/>' +
        '<ellipse cx="30" cy="15" rx="26" ry="12" fill="#7C2BD6" opacity=".55"/>' +
        '<rect x="22" y="8" width="16" height="12" rx="2" fill="#FFC978" opacity=".8"/>' +
        '<g fill="#05030A">' +
          '<circle cx="8" cy="30" r="5"/><circle cx="20" cy="32" r="5"/><circle cx="32" cy="29" r="5"/>' +
          '<circle cx="44" cy="32" r="5"/><circle cx="54" cy="30" r="5"/></g>' +
      '</svg></span>' +
    '<span class="hnt"><b>' + nz[0] + '</b><i>' + nz[1] + '</i></span></span>';

  /* il telefono: il pallino rosso è la roba non letta del diario */
  const nuovi = Math.max(0, G.log.length - (G.seenLog || 0));
  $("hb-phone").innerHTML =
    '<span class="hph"><span class="hscr">' + hsvg("chat") + '<span class="hpk">Chat</span></span>' +
    (nuovi ? '<i class="hbdg">' + (nuovi > 9 ? "9+" : nuovi) + '</i>' : '') + '</span>';
}

/* ================= COMANDI ================= */
$("hb-pins").addEventListener("click", ev => {
  const b = ev.target.closest(".hpin"); if(!b) return;
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
