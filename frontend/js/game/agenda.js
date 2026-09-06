/* L'AGENDA — Anni di Fame (punti 8 e 9).

   Gli eventi della giornata stanno in fondo alla plancia e si potevano solo
   fare **adesso**: ci cliccavi sopra e partivi. Ma un evento alle 21:00 quando
   sono le 15:00 non è una mossa, è un appuntamento — e un appuntamento o te lo
   segni o te lo dimentichi, che è esattamente quello che succedeva.

   Da qui in poi ogni evento si può **segnare in agenda**, e l'agenda ti avvisa:

   - **punto 8, gli eventi di oggi** — un quarto d'ora prima dell'ora arriva la
     notifica. Se stavi facendo una cosa lunga e il tempo è saltato oltre, la
     notifica arriva lo stesso e ti dice che è cominciata;
   - **punto 9, gli eventi della settimana** — sono in un altro giorno, quindi
     l'avviso a quindici minuti non serve a niente: quello che serve è saperlo
     la mattina. La notifica arriva **il giorno stesso, appena ti svegli**.

   Dove finisce la notifica: sul momento un toast a schermo, e in ogni caso nel
   centro notifiche del telefono (`ADF_EVENTI.addNotification`), che è l'unico
   che c'è — non se ne apre un secondo. Così se stavi guardando altro la trovi
   lì, col pallino rosso sull'icona.

   Cosa NON fa: non ti porta all'evento e non lo fa partire da solo. Il tempo di
   questo gioco lo muove il giocatore, e un'agenda che ti teletrasporta alle
   21:00 sarebbe il gioco che gioca da solo. Ti avvisa, e poi decidi tu. */
"use strict";

(() => {
  const PREAVVISO = 15;              // minuti prima dell'ora, per gli eventi di oggi
  const GIORNI = ["", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"];

  /* ==================== GLI EVENTI DELLA SETTIMANA (punto 9) ====================
     Non sono gli stessi di ogni sera: succedono una volta a settimana, in un
     giorno e a un'ora loro, e non capitano tutte le settimane le stesse. Ogni
     voce punta a una cosa che nel gioco esiste già — un'azione, La Sala, la
     Strada — perché un evento che non porta da nessuna parte è una scritta. */
  /* `peso`, Da smistare punto 6: non tutti e sei valgono uguale — un evento
     più importante della settimana dà di più, uno minore dà meno. È il
     moltiplicatore che l'azione vera (actions.js/posto.js/strada-crimine.js)
     applica quando la giochi segnata in agenda, nel giorno giusto: vedi
     consumaPeso() più sotto. Il giro grosso rischia di più e rende di più;
     le porte aperte in palestra sono la cosa più piccola delle sei. */
  const SETTIMANALI = [
    {id:"free", ic:"mic", k:"#A855F7", n:"Battle di quartiere", peso:1.3,
     d:"Una sera sola: si sfida chi si presenta.", giorno:5, ora:"22:00",
     righe:[["hype", "Hype se tieni il palco"], ["gente", "Ti vedono in tanti"]]},
    {id:"live", ic:"corona", k:"#F97316", n:"Serata open mic", peso:1.15,
     d:"Il locale apre il palco a chi ha qualcosa da far sentire.", giorno:6, ora:"21:30",
     righe:[["fama", "Fama vera"], ["soldi", "Qualche soldo"]]},
    {id:"sala", ic:"nota", k:"#38BDF8", n:"Sessione lunga alla Sala", peso:1.2,
     d:"Tutta la sera, e gira gente che conta.", giorno:3, ora:"20:00", posto:true,
     righe:[["gente", "Gente da conoscere"], ["cursori", "Beat sul tavolo"]]},
    {id:"promo", ic:"hype", k:"#FB923C", n:"Giornata di lanci", peso:1.25,
     d:"Oggi i social girano: quello che spingi lo vedono di più.", giorno:2, ora:"18:00",
     righe:[["hype", "Vale di più oggi"], ["fama", "Occhi addosso"]]},
    {id:"colpo", ic:"maschera", k:"#EF4444", n:"Il giro grosso", peso:1.6,
     d:"Passa una cosa più seria del solito. Rischio più serio.", giorno:4, ora:"01:00", strada:true,
     righe:[["soldi", "Soldi veri"], ["rischio", "Guai veri"]]},
    {id:"palestra_pesi", ic:"manubrio", k:"#57C98B", n:"Porte aperte in palestra", peso:1.1,
     d:"Un giorno a settimana si entra senza pagare.", giorno:1, ora:"17:00",
     righe:[["cuore", "Benessere"], ["scudo", "Tieni la striscia"]]}
  ];

  /* Due a settimana. Il seme è il numero della settimana e non il caso: la
     plancia si ridisegna venti volte al minuto, e con `Math.random()` gli
     eventi cambierebbero sotto gli occhi mentre li guardi.

     Fra i sei, si preferiscono quelli che devono ancora arrivare: due eventi
     già passati sono una riga di storia, e la riga di storia non serve a
     nessuno — quello che serve è sapere cosa c'è **da qui a domenica**. Se la
     settimana è agli sgoccioli e non è rimasto niente, si mostra lo stesso
     quello che c'è stato, segnato «passato». */
  function settimanali(){
    const seme = (Number(G.year) || 1) * 53 + (Number(G.week) || 1);
    const giro = SETTIMANALI.map((_, i) => SETTIMANALI[(i + seme) % SETTIMANALI.length]);
    const oggi = G.day || 1;
    const avanti = giro.filter(e => e.giorno >= oggi);
    const dietro = giro.filter(e => e.giorno < oggi);
    return avanti.concat(dietro).slice(0, 2).sort((x, y) => x.giorno - y.giorno);
  }

  /* ==================== IL QUADERNO ==================== */
  function ag(){
    if(!G.agenda || typeof G.agenda !== "object") G.agenda = {voci:[], ultimoGiorno:0};
    if(!Array.isArray(G.agenda.voci)) G.agenda.voci = [];
    return G.agenda;
  }
  const oraInMinuti = testo => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(testo || "")); if(!m) return 0;
    let h = +m[1];
    /* dopo mezzanotte è ancora la stessa serata: le 01:30 sono le 25:30 */
    if(h < 5) h += 24;
    return h * 60 + (+m[2]);
  };
  const adesso = () => {
    try{ return window.GAME_TIME ? GAME_TIME.now().minutes : (G.timeMinutes || 8 * 60); }
    catch(e){ return G.timeMinutes || 8 * 60; }
  };
  const chiave = (e, tipo) => tipo + ":" + e.id;

  /* Le voci vecchie non si accumulano: un appuntamento di due settimane fa non
     è storia, è sporcizia. Si tengono quelli di oggi e quelli ancora da venire. */
  function pulisci(){
    const a = ag(), anno = G.year || 1, sett = G.week || 1, giorno = G.day || 1;
    const prima = a.voci.length;
    a.voci = a.voci.filter(v =>
      v.anno > anno ||
      (v.anno === anno && v.settimana > sett) ||
      (v.anno === anno && v.settimana === sett && v.giorno >= giorno));
    return prima !== a.voci.length;
  }

  function voci(){ pulisci(); return ag().voci; }
  function trova(e, tipo){
    return voci().find(v => v.k === chiave(e, tipo) &&
      v.anno === (G.year || 1) && v.settimana === (G.week || 1));
  }
  const segnato = (e, tipo) => !!trova(e, tipo);

  function segna(e, tipo){
    if(segnato(e, tipo)) return null;
    const giorno = tipo === "settimana" ? e.giorno : (G.day || 1);
    const v = {
      k:chiave(e, tipo), id:e.id, tipo:tipo,
      n:e.n, ic:e.ic, kolore:e.k, ora:e.ora, minuti:oraInMinuti(e.ora),
      anno:G.year || 1, settimana:G.week || 1, giorno:giorno,
      avvisato:false
    };
    ag().voci.push(v);
    ag().voci.sort((x, y) => (x.giorno - y.giorno) || (x.minuti - y.minuti));
    if(typeof save === "function") save();
    return v;
  }
  function togli(e, tipo){
    const a = ag(), k = chiave(e, tipo);
    const n = a.voci.length;
    a.voci = a.voci.filter(v => !(v.k === k && v.anno === (G.year || 1) && v.settimana === (G.week || 1)));
    if(a.voci.length !== n && typeof save === "function") save();
    return a.voci.length !== n;
  }

  /* Il tasto sulla card: segna se non c'è, toglie se c'è. Torna cosa ha fatto,
     così chi ha cliccato può dirlo a schermo. */
  function tocca(e, tipo){
    if(segnato(e, tipo)){ togli(e, tipo); return {segnato:false}; }
    const v = segna(e, tipo);
    return {segnato:true, voce:v};
  }

  /* ==================== IL PESO DELL'EVENTO (punto 6) ====================
     Non tutti gli eventi della settimana valgono uguale, e ognuno vale il
     suo solo se: l'hai segnato in agenda come evento della settimana, ed è
     proprio oggi il suo giorno — non prima, non "un po' dopo perché non
     hai fatto in tempo". Un bonus preso una volta non si ripete nella
     stessa settimana: consumaPeso() lo marca subito. */
  function vociDaConsumare(id){
    return voci().filter(v => v.tipo === "settimana" && v.id === id && !v.bonusUsato &&
      v.anno === (G.year || 1) && v.settimana === (G.week || 1) && v.giorno === (G.day || 1));
  }
  function pesoDiOggi(id){
    if(!vociDaConsumare(id).length) return 1;
    const def = SETTIMANALI.find(s => s.id === id);
    return def && def.peso ? def.peso : 1;
  }
  function consumaPeso(id){
    const trovate = vociDaConsumare(id);
    if(!trovate.length) return 1;
    const def = SETTIMANALI.find(s => s.id === id);
    const peso = def && def.peso ? def.peso : 1;
    if(peso > 1){
      trovate.forEach(v => { v.bonusUsato = true; });
      if(typeof save === "function") save();
    }
    return peso;
  }

  /* ==================== GLI AVVISI ==================== */
  function avvisa(v, testo, sottotesto){
    try{
      if(typeof toast === "function")
        toast("<b>" + testo + "</b> " + sottotesto, "", "🔔", ["#F59E0B", "#B45309"]);
    }catch(e){}
    try{
      if(window.ADF_EVENTI && typeof ADF_EVENTI.addNotification === "function")
        ADF_EVENTI.addNotification({
          eventId:"agenda-" + v.id, tier:"basso", family:"Agenda",
          title:testo, result:sottotesto, source:"agenda"
        });
    }catch(e){}
  }

  /* Gli eventi di oggi (punto 8): un quarto d'ora prima. Se il tempo è saltato
     oltre — una mossa lunga, un +1 ora — la notifica arriva comunque e cambia
     parole: non «fra poco», ma «è cominciata». */
  function controllaOggi(fino){
    let cambiato = false;
    for(const v of voci()){
      if(v.tipo !== "oggi" || v.avvisato) continue;
      if(v.giorno !== (G.day || 1)) continue;
      if(fino < v.minuti - PREAVVISO) continue;
      v.avvisato = true; cambiato = true;
      if(fino < v.minuti) avvisa(v, "Fra poco: " + v.n, "Alle " + v.ora + ", segnato in agenda.");
      else avvisa(v, "È cominciata: " + v.n, "Erano le " + v.ora + ".");
    }
    return cambiato;
  }

  /* Gli eventi della settimana (punto 9): la mattina del giorno stesso. Il
     «quando ti svegli» è il primo avanzamento di tempo del giorno nuovo. */
  function controllaGiorno(){
    const a = ag(), giorno = G.day || 1;
    if(a.ultimoGiorno === giorno) return false;
    a.ultimoGiorno = giorno;
    let cambiato = true;
    for(const v of voci()){
      if(v.tipo !== "settimana" || v.avvisato) continue;
      if(v.giorno !== giorno) continue;
      v.avvisato = true;
      avvisa(v, "Oggi: " + v.n, "Alle " + v.ora + ", te l'eri segnato.");
    }
    return cambiato;
  }

  window.addEventListener("game-time:advanced", ev => {
    const d = (ev && ev.detail) || {};
    let cambiato = controllaGiorno();
    if(controllaOggi(Number(d.to) || adesso())) cambiato = true;
    if(cambiato && typeof save === "function") save();
  });

  /* ==================== QUELLO CHE SERVE FUORI ==================== */
  window.AGENDA = {
    settimanali, voci, segnato, segna, togli, tocca,
    pesoDiOggi, consumaPeso,
    minutiDi:oraInMinuti,
    /* è già passata? serve alla card, per non far segnare l'impossibile */
    passata(e, tipo){
      if(tipo === "settimana") return (e.giorno || 7) < (G.day || 1);
      return oraInMinuti(e.ora) <= adesso();
    },
    giornoNome:n => GIORNI[n] || ("giorno " + n),
    PREAVVISO
  };
})();
