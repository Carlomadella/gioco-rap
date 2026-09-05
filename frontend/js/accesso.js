/* La pagina di accesso — Anni di Fame (punto 27).

   Sta da sola perché l'account è una cosa a sé: non è il gioco, non è la
   copertina del gioco. Qui dentro c'è un modulo con due righe, il ponte col
   server è js/net/online.js e non ce n'è altro.

   Regola tenuta da online.js e rispettata anche qui: **se il server non c'è,
   non si rompe niente**. `ONLINE` torna `null` quando la rete non risponde, e
   la fascia in fondo (js/servizio.js) lo dice per conto suo. La carriera resta
   dov'è, su questo dispositivo, con o senza account.

   Le rotte usate sono tre, e sono quelle di backend/README-API.md:
     POST   /api/account    tipo "email" → si apre l'account
     POST   /api/sessione   tipo "email" → si entra
     GET    /api/io         chi sei, e cosa hai in cloud
     DELETE /api/sessione   si esce */
"use strict";

(() => {
  let modo = "entra";                     // "entra" oppure "nuovo"
  const mail = $("acc-mail"), segreto = $("acc-segreto");
  const modulo = $("acc-modulo"), chi = $("acc-chi"), dice = $("acc-dice");
  const vai = $("acc-vai");

  /* I messaggi del server sono parole in codice: qui diventano italiano. Le
     stringhe sono quelle vere di backend/server.js — se ne nasce una nuova,
     si vede lo stesso qualcosa di sensato invece di «undefined». */
  const SPIEGA = {
    "email-non-valida": "Quella mail non sembra una mail.",
    "segreto-troppo-corto": "La password deve essere di almeno otto caratteri.",
    "email-gia-usata": "Quella mail ha già un account. Prova a entrare, invece di crearne uno.",
    "non-torna": "Mail o password non tornano.",
    "sessione-scaduta": "La sessione è scaduta: entra di nuovo.",
    "account-sconosciuto": "Di quell'account non c'è traccia."
  };
  const spiega = e => SPIEGA[e] || ("Non ha funzionato (" + e + ").");

  function messaggio(testo, tono){
    dice.textContent = testo;
    dice.className = "acc-dice on " + (tono || "male");
  }
  function zitto(){ dice.className = "acc-dice"; dice.textContent = ""; }

  /* ==================== LE DUE FACCE ==================== */
  function mostraModo(m){
    modo = m;
    zitto();
    $("acc-t-entra").classList.toggle("on", m === "entra");
    $("acc-t-entra").setAttribute("aria-selected", m === "entra" ? "true" : "false");
    $("acc-t-nuovo").classList.toggle("on", m === "nuovo");
    $("acc-t-nuovo").setAttribute("aria-selected", m === "nuovo" ? "true" : "false");
    $("acc-tit").textContent = m === "entra" ? "Entra nel tuo account" : "Apri un account";
    $("acc-sub").textContent = m === "entra"
      ? "Serve solo a portarti dietro la carriera: cambi telefono, rientri, e ritrovi tutto. Per giocare non serve — la partita è già salvata qui."
      : "Una mail e una password. Non chiediamo altro, e non serve per giocare: serve perché la carriera non resti prigioniera di questo dispositivo.";
    vai.textContent = m === "entra" ? "Entra" : "Apri l'account";
    segreto.setAttribute("autocomplete", m === "entra" ? "current-password" : "new-password");
    $("acc-nota").textContent = m === "entra"
      ? "Se la password la dimentichi, la carriera su questo dispositivo resta comunque dov'è: l'account serve solo a ritrovarla altrove."
      : "La password è tua e non la sa nessuno: sul server ne resta solo l'impronta, non la password.";
  }

  /* ==================== CHI SEI ====================
     Il modulo e la scheda «sei dentro» sono la stessa pagina, una alla volta. */
  function mostraDentro(dati){
    const a = (dati && dati.account) || {};
    $("acc-chi-mail").textContent = a.email || a.id_esterno || a.idEsterno || "account senza mail";
    const quando = a.creato || a.creato_il || a.creatoIl;
    $("acc-chi-da").textContent = quando
      ? new Date(quando).toLocaleDateString("it-IT", {day:"numeric", month:"long", year:"numeric"})
      : "—";
    const n = (dati && dati.carriere && dati.carriere.length) || 0;
    $("acc-chi-carriere").textContent = n === 0 ? "nessuna, per ora"
      : n === 1 ? "una" : n + " carriere";
    $("acc-tit").textContent = "Sei dentro";
    $("acc-sub").textContent = "Da qui la carriera può viaggiare: la salvi in cloud dalle impostazioni del gioco e la ritrovi su un altro dispositivo.";
    modulo.style.display = "none";
    chi.classList.add("on");
  }
  function mostraFuori(){
    chi.classList.remove("on");
    modulo.style.display = "";
    mostraModo(modo);
  }

  /* All'apertura: se una sessione c'è già, si chiede al server se vale ancora.
     Se il server non risponde non si dice niente di brutto — si lascia il
     modulo, e ci pensa la fascia in fondo a spiegare che è staccato. */
  async function guarda(){
    const mia = ONLINE.identita();
    if(!mia || !mia.sessione){ mostraFuori(); return; }
    const dati = await ONLINE.io();
    if(dati && !dati.errore){ mostraDentro(dati); return; }
    mostraFuori();
    if(dati && dati.errore === "sessione-scaduta") messaggio(spiega(dati.errore));
  }

  /* ==================== I COMANDI ==================== */
  $("acc-t-entra").onclick = () => mostraModo("entra");
  $("acc-t-nuovo").onclick = () => mostraModo("nuovo");

  modulo.addEventListener("submit", async e => {
    e.preventDefault();
    const m = mail.value.trim().toLowerCase(), s = segreto.value;
    if(!m || !s) return;
    if(modo === "nuovo" && s.length < 8){ messaggio(SPIEGA["segreto-troppo-corto"]); return; }

    vai.disabled = true;
    vai.textContent = modo === "entra" ? "Sto entrando…" : "Sto aprendo…";
    const r = modo === "entra" ? await ONLINE.entra(m, s) : await ONLINE.registraConMail(m, s);
    vai.disabled = false;
    mostraModo(modo);                     // rimette la scritta giusta sul tasto

    /* null = il server non ha risposto. Non è un errore del giocatore e non va
       raccontato come tale. */
    if(!r){ messaggio("Il server non risponde. Riprova fra un momento: la partita intanto resta qui, salva.", "male"); return; }
    if(r.errore){ messaggio(spiega(r.errore)); return; }

    segreto.value = "";
    messaggio(modo === "entra" ? "Bentornato." : "Account aperto: da adesso la carriera ti segue.", "bene");
    const dati = await ONLINE.io();
    if(dati && !dati.errore) mostraDentro(dati);
  });

  $("acc-esci").onclick = async () => {
    $("acc-esci").disabled = true;
    await ONLINE.esci();
    $("acc-esci").disabled = false;
    mostraFuori();
    messaggio("Sei uscito. La carriera resta su questo dispositivo, come sempre.", "bene");
  };

  /* Il marchio e il «‹ Menu» tornano alla landing: da qui non si entra in
     partita, l'account e il gioco sono due pagine diverse. */
  const allaLanding = () => vaiA("landing");
  $("brand").onclick = allaLanding;
  $("nav-back").onclick = allaLanding;

  mostraModo("entra");
  guarda();
})();
