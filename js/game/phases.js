/* Fasi della carriera e prove di passaggio. */
"use strict";

/* ==================== FASI DELLA SCALATA ==================== */
/* Ogni fase mette un tetto a quanto puoi arrivare lontano in una settimana.
   Per salire di fase devi superare una PROVA: una scelta vera, con dei requisiti. */
const PHASES = [
  {n:"Sconosciuto",        cap:800,     fmax:900,     d:"Suoni per gli amici e per nessun altro."},
  {n:"Rapper esordiente",  cap:5200,    fmax:6000,    d:"Nel tuo giro sanno chi sei."},
  {n:"Rapper emergente",   cap:34000,   fmax:45000,   d:"I locali ti chiamano loro."},
  {n:"Rapper",             cap:210000,  fmax:300000,  d:"Vivi di questo. Fuori città sanno il tuo nome."},
  {n:"Star",               cap:1300000, fmax:2000000, d:"Sei dentro al discorso grande."},
  {n:"Man of the Year",    cap:6500000, fmax:9000000, d:"Quest'anno è stato il tuo."},
  {n:"GOAT",               cap:1e9,     fmax:1e9,     d:"Non è più una carriera. È un nome che resta."}
];
const relCount = () => G.songs.filter(s => s.released).length;
const bestRel = () => G.songs.filter(s => s.released).reduce((a,s) => Math.max(a,s.q), 0);

function passTrial(msg){
  G.phase = Math.min(G.phase+1, PHASES.length-1);
  G.trialCd = 0;
  G.hype = clamp(G.hype + 18, 0, 100);
  pushLog("<b>" + PHASES[G.phase].n + ".</b> " + msg, "big");
  return {t:"", c:""};
}
function failTrial(msg, weeks){
  G.trialCd = weeks || 8;
  delete G.trialsDone[G.phase];
  G.hype = clamp(G.hype - 8, 0, 100);
  pushLog(msg, "bad");
  return {t:"", c:""};
}

const TRIALS = [
{ ph:0, k:"Prova", t:"Il contest del quartiere",
  hint:"Serve: 150 fan, un pezzo pubblicato, 6 settimane di gavetta.",
  req:g => g.fans >= 150 && relCount() >= 1 && totalWeeks() >= 6,
  d:"Sotto casa hanno organizzato una serata a premi. Ci sono trenta persone e un impianto che fischia. È poco, ma è la prima volta che qualcuno ti mette su un palco.",
  opts:[
    {n:"Porti il tuo pezzo migliore", d:"Passi se il pezzo regge (qualità 42+)",
     run(){ return bestRel() >= 42
       ? passTrial("Hanno chiesto come ti chiami. Adesso nel quartiere lo sanno.")
       : failTrial("Il pezzo non reggeva su quell'impianto. Applausi di cortesia.", 6); }},
    {n:"Vai a braccio, freestyle", d:"Passi se il flow è almeno 18",
     run(){ return G.skills.flow >= 18
       ? passTrial("Hai chiuso con una rima che hanno ripetuto per settimane.")
       : failTrial("Ti sei incartato a metà. Qualcuno ha riso.", 6); }},
    {n:"Non ti presenti", d:"Nessun rischio, nessun passo avanti",
     run(){ G.wellbeing = clamp(G.wellbeing+8,0,100);
       return failTrial("Sei rimasto a casa. Il posto l'ha preso un altro.", 5); }}
  ]},

{ ph:1, k:"Prova", t:"Il locale che conta",
  hint:"Serve: 1.200 fan, presenza 18, 20 settimane di carriera.",
  req:g => g.fans >= 1200 && g.skills.presenza >= 18 && totalWeeks() >= 20,
  d:"Il locale dove passano quelli che poi esplodono ha una data libera. Il gestore ti guarda come si guarda uno che non ha ancora dimostrato niente.",
  opts:[
    {n:"Suoni gratis pur di esserci", d:"Passi se la presenza è 22+. Zero euro.",
     run(){ return G.skills.presenza >= 22
       ? passTrial("Sala piena. Da quella sera in città sanno chi sei.")
       : failTrial("Hai suonato davanti a quindici persone distratte.", 8); }},
    {n:"Chiedi di essere pagato", d:"Passi se hai hype 40+. Altrimenti ti chiude la porta.",
     run(){ if(G.hype >= 40){ G.money += 400;
         return passTrial("Ti hanno pagato e ti hanno richiamato. Ti sei fatto rispettare."); }
       return failTrial("«Torna quando sei qualcuno.» Porta chiusa.", 10); }},
    {n:"Ti paghi tu la serata", d:"−600 €, passi comunque se puoi permettertelo",
     run(){ if(G.money < 600) return failTrial("Non avevi i soldi. È rimasta una serata immaginata.", 6);
       G.money -= 600;
       return passTrial("Hai pagato tu il palco. Ha funzionato, ma ti è costato."); }}
  ]},

{ ph:2, k:"Prova", t:"Il festival",
  hint:"Serve: 8.000 fan, 4 pezzi fuori, 45 settimane.",
  req:g => g.fans >= 8000 && relCount() >= 4 && totalWeeks() >= 45,
  d:"C'è un festival estivo con dodicimila persone al giorno. Sul palco piccolo c'è ancora un buco, e ci sono tre modi per entrarci.",
  opts:[
    {n:"Te lo procuri con i contatti", d:"Passi se la rete è 32+",
     run(){ return G.skills.rete >= 32
       ? passTrial("Ci sei entrato da chi conosci. Sul palco poi eri tu.")
       : failTrial("Nessuno ha risposto ai messaggi. Il buco l'ha preso un altro.", 10); }},
    {n:"Ci arrivi con l'etichetta", d:"Serve un contratto firmato",
     run(){ return G.contract
       ? passTrial("L'etichetta ti ha messo in cartellone. Da qui in poi si esce dalla città.")
       : failTrial("Senza nessuno dietro non ti hanno nemmeno risposto.", 10); }},
    {n:"Ti compri lo slot", d:"−4.000 €",
     run(){ if(G.money < 4000) return failTrial("Quattromila euro non li avevi.", 8);
       G.money -= 4000;
       return passTrial("Slot comprato. Nessuno lo sa e nessuno lo saprà mai."); }}
  ]},

{ ph:3, k:"Prova", t:"Trenta date in due mesi",
  hint:"Serve: 45.000 fan, un contratto firmato, 85 settimane.",
  req:g => g.fans >= 45000 && !!g.contract && totalWeeks() >= 85,
  d:"Ti propongono un tour vero. Trenta date, furgone, alberghi da due stelle e due giorni liberi in tutto.",
  opts:[
    {n:"Le fai tutte e trenta", d:"Passi se il benessere è 45+. Ti svuota comunque.",
     run(){ if(G.wellbeing >= 45){ G.wellbeing = clamp(G.wellbeing-30,0,100); G.money += 9000;
         return passTrial("Trenta date fatte. Sei distrutto ma adesso giochi in un altro campionato."); }
       return failTrial("Sei crollato alla dodicesima data. Tour annullato.", 12); }},
    {n:"Ne fai dieci e tieni la testa", d:"Passi se l'hype è 60+",
     run(){ G.money += 3000;
       return G.hype >= 60
        ? passTrial("Dieci date piene. Hai fatto meno e hai contato di più.")
        : failTrial("Dieci date mezze vuote. Non è bastato.", 10); }},
    {n:"Rinunci", d:"Resti dove sei, ma intero",
     run(){ G.wellbeing = clamp(G.wellbeing+15,0,100);
       return failTrial("Hai detto no al tour. L'occasione tornerà, forse.", 14); }}
  ]},

{ ph:4, k:"Prova", t:"L'arena",
  hint:"Serve: 250.000 fan, un terzo posto in classifica, 130 settimane.",
  req:g => g.fans >= 250000 && g.best.chart <= 3 && totalWeeks() >= 130,
  d:"Diecimila biglietti da vendere in prevendita. Se non li vendi, la data salta e lo sanno tutti.",
  opts:[
    {n:"Annunci la data", d:"Passi se l'hype è 55+",
     run(){ return G.hype >= 55
       ? passTrial("Sold out in quattro giorni. Prima fila.")
       : failTrial("Prevendite ferme. Data annullata, e i giornali l'hanno scritto.", 16); }},
    {n:"Prima un disco, poi l'arena", d:"Serve almeno un pezzo sopra il milione di stream",
     run(){ return G.songs.some(x => x.streams >= 1000000)
       ? passTrial("Hai aspettato il pezzo giusto. Poi l'arena si è riempita da sola.")
       : failTrial("Non avevi ancora il pezzo che regge un'arena.", 12); }}
  ]}
,
{ ph:5, k:"Prova", t:"Quello che resta",
  hint:"Serve: 900.000 fan, il primo posto, un pezzo oltre il milione, 190 settimane.",
  req:g => g.fans >= 900000 && g.best.chart === 1 && g.songs.some(x=>x.streams>=1000000) && totalWeeks() >= 190,
  d:"Ti chiedono un disco che non serve a vendere. Serve a dire cosa sei stato. Nessuno può scriverlo al posto tuo, e se sbagli questo si ricorderanno questo.",
  opts:[
    {n:"Lo scrivi da solo, tutto", d:"Serve scrittura 60+. Ti prosciuga.",
     run(){ if(G.skills.scrittura >= 60){ G.wellbeing = clamp(G.wellbeing-25,0,100);
         return passTrial("L'hai scritto tu, riga per riga. Adesso quel disco lo studiano."); }
       return failTrial("Non era ancora il tuo disco. L'hai capito prima degli altri.", 20); }},
    {n:"Chiami tutti quelli che contano", d:"Serve rete 55+",
     run(){ return G.skills.rete >= 55
       ? passTrial("Ci sono dentro tutti. E al centro ci sei tu.")
       : failTrial("Metà delle persone che volevi non ha risposto.", 16); }},
    {n:"Ti prendi un anno di silenzio", d:"Perdi fan, ma torni con tutto",
     run(){ G.fans = Math.round(G.fans*0.75); G.wellbeing = clamp(G.wellbeing+30,0,100);
       return failTrial("Un anno di silenzio. Qualcuno ti ha dimenticato, tu no.", 18); }}
  ]}
];

function pendingTrial(){
  return TRIALS.find(t => t.ph === G.phase && !G.trialsDone[t.ph] && t.req(G));
}
function nextTrial(){ return TRIALS.find(t => t.ph === G.phase); }
