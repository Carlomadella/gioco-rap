/* IL CIRCOLO — gli incontri delle quattro stanze (01/10/2026).

   CARLO, 01/10: «togliamo la barra in basso con la gente, il palco, la
   serata di oggi e i momenti durante il live, e quei punti devono essere
   spostati nelle pagine che si aprono quando si clicca sul pulsante
   bancone, palco, sala e backstage» — pagine complete, come i riferimenti
   `bancone.png`, `sala.png`, `open_mic.png` e `backstage.png`; e nel
   backstage «si possano anche incontrare i fan per parlarci e dirti cosa
   gli è piaciuto e cosa no».

   Qui c'è solo quello che prima non esisteva — le pagine le disegna
   circolo-stanze.js, le mosse con la gente restano quelle di posto.js:

     il bancone   l'atmosfera del locale, e quattro modi di avvicinare uno:
                  attaccare bottone (il dialogo di posto.js), offrire da
                  bere, ascoltare, presentarsi
     il backstage l'artista della serata, le mosse col giro che conta, i
                  tuoi fan che ti dicono cosa gli è piaciuto e cosa no

   Numeri piccoli, di proposito: un pezzo di rapporto, un punto di hype,
   qualche fan. Ogni mossa una volta per persona e per sera (`circoloOggi`),
   e ognuna costa tempo vero, come le mosse della Sala. Il grosso della
   carriera resta fuori di qui: i pezzi, i live, le uscite. */
"use strict";

const CC_BEVUTA = 6;                 /* euro: un giro al bancone */
const CC_TEMPO = Object.freeze({bevi:15, ascolta:20, presentati:10, networking:30,
  contatto:20, collab:30, osserva:15, fan:10});
const CC_COLLAB_SETTIMANE = 4;       /* una proposta all'artista della serata ogni quattro settimane */

/* ==================== LA SERA ====================
   Quello che vale «una volta per sera» sta in `G.circolo.oggi`, che si
   svuota da solo quando cambia il giorno. */
function circoloOggi(){
  const c = circoloStato();
  const key = circoloGiorno();
  if(!c.oggi || c.oggi.key !== key)
    c.oggi = {key:key, bevuto:{}, ascoltato:{}, presentato:{}, rete:{}, ospite:{}, fan:{}};
  return c.oggi;
}
function circoloSett(){ return typeof totalWeeks === "function" ? totalWeeks() : Number(G.week || 1); }
function ccNumeroGiorno(){ return Number(G.day || 1) + Number(G.week || 1) * 7 + Number(G.year || 1) * 371; }

/* Il tempo: lo stesso gate delle mosse della Sala (posto.js, `poTempoGate`),
   coi minuti di qui. */
function ccTempoOk(tipo){
  const min = CC_TEMPO[tipo] || 0;
  if(typeof GAME_TIME === "undefined" || typeof GAME_TIME.canSpend !== "function") return {ok:true};
  const g = GAME_TIME.canSpend(min);
  if(g && g.ok === false) return {ok:false, perche:typeof poTempoPerche === "function" ? poTempoPerche(g) : "Non c’è più tempo"};
  return {ok:true};
}
function ccTempoSpendi(tipo){
  if(typeof GAME_TIME !== "undefined" && typeof GAME_TIME.spend === "function")
    GAME_TIME.spend(CC_TEMPO[tipo] || 0, "circolo-" + tipo);
}
/* l'hype che entra davvero: sopra al tetto della fase (`hypeCap`) non sale,
   e la pagina scrive solo quello che è cambiato */
const CC_HYPE_SERA = 2;               /* l'hype che le stanze danno in una sera, tutto insieme */
function ccHype(n){
  const tetto = typeof hypeCap === "function" ? hypeCap() : 100;
  const prima = Number(G.hype || 0);
  if(n > 0){
    /* una sera al Circolo vale al massimo due punti di hype, comunque li
       prendi (problemi-riscontrati, voce 87): il resto lo fanno i pezzi e i
       live. La collaborazione con l'artista no: è una ogni quattro settimane */
    const oggi = circoloOggi();
    const resto = ccHypeLibero ? n : Math.max(0, CC_HYPE_SERA - Number(oggi.hype || 0));
    const su = Math.min(n, resto);
    G.hype = Math.max(prima, Math.min(tetto, prima + su));
    if(!ccHypeLibero) oggi.hype = Number(oggi.hype || 0) + Math.round(G.hype - prima);
  } else G.hype = Math.max(0, prima + n);
  return Math.round(G.hype - prima);
}
let ccHypeLibero = false;
const ccHypeTesto = d => d > 0 ? " +" + d + " hype." : d < 0 ? " " + d + " hype." : "";
/* un pezzo di rapporto, e se basta un gradino: come la Sala (posto.js) */
function ccRelSali(p, pt){
  p.pt = Number(p.pt || 0) + pt;
  let salito = false;
  while(typeof relSoglia === "function" && p.pt >= relSoglia(p) && p.rel < 5){ p.pt -= relSoglia(p); p.rel++; salito = true; }
  if(salito){
    if(typeof SFX === "object" && SFX.fanfare) SFX.fanfare();
    if(typeof pushLog === "function") pushLog("Con <b>" + p.n + "</b> adesso siete <b>" + relNome(p) + "</b>.", "");
  }
  return salito;
}
/* quello che è appena successo, scritto nella pagina sotto alle mosse */
function ccDice(testo, cls){
  if(typeof CIRCOLO !== "undefined") CIRCOLO.detto = {t:testo, cls:cls || ""};
}
function ccFine(){
  if(typeof save === "function") save();
  if(typeof renderGioco === "function") renderGioco();
  if(typeof renderLuogo === "function") renderLuogo();
  if(typeof renderHub === "function") renderHub();
}

/* ==================== L'ATMOSFERA ====================
   Quanto è pieno il locale: di pomeriggio poca gente, la sera la sala, il
   fine settimana di più. Al bancone pesa sulle mosse — più gente, più
   facile attaccare bottone — da −0,2 a +0,2 sulla probabilità. */
const CC_ATM_FASCIA = {networking:36, soundcheck:55, serata:82, aftershow:66};
function circoloAtmosfera(){
  const f = circoloFascia();
  if(!f) return 0;
  const g = ccNumeroGiorno();
  const fine = (Number(G.day || 1) % 7 === 5 || Number(G.day || 1) % 7 === 6) ? 8 : 0;
  return Math.max(0, Math.min(100, (CC_ATM_FASCIA[f.id] || 40) + fine + (g * 7 % 11) - 5));
}
function circoloAtmosferaNome(a){
  return a <= 0 ? ["Chiuso", "Il locale riapre alle 13:00."]
    : a < 45 ? ["Tranquilla", "Poca gente: si parla meglio, ma ci sono meno facce."]
    : a < 65 ? ["Si scalda", "Arriva gente: buon momento per presentarsi."]
    : a < 82 ? ["Viva", "Tanta gente in giro, ottime opportunità di contatti."]
    : ["Locale pieno", "Tanta gente in giro, ottime opportunità di contatti."];
}
function ccAtmBonus(){ return (circoloAtmosfera() - 50) / 250; }

/* ==================== IL BANCONE ==================== */
/* L'umore che si legge in faccia a uno, accanto al nome */
function circoloUmore(p){
  if(circoloSconosciuto(p)) return {n:"Curioso", cls:"giallo"};
  if(p.rel >= 2) return {n:"Amichevole", cls:"verde"};
  if(p.scoperto && (p.car === "aperto" || p.car === "gasato")) return {n:"Interessato", cls:"verde"};
  if(p.scoperto && p.car === "diffidente") return {n:"Sulle sue", cls:"grigio"};
  return {n:"Neutrale", cls:"grigio"};
}
/* Le quattro mosse, come dati: la pagina le disegna, il click le fa. */
function circoloBanconeMosse(p){
  const oggi = circoloOggi();
  const qui = circoloQui();
  const lontano = !qui ? "Sei lontano: raggiungi il Circolo dalla mappa" : null;
  const chiuso = !circoloFascia() ? "Il Circolo è chiuso" : null;
  const nessuno = !p ? "Scegli qualcuno dalla lista" : null;
  const stop = chiuso || lontano || nessuno;
  const tempo = t => { const g = ccTempoOk(t); return g.ok ? null : g.perche; };
  const voce = (id, n, d, perche, costo) => ({id:id, n:n, d:d, puo:!perche, perche:perche || "", costo:costo || ""});
  return [
    voce("attacca", "Attacca bottone", "Inizia una conversazione e conosci meglio la persona.",
      stop || (typeof POSTO_PARLA !== "undefined" && POSTO_PARLA ? "Finisci prima il discorso" : null) ||
        (typeof poTempoGate === "function" && !poTempoGate("parla").ok ? poTempoPerche(poTempoGate("parla")) : null),
      typeof poTempoTesto === "function" ? poTempoTesto("parla") : "30 min"),
    voce("bevi", "Offri da bere", "Un drink può rompere il ghiaccio e creare il giusto clima.",
      stop || (oggi.bevuto[p.id] ? "Stasera gliel’hai già offerto" : null) ||
        (G.money < CC_BEVUTA ? "Servono " + CC_BEVUTA + " €" : null) || tempo("bevi"),
      CC_BEVUTA + " € · " + CC_TEMPO.bevi + " min"),
    voce("ascolta", "Ascolta la conversazione", "Rimani in disparte e ascolta. Potresti cogliere informazioni utili.",
      stop || (oggi.ascoltato[p.id] ? "L’hai già ascoltato, stasera" : null) || tempo("ascolta"),
      CC_TEMPO.ascolta + " min"),
    voce("presentati", "Presentati", "Racconta chi sei e cosa fai. Lascia il segno.",
      stop || (!circoloSconosciuto(p) ? "Vi conoscete già" : null) ||
        (oggi.presentato[p.id] ? "Ti sei già presentato" : null) || tempo("presentati"),
      CC_TEMPO.presentati + " min")
  ];
}
function circoloBancone(id, pid){
  const p = (G.gente || []).find(x => x.id === pid);
  const m = circoloBanconeMosse(p).find(x => x.id === id);
  if(!p || !m || !m.puo) return false;
  const oggi = circoloOggi();
  if(typeof SFX === "object" && SFX.tap) SFX.tap();

  /* attaccare bottone è il dialogo della Sala: la situazione e le risposte */
  if(id === "attacca"){
    p.visto = true;
    if(typeof azionePosto === "function") azionePosto("parla", p.id);
    return true;
  }
  ccTempoSpendi(id);

  if(id === "bevi"){
    oggi.bevuto[p.id] = 1;
    G.money -= CC_BEVUTA;
    p.visto = true;
    const prob = ({aperto:.9, gasato:.85, pratico:.7, diffidente:.5}[p.car] || .7) + ccAtmBonus();
    if(Math.random() < prob){
      const salito = ccRelSali(p, 1);
      ccDice(salito ? "Brindate. Con " + p.n + " adesso siete " + relNome(p) + "."
        : "Brindate: " + p.n + " si scioglie un po’. Un pezzo di rapporto in più.", "bene");
    } else {
      ccDice(p.n + " accetta il bicchiere, ma resta sulle sue.", "");
    }
    if(typeof pushLog === "function") pushLog("Al bancone hai offerto da bere a <b>" + p.n + "</b>: −" + CC_BEVUTA + " €.", "");
  }

  if(id === "ascolta"){
    oggi.ascoltato[p.id] = 1;
    if(typeof gain === "function") gain("rete", 0.2);
    if(!p.scoperto && Math.random() < 0.6 + ccAtmBonus()){
      p.scoperto = true;
      ccDice("Ascoltando hai capito che tipo è " + (circoloSconosciuto(p) ? "quello lì" : p.n) + ": " +
        (CARATTERI.find(c => c.id === p.car) || {d:""}).d.toLowerCase(), "bene");
    } else if(p.scoperto){
      if(typeof gain === "function") gain("rete", 0.2);
      ccDice("Niente di nuovo su di lui, ma adesso sai con chi gira.", "");
    } else {
      ccDice("Troppo rumore: hai sentito solo pezzi di frase.", "");
    }
  }

  if(id === "presentati"){
    oggi.presentato[p.id] = 1;
    p.visto = true;
    const prob = 0.4 + Number(G.hype || 0) / 250 + ccAtmBonus();
    if(Math.random() < prob){
      ccRelSali(p, 1);
      /* col locale pieno, presentarsi bene si nota anche intorno */
      const dh = circoloAtmosfera() >= 70 ? ccHype(1) : 0;
      ccDice(p.n + " si ricorda il tuo nome." + (dh ? " Qualcuno intorno si è girato:" + ccHypeTesto(dh) : ""), "bene");
    } else {
      ccDice("Ti presenti a " + p.n + ". Annuisce, ma la testa è altrove.", "");
    }
  }
  ccFine();
  return true;
}

/* ==================== IL BACKSTAGE ====================
   Si apre con la serata (dalle 21:00 alle 03:00). Ci sono l'artista della
   serata — uno di fuori, che stasera suona qui e domani no — e la gente del
   giro che conosci. L'artista non entra nella tua rete come una persona
   della Sala: se lo convinci ti presenta qualcuno, o ci fai un pezzo. */
const CC_OSPITI = [
  {n:"Raiz", r:"Headliner", d:"Rapper affermato, tournée nazionale.", tag:["Rap", "Tournée nazionale", "Label indipendente"], fama:82, fino:"00:30",
   bio:"Punto di riferimento della scena. In tour per il suo nuovo album, sempre aperto a conoscere nuovi talenti."},
  {n:"Nayra", r:"Artista emergente", d:"Pop-rap, sta crescendo rapidamente.", tag:["Pop-rap", "Uscite ogni mese"], fama:64, fino:"02:00",
   bio:"Due singoli in classifica quest’anno. Cerca voci nuove per il prossimo progetto."},
  {n:"DJ Kento", r:"Producer / DJ", d:"Producer della scena locale.", tag:["Beat", "DJ set", "Club"], fama:58, fino:"01:30",
   bio:"Suona nei club della regione e produce per tre artisti. Ascolta tutto, parla poco."},
  {n:"Siria", r:"Manager", d:"Gestisce diversi artisti in Italia.", tag:["Management", "Booking"], fama:76, fino:"01:00",
   bio:"Segue artisti che fanno date in tutta Italia. È qui per vedere chi sale sul palco."},
  {n:"Luca Framez", r:"Videomaker", d:"Realizza video e contenuti musicali.", tag:["Videoclip", "Contenuti"], fama:60, fino:"03:00",
   bio:"Ha girato video per mezza scena del nord. Sta cercando il prossimo artista da filmare."}
];
function circoloBackstageAperto(){
  const f = circoloFascia();
  return !!(f && (f.palco || f.id === "aftershow"));
}
function circoloOspite(){
  if(!circoloBackstageAperto()) return null;
  return CC_OSPITI[ccNumeroGiorno() % CC_OSPITI.length];
}
/* chi del giro passa dal backstage: quelli che ti conoscono */
function circoloBackstageGente(){
  if(!circoloBackstageAperto()) return [];
  return circoloStasera().filter(p => p.rel >= 1 && !circoloSconosciuto(p)).slice(0, 4);
}
/* quanto ci vuole perché l'artista ti dica di sì: prestigio e rischio */
function circoloOspiteProb(){
  const o = circoloOspite();
  if(!o) return 0;
  const tuo = Math.min(0.4, Number(G.fans || 0) / 5000) + Number(G.hype || 0) / 400 +
    (((G.skills && G.skills.rete) || 0) / 250);
  return Math.max(0.08, Math.min(0.85, 0.3 + tuo - (o.fama - 60) / 200));
}
function circoloBackstageMosse(sel){
  const oggi = circoloOggi();
  const o = circoloOspite();
  const st = oggi.ospite;
  const chiuso = !circoloBackstageAperto() ? "Il backstage apre con la serata, alle 21:00" : null;
  const lontano = !circoloQui() ? "Sei lontano: raggiungi il Circolo dalla mappa" : null;
  const stop = chiuso || lontano;
  const tempo = t => { const g = ccTempoOk(t); return g.ok ? null : g.perche; };
  const voce = (id, n, d, perche, costo) => ({id:id, n:n, d:d, puo:!perche, perche:perche || "", costo:costo || ""});
  if(sel === "ospite" && o){
    const cd = circoloSett() - Number(circoloStato().collab == null ? -99 : circoloStato().collab);
    return [
      voce("presentati", "Presentati", "Fai una buona prima impressione.",
        stop || (st.presentato ? (st.notato ? "Ti ha già notato" : "Ci hai già provato stasera") : null) || tempo("presentati"),
        CC_TEMPO.presentati + " min"),
      voce("networking", "Fai networking", "Parla del tuo progetto e ascolta i suoi.",
        stop || (st.networking ? "Stasera l’hai già fatto" : null) || tempo("networking"), CC_TEMPO.networking + " min"),
      voce("contatto", "Chiedi un contatto", "Potrebbe presentarti a qualcuno.",
        stop || (!st.notato ? "Prima deve averti notato" : null) ||
          (st.contatto || (circoloStato().presentati || {})[o.n] ? "Te l’ha già dato" : null) || tempo("contatto"),
        CC_TEMPO.contatto + " min"),
      voce("collab", "Proponi una collaborazione", "Valuta un progetto insieme.",
        stop || (!st.notato ? "Prima deve averti notato" : null) ||
          (cd < CC_COLLAB_SETTIMANE ? "Ne hai proposta una da poco" : null) ||
          (!(G.songs || []).some(s => s.released) ? "Serve almeno un pezzo fuori" : null) || tempo("collab"),
        CC_TEMPO.collab + " min"),
      voce("osserva", "Osserva l’ambiente", "Resta in disparte e prendi appunti.",
        stop || (st.osservato ? "L’hai già fatto stasera" : null) || tempo("osserva"), CC_TEMPO.osserva + " min")
    ];
  }
  const p = (G.gente || []).find(x => x.id === sel);
  return [
    voce("networking", "Fai networking", "Due parole lontano dalla sala: vale più che al bancone.",
      stop || (!p ? "Scegli qualcuno" : null) || (p && oggi.rete[p.id] ? "Stasera ci avete già parlato" : null) || tempo("networking"),
      CC_TEMPO.networking + " min"),
    voce("osserva", "Osserva l’ambiente", "Resta in disparte e prendi appunti.",
      stop || (st.osservato ? "L’hai già fatto stasera" : null) || tempo("osserva"), CC_TEMPO.osserva + " min")
  ];
}
function circoloBackstage(id, sel){
  const m = circoloBackstageMosse(sel).find(x => x.id === id);
  if(!m || !m.puo) return false;
  const oggi = circoloOggi();
  const st = oggi.ospite;
  const o = circoloOspite();
  if(typeof SFX === "object" && SFX.tap) SFX.tap();
  ccTempoSpendi(id);

  if(id === "presentati"){
    st.presentato = 1;
    if(Math.random() < circoloOspiteProb() + 0.15){
      st.notato = 1;
      const dh = ccHype(1);
      ccDice(o.n + " ti guarda bene in faccia: si ricorderà di te." + ccHypeTesto(dh), "bene");
      if(typeof pushLog === "function") pushLog("Nel backstage ti sei presentato a <b>" + o.n + "</b>, e ti ha notato.", "");
    } else {
      ccDice(o.n + " ti stringe la mano e torna a parlare con il suo team.", "");
    }
  }
  if(id === "networking"){
    if(sel === "ospite"){
      st.networking = 1;
      if(typeof gain === "function") gain("rete", 0.6);
      const dh = st.notato ? ccHype(1) : 0;
      ccDice("Mezz’ora a parlare di date, label e studi." + (dh ? " Il tuo nome gira:" + ccHypeTesto(dh) : ""), "bene");
    } else {
      const p = (G.gente || []).find(x => x.id === sel);
      oggi.rete[p.id] = 1;
      if(typeof gain === "function") gain("rete", 0.4);
      const salito = ccRelSali(p, 1);
      ccDice(salito ? "Con " + p.n + " adesso siete " + relNome(p) + "."
        : "Con " + p.n + ", lontano dal rumore: un pezzo di rapporto in più.", "bene");
    }
  }
  if(id === "contatto"){
    st.contatto = 1;
    /* Ogni artista ti presenta qualcuno una volta sola (`G.circolo.presentati`),
       e la gente della Sala non passa il suo tetto (POSTO_MAX, posto.js): con la
       Sala piena l'artista parla bene di te a uno che conosci già
       (problemi-riscontrati, voce 85). */
    const c = circoloStato();
    if(!c.presentati) c.presentati = {};
    c.presentati[o.n] = 1;
    const pieno = typeof genteDellaSala === "function" && genteDellaSala().filter(x => !x.via).length >= POSTO_MAX;
    const giro = (G.gente || []).filter(x => !x.via && !circoloSconosciuto(x) && x.rel < 5);
    if(pieno && giro.length){
      const p = giro[ccNumeroGiorno() % giro.length];
      const salito = ccRelSali(p, 2);
      ccDice(o.n + " conosce " + p.n + ", e gli parla bene di te." + (salito ? " Adesso siete " + relNome(p) + "." : " Due pezzi di rapporto in più."), "bene");
    } else {
      const ruoli = ["fonico", "videomaker", "beatmaker"].filter(r => !POSTO_RUOLI[r].da || POSTO_RUOLI[r].da(G));
      const p = nuovaPersona(ruoli[ccNumeroGiorno() % ruoli.length]);
      p.visto = true; p.rel = 1; p.pt = 0;
      p.storia = "Te l’ha presentato " + o.n + " nel backstage del Circolo.";
      G.gente.push(p);
      ccDice(o.n + " ti presenta " + p.n + ", " + ccRuolo(p).toLowerCase() + ". Adesso è un tuo contatto.", "bene");
      if(typeof pushLog === "function") pushLog("<b>" + o.n + "</b> ti ha presentato <b>" + p.n + "</b> (" + ccRuolo(p).toLowerCase() + ").", "");
    }
  }
  if(id === "collab"){
    circoloStato().collab = circoloSett();
    if(Math.random() < circoloOspiteProb()){
      const h = Math.round(5 + o.fama * 0.05);
      const f = Math.round(rnd(30, 80) + Number(G.fans || 0) * 0.02);
      ccHypeLibero = true;
      const dh = ccHype(h);
      ccHypeLibero = false;
      G.fans += f;
      if(typeof gain === "function"){ gain("rete", 1); gain("flow", 0.4); }
      ccDice(o.n + " ci sta: una strofa tua nel suo prossimo giro." + ccHypeTesto(dh) + " +" + f + " fan.", "bene");
      if(typeof pushLog === "function") pushLog("Collaborazione con <b>" + o.n + "</b>:" + ccHypeTesto(dh) + " +" + f + " fan.", "big");
    } else {
      const dh = ccHype(-2);
      ccDice("«Non è il momento.» " + o.n + " è gentile, ma è un no." + ccHypeTesto(dh), "male");
    }
  }
  if(id === "osserva"){
    st.osservato = 1;
    if(typeof gain === "function") gain("rete", 0.3);
    const scoperti = circoloBackstageGente().filter(p => !p.scoperto);
    scoperti.forEach(p => { p.scoperto = true; });
    ccDice(scoperti.length
      ? "Hai capito che tipi sono " + scoperti.map(p => p.n).join(", ") + "."
      : "Chi conta, chi parla, chi aspetta: adesso il backstage lo leggi meglio.", "bene");
  }
  ccFine();
  return true;
}

/* Le occasioni della serata e quello che si può sbloccare: si leggono da
   quello che c'è, non si inventano. */
function circoloOccasioni(){
  const out = [];
  const o = circoloOspite();
  const oggi = circoloOggi();
  if(o && !oggi.ospite.notato) out.push({ic:"nota", n:"Collaborazione possibile", d:o.n + " è in cerca di nuovi talenti per un progetto parallelo.", p:"Alta priorità"});
  const sett = circoloSett();
  const rap = circoloStasera().find(p => p.ruolo === "rapper" && p.rel >= 3 && sett - p.feat >= 6);
  if(rap) out.push({ic:"mic", n:"Feat in vista", d:rap.n + " stasera ti chiama sul palco con lui.", p:"Media"});
  const vid = circoloStasera().find(p => p.ruolo === "videomaker" && p.rel >= 2);
  if(vid && typeof daGirare === "function" && daGirare()) out.push({ic:"video", n:"Videoclip in arrivo", d:vid.n + " può girare il video di «" + daGirare().t + "».", p:"Media"});
  if(circoloPresenti().some(circoloSconosciuto)) out.push({ic:"gente", n:"Nuovi contatti nella scena", d:"Al bancone c’è gente che non conosci ancora.", p:"Alta"});
  return out;
}
function circoloSblocchi(){
  const o = circoloOspite();
  const st = circoloOggi().ospite;
  return [
    {ic:"nota", n:o ? "Feat con " + o.n : "Feat con l’artista della serata", d:"Sblocca una collaborazione per un brano.", ok:!!st.notato},
    {ic:"gente", n:"Un contatto nuovo", d:"L’artista ti presenta qualcuno del suo giro.", ok:!!st.notato && !st.contatto && !(o && (circoloStato().presentati || {})[o.n])},
    {ic:"stella", n:"Showcase", d:"Solo su invito: ti ci chiama un promoter, più avanti nella carriera.", ok:false},
    {ic:"stella", n:"Opening Act", d:"Apri il concerto di qualcuno: serve un nome che la gente conosce già.", ok:false}
  ];
}

/* ==================== I TUOI FAN ====================
   Nel backstage, a fine serata, c'è chi è venuto per te. Ognuno ti dice una
   cosa che gli è piaciuta e una che no — sui tuoi pezzi veri, o sul palco
   di stasera — e tu scegli cosa farci: una foto (un punto di hype, qualche
   fan) o la domanda giusta (la critica ti insegna qualcosa). Uno alla volta,
   una volta per sera. Arrivano quando hai qualcosa da far sentire. */
const CC_FAN_NOMI = ["Giulia", "Matteo", "Sofia", "Kevin", "Aurora", "Samuele", "Noemi", "Christian", "Alessia", "Davide", "Chiara", "Mattia"];
function circoloFanQuanti(){
  const fuori = (G.songs || []).filter(s => s.released);
  if(!circoloBackstageAperto() || !fuori.length) return 0;
  return Math.min(3, 1 + Math.floor(Number(G.fans || 0) / 400));
}
function circoloFan(){
  const n = circoloFanQuanti();
  if(!n) return [];
  const fuori = (G.songs || []).filter(s => s.released).slice().sort((a, b) => b.q - a.q);
  const g = ccNumeroGiorno();
  const suonato = G.circolo && G.circolo.suonato && G.circolo.suonato.key === circoloGiorno();
  const out = [];
  for(let i = 0; i < n; i++){
    const nome = CC_FAN_NOMI[(g * 5 + i * 7) % CC_FAN_NOMI.length];
    /* cosa non gli è piaciuto: la cosa più debole che c'è davvero, fra i
       pezzi della metà bassa; quello che gli è piaciuto è un altro pezzo */
    const bassi = fuori.slice(Math.ceil(fuori.length / 2));
    const peggio = bassi.length ? bassi[(g + i) % bassi.length] : null;
    const altri = fuori.filter(s => s !== peggio);
    const top = altri[(g + i) % altri.length];
    /* le critiche che valgono davvero per quel pezzo; ogni fan ne pesca
       una diversa, così tre fan non dicono la stessa cosa */
    const critiche = [];
    if(peggio && !peggio.mixed) critiche.push(["«" + peggio.t + "» suona piatta, come se non fosse mixata.", "flow"]);
    if(peggio && !peggio.video) critiche.push(["di «" + peggio.t + "» non c’è un video: non so cosa far vedere ai miei amici.", "presenza"]);
    if(peggio) critiche.push(["«" + peggio.t + "» non l’ho capita: il ritornello non mi resta.", "scrittura"]);
    if(fuori.length < 3) critiche.push(["vorrei più pezzi: " + (fuori.length === 1 ? "uno solo" : "due") + " li consumo in una settimana.", "scrittura"]);
    const [no, impara] = critiche[(g + i) % critiche.length];
    const si = suonato && i === 0 ? "stasera sul palco: ti ho sentito da sotto, eri vero."
      : "«" + top.t + "» la so a memoria" + (top.q >= 70 ? ", la mando a tutti." : ".");
    out.push({id:"f" + i, n:nome, si:si, no:no, impara:impara, volto:CC_VOLTI_LUI.concat(CC_VOLTI_LEI)[(g + i * 3) % 8]});
  }
  return out;
}
function circoloFanMossa(fid, scelta){
  const fan = circoloFan().find(f => f.id === fid);
  const oggi = circoloOggi();
  if(!fan || oggi.fan[fid] || !circoloQui()) return false;
  if(scelta !== "foto" && scelta !== "critica") return false;
  if(!ccTempoOk("fan").ok) return false;
  ccTempoSpendi("fan");
  oggi.fan[fid] = scelta;
  if(typeof SFX === "object" && SFX.tap) SFX.tap();
  if(scelta === "foto"){
    const f = Math.round(rnd(2, 6));
    const dh = ccHype(1); G.fans += f;
    ccDice("Foto con " + fan.n + ": la posta stanotte." + ccHypeTesto(dh) + " +" + f + " fan.", "bene");
  } else {
    const nomi = {flow:"il Rap", presenza:"il Carisma", scrittura:"la Scrittura"};
    if(typeof gain === "function") gain(fan.impara, 0.4);
    ccDice(fan.n + " ti dice il perché, nel dettaglio. Te lo segni: ci guadagna " + nomi[fan.impara] + ".", "bene");
  }
  if(typeof pushLog === "function") pushLog("Nel backstage hai parlato con <b>" + fan.n + "</b>, che ti segue.", "");
  ccFine();
  return true;
}
