/* Incontri per strada (punto 54): stessa forma per tutti — ti fermano, tu
   scegli come rispondere — ma le circostanze sono otto storie diverse: un
   fan gentile, uno maleducato, un hater, un opp, un giornalista, una faccia
   di prima, il manager, uno con cui è finita male. Capitano vivendo la
   giornata (avanzaGiorno, sim.js), non a tavolino.

   Da smistare, punto 5: il giornalista si aggiunge qui — si vede solo con
   fama vera (G.fans >= 2000, la stessa soglia con cui compare alla Sala,
   posto.js) e fa domande che, se rispondi senza filtri, diventano un pezzo
   vero postato con `postaEvento` — bene se la risposta regge, male se no.
   L'opp era già qui da prima (punto 54): non serviva altro codice, solo
   chiuderlo come punto a sé.

   Due circostanze non hanno uno stato vero dietro e sono rimaste flavor:
   «l'ex manager» — nel gioco non esiste ancora un manager che si lascia,
   solo `G.manager` acceso o spento, quindi qui è «il manager», non «l'ex»;
   «i vecchi amici» — non c'è un elenco di amicizie precedenti alla fama,
   quindi è una faccia generica, gated solo sul tempo passato. Il resto
   (l'opp, chi ti sei giocato alla Sala) usa dati veri: G.rivals.

   Da smistare, punto 4: ognuno ha anche un `liv` — basso, medio, alto — che
   dice cosa succede se capita mentre stai saltando avanti nel tempo
   (saltaGiorni, sim.js). Non è un numero a caso: rispecchia il peso che
   l'incontro ha già (`peso`, quanto è comune) e quanto costa sbagliarlo.
   - basso: un fan, buono o cafone — capita spesso, il conto è quasi sempre
     una manciata di hype o benessere. Non ferma niente.
   - medio: un hater, un giornalista, una vecchia amicizia, il manager — meno comuni,
     pesano un po' di più, ma restano cose che si risolvono da sole senza
     bisogno di stare lì a decidere.
   - alto: un opp che sblocca solo con 300 fan veri e rivali in giro, o chi
     ti sei giocato alla Sala — rari apposta, e la scelta cambia davvero la
     reputazione o un rapporto. Questi fermano il salto sul serio: si vede
     la scena, si sceglie, e solo dopo il tempo riparte da dove si era
     fermato. */
"use strict";

const STRADA_NOMI = ["Marco","Giulia","Fede","Sara","Luca","Vale","Ale","Chicco","Mattia","Cate","Simo","Robi"];

/* Da smistare, punto 5: nomi e domande del giornalista di strada — persona
   diversa da quelli della Sala (posto.js), che è un ruolo fisso lì dentro;
   qui è un cronista di passaggio, la testata è sempre «La Voce del Giro»,
   la stessa che già firma i pezzi negativi nati da altri incontri. */
const STR_GIORNALISTA_NOMI = ["Marta Belloni","Dario Conte","Elisa Rinaldi","Toni Sarti","Nadia Ferro"];
const STR_GIORNALISTA_DOMANDE = [
  "ti chiede cosa pensi del tuo rivale del momento, e se è vero che ti scrivono le barre",
  "ti chiede se è vero che dietro i tuoi testi c'è un ghostwriter",
  "ti chiede perché non hai mai risposto a chi ti ha attaccato in un pezzo",
  "ti chiede se ti senti minacciato dai nuovi che stanno uscendo adesso",
  "ti chiede se è vero che stai per firmare con una major e lasci il giro",
  "ti chiede cosa risponde a chi dice che sei solo hype, senza sostanza"
];

/* Da smistare, punto 2: "la scena dei fan ne hai fatte si e no 3" — vero, erano
   una frase sola con solo il nome che cambiava. Qui sotto un luogo e un
   comportamento si combinano (12×13 = 156 possibilità, per bello e per
   maleducato separatamente): non sono 156 scene scritte a mano, ma 156 modi
   diversi di leggerle, e con la cronologia qui sotto le ultime 30 viste per
   tipo non si ripescano — l'unica strada per rivedere la stessa combinazione
   è vederne prima altre 30 diverse. */
const STR_FAN_LUOGHI = [
  "Al bar sotto casa", "Sulla porta del supermercato", "In fila alla posta",
  "Aspettando il bus", "All'uscita della palestra", "Nel parcheggio del centro commerciale",
  "In stazione, sul binario", "Davanti al chiosco dei kebab", "In metro, due fermate prima della tua",
  "Al semaforo, mentre aspetti il verde", "Al mercato del sabato", "In coda dal barbiere"
];
const STR_FAN_COMPORTAMENTI = [
  "ti punta il dito e urla il tuo nome a squarciagola: «Sei tu? Foto, dai, foto!»",
  "si blocca a metà passo, si gira verso l'amico e sussurra: «Guarda chi c'è, non ci credo»",
  "lascia cadere le buste della spesa dalla sorpresa, e si scusa ridendo mentre le raccoglie",
  "si mette le mani sulla bocca, sbianca, e riesce solo a dire: «Sei proprio tu?»",
  "ti corre incontro senza guardare la strada, rischiando di inciampare",
  "ti manda un vocale mentre è ancora a due metri: «Non ci credo, non ci credo, non ci credo»",
  "tira fuori il telefono e comincia a filmare ancora prima di salutarti",
  "tira per la manica un amico che non ti aveva riconosciuto: «Guarda chi c'è, non ci posso credere»",
  "resta immobile per qualche secondo, poi esplode: «Ti seguo da quando avevi duecento fan!»",
  "si avvicina timido, la voce che trema: «Scusa, posso disturbarti un attimo?»",
  "chiama a gran voce tutta la famiglia, che esce di corsa a vedere",
  "si gira di scatto come se avesse sentito il tuo nome nell'aria",
  "ti riconosce dalla voce prima ancora di vederti in faccia"
];
const STR_FANMALE_COMPORTAMENTI = [
  "ti si struscia addosso per il selfie, sgomita, non capisce gli spazi",
  "ti strappa quasi di mano il telefono per farsi la foto da solo",
  "ti chiama a voce altissima da lontano finché tutti si girano",
  "ti pianta un gomito nelle costole per farsi spazio da solo",
  "ti blocca il passo con tutto il carrello della spesa",
  "ti mette un braccio al collo per il selfie senza chiedere",
  "urla al telefono con un amico mentre ti tiene per la giacca",
  "ti chiede tre foto diverse, una via l'altra, senza fermarsi mai",
  "insiste anche dopo il primo «no», sempre più vicino",
  "fa notare a tutti quelli intorno chi sei, indicandoti col dito",
  "supera la fila per arrivarti davanti prima degli altri",
  "ti cammina accanto per venti metri raccontandoti la sua vita",
  "registra un video senza chiedere, commentando ad alta voce"
];

/* Sceglie un indice 0..totale-1 evitando quelli visti di recente (in `storico`,
   un array che tiene le ultime `maxStorico` combinazioni per quel tipo di
   incontro). Con 156 combinazioni e una cronologia di 30, quasi sempre basta
   un tentativo solo. */
function strPescaCombo(totale, storico, maxStorico){
  let idx, tentativi = 0;
  do{ idx = Math.floor(Math.random() * totale); tentativi++; }
  while(storico.indexOf(idx) >= 0 && tentativi < 8);
  storico.push(idx);
  if(storico.length > maxStorico) storico.shift();
  return idx;
}
function strScenaFan(comportamenti, storicoKey){
  if(!G.strFanHist) G.strFanHist = {bello:[], male:[]};
  const storico = G.strFanHist[storicoKey] || (G.strFanHist[storicoKey] = []);
  const totale = STR_FAN_LUOGHI.length * comportamenti.length;
  const idx = strPescaCombo(totale, storico, 30);
  return {
    luogo: STR_FAN_LUOGHI[Math.floor(idx / comportamenti.length)],
    comp: comportamenti[idx % comportamenti.length]
  };
}

/* Un fan ti fotografa, un giornalista ti massacra: quello che nasce da un
   incontro finisce su LaFamegram davvero, non solo nel diario. */
function postaEvento(nome, testo, like){
  if(!G.lafamegramEventi) G.lafamegramEventi = [];
  G.lafamegramEventi.unshift({n:nome, t:testo, w:"in giro", like:Math.max(0, Math.round(like || 0)), mia:false});
  if(G.lafamegramEventi.length > 20) G.lafamegramEventi.length = 20;
}

const INCONTRI = [
  {id:"fan_bello", peso:3, liv:"basso", req:() => true, crea(){
    const nome = pick(STRADA_NOMI);
    const sc = strScenaFan(STR_FAN_COMPORTAMENTI, "bello");
    return {t:"Un fan ti riconosce", d:sc.luogo + ". " + nome + " " + sc.comp,
      opts:[
        {n:"Fatti la foto con lui", d:"Due minuti, gli fai piacere", run(){
          const art = window.ARTIST || {};
          G.hype = clamp(G.hype + rnd(2,5), 0, 100);
          G.fans += Math.round(rnd(3,14));
          G.wellbeing = clamp(G.wellbeing + 1, 0, 100);
          postaEvento(nome, "Ho appena incontrato " + ((art.name || "un artista").trim() || "un artista") +
            " per strada, che gasato 🔥", rnd(20,60));
          return {t:nome + " è ripartito col telefono in mano, felicissimo. L'ha già postata.", c:"good"};
        }},
        {n:"Passa oltre, gentile", d:"Hai fretta, ma non sei scortese", run(){
          return {t:"Ti sei scusato e sei andato via. " + nome + " c'è rimasto un po' male.", c:""};
        }}
      ]};
  }},

  {id:"fan_maleducato", peso:2, liv:"basso", req:() => true, crea(){
    const nome = pick(STRADA_NOMI);
    const sc = strScenaFan(STR_FANMALE_COMPORTAMENTI, "male");
    return {t:"Un fan sopra le righe", d:sc.luogo + ". " + nome + " " + sc.comp,
      opts:[
        {n:"Fatti la foto lo stesso", d:"Non vale la pena litigare", run(){
          G.hype = clamp(G.hype + rnd(1,3), 0, 100); G.wellbeing = clamp(G.wellbeing - 1, 0, 100);
          return {t:"Foto fatta, in fretta. Meglio chiuderla lì.", c:""};
        }},
        {n:"Gli dici di no, ha esagerato", d:"Rischi che la racconti a modo suo", run(){
          const art = window.ARTIST || {};
          if(Math.random() < .3){
            G.hype = clamp(G.hype - rnd(3,8), 0, 100);
            postaEvento("La Voce del Giro", "Pare che " + ((art.name || "un artista").trim() || "un artista") +
              " si sia rifiutato di fare una foto a un fan. Bella storia.", rnd(15,40));
            return {t:"Qualcuno vicino ha visto tutto, e adesso gira una versione tutta sua.", c:"bad"};
          }
          return {t:"Ha borbottato qualcosa e se n'è andato. Nessuno l'ha notato.", c:""};
        }}
      ]};
  }},

  {id:"hater", peso:2, liv:"medio", req:() => G.hype >= 15, crea(){
    const nome = pick(STRADA_NOMI);
    return {t:"Uno se la prende con te", d:nome + " ti riconosce e comincia a dirtene di tutti i colori, ad alta voce.",
      opts:[
        {n:"Rispondi a tono", d:"Rischi, ma se la fai buona ci guadagni", run(){
          const art = window.ARTIST || {};
          if(G.skills.flow + G.skills.presenza >= 24){
            G.hype = clamp(G.hype + rnd(4,9), 0, 100);
            postaEvento("La Voce del Giro", "Video: la risposta di " + ((art.name || "un artista").trim() || "un artista") +
              " a uno che lo attaccava per strada. Distrutto.", rnd(40,90));
            return {t:"Gliene hai dette quattro belle. Qualcuno ha ripreso tutto.", c:"good"};
          }
          G.wellbeing = clamp(G.wellbeing - 4, 0, 100);
          return {t:"Ti sei impappinato. " + nome + " se n'è andato ridendo.", c:"bad"};
        }},
        {n:"Lo ignori", d:"Nessun rischio, un po' di fastidio", run(){
          G.wellbeing = clamp(G.wellbeing - 2, 0, 100);
          return {t:"L'hai lasciato parlare da solo. Fastidioso, ma finita lì.", c:""};
        }}
      ]};
  }},

  {id:"opp", peso:2, liv:"alto", req:() => G.rivals.length > 0 && G.fans >= 300, crea(){
    const r = pick(G.rivals);
    return {t:"Lo incroci per strada", d:r.n + " ti vede, e non fa finta di niente: sa benissimo chi sei.",
      opts:[
        {n:"Lo saluti, civile", d:"Nessun dramma", run(){
          gain("rete", .3);
          return {t:"Vi siete salutati come si salutano due che corrono per lo stesso posto.", c:""};
        }},
        {n:"Lo provochi", d:"Rischioso, ma se vinci lo scambio ne parlano", run(){
          const art = window.ARTIST || {};
          const vinci = G.fans + G.hype * 30 >= r.p * 0.8;
          if(vinci){
            G.hype = clamp(G.hype + rnd(4,10), 0, 100);
            postaEvento("La Voce del Giro", ((art.name || "un artista").trim() || "un artista") + " e " + r.n +
              " se le sono dette per strada. Chi ha vinto lo sanno tutti.", rnd(30,70));
            return {t:"Gliel'hai fatta vedere. La gente intorno se lo ricorderà.", c:"good"};
          }
          G.wellbeing = clamp(G.wellbeing - 3, 0, 100);
          return {t:r.n + " ha avuto l'ultima parola. Non l'hai presa bene.", c:"bad"};
        }}
      ]};
  }},

  {id:"giornalista", peso:1, liv:"medio", req:() => G.fans >= 2000, crea(){
    const nome = pick(STR_GIORNALISTA_NOMI);
    const domanda = pick(STR_GIORNALISTA_DOMANDE);
    return {t:"Un giornalista ti ferma", d:nome + ", de «La Voce del Giro», ti riconosce e attacca subito: " + domanda + ".",
      opts:[
        {n:"Rispondi con cautela", d:"Una frase generica, niente titoli", run(){
          G.wellbeing = clamp(G.wellbeing - 1, 0, 100);
          return {t:"Hai risposto senza dire niente di vero. " + nome + " se n'è andato senza un titolo.", c:""};
        }},
        {n:"Rispondi a modo tuo, senza filtri", d:"Una frase a effetto: se la becchi bene fa notizia, se la sbagli pure", run(){
          const art = window.ARTIST || {};
          if(G.skills.flow + G.skills.presenza >= 24){
            G.hype = clamp(G.hype + rnd(5,12), 0, 100);
            postaEvento("La Voce del Giro", ((art.name || "un artista").trim() || "un artista") +
              " a ruota libera con " + nome + ": la frase sta già girando.", rnd(35,80));
            return {t:"L'hai detta come la pensi. " + nome + " sorrideva mentre scriveva.", c:"good"};
          }
          G.hype = clamp(G.hype - rnd(3,8), 0, 100);
          G.wellbeing = clamp(G.wellbeing - 3, 0, 100);
          postaEvento("La Voce del Giro", "Le parole di troppo di " + ((art.name || "un artista").trim() || "un artista") +
            " a " + nome + ". Non la prenderanno bene tutti.", rnd(20,55));
          return {t:"Detto e fatto: " + nome + " l'ha titolata peggio di come l'avevi pensata tu.", c:"bad"};
        }}
      ]};
  }},

  {id:"amici", peso:1, liv:"medio", req:() => totalWeeks() >= 8, crea(){
    const nome = pick(STRADA_NOMI);
    return {t:"Una faccia di prima", d:nome + ", uno che conoscevi da prima che qualcuno sapesse chi sei, ti ferma per strada.",
      opts:[
        {n:"Ti fermi a parlare", d:"Tempo perso, ma fa bene", run(){
          G.wellbeing = clamp(G.wellbeing + rnd(6,12), 0, 100); gain("rete", .4);
          return {t:"Due chiacchiere vere, di quelle senza secondi fini. Ti sei sentito meglio.", c:"good"};
        }},
        {n:"Hai fretta", d:"Lo saluti e vai", run(){
          return {t:"Vi siete salutati in fretta. Magari la prossima volta.", c:""};
        }}
      ]};
  }},

  {id:"manager", peso:1, liv:"medio", req:() => !!G.manager, crea(){
    return {t:"Il tuo manager ti becca per strada", d:"Ne approfitta per parlarti di lavoro, anche se non è in ufficio.",
      opts:[
        {n:"Lo stai a sentire", d:"Cinque minuti, magari ne esce qualcosa", run(){
          if(Math.random() < .5){
            const m = Math.round(rnd(30,90)); G.money += m;
            return {t:"Ti ha girato un contatto buono: +" + fmt(m) + " €.", c:"good"};
          }
          return {t:"Chiacchiere di lavoro, niente di concreto oggi.", c:""};
        }},
        {n:"Gli dici che oggi stacchi", d:"Ti fa bene, a lui un po' meno", run(){
          G.wellbeing = clamp(G.wellbeing + 5, 0, 100);
          return {t:"Ha storto il naso, ma hai tenuto il punto.", c:""};
        }}
      ]};
  }},

  {id:"nemico", peso:1, liv:"alto", req:() => G.rivals.some(r => r.storia && r.storia.indexOf("Sala") >= 0), crea(){
    const r = G.rivals.find(x => x.storia && x.storia.indexOf("Sala") >= 0);
    return {t:"È finita male, e te lo ritrovi davanti", d:r.n + " ti vede. Vi conoscevate da prima, poi non più.",
      opts:[
        {n:"Fai finta di niente", d:"La strada è larga", run(){
          return {t:"Avete guardato altrove tutti e due. Meglio così.", c:""};
        }},
        {n:"Ci parli, provi a chiarire", d:"Potrebbe non servire a niente", run(){
          if(Math.random() < .35){
            G.wellbeing = clamp(G.wellbeing + 6, 0, 100);
            return {t:"Non è tornato tutto come prima, ma vi siete detti due cose vere.", c:"good"};
          }
          G.wellbeing = clamp(G.wellbeing - 3, 0, 100);
          return {t:"Non è servito a niente. Anzi.", c:"bad"};
        }}
      ]};
  }}
];

function mostraIncontro(scena, obbligatorio, onDone){
  const opts=(scena.opts||[]).map(o=>({
    n:o.n,d:o.d,
    run(){
      let r=null;
      try{ r=o.run ? o.run() : {t:"",c:""}; }
      finally{ if(typeof onDone==="function") onDone(); }
      return r;
    }
  }));
  const ev={k:"Per strada",t:scena.t,d:scena.d,opts};
  /* Gli HIGH non hanno annulla: niente X, ESC o click fuori. */
  if(!obbligatorio) ev.annulla=function(){};
  showEvent(ev);
}

/* Da smistare, punto 4: un incontro basso o medio, mentre stai saltando
   avanti, non merita un popup — si risolve da solo scegliendo la prima
   opzione (la più prudente, per come sono scritte tutte) e finisce nel
   diario come se l'avessi scelta tu al volo. */
function risolviIncontroAuto(scena){
  const o = scena.opts[0];
  if(!o) return;
  const r = o.run();
  if(r && r.t) pushLog(r.t, r.c);
}

/* Un giorno su tre, più o meno, e solo fra le circostanze che oggi hanno
   senso (l'opp serve fama, il manager serve un manager…): pesata, non
   equiprobabile, così le comuni restano comuni. */
function provaIncontro(){
  if(G.ended || Math.random() > 0.35) return;

  try{
    if(window.ADF_EVENTI && typeof ADF_EVENTI.globalHigh==="function" &&
       ADF_EVENTI.globalHigh()) return;
  }catch(_){}

  let eleggibili = INCONTRI.filter(i => i.req());

  /* Un incontro ALTO entra nel pool solo quando la finestra HIGH globale
     è pronta; altrimenti continuiamo a pescare soltanto basso/medio. */
  try{
    if(window.ADF_EVENTI && typeof ADF_EVENTI.highReady==="function" &&
       !ADF_EVENTI.highReady())
      eleggibili=eleggibili.filter(i => (i.liv||"medio")!=="alto");
  }catch(_){}

  if(!eleggibili.length) return;
  const tot = eleggibili.reduce((a, i) => a + i.peso, 0);
  let r = Math.random() * tot, scelto = eleggibili[0];
  for(const i of eleggibili){ if(r < i.peso){ scelto = i; break; } r -= i.peso; }
  const scena = scelto.crea();
  const liv = scelto.liv || "medio";

  /* durante un salto: basso/medio si risolvono da soli, alto ferma il
     salto sul serio (SALTO_STOP, sim.js legge questa variabile) */
  if(SALTO){
    if(liv !== "alto"){ risolviIncontroAuto(scena); return; }
    SALTO_STOP = {k:"Per strada", t:scena.t, d:scena.d, annulla(){}, opts:scena.opts};
    return;
  }

  /* Anche nel gioco normale LOW/MEDIUM non fermano il giocatore. */
  if(liv !== "alto"){
    try{
      if(window.ADF_EVENTI && typeof ADF_EVENTI.claimAutoEvent==="function" &&
         !ADF_EVENTI.claimAutoEvent("street")) return;
    }catch(_){}

    risolviIncontroAuto(scena);
    try{
      if(window.ADF_EVENTI && typeof ADF_EVENTI.addNotification==="function"){
        ADF_EVENTI.addNotification({
          eventId:"strada:"+scelto.id,
          tier:liv,
          title:scena.t,
          result:scena.d,
          source:"legacy-street",
          read:false
        });
      }
    }catch(_){}
    try{
      window.dispatchEvent(new CustomEvent("game-event:resolved",{detail:{
        id:"strada:"+scelto.id,
        level:liv,
        automatic:true,
        legacy:true
      }}));
    }catch(_){}
    return;
  }

  try{
    if(window.ADF_EVENTI && typeof ADF_EVENTI.beginHigh==="function" &&
       !ADF_EVENTI.beginHigh("street",scelto.id)) return;
  }catch(_){}

  mostraIncontro(scena,true,()=>{
    try{
      if(window.ADF_EVENTI && typeof ADF_EVENTI.endHigh==="function")
        ADF_EVENTI.endHigh("street",scelto.id);
    }catch(_){}
  });
}

/* Ripristina un HIGH per strada dopo refresh. La scena viene ricostruita
   dallo stesso id: può cambiare un dettaglio cosmetico casuale, ma la
   decisione obbligatoria e i suoi effetti restano quelli dell'incontro. */
window.ADF_RESTORE_STREET_HIGH=function(id){
  const scelto=INCONTRI.find(i=>i.id===id && i.req());
  if(!scelto){
    try{
      if(window.ADF_EVENTI && typeof ADF_EVENTI.endHigh==="function")
        ADF_EVENTI.endHigh("street",String(id||""));
    }catch(_){}
    return false;
  }
  mostraIncontro(scelto.crea(),true,()=>{
    try{
      if(window.ADF_EVENTI && typeof ADF_EVENTI.endHigh==="function")
        ADF_EVENTI.endHigh("street",scelto.id);
    }catch(_){}
  });
  return true;
};
