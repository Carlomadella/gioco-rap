/* I nomi che non vanno bene.

   Un nome d'arte è **scritto da chi gioca e letto da tutti gli altri**: sta in
   classifica, nelle notizie, nella scheda. Apple e Google, giustamente, non
   pubblicano un gioco che mostra a un ragazzino il nome che un altro ha
   inventato apposta per offenderlo. Quindi serve un filtro, e serve un modo
   per segnalare quello che il filtro non prende.

   Come funziona, in tre passi:
   1. il nome si **normalizza** — via accenti, via numeri e simboli usati al
      posto delle lettere (`c4zz0` → `cazzo`), via le lettere ripetute;
   2. si guarda se dentro c'è una **parola vietata**;
   3. si guarda se prova a **spacciarsi per noi** (admin, moderatore, il nome
      dello studio) o per il gioco.

   Nessun filtro prende tutto e ogni filtro prende qualche innocente: per
   questo il filtro non è l'unica difesa, ma la prima. Dietro c'è la coda delle
   segnalazioni, che la guarda una persona.

   La lista sta in `parole.js`, in modo che si allunghi senza toccare la logica. */
"use strict";

const { VIETATE, NOSTRE, INNOCENTI } = require("./parole.js");

/* le sostituzioni furbe: 4 al posto di a, 0 al posto di o, e così via */
const FURBE = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b",
  "@": "a", "$": "s", "!": "i", "|": "i", "€": "e", "£": "l" };

function normalizza(nome){
  let s = String(nome || "").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");     // via gli accenti
  s = s.replace(/[0134578@$!|€£]/g, c => FURBE[c] || c);
  s = s.replace(/[^a-z]/g, "");                            // resta solo l'alfabeto
  s = s.replace(/(.)\1{2,}/g, "$1$1");                     // «caaaaazzo» → «caazzo»
  return s;
}

/* Le parole vietate si cercano anche dentro alla parola, ma solo quando sono
   abbastanza lunghe: se no «cuoco» diventa impronunciabile. Sotto le cinque
   lettere devono stare da sole o attaccate a un confine. */
function trovaVietata(nome){
  let piano = normalizza(nome);
  /* prima si tolgono le parole per bene che contengono dentro una vietata:
     «scazzo» non è «cazzo», e chi si chiama così non ha fatto niente */
  for(const buona of INNOCENTI) piano = piano.split(normalizza(buona)).join("-");
  const senzaDoppie = piano.replace(/(.)\1+/g, "$1");
  for(const parola of VIETATE){
    const p = normalizza(parola);
    if(!p) continue;
    if(p.length >= 5){
      if(piano.indexOf(p) >= 0 || senzaDoppie.indexOf(p) >= 0) return parola;
    } else {
      const bordo = new RegExp("(^|[^a-z])" + p + "([^a-z]|$)");
      if(bordo.test(piano) || piano === p) return parola;
    }
  }
  return null;
}

/* Spacciarsi per il gioco o per chi lo fa: «Admin», «Moderatore», «La Fame
   Studio». Non è offensivo, è peggio — è qualcuno che può farsi credere. */
function fingeDiEssereNoi(nome){
  const piano = normalizza(nome);
  return NOSTRE.some(n => piano.indexOf(normalizza(n)) >= 0);
}

/* Torna null se il nome va bene, o il motivo per cui non va. Il motivo che
   torniamo a chi si iscrive resta vago di proposito: dirgli esattamente quale
   parola abbiamo trovato è un invito a girarci intorno. */
function controllaNome(nome){
  const piano = normalizza(nome);
  if(piano.length < 2) return { no: "nome-senza-lettere" };
  if(fingeDiEssereNoi(nome)) return { no: "nome-riservato" };
  const brutta = trovaVietata(nome);
  if(brutta) return { no: "nome-non-va-bene", trovata: brutta };
  return null;
}

/* Un nome d'ufficio, per quando ne togliamo uno: non è una punizione scritta
   in faccia a tutti, è solo un nome neutro. */
const nomeDufficio = id => "Artista " + String(id).replace(/-/g, "").slice(0, 4).toUpperCase();

module.exports = { controllaNome, normalizza, trovaVietata, fingeDiEssereNoi, nomeDufficio };
