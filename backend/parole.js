/* La lista delle parole che non vogliamo come nome d'arte.

   Sta in un file suo perché è una lista **che si allunga**: ogni volta che una
   segnalazione viene accolta e la parola non c'era, si aggiunge qui. La logica
   sta in `moderazione.js` e non si tocca.

   Due avvertenze, perché nessuno si illuda:
   - un filtro a parole non prende tutto (chi vuole offendere trova sempre un
     giro) e ogni tanto prende un innocente. Per questo dietro c'è la coda
     delle segnalazioni, che la guarda una persona;
   - la lista qui sotto è un punto di partenza onesto, non un lavoro di
     moderazione finito. Il giorno che il gioco è in vendita in più lingue,
     questa diventa una lista mantenuta per davvero, lingua per lingua.

   Il confronto lo fa `moderazione.js` dopo aver normalizzato il nome, quindi
   qui si scrivono le parole in chiaro e minuscole: le varianti con i numeri al
   posto delle lettere le becca lui. */
"use strict";

/* insulti e volgarità: italiano e inglese, il minimo sindacale per non
   pubblicare un gioco in cui il primo in classifica si chiama come capita */
const VIETATE = [
  // italiano — volgarità
  "cazzo", "coglione", "stronzo", "vaffanculo", "fanculo", "merda", "puttana",
  "troia", "zoccola", "bastardo", "porcodio", "diocane", "madonnaputtana",
  // italiano — insulti a persone
  "handicappato", "mongoloide", "ritardato", "negro", "terrone", "frocio",
  "ricchione", "zingaro", "puttaniere",
  // inglese
  "fuck", "shit", "bitch", "cunt", "whore", "nigger", "nigga", "faggot", "retard",
  "rape", "rapist", "nazi", "hitler", "isis",
  // odio e violenza
  "gasthejews", "killyourself", "suicidati", "ammazzati", "pedofilo", "pedo"
];

/* nomi che nessuno può prendersi perché farebbero credere di essere noi, o il
   gioco stesso */
const NOSTRE = [
  "admin", "amministratore", "moderatore", "moderator", "staff", "supporto",
  "support", "sistema", "system", "annidifame", "anni di fame", "lafamestudio",
  "la fame studio", "lafame", "ufficiale", "official"
];

/* Parole per bene che contengono dentro una parola vietata. È il problema
   classico dei filtri: «scazzo» è una parola normale, «cazzuola» è un attrezzo
   da muratore. Queste si tolgono dal nome **prima** di cercare le vietate,
   così non si blocca gente che non ha fatto niente. */
const INNOCENTI = [
  "scazzo", "scazzi", "scazzato", "cazzuola", "cazzimma",
  "arrapato",                      // volgare ma non un insulto a qualcuno
  "scunthorpe", "assisi", "bassano", "cassino", "grasse"
];

module.exports = { VIETATE, NOSTRE, INNOCENTI };
