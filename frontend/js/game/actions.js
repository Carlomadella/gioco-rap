/* Azioni della settimana e lavoretti, con costi e requisiti. */
"use strict";

/* ==================== AZIONI ==================== */
const BEATNAMES = ["Vetro Rotto","Fumo Blu","Terzo Piano","Sottopasso","Neve Sporca",
  "Ferro Vecchio","Ore Piccole","Cemento Armato","Luce Gialla","Ultimo Treno"];

/* Punto 39/40: con l'energia a 100 al giorno (100 non a settimana) e i giorni
   che si chiudono uno alla volta, in una settimana ci stanno molte più mosse
   di prima (~3). RITMO smorza i guadagni diretti delle mosse che si possono
   ripetere senza limiti (promo, live, freestyle veloce) perché farne 10 al
   giorno non deve valere 10 volte una sola — i pezzi restano tal quali: il
   tetto settimanale della fase (PHASES.cap) già li tiene a bada da solo. */
const RITMO = 0.4;

const JOBS = [
  {id:"volantini", n:"Volantinaggio", pay:70,  e:18, d:"Freddo, gambe, nessuna dignità."},
  {id:"lavapiatti", n:"Lavapiatti",   pay:100, e:18, d:"Turni serali, cucina bollente."},
  {id:"fattorino",  n:"Fattorino",    pay:125, e:18, d:"In giro col motorino, piove sempre."},
  {id:"barista",    n:"Barista",      pay:130, e:18, d:"Conosci gente. Ogni turno un contatto in più.",
   extra(){ G.skills.rete += 0.5; return " Rete +0.5."; }},
  {id:"magazzino",  n:"Magazziniere", pay:165, e:32, d:"Bancali e schiena. Paga bene, ti spegne."},
  {id:"buttafuori", n:"Buttafuori",   pay:210, e:32, d:"Notti in piedi sulla porta di un locale.",
   req:g => g.skills.presenza >= 16},
  {id:"fonico",     n:"Fonico junior", pay:180, e:32, d:"In uno studio vero. Impari guardando.",
   req:g => g.skills.flow >= 20, extra(){ G.skills.flow += 0.9; return " Flow +0.9."; }}
];

/* Cosa determina davvero la qualità di quello che fai:
   benessere, dove vivi, quanto hai lavorato questa settimana, quanti pezzi hai già fatto. */
function qFactors(){
  const f = [];
  const ben = clamp(0.58 + G.wellbeing/135, 0.58, 1.14);           f.push(["benessere", ben]);
  const casa = 1 + (G.life && G.life.casa ? G.life.casa : 0)*0.04;  f.push(["dove vivi", casa]);
  const stanco = 1 - Math.min(0.20, (G.shifts||0)*0.07);
  if((G.shifts||0) > 0) f.push(["turni fatti", stanco]);
  const lu = 0.65 + luc()*0.005;                                    f.push(["lucidità", lu]);
  const esp = 1 + Math.min(0.14, G.songs.length*0.012);             f.push(["esperienza", esp]);
  const attr = 1 + Math.min(0.10, gearBonus()*0.004);
  if(gearBonus() > 0) f.push(["attrezzatura", attr]);
  return {mult: ben*casa*stanco*esp*attr*lu, list:f};
}
const qDetail = () => qFactors().list
  .map(([n,v]) => n + " " + (v>=1?"+":"") + Math.round((v-1)*100) + "%").join(" · ");
const wellFactor = () => qFactors().mult;
const qVeloce = () => clamp((28 + G.skills.scrittura*0.8) * wellFactor(), 5, 100);
const gearBonus = () => GEAR.reduce((a,g) => a + (G.gear[g.id] ? g.q : 0), 0);
const bestBar  = () => G.bars.slice().sort((a,b) => b.q-a.q)[0];
const bestBeat = () => G.beats.slice().sort((a,b) => b.q-a.q)[0];
const unmixed  = () => G.songs.filter(s => !s.released && !s.mixed);
const ready    = () => G.songs.filter(s => !s.released);
const songQ = (bar, beat) => clamp((bar.q*0.45 + beat.q*0.33 + G.skills.flow*0.35 + gearBonus()) * wellFactor(), 5, 100);
const mixGain = () => Math.round(6 + (G.gear.monitor?5:0) + (G.gear.cuffie?3:0) + G.skills.flow*0.06);

function offerJobs(){
  const pool = JOBS.filter(j => (!j.req || j.req(G)) && (!G.job || G.job.id !== j.id));
  const picks = [];
  while(picks.length < 2 && picks.length < pool.length){
    const j = pick(pool);
    if(picks.indexOf(j) < 0) picks.push(j);
  }
  const opts = picks.map(j => ({
    n: j.n + " · " + j.pay + " € a turno",
    d: j.e + " energia per turno. " + j.d,
    run(){
      G.job = {id:j.id, n:j.n, pay:j.pay, e:j.e, missed:0};
      return {t:"Hai preso il posto da " + j.n.toLowerCase() + ": " + j.pay + " € a turno.", c:"good"};
    }
  }));
  opts.push({n:"Nessuno dei due", d:"Resti senza stipendio fisso.",
    run(){ return {t:"Hai rifiutato entrambi. La settimana prossima si vedrà.", c:""}; }});
  showEvent({k:"Colloqui", t:"Due posti liberi",
    d:"Non è quello che vuoi fare nella vita. È quello che paga la sala e i beat.", opts});
}

const ACTIONS = [
  {id:"scrivi", n:"Scrivi barre", e:28, luc:3,
   d:"Il foglio, la penna e quello che hai in testa.",
   give:() => "veloce · oppure scrivila tu ×1,5",
   run(){
     scegliModo({
       t:"Scrivi barre",
       d:"Puoi buttare giù qualcosa di getto e passare oltre, oppure sederti davvero al foglio e scriverla riga per riga.",
       dv:"La butto giù io e te la faccio leggere: qualità ~" + Math.round(qVeloce()) +
          ", decisa dalle tue statistiche. Poi la tieni così o la sistemi. Oggi contano: " + qDetail() + ".",
       dg:"Foglio bianco: le barre le scrivi tu, e vale ×1,5. Se ti blocchi, «Completa la canzone» riempie il resto.",
       veloce(){
         /* non si chiude piu' al buio: la strofa si vede e si puo' correggere */
         apriFoglio({generata:true, righe:6, minimo:qVeloce()});
         return {t:"", c:""};
       },
       gioca(){ apriFoglio({righe:4}); }
     });
     return "";
   }},

  {id:"beat", n:"Cerca un beat", e:25, luc:1,
   d:"Giri fra i produttori. Torni con roba da comprare.",
   give:() => "3 beat, 3 generi · +rete",
   run(){
     const out = offriBeat();
     gain("rete", 0.9);
     return "Tre beat sul tavolo: " +
       out.map(b => b.n + " (" + genBeat(b.gen).n.toLowerCase() + ", q" + b.q + ")").join(" · ") +
       ". Si comprano dal Catalogo.";
   }},

  {id:"registra", n:"Registra il pezzo", e:45, luc:3,
   money:() => G.gear.mic ? 0 : 50,
   d:"Strofa più beat, in sala. Esce una traccia grezza.",
   need:() => !G.bars.length ? "1 strofa" : !G.beats.length ? "1 beat" : null,
   give:() => {
     const b = bestBar(), bt = bestBeat();
     return (b && bt ? "1 traccia · qualità ~" + Math.round(songQ(b,bt)) : "1 traccia grezza") + " · −3 benessere";
   },
   run(){
     const b = bestBar(), bt = bestBeat();
     chiediTitolo(title(), (nome, seed, img) => {
       G.bars.splice(G.bars.indexOf(b),1);
       G.beats.splice(G.beats.indexOf(bt),1);
       if(!G.gear.mic) G.money -= 50;
       const q = clamp(Math.round(songQ(b,bt) + rnd(-5,6)), 5, 100);
       const s2 = {t:nome, q, mixed:false, released:false, week:0, streams:0, last:0,
         txt:b.txt||"", tema:b.tema||"", seed:seed, img:img||""};
       G.songs.push(s2); G.wellbeing = clamp(G.wellbeing-3,0,100);
       pushLog("Registrato <b>«" + nome + "»</b> su «" + bt.n + "» — qualità " + q + ".", "");
       SFX.rec(); save(); renderGioco();
     });
     return "";
   }},

  {id:"mixa", n:"Mixa il pezzo", e:24, luc:2,
   d:"Livelli e spazio. Qui il provino diventa pezzo.",
   need:() => unmixed().length ? null : "1 traccia da mixare",
   give:() => "+" + mixGain() + " qualità · +flow",
   run(){
     const s = unmixed().sort((a,b) => b.q-a.q)[0];
     s.q = clamp(s.q + mixGain(), 5, 100); s.mixed = true;
     gain("flow", 1.1);
     return "«" + s.t + "» mixato: qualità " + s.q + ". Pronto per uscire.";
   }},

  {id:"pubblica", n:"Pubblica il pezzo", e:0, luc:1,
   d:"Lo metti fuori. Da qui in poi corre da solo.",
   need:() => ready().length ? null : "1 traccia",
   give:() => {
     const s = ready().sort((a,b) => b.q-a.q)[0];
     return s ? "esce «" + s.t + "» · q" + s.q + (s.mixed ? "" : " · non mixato, −8") : "un pezzo esce";
   },
   run(){
     const s = ready().sort((a,b) => b.q-a.q)[0];
     if(!s.mixed) s.q = clamp(s.q - 8, 5, 100);
     s.released = true; s.week = totalWeeks();
     G.hype = clamp(G.hype + 6 + s.q*0.12, 0, 100);
     return "«" + s.t + "» è fuori" + (s.mixed ? "." : ", ma non era mixato: qualità " + s.q + ".");
   }},

  {id:"promo", n:"Promo sui social", e:12,
   d:"Clip e provocazioni. Accende quello che hai fuori.",
   need:() => G.songs.some(s => s.released) ? null : "1 pezzo fuori",
   give:() => "+" + Math.round((6 + G.skills.rete*0.12) * RITMO) + " hype · follower",
   run(){
     const h = (6 + G.skills.rete*0.12) * RITMO;
     G.hype = clamp(G.hype + h, 0, 100);
     const f = Math.round((G.fans*0.012 + rnd(4,24)) * RITMO);
     G.fans += f; G.wellbeing -= 1;
     return "Hype +" + Math.round(h) + ", " + f + " nuovi follower.";
   }},

  {id:"free", n:"Freestyle in piazza", e:26, luc:3,
   d:"Solo il beat e la gente che passa.",
   give:() => "veloce · oppure giocala ×1,5",
   run(){
     scegliModo({
       t:"Freestyle in piazza",
       d:"Puoi farti il tuo giro e tornare a casa, oppure metterti lì davvero: andare a tempo e rispondere a chi ti provoca, con la folla che cresce o se ne va.",
       dv:"Un clic. Presenza e qualche fan, senza rischi.",
       dg:"Vai a tempo col beat e scegli le risposte giuste. Quello che guadagni dipende da quanta gente resta, e vale 1,5 volte.",
       veloce(){
         gain("presenza", 1.4);
         const f = Math.round((rnd(2,12) + G.skills.presenza*0.5) * RITMO);
         G.fans += f; G.wellbeing = clamp(G.wellbeing-2,0,100);
         return {t:"Giro veloce in piazza: " + f + " persone si sono fermate.", c:""};
       },
       gioca(){ apriPiazza(BOOST); }
     });
     return "";
   }},

  {id:"live", n:"Serata open mic", e:42, luc:2,
   d:"Palco piccolo, ma la gente ti vede in faccia.",
   need:() => G.songs.some(s => s.released) ? null : "1 pezzo fuori",
   give:() => "~" + Math.round((20 + G.hype*1.4 + 40) * RITMO) + " € · fan · presenza",
   run(){
     const f = Math.round((rnd(8,30) + G.skills.presenza*1.4 + G.hype*0.7) * RITMO);
     const m = Math.round((rnd(20,60) + G.hype*1.4) * RITMO);
     const lbb = lifeBonus();
     G.fans += Math.round(f*lbb.live); G.money += Math.round(m*lbb.live);
     gain("presenza", 1.2); G.wellbeing -= 3;
     return "Serata fatta: +" + f + " fan, +" + m + " €.";
   }},

  {id:"turno", n:"Vai al turno", e:18, luc:-3,
   d:"Nessuna musica, ma i soldi entrano.",
   avail:() => !!G.job,
   dyn:() => G.job ? G.job.e : 18,
   give:() => G.job ? "+" + G.job.pay + " € · −4 benessere" : "",
   run(){
     const j = G.job;
     G.money += j.pay; G.wellbeing -= 4; G.shifts = (G.shifts||0) + 1;
     const def = JOBS.find(x => x.id === j.id);
     let extra = "";
     if(def && def.extra) extra = def.extra();
     return "Turno da " + j.n.toLowerCase() + ": +" + j.pay + " €." + extra;
   }},

  {id:"cercalavoro", n:"Cerca lavoro", e:10, luc:-1,
   d:"Due colloqui, due possibilità.",
   avail:() => !G.job,
   give:() => "2 offerte fra cui scegliere",
   run(){ offerJobs(); return "Hai fatto due colloqui."; }},

  {id:"stacca", n:"Stacca la spina", e:14, luc:1,
   d:"Dormi, mangi, vedi gente normale.",
   give:() => "+25 benessere · +1 rete",
   run(){
     const w = Math.round(rnd(20,32));
     G.wellbeing = clamp(G.wellbeing + w, 0, 100);
     gain("rete", 1.4);
     let s = "Ti sei fermato. Benessere +" + w + ", rete +1.";
     if(Math.random() < .18){ G.hype = clamp(G.hype+5,0,100); s += " Hai incrociato la persona giusta."; }
     return s;
   }},

  /* La palestra sta nella vita quotidiana: costa poco, ti tiene su il corpo e
     ti si vede addosso quando sali su un palco. Non fa musica, fa la persona
     che la musica la regge. */
  {id:"palestra", n:"Palestra", e:12, luc:1,
   money:() => 12,
   d:"Un'ora di ferro. La testa si svuota e il corpo tiene.",
   give:() => "+benessere · +presenza",
   run(){
     const b = Math.round(rnd(9,15));
     G.wellbeing = clamp(G.wellbeing + b, 0, 100);
     G.money -= 12;
     gain("presenza", 0.5);
     let s = "Un'ora di palestra: benessere +" + b + ", presenza su.";
     if(Math.random() < .15){ gain("rete", 0.8); s += " In sala pesi c'era gente del giro."; }
     return s;
   }}
];
