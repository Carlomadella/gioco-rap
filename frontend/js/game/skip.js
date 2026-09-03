/* Salta il tempo (punti 40/41): quanti giorni vuoi, non più tre taglie fisse
   e non più un giorno a settimana al massimo. Non scrivi, non registri, non
   ti fai vedere da nessuno — il corpo si riprende da solo (la notte ricarica
   energia, il benessere tende al suo livello naturale), la testa un po' meno:
   niente azioni musicali vuol dire niente lucidità guadagnata, e la settimana
   la toglie comunque un pochino da sola. Non serve inventare penalità a
   mano: avanzaGiorno() e advanceWeek() (sim.js) le danno già, semplicemente
   vivendo quei giorni senza fare niente — qui si sceglie solo quanti. */
"use strict";

function scegliSalto(opts){
  $("m-k").textContent = "Il tempo";
  $("m-t").textContent = "Salta avanti";
  $("m-d").innerHTML = "Ti fermi e lasci correre il calendario. Non scrivi, non registri, " +
    "non ti fai vedere da nessuno: recuperi le forze e perdi il resto.";
  const w = $("m-opts"); w.innerHTML = "";
  opts.forEach(o => {
    const b = document.createElement("button");
    b.className = "opt2";
    b.innerHTML = '<span class="n">' + o.n + '</span><span class="d">' + o.d + '</span>';
    b.onclick = () => { $("modal").classList.remove("on"); o.run(); };
    w.appendChild(b);
  });
  $("modal").classList.add("on");
}

function saltaTempo(){
  if(G.ended) return;
  scegliSalto([
    {n:"1 giorno", d:"Una notte di ricarica: energia su, e basta.", run:() => saltaGiorni(1)},
    {n:"2 giorni", d:"Due notti. Il corpo si riprende un po' di più.", run:() => saltaGiorni(2)},
    {n:"Una settimana", d:"7 giorni fuori dai giochi: la settimana si chiude da sola, con le sue spese e i suoi stream.", run:() => saltaGiorni(7)},
    {n:"Un mese", d:"28 giorni di silenzio. Benessere pieno, ma lucidità e hype ne risentono davvero.", run:() => saltaGiorni(28)},
    {n:"Lascia stare", d:"Torni a quello che stavi facendo.", run(){}}
  ]);
}

/* Il motore vero: n giorni di fila, senza finestre in mezzo — solo alla fine
   un rigo nel diario e, se qualche settimana si è chiusa per strada, un
   rapporto solo (non uno a settimana, che con un mese sarebbero quattro).

   Da smistare, punto 4: "di fila" non vuol più dire "a occhi chiusi". Ogni
   giorno vissuto può far scattare un incontro/evento/prova "alto" — vero
   raro, vera scelta — e quando succede il salto si ferma sul serio: si vede
   la scena (mostraEventoConRipresa, sotto), e solo dopo la risposta i
   giorni che restavano vengono vissuti, richiamando saltaGiorni() da capo
   sul resto. Basso e medio non arrivano fin qui: si risolvono da soli
   dentro avanzaGiorno()/advanceWeek() (sim.js), il salto non li vede nemmeno. */
function saltaGiorni(n){
  if(G.ended || n <= 0) return;
  if(!weekOpen) openWeek();
  const before = weekOpen, costiSettimana = weeklyCosts();
  const lucPrima = luc(), wellPrima = G.wellbeing;
  SALTO = true;
  SALTO_STOP = null;
  let settimaneChiuse = 0, vissuti = 0;
  for(; vissuti < n && !G.ended; vissuti++){
    if(vissuti === n - 1) SALTO = false;   /* l'ultimo giorno rimette in moto eventi e prove */
    if(avanzaGiorno()) settimaneChiuse++;
    if(SALTO_STOP){ vissuti++; break; }    /* oggi si è fermato qui: contato, non si rivive */
  }
  SALTO = false;
  const dLuc = Math.round(luc() - lucPrima), dWell = Math.round(G.wellbeing - wellPrima);
  pushLog("<b>" + vissuti + (vissuti === 1 ? " giorno saltato." : " giorni saltati.") + "</b> Benessere " +
    (dWell >= 0 ? "+" + dWell : dWell) + ", lucidità " + (dLuc >= 0 ? "+" + dLuc : dLuc) + ".",
    dLuc <= -10 ? "bad" : "");
  SFX[settimaneChiuse > 0 ? "week" : "giorno"]();
  save();
  if(settimaneChiuse > 0){
    const detenutoDopoSalto=!!(G.strada&&G.strada.arresto);
    if(!detenutoDopoSalto){
      weekReport(before, costiSettimana * settimaneChiuse);
    }else{
      /* Il report settimanale, se lasciato .on dietro al carcere,
         rende invisibilmente bloccanti i successivi +1/+7. */
      const report=document.getElementById("report");
      if(report) report.classList.remove("on");
    }
    openWeek();
    if(detenutoDopoSalto){
      try{window.dispatchEvent(new CustomEvent("jail:changed"))}catch(_){}
    }
  } else renderGioco();
  avvisoLucidita();
  if(SALTO_STOP){
    const evento = SALTO_STOP, rimasti = n - vissuti;
    SALTO_STOP = null;
    mostraEventoConRipresa(evento, rimasti);
  }
}

/* La scena "alta" che ha fermato il salto: le stesse opzioni di sempre, solo
   che scegliendone una (o chiudendo con ESC, dove è concesso) il salto
   riprende da dove si era fermato — se restavano giorni da vivere. */
function mostraEventoConRipresa(evento, rimasti){
  const continua = () => { if(rimasti > 0) saltaGiorni(rimasti); };
  const wrapped = {
    k:evento.k, t:evento.t, d:evento.d,
    opts:evento.opts.map(o => ({
      n:o.n, d:o.d,
      run(){ const r = o.run(); continua(); return r; }
    }))
  };
  if(evento.annulla) wrapped.annulla = () => { evento.annulla(); continua(); };
  showEvent(wrapped);
}

function avvisoLucidita(){
  if(luc() < 35)
    setTimeout(() => toast("<b>Lucidità " + Math.round(luc()) + ".</b> Fatichi a mettere insieme due rime: " +
      "tutto quello che scrivi e registri viene peggio.", "bad", "◑", ["#5A6472","#2B2B34"]), 1200);
}
