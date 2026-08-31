/* I bot: quelli che fanno numero finché i giocatori veri non bastano.

   Vivono come i rivali dentro al gioco (`js/game/rivals.js`): crescono, escono
   con un pezzo, firmano, spariscono dai radar. La differenza è che qui la
   settimana passa per tutti insieme, sul server, e quindi la classifica si
   muove anche mentre nessuno gioca. */
"use strict";

const { CITTA, GENERI, STORIE, TITOLI, scegli, nuovoNome } = require("./nomi.js");
const crypto = require("crypto");

const fra = (a, b) => a + Math.random() * (b - a);
const idNuovo = () => crypto.randomBytes(6).toString("hex");

/* Un bot nuovo. `stream` è la sua quota di partenza: la scala va da chi ha
   trecento ascolti a chi ne ha due milioni, così ogni giocatore — al primo
   pezzo o alla decima uscita — trova sempre gente sopra e gente sotto. */
function nuovoBot(stream, usati){
  const nome = nuovoNome(usati);
  usati.add(nome.toLowerCase());
  return {
    id: idNuovo(), bot: true, nome,
    citta: scegli(CITTA), genere: scegli(GENERI), storia: scegli(STORIE),
    stream: Math.round(stream), streamPrec: Math.round(stream),
    pos: 0, posPrec: 0,
    uscite: Math.floor(fra(1, 7)), deal: Math.random() < 0.22, mom: 0, hot: 0,
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

/* Una settimana di vita dei bot. Torna le notizie da mettere in bacheca. */
function settimanaBot(bot, notizie){
  for(const b of bot){
    b.mom = (b.mom || 0) * 0.72;
    b.stream = Math.min(3.2e6, Math.max(120, b.stream * fra(0.955, 1.075) * (1 + b.mom)));
    if(b.hot > 0) b.hot--;

    const dado = Math.random();
    if(dado < 0.055){
      b.uscite++; b.ultima = scegli(TITOLI); b.seed = Math.floor(Math.random() * 1e9);
      b.mom += fra(0.15, 0.5); b.hot = 3;
      notizie.push(b.nome + " è uscito con «" + b.ultima + "».");
    } else if(dado < 0.07 && !b.deal && b.stream > 4000){
      b.deal = true; b.mom += 0.3;
      notizie.push(b.nome + " ha firmato con un'etichetta.");
    } else if(dado < 0.085 && b.stream > 8000){
      b.stream *= fra(0.45, 0.68);
      notizie.push(b.nome + " è sparito dai radar. Succede in fretta.");
    }
    b.stream = Math.round(b.stream);
  }
}

/* Chi non ce la fa smette, e ogni tanto spunta uno dal niente: il numero resta
   quello, le facce no. */
function ricambio(bot, quanti, usati, notizie){
  for(let i = bot.length - 1; i >= 0; i--){
    if(bot[i].stream < 150 && Math.random() < 0.25){
      notizie.push(bot[i].nome + " ha smesso. Non ce l'ha fatta.");
      usati.delete(bot[i].nome.toLowerCase());
      bot.splice(i, 1);
    }
  }
  while(bot.length < quanti){
    const nuovo = nuovoBot(fra(260, 9000), usati);
    bot.push(nuovo);
    notizie.push(nuovo.nome + " è spuntato dal niente. Da " + nuovo.citta + ".");
  }
}

module.exports = { nuovoBot, popolazione, settimanaBot, ricambio, idNuovo };
