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

/* ==================== IL DIRADAMENTO ====================

   Il primo dei rischi segnati in `backend.md` § 8, con già scritta la regola e
   mai fatta: «se un domani i giocatori veri diventano tanti e i bot restano
   140, i bot vanno tolti dall'alto: un bot in top 10 quando ci sono mille
   giocatori veri è una bugia che si vede».

   I bot servono a non far trovare una classifica vuota. Man mano che arriva
   gente vera servono meno, e quelli che danno più fastidio sono **quelli in
   cima**: il primo posto tenuto da uno che non esiste, con mille persone vere
   sotto, è la cosa che fa dire «ma allora è tutto finto».

   Due mosse, e nessuna delle due è brusca:

   - **il bersaglio scende**: la classifica resta grossa uguale, il posto lo
     prendono i veri (`quantiServono`);
   - **quando ce ne sono troppi va via il più in alto**, un pezzo alla volta —
     un decimo dell'eccesso a giro, mai tutto insieme. Un mondo che perde metà
     dei nomi grossi in una notte si nota più della bugia che stiamo togliendo.

   E c'è una guardia: **finché i giocatori veri sono meno di dieci non si tocca
   niente**. Con tre iscritti, togliere la cima vorrebbe dire lasciare la
   classifica senza testa per far posto a nessuno — il contrario di quello che
   serve. */

/* Quanti bot ci vogliono, dato quanta gente vera sta giocando davvero. */
const VERI_PER_DIRADARE = 10;
function quantiServono(pieno, veri, minimo){
  const min = Math.max(0, Math.min(minimo, pieno));
  return Math.max(min, Math.min(pieno, pieno - Math.max(0, veri)));
}

/* Manda a casa i bot di troppo, dall'alto. Torna quanti ne ha tolti.
   `bot` viene modificato sul posto, come fa già `ricambio`. */
function dirada(bot, bersaglio, veri, usati, notizie){
  if(veri < VERI_PER_DIRADARE) return 0;
  const troppi = bot.length - bersaglio;
  if(troppi <= 0) return 0;
  /* un decimo per giro, e almeno uno: se no con cento di troppo non finisce mai */
  const quanti = Math.min(troppi, Math.max(1, Math.round(troppi / 10)));
  const dallAlto = bot.slice().sort((a, b) => b.stream - a.stream).slice(0, quanti);
  for(const b of dallAlto){
    const i = bot.indexOf(b);
    if(i < 0) continue;
    bot.splice(i, 1);
    if(usati) usati.delete(String(b.nome).toLowerCase());
    /* Uno che si ritira mentre sta in alto non «non ce l'ha fatta»: smette da
       vincente, ed è una notizia normale come le altre. Da qui non deve
       trapelare nemmeno adesso che era un bot. */
    notizie.push({ id: b.id, tipo: "ritiro", testo: SALUTI[Math.floor(Math.random() * SALUTI.length)](b) });
  }
  return dallAlto.length;
}

const SALUTI = [
  b => b.nome + " si ritira all'apice. Ha detto che voleva smettere da vincente.",
  b => b.nome + " chiude e passa dall'altra parte: adesso produce e basta.",
  b => b.nome + " lascia le scene. L'ultimo disco era il pezzo che voleva.",
  b => b.nome + " molla tutto e torna a " + b.citta + ". Nessuno se l'aspettava."
];

/* ==================== IL RITRATTO ====================

   La regola del punto 30 dice che un bot non si deve riconoscere. Finché la
   classifica diceva solo nome, città, ascolti e uscite era vero; poi il gioco
   ha cominciato a mandare **il livello**, e i bot sono rimasti tutti a
   `livello 1` — perché nessuno gliel'ha mai scritto. Uno con due milioni di
   ascolti al livello 1 è un manichino con un'etichetta addosso: bastava
   guardare la classifica per fare l'elenco dei finti.

   Qui ci sono i numeri che un bot non ha nel database, calcolati da quello che
   ha: quanto lo ascoltano e quanti pezzi ha fuori. **Non si scrivono da
   nessuna parte** — si derivano quando qualcuno guarda, così non c'è una
   seconda verità da tenere allineata e i bot che esistono già sono a posto dal
   primo istante, senza travaso.

   I conti sono gli stessi del gioco, non inventati qui:
   - i fan si stimano dagli ascolti con la stessa relazione che usa
     `plausibilita.js` per giudicare i numeri di un giocatore vero;
   - il livello sale sulla scala di `frontend/js/game/state.js` (300 punti il
     primo, ×1,35 ogni volta, tetto 60);
   - la fase è la prima di `frontend/js/game/phases.js` che regge quegli
     ascolti in una settimana.
   Se un giorno il gioco cambia la scala, questi due elenchi vanno rifatti
   uguali: sono copie, e stanno scritte qui apposta perché il server non può
   leggere i file del gioco. */
const { M } = require("./plausibilita.js");

/* i tetti di stream settimanali delle fasi (PHASES[].cap del gioco) */
const FASI_CAP = [800, 5200, 34000, 210000, 1300000, 6500000];

function livelloDa(xp){
  let lvl = 1, serve = 300, fatti = 0;
  while(xp >= fatti + serve && lvl < 60){ fatti += serve; lvl++; serve = Math.round(serve * 1.35); }
  return lvl;
}

function ritratto(r){
  const stream = Math.max(0, Number(r.stream) || 0);
  const uscite = Math.max(0, Number(r.uscite) || 0);
  const seed = Math.abs(Number(r.seed) || 0);
  const fan = stream / M.perFan;                       // chi ti ascolta, all'incirca
  const livello = livelloDa(Math.round(fan + uscite * 140));
  let fase = 0;
  while(fase < FASI_CAP.length && stream > FASI_CAP[fase]) fase++;

  /* Serate e feat: nessuno li ha contati per i bot, ma una carriera con dieci
     pezzi fuori e un contratto le serate le ha fatte. Si tengono legati alle
     uscite e alla fase — cioè a quanto è avanti — e il resto lo decide il
     seme, che è fisso: due letture di fila danno lo stesso numero, se no il
     diario di un bot ballerebbe a ogni schermata. */
  return {
    livello, fase,
    live: Math.round(uscite * 1.6 + fase * 5 + (seed % 9)),
    feat: Math.round(uscite * 0.45 + fase * 0.8 + (seed % 4))
  };
}

module.exports = { nuovoBot, popolazione, settimanaBot, ricambio, idNuovo, CARATTERI,
  ritratto, livelloDa, FASI_CAP, quantiServono, dirada, VERI_PER_DIRADARE };
