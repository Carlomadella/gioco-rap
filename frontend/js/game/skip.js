/* Salta il tempo: un giorno, una settimana, un mese.
   Più tempo lasci passare, più recuperi il corpo e più perdi la testa:
   un giorno ti rimette in piedi, una settimana ti spegne la lucidità,
   un mese ti fa dimenticare da tutti. */
"use strict";

const RIPOSI_MAX = 1;   /* quante volte a settimana puoi staccare un giorno */

/* modale con le scelte: chiude prima di eseguire, così le settimane
   che passano possono aprire i loro eventi senza che gli si chiuda sopra */
function scegliSalto(opts){
  $("m-k").textContent = "Il tempo";
  $("m-t").textContent = "Salta avanti";
  $("m-d").innerHTML = "Ti fermi e lasci correre il calendario. Non scrivi, non registri, " +
    "non ti fai vedere da nessuno: recuperi le forze e perdi il resto.";
  const w = $("m-opts"); w.innerHTML = "";
  opts.forEach(o => {
    const b = document.createElement("button");
    b.className = "opt2";
    b.disabled = !!o.off;
    b.innerHTML = '<span class="n">' + o.n + '</span><span class="d">' + o.d + '</span>';
    if(!o.off) b.onclick = () => { $("modal").classList.remove("on"); o.run(); };
    w.appendChild(b);
  });
  $("modal").classList.add("on");
}

function saltaTempo(){
  if(G.ended) return;
  const riposi = G.rest || 0;
  scegliSalto([
    {n:"Un giorno",
     d: riposi >= RIPOSI_MAX
       ? "Questa settimana un giorno te lo sei già preso. Bisogna chiudere la settimana."
       : "Dormi, mangi, non pensi a niente: <b>+1 turno</b> e <b>benessere su</b>. Una volta a settimana.",
     off: riposi >= RIPOSI_MAX,
     run: saltaGiorno},
    {n:"Una settimana",
     d:"La settimana passa da sola: torni con <b>tutti i turni</b> e il benessere su, ma perdi <b>14 di lucidità</b>. Le spese le paghi lo stesso.",
     run: saltaSettimana},
    {n:"Un mese",
     d:"Quattro settimane di niente. Benessere pieno, ma <b>−34 di lucidità</b> e <b>l'hype crolla</b>: la gente ha altro da ascoltare.",
     run: saltaMese},
    {n:"Lascia stare", d:"Torni a quello che stavi facendo.", run(){}}
  ]);
}

function saltaGiorno(){
  G.rest = (G.rest || 0) + 1;
  const prima = G.energy;
  G.energy = Math.min(G.maxEnergy, G.energy + 1);
  const w = Math.round(rnd(4, 8));
  G.wellbeing = clamp(G.wellbeing + w, 0, 100);
  const guad = G.energy > prima ? "+1 turno" : "eri già al massimo dei turni";
  pushLog("Un giorno fuori dai giochi: " + guad + ", benessere +" + w + ".", "");
  SFX.week();
  toast("Un giorno di stacco: <b>" + guad + "</b>, benessere +" + w + ".", "good", "☾", ["#2B3340","#4A5568"]);
  save(); renderGioco();
}

function saltaSettimana(){
  if(!weekOpen) openWeek();
  const before = weekOpen, costs = weeklyCosts();
  addLuc(-14);
  G.wellbeing = clamp(G.wellbeing + 10, 0, 100);
  pushLog("<b>Una settimana saltata.</b> Hai dormito, hai visto gente, non hai scritto una riga.", "");
  advanceWeek();
  weekReport(before, costs);
  openWeek();
  avvisoLucidita();
}

function saltaMese(){
  if(!weekOpen) openWeek();
  const before = weekOpen, costs = weeklyCosts() * 4;
  pushLog("<b>Un mese senza fare niente.</b> Ti sei riposato come non facevi da anni.", "big");
  SALTO = true;
  for(let i = 0; i < 4 && !G.ended; i++){
    if(i === 3) SALTO = false;      /* l'ultima settimana rimette in moto eventi e prove */
    advanceWeek();
  }
  SALTO = false;
  addLuc(-34);
  G.hype = clamp(G.hype * 0.55, 0, 100);
  G.wellbeing = clamp(G.wellbeing + 22, 0, 100);
  G.energy = G.maxEnergy;
  G.rest = 0;
  pushLog("Un mese dopo: sei intero, ma <b>fuori dal giro</b>. Hype " + Math.round(G.hype) +
    ", lucidità " + Math.round(luc()) + ".", "bad");
  save();
  weekReport(before, costs);
  openWeek();
  avvisoLucidita();
}

function avvisoLucidita(){
  if(luc() < 35)
    setTimeout(() => toast("<b>Lucidità " + Math.round(luc()) + ".</b> Fatichi a mettere insieme due rime: " +
      "tutto quello che scrivi e registri viene peggio.", "bad", "◑", ["#5A6472","#2B2B34"]), 1200);
}
