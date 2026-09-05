/* Stato della partita (G), valori iniziali, salvataggio. */
"use strict";

/* helper numerici usati solo dal gioco ($ e pick stanno in js/core.js) */
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const rnd = (a,b) => a + Math.random()*(b-a);
const fmt = n => Math.round(n).toLocaleString("it-IT");
const short = n => n >= 1e6 ? (n/1e6).toFixed(1).replace(".",",")+"M"
  : n >= 1000 ? (n/1000).toFixed(1).replace(".",",")+"k" : String(Math.round(n));

/* ==================== STATO ==================== */
const SAVE_KEY = "anni-di-fame-partita-v2";
const START = () => ({
  week:1, year:1, day:1, age:19,
  difficolta:"anni-di-fame",
  energy:100, maxEnergy:100, rest:0,
  money:0, fans:0, hype:0, wellbeing:80, lucidita:80,
  skills:{scrittura:0, flow:0, presenza:0, rete:0},
  songs:[], bars:[], beats:[], market:[], job:null, shifts:0,
  life:{casa:0, auto:0, look:0, uscite:0, crew:0}, gear:{}, contract:null, obligation:null,
  offersSeen:{}, goals:{}, log:[], streak:0,
  phase:0, trialCd:0, trialsDone:{}, evCd:{}, seenLog:0,
  rivals:[], gente:[], chartPrev:99, streamsPrev:0, lafamegramMiei:[], lafamegramEventi:[],
  best:{fans:0, chart:99}, ended:false,
  /* Anti-spam Promo: memoria della quota percentuale gia' consumata nella settimana. */
  promoSaturation:{key:"", baseFans:0, pctUsed:0},
  /* punto 21: la Strada. Ricostruita da claude/carriera-criminale.md */
  strada:{rep:0, heat:0, sporchi:0, uomini:0, prot:0, ferro:false, avvocato:false,
    attivita:{}, precedenti:0, arresto:null, giroAvviato:false},
  /* punto 66: chi scrive in chat — mamma e il migliore amico da subito */
  chat:{},
  /* Le palline rosse del telefono: qui sta quello che hai gia' guardato, se no
     restano accese per sempre e smettono di voler dire «c'e' roba nuova».
     Notizie: la settimana in cui le hai aperte. Obiettivi: com'erano l'ultima
     volta che li hai guardati (vedi telefono.js). */
  telVisto:{notizie:0, obiettivi:[]},
  /* Da smistare, punto 2: le ultime combinazioni viste degli incontri coi fan,
     per non ripescare la stessa scena a breve (strada.js) */
  strFanHist:{bello:[], male:[]}
});
/* Livello ed esperienza: fan, skill e pezzi usciti in un numero solo.
   Lo leggono la testata della partita e la testata dell'hub, quindi sta qui
   e non dentro a una delle due. */
function livello(){
  const skl = G.skills.scrittura + G.skills.flow + G.skills.presenza + G.skills.rete;
  const xp = Math.round(G.fans + skl*22 + G.songs.filter(x => x.released).length*140);
  let lvl = 1, need = 300, acc = 0;
  while(xp >= acc + need && lvl < 60){ acc += need; lvl++; need = Math.round(need*1.35); }
  return {lvl:lvl, into:xp - acc, need:need};
}

/* la lucidità: quanto hai la testa dentro la musica. Sale quando lavori ai pezzi,
   scende con i turni, con le settimane vuote e con il tempo che salti. */
const luc = () => (G.lucidita == null ? 80 : G.lucidita);
function addLuc(n){ G.lucidita = clamp(luc() + n, 0, 100); }

/* La chiave vera dipende dallo slot scelto nelle impostazioni: lo slot 1 tiene
   quella storica, così le carriere già iniziate restano dove sono. */
const CHIAVE_PARTITA = () => (typeof slotKey === "function" ? slotKey(SAVE_KEY) : SAVE_KEY);

let G = START();
window.__G = () => G;
/* Se il salvataggio non si legge — troncato, scritto a metà perché il browser
   si è chiuso mentre salvava — prima si mette da parte una copia intatta, poi
   si parte da una partita nuova. Prima qui c'era un `catch(e){}` muto: la
   partita rotta restava lì finché il primo salvataggio non ci scriveva sopra,
   e a quel punto non era più recuperabile da nessuno. Chi lo dice al giocatore
   è js/servizio.js, che guarda `__ADF_SALVATAGGIO_ROTTO`. */
try{
  const r = localStorage.getItem(CHIAVE_PARTITA());
  if(r) G = Object.assign(START(), JSON.parse(r));
}catch(e){
  let copia = null;
  try{
    const grezzo = localStorage.getItem(CHIAVE_PARTITA());
    copia = CHIAVE_PARTITA() + "-illeggibile-" + new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    localStorage.setItem(copia, grezzo);
    window.__ADF_SALVATAGGIO_ROTTO = { chiave: CHIAVE_PARTITA(), copia, errore: e.message, grezzo };
  }catch(e2){
    /* niente spazio per la copia: si dice lo stesso cos'è successo */
    window.__ADF_SALVATAGGIO_ROTTO = { chiave: CHIAVE_PARTITA(), copia: null, errore: e.message, grezzo: "" };
  }
}
function save(){ try{ if(typeof salvaConCopertine === 'function') salvaConCopertine();
  else localStorage.setItem(CHIAVE_PARTITA(), JSON.stringify(G)); }catch(e){} }
