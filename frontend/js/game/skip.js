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
   rapporto solo (non uno a settimana, che con un mese sarebbero quattro). */
function saltaGiorni(n){
  if(G.ended || n <= 0) return;
  if(!weekOpen) openWeek();
  const before = weekOpen, costiSettimana = weeklyCosts();
  const lucPrima = luc(), wellPrima = G.wellbeing;
  SALTO = true;
  let settimaneChiuse = 0;
  for(let i = 0; i < n && !G.ended; i++){
    if(i === n - 1) SALTO = false;   /* l'ultimo giorno rimette in moto eventi e prove */
    if(avanzaGiorno()) settimaneChiuse++;
  }
  SALTO = false;
  const dLuc = Math.round(luc() - lucPrima), dWell = Math.round(G.wellbeing - wellPrima);
  pushLog("<b>" + n + (n === 1 ? " giorno saltato." : " giorni saltati.") + "</b> Benessere " +
    (dWell >= 0 ? "+" + dWell : dWell) + ", lucidità " + (dLuc >= 0 ? "+" + dLuc : dLuc) + ".",
    dLuc <= -10 ? "bad" : "");
  SFX.week();
  save();
  if(settimaneChiuse > 0){
    weekReport(before, costiSettimana * settimaneChiuse);
    openWeek();
  } else renderGioco();
  avvisoLucidita();
}

function avvisoLucidita(){
  if(luc() < 35)
    setTimeout(() => toast("<b>Lucidità " + Math.round(luc()) + ".</b> Fatichi a mettere insieme due rime: " +
      "tutto quello che scrivi e registri viene peggio.", "bad", "◑", ["#5A6472","#2B2B34"]), 1200);
}
