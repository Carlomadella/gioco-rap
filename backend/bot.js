/* I bot: quelli che fanno numero finché i giocatori veri non bastano.

   Vivono come i rivali dentro al gioco (`frontend/js/game/rivals.js`): crescono,
   escono con un pezzo, firmano, spariscono dai radar. La differenza è che qui la
   settimana passa per tutti insieme, sul server, e quindi la classifica si muove
   anche mentre nessuno gioca.

   Da qui non esce mai niente che dica «sono un bot»: nome vero, città vera,
   storia sua. È la regola del punto 30, ed è tutta la ragione per cui questo
   file è scritto con cura invece che con un `Math.random()` e via. */
"use strict";

const { CITTA, GENERI, STORIE, TITOLI, scegli, nuovoNome } = require("./nomi.js");
const crypto = require("crypto");

const fra = (a, b) => a + Math.random() * (b - a);
const idNuovo = () => crypto.randomUUID();

/* Il carattere decide come si muove uno, non quanto vale: è quello che fa
   sembrare la classifica abitata da persone diverse invece che da
   centoquaranta copie della stessa formula. */
const CARATTERI = {
  normale:   { su: [0.955, 1.075], evento: 1,    tiene: 0.72 },
  costante:  { su: [0.985, 1.045], evento: 0.6,  tiene: 0.85 },   // sale piano e non molla
  esplosivo: { su: [0.90,  1.16 ], evento: 1.6,  tiene: 0.60 },   // grosse salite e grosse cadute
  meteora:   { su: [0.86,  1.28 ], evento: 2.2,  tiene: 0.45 }    // esplode e sparisce
};
const pesca = () => {
  const d = Math.random();
  return d < 0.55 ? "normale" : d < 0.78 ? "costante" : d < 0.93 ? "esplosivo" : "meteora";
};

/* Un bot nuovo. `stream` è la sua quota di partenza: la scala va da chi ha
   trecento ascolti a chi ne ha due milioni, così ogni giocatore — al primo
   pezzo o alla decima uscita — trova sempre gente sopra e gente sotto. */
function nuovoBot(stream, usati){
  const nome = nuovoNome(usati);
  usati.add(nome.toLowerCase());
  return {
    id: idNuovo(), bot: true, nome,
    citta: scegli(CITTA), genere: scegli(GENERI), storia: scegli(STORIE),
    stream: Math.round(stream),
    uscite: Math.floor(fra(1, 7)), deal: Math.random() < 0.22,
    slancio: 0, caldo: 0, carattere: pesca(),
    seed: Math.floor(Math.random() * 1e9), ultima: scegli(TITOLI),
    creato: Date.now()
  };
}

/* La popolazione di partenza, distribuita in scala logaritmica: tanti piccoli,
   pochi grossi. Come è fatta una classifica vera. */
function popolazione(quanti, usati){
  const out = [];
  for(let i = 0; i < quanti; i++){
    const t = i / Math.max(1, quanti - 1);            // 0 = il più grosso
    const stream = Math.exp(Math.log(2.2e6) - t * Math.log(2.2e6 / 260)) * fra(0.75, 1.3);
    out.push(nuovoBot(stream, usati));
  }
  return out;
}

/* Una settimana di vita dei bot. Cambia gli oggetti che gli passi e riempie
   `notizie` con `{id, tipo, testo}`: **con dentro di chi sono**, perché il feed
   del telefono deve poter dire «questo l'ha fatto uno che ti sta due posizioni
   sopra», e senza l'id non si può. */
function settimanaBot(bot, notizie){
  for(const b of bot){
    const c = CARATTERI[b.carattere] || CARATTERI.normale;
    b.slancio = (b.slancio || 0) * c.tiene;
    b.stream = Math.min(3.2e6, Math.max(120, b.stream * fra(c.su[0], c.su[1]) * (1 + b.slancio)));
    if(b.caldo > 0) b.caldo--;

    const dado = Math.random() / c.evento;
    if(dado < 0.055){
      b.uscite++; b.ultima = scegli(TITOLI); b.seed = Math.floor(Math.random() * 1e9);
      b.slancio += fra(0.15, 0.5); b.caldo = 3;
      notizie.push({ id: b.id, tipo: "uscita", testo: b.nome + " è uscito con «" + b.ultima + "»." });
    } else if(dado < 0.07 && !b.deal && b.stream > 4000){
      b.deal = true; b.slancio += 0.3;
      notizie.push({ id: b.id, tipo: "firma", testo: b.nome + " ha firmato con un'etichetta." });
    } else if(dado < 0.085 && b.stream > 8000){
      b.stream *= fra(0.45, 0.68);
      notizie.push({ id: b.id, tipo: "sparizione", testo: b.nome + " è sparito dai radar. Succede in fretta." });
    }
    b.stream = Math.round(b.stream);
  }
}

/* Chi non ce la fa smette, e ogni tanto spunta uno dal niente: il numero resta
   quello, le facce no. */
function ricambio(bot, quanti, usati, notizie){
  for(let i = bot.length - 1; i >= 0; i--){
    if(bot[i].stream < 150 && Math.random() < 0.25){
      notizie.push({ id: bot[i].id, tipo: "ritiro", testo: bot[i].nome + " ha smesso. Non ce l'ha fatta." });
      usati.delete(bot[i].nome.toLowerCase());
      bot.splice(i, 1);
    }
  }
  while(bot.length < quanti){
    const nuovo = nuovoBot(fra(260, 9000), usati);
    bot.push(nuovo);
    notizie.push({ id: nuovo.id, tipo: "ingresso", testo: nuovo.nome + " è spuntato dal niente. Da " + nuovo.citta + "." });
  }
}

module.exports = { nuovoBot, popolazione, settimanaBot, ricambio, idNuovo, CARATTERI };
