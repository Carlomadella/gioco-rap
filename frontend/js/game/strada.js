/* Incontri per strada (punto 54): stessa forma per tutti — ti fermano, tu
   scegli come rispondere — ma le circostanze sono sette storie diverse: un
   fan gentile, uno maleducato, un hater, un opp, una faccia di prima, il
   manager, uno con cui è finita male. Capitano vivendo la giornata
   (avanzaGiorno, sim.js), non a tavolino: niente durante un salto di tempo,
   niente lo stesso giorno in cui chiude la settimana.

   Due circostanze non hanno uno stato vero dietro e sono rimaste flavor:
   «l'ex manager» — nel gioco non esiste ancora un manager che si lascia,
   solo `G.manager` acceso o spento, quindi qui è «il manager», non «l'ex»;
   «i vecchi amici» — non c'è un elenco di amicizie precedenti alla fama,
   quindi è una faccia generica, gated solo sul tempo passato. Il resto
   (l'opp, chi ti sei giocato alla Sala) usa dati veri: G.rivals. */
"use strict";

const STRADA_NOMI = ["Marco","Giulia","Fede","Sara","Luca","Vale","Ale","Chicco","Mattia","Cate","Simo","Robi"];

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
  {id:"fan_bello", peso:3, req:() => true, crea(){
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

  {id:"fan_maleducato", peso:2, req:() => true, crea(){
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

  {id:"hater", peso:2, req:() => G.hype >= 15, crea(){
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

  {id:"opp", peso:2, req:() => G.rivals.length > 0 && G.fans >= 300, crea(){
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

  {id:"amici", peso:1, req:() => totalWeeks() >= 8, crea(){
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

  {id:"manager", peso:1, req:() => !!G.manager, crea(){
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

  {id:"nemico", peso:1, req:() => G.rivals.some(r => r.storia && r.storia.indexOf("Sala") >= 0), crea(){
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

function mostraIncontro(scena){
  showEvent({k:"Per strada", t:scena.t, d:scena.d, annulla(){}, opts:scena.opts});
}

/* Un giorno su tre, più o meno, e solo fra le circostanze che oggi hanno
   senso (l'opp serve fama, il manager serve un manager…): pesata, non
   equiprobabile, così le comuni restano comuni. */
function provaIncontro(){
  if(G.ended || Math.random() > 0.35) return;
  const eleggibili = INCONTRI.filter(i => i.req());
  if(!eleggibili.length) return;
  const tot = eleggibili.reduce((a, i) => a + i.peso, 0);
  let r = Math.random() * tot, scelto = eleggibili[0];
  for(const i of eleggibili){ if(r < i.peso){ scelto = i; break; } r -= i.peso; }
  mostraIncontro(scelto.crea());
}
