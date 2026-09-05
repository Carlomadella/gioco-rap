/* LE PAGINE DI SERVIZIO — quando il gioco si ferma e ti deve dire una cosa.

   Prima di questo file, quando qualcosa andava storto non succedeva niente di
   visibile: un errore in un modulo lasciava la pagina a metà senza dire una
   parola, il catalogo dei mille eventi poteva non arrivare e il gioco andava
   avanti come se niente fosse (solo, gli eventi non uscivano più), il server
   irraggiungibile lo sapeva solo `ONLINE.staccato` — che non leggeva nessuno —
   e un salvataggio illeggibile veniva ingoiato da un `catch(e){}` e coperto
   dalla partita nuova al primo salvataggio.

   Quattro momenti, quattro risposte:

     AVVIO         sta caricando. Sta nell'HTML, non lo disegna questo file:
                   deve vedersi anche se il codice non parte (vedi servizio.css).
     ROTTO         un errore che ha fermato il gioco. Si dice cos'è successo,
                   si dà il dettaglio a chi lo vuole, e si esce da qualche parte.
     SALVATAGGIO   la partita salvata non si legge. **Non si sovrascrive**: se
                   ne mette una copia da parte e si lascia scegliere.
     STACCATO      il server non risponde. Non è una pagina: il gioco si gioca
                   lo stesso da soli, ed è una fascia in basso.

   **Perché questo file si carica presto.** Sta subito dopo `core.js`, prima di
   tutti i moduli del gioco: gli ascoltatori degli errori devono essere già lì
   quando il resto comincia a girare, se no i primi errori — che sono quelli
   che contano, perché fermano l'avvio — non li sente nessuno.

   Da qui non si esce mai in un vicolo cieco: ogni schermata ha almeno un tasto
   che riporta a giocare, e nessuna può bloccare la partita per sempre. */
"use strict";

(() => {
  const ROTTI = [];               /* gli errori raccolti, per il dettaglio */
  let mostrata = false;           /* una sola schermata rotta per sessione */

  const q = id => document.getElementById(id);
  const esc = t => String(t == null ? "" : t)
    .replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

  /* ==================== AVVIO ====================
     Se ne va quando la pagina è caricata, non quando è pronto tutto. Il
     catalogo dei mille eventi arriva per conto suo, dopo, ed è un file da
     quattro megabyte e mezzo: aspettare anche quello vorrebbe dire tenere
     fermo davanti a una barra chi voleva solo aprire il menu, per una roba
     che serve solo quando la carriera è già cominciata. Il menu è pronto
     quando è pronto il menu. */
  function viaAvvio(){
    const el = q("avvio");
    if(!el || el.classList.contains("via")) return;
    el.classList.add("via");
    /* tolto dal giro dei tab e dei lettori di schermo, non solo invisibile */
    setTimeout(() => { el.hidden = true; }, 600);
  }
  if(document.readyState === "complete") viaAvvio();
  else window.addEventListener("load", viaAvvio);

  /* ==================== IL FOGLIO ====================
     Un solo contenitore per tutte le schermate a pagina intera: cambia il
     testo e i tasti, non l'impalcatura. */
  function mostra({ tono, occhiello, titolo, testo, tasti, dettaglio }){
    const el = q("servizio");
    if(!el) return;
    viaAvvio();
    el.classList.toggle("calmo", tono === "calmo");
    el.innerHTML =
      '<div class="foglio" role="alertdialog" aria-modal="true" aria-labelledby="servizio-t">' +
        '<span class="k">' + esc(occhiello) + '</span>' +
        '<h2 id="servizio-t">' + esc(titolo) + '</h2>' +
        testo.map(p => '<p>' + p + '</p>').join("") +
        '<div class="tasti">' +
          tasti.map((t, i) => '<button type="button" data-t="' + i +
            '"' + (t.primo ? ' class="primo"' : '') + '>' + esc(t.n) + '</button>').join("") +
        '</div>' +
        (dettaglio
          ? '<details><summary>Il dettaglio tecnico</summary><pre>' + esc(dettaglio) + '</pre></details>'
          : '') +
      '</div>';
    el.querySelector(".tasti").addEventListener("click", ev => {
      const b = ev.target.closest("button[data-t]");
      if(!b) return;
      const t = tasti[Number(b.dataset.t)];
      if(t && typeof t.fai === "function") t.fai();
    });
    el.classList.add("on");
    const primo = el.querySelector("button");
    if(primo) primo.focus();
  }
  function chiudi(){
    const el = q("servizio");
    if(el){ el.classList.remove("on"); el.innerHTML = ""; }
  }

  /* ==================== ROTTO ====================
     Un errore che è arrivato fin qui ha già fermato quello che stava facendo.
     Non si finge che vada tutto bene, e non si scrive «Error: undefined is not
     a function» in faccia a chi voleva solo giocare: quello sta nel dettaglio,
     per chi lo deve mandare a qualcuno. */
  function segnaErrore(dove, msg, pila){
    ROTTI.push({ quando: new Date().toISOString(), dove, msg: String(msg || ""), pila: String(pila || "") });
    if(ROTTI.length > 12) ROTTI.shift();
  }
  function schermataRotta(){
    if(mostrata) return;
    mostrata = true;
    const ultimo = ROTTI[ROTTI.length - 1] || {};
    mostra({
      tono: "grave",
      occhiello: "Si è rotto qualcosa",
      titolo: "Il gioco si è fermato",
      testo: [
        "Un pezzo del gioco ha smesso di funzionare a metà. <b>La partita salvata non è stata toccata</b>: quello che avevi fatto fino all'ultimo salvataggio è dove l'hai lasciato.",
        "Ricaricare di solito basta. Se ricapita sempre nello stesso punto, apri il dettaglio qui sotto e mandalo: lì c'è scritto cosa è successo davvero."
      ],
      tasti: [
        { n: "Ricarica il gioco", primo: true, fai: () => location.reload() },
        { n: "Continua lo stesso", fai: () => { chiudi(); } }
      ],
      dettaglio: ROTTI.map(r =>
        r.quando + "  [" + r.dove + "]\n" + r.msg + (r.pila ? "\n" + r.pila : "")
      ).join("\n\n") + "\n\n---\nversione: " + (window.VERSIONE_GIOCO || "?") +
        "\nschermo: " + innerWidth + "x" + innerHeight +
        "\nbrowser: " + navigator.userAgent + (ultimo.dove ? "" : "")
    });
  }

  /* Gli errori veri: quelli del codice e le promesse cadute senza rete di
     sicurezza. Il `true` in fondo è la fase di cattura, che serve a prendere
     anche le immagini e i file che non si caricano — quelli non salgono fino
     a window da soli. */
  window.addEventListener("error", ev => {
    const t = ev.target;
    if(t && t !== window && (t.src || t.href)){
      /* un file che non arriva non ferma il gioco: si annota e basta */
      segnaErrore("file", "non caricato: " + (t.src || t.href), "");
      return;
    }
    segnaErrore("codice", ev.message, ev.error && ev.error.stack);
    schermataRotta();
  }, true);

  window.addEventListener("unhandledrejection", ev => {
    const r = ev.reason;
    segnaErrore("promessa", (r && r.message) || r, r && r.stack);
    schermataRotta();
  });

  /* ==================== SALVATAGGIO ILLEGGIBILE ====================
     `state.js` mette da parte la partita che non è riuscito a leggere e lascia
     detto qui. La regola è una: **non si cancella niente**. La copia sta in
     un'altra chiave, e da qui si sceglie se riprovare o ricominciare. */
  function schermataSalvataggio(rotto){
    mostra({
      tono: "calmo",
      occhiello: "Salvataggio",
      titolo: "La partita salvata non si legge",
      testo: [
        "Il gioco ha trovato un salvataggio in questo slot ma non è riuscito ad aprirlo: il file è troncato o scritto a metà, di solito perché il browser è stato chiuso mentre salvava.",
        "<b>Non è stato cancellato.</b> Ne è stata messa una copia da parte, sotto un altro nome, prima di toccare qualsiasi cosa: se un giorno si riesce a recuperarla, è ancora lì.",
        "Puoi riprovare a caricarla — a volte è un problema del momento — oppure ricominciare da questo slot, che da lì in poi userà una partita nuova."
      ],
      tasti: [
        { n: "Riprova a caricarla", primo: true, fai: () => location.reload() },
        { n: "Ricomincia da questo slot", fai: () => { chiudi(); } }
      ],
      dettaglio: "chiave: " + (rotto.chiave || "?") +
        "\ncopia messa da parte: " + (rotto.copia || "nessuna") +
        "\nerrore: " + (rotto.errore || "?") +
        "\nprimi caratteri: " + String(rotto.grezzo || "").slice(0, 400)
    });
  }
  function guardaSalvataggio(){
    const rotto = window.__ADF_SALVATAGGIO_ROTTO;
    if(rotto && !rotto.detto){ rotto.detto = true; schermataSalvataggio(rotto); }
  }
  if(document.readyState === "complete") setTimeout(guardaSalvataggio, 0);
  else window.addEventListener("load", guardaSalvataggio);

  /* ==================== STACCATO ====================
     Il server serve per la classifica, per l'account e per il salvataggio in
     cloud. Tutto il resto — cioè il gioco — funziona uguale senza. Per questo
     non si prende lo schermo: si dice cosa manca, e ci si toglie di mezzo. */
  let staccatoVisto = 0;
  function fasciaStaccato(){
    const el = q("staccato");
    if(!el) return;
    /* non più di una volta ogni due minuti: se il server è giù, lo è per un
       po', e ripeterlo a ogni chiamata è solo rumore */
    const ora = Date.now();
    if(ora - staccatoVisto < 120000) return;
    staccatoVisto = ora;
    el.classList.add("on");
    clearTimeout(fasciaStaccato.t);
    fasciaStaccato.t = setTimeout(() => el.classList.remove("on"), 9000);
  }
  document.addEventListener("click", ev => {
    const b = ev.target.closest("#staccato button");
    if(!b) return;
    q("staccato").classList.remove("on");
    if(b.dataset.riprova === "1"){
      staccatoVisto = 0;
      try{ if(window.ONLINE && ONLINE.stato) ONLINE.stato(); }catch(e){}
    }
  });
  window.addEventListener("adf:rete-staccata", fasciaStaccato);

  /* ==================== FUORI ====================
     Esposte perché le possa chiamare chi le sa usare, e perché una prova
     possa aprirle senza dover rompere il gioco davvero. */
  window.ADF_SERVIZIO = {
    rotto: schermataRotta,
    salvataggio: schermataSalvataggio,
    staccato: fasciaStaccato,
    chiudi,
    viaAvvio,
    errori: () => ROTTI.slice()
  };
})();
