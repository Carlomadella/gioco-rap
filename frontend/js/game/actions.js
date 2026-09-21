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

/* Blocco 2 — ritmo giornaliero.
   La memoria sta dentro G, quindi sopravvive al save. Non serve un reset
   esplicito: quando anno/settimana/giorno cambia, la chiave cambia con lui. */
const ADF_MAX_SCRITTURE_GIORNO = 2;
function adfGiornoKey(){
  return [Number(G.year||1), Number(G.week||1), Number(G.day||1)].join(":");
}
function adfDailyCounts(){
  const key = adfGiornoKey();
  if(!G.adfDailyActions || G.adfDailyActions.key !== key ||
     !G.adfDailyActions.counts || typeof G.adfDailyActions.counts !== "object"){
    G.adfDailyActions = {key:key, counts:{}};
  }
  return G.adfDailyActions.counts;
}
function adfOggi(id){
  return Number(adfDailyCounts()[id] || 0);
}
function adfSegnaOggi(id){
  const c = adfDailyCounts();
  c[id] = Number(c[id] || 0) + 1;
  return c[id];
}

/* Da smistare, punto 6: lo stesso contenitore, ma a settimana invece che a
   giorno — serve alle mosse che diventano "evento esclusivo" (una volta a
   settimana, non una volta al giorno), come la battle di freestyle vera. */
function adfSettimanaChiave(){
  return [Number(G.year||1), Number(G.week||1)].join(":");
}
function adfSettimanaCounts(){
  const key = adfSettimanaChiave();
  if(!G.adfWeeklyActions || G.adfWeeklyActions.key !== key ||
     !G.adfWeeklyActions.counts || typeof G.adfWeeklyActions.counts !== "object"){
    G.adfWeeklyActions = {key:key, counts:{}};
  }
  return G.adfWeeklyActions.counts;
}
function adfSettimana(id){
  return Number(adfSettimanaCounts()[id] || 0);
}
function adfSegnaSettimana(id){
  const c = adfSettimanaCounts();
  c[id] = Number(c[id] || 0) + 1;
  return c[id];
}

/* Punto 2 - Promo.
   La prima promo del giorno rende pieno, poi il pubblico si satura.
   La componente percentuale non puo' inoltre crescere all'infinito
   ricomponendosi sui follower appena guadagnati. */
const ADF_PROMO_DAILY_MULT = Object.freeze([1, 0.5, 0.2]);
const ADF_PROMO_DAILY_FLOOR = 0.1;
const ADF_PROMO_WEEKLY_PCT_CAP = 0.015;
/* Da smistare, punto 7: la promo può ripetersi tutti i giorni della settimana
   (ogni giorno riparte al massimo), ma l'hype no — se no basta fare promo ogni
   giorno per farmarlo comunque, solo più lentamente. Questo è il tetto vero,
   settimanale, oltre al quale la promo continua a dare follower ma non hype. */
const ADF_PROMO_WEEKLY_HYPE_CAP = 22;
/* Quanto un post spinge il pezzo scelto (moltiplicatore sui suoi stream della
   settimana, +0.10 a post, non oltre 1.5): un aiuto vero, non un secondo video. */
const ADF_PROMO_SPINTA = 0.10;
const ADF_PROMO_SPINTA_MAX = 1.5;
/* Punto 8 dello Studio: l'anteprima di un pezzo non ancora uscito. Al massimo
   tre per pezzo, e ognuna vale all'uscita +0,12 di spinta sulla prima
   settimana — la stessa `s.spinta` della promo, che poi scende da sola. */
const ADF_ANTEPRIME_MAX = 3;
const ADF_ANTEPRIMA_SPINTA = 0.12;
/* Quando il pezzo esce (l'azione `pubblica` qui sotto, o `studioUscitePronte`
   il venerdì) le anteprime fatte diventano la spinta della prima settimana. */
function anteprimeAllUscita(s){
  if(!s || !s.anteprime) return;
  s.spinta = Math.max(s.spinta || 1, 1 + Math.min(ADF_ANTEPRIME_MAX, s.anteprime) * ADF_ANTEPRIMA_SPINTA);
  delete s.anteprime;
}

function promoSettimanaKey(){
  return [Number(G.year||1), Number(G.week||1)].join(":");
}

function promoSettimana(){
  const key = promoSettimanaKey();
  if(!G.promoSaturation || G.promoSaturation.key !== key){
    G.promoSaturation = {
      key:key,
      baseFans:Math.max(0, Number(G.fans||0)),
      pctUsed:0,
      hypeUsed:0
    };
  }

  G.promoSaturation.baseFans =
    Math.max(0, Number(G.promoSaturation.baseFans||0));
  G.promoSaturation.pctUsed =
    Math.max(0, Number(G.promoSaturation.pctUsed||0));
  G.promoSaturation.hypeUsed =
    Math.max(0, Number(G.promoSaturation.hypeUsed||0));

  return G.promoSaturation;
}

/* «Lo stile che conta» (21/09/2026): sul palco — la serata e la piazza —
   la presenza e' l'abilita' piu' i capi da presenza che hai addosso
   (stilePresenza in stile.js). Il freestyle giocato in piazza.js ha i suoi
   conti e non passa di qui. */
function presenzaSulPalco(){
  return typeof stilePresenza === "function" ? stilePresenza() : G.skills.presenza;
}

function promoDailyMult(){
  const n = adfOggi("promo");
  return n < ADF_PROMO_DAILY_MULT.length
    ? ADF_PROMO_DAILY_MULT[n]
    : ADF_PROMO_DAILY_FLOOR;
}

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
   req:g => g.skills.flow >= 20, extra(){ G.skills.flow += 0.9; return " Flow +0.9."; }},
  /* punto 59: full time, non part time come il lavapiatti — paga di più e
     costa più energia, un turno vero ti si mangia la giornata */
  {id:"operaio", n:"Operaio", pay:220, e:40, d:"Fabbrica, turno pieno, linea di montaggio. Si sente tutto."}
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
  /* l'attrezzatura da casa non c'e' piu' (21/09/2026): si registra in Studio */
  return {mult: ben*casa*stanco*esp*lu, list:f};
}
const qDetail = () => qFactors().list
  .map(([n,v]) => n + " " + (v>=1?"+":"") + Math.round((v-1)*100) + "%").join(" · ");
const wellFactor = () => qFactors().mult;
const qVeloce = () => clamp((22 + G.skills.scrittura*0.65) * wellFactor(), 5, 100);
const bestBar  = () => G.bars.slice().sort((a,b) => b.q-a.q)[0];
const bestBeat = () => G.beats.slice().sort((a,b) => b.q-a.q)[0];
const unmixed  = () => G.songs.filter(s => !s.released && !s.mixed);
const ready    = () => G.songs.filter(s => !s.released);
const songQ = (bar, beat) => clamp((bar.q*0.45 + beat.q*0.33 + G.skills.flow*0.35) * wellFactor(), 5, 100);
/* punto 12: quanto migliora il mix. Ai monitor e alle cuffie si aggiunge **chi
   c'è dietro al banco**: un fonico conosciuto alla Sala e chiamato dallo
   Studio vale quanto il rapporto che avete costruito. `typeof` perché
   studio.js si carica dopo, e perché il gioco deve reggere anche senza. */
const studioBonus = () => (typeof studioAiutoFonico === "function" ? studioAiutoFonico() : 0);
/* punto 4: il feat. Stessa strada del fonico — lo Studio dice quanto vale,
   qui si somma e basta. Vale per un pezzo solo: `studioConsumaFeat()` lo
   stacca appena la traccia esce dalla cabina. */
const featBonus = () => (typeof studioAiutoFeat === "function" ? studioAiutoFeat() : 0);
/* Quanto hype porta il feat all'uscita: la fama di chi c'e' sul pezzo
   (`s.featFama`, scritta alla registrazione). Fama 50 → +4. La stessa
   riga la usa l'uscita del venerdi' (studio-elementi.js). */
const ADF_FEAT_HYPE = 0.08;
function featHypeUscita(s){ return Math.round((s && s.featFama || 0) * ADF_FEAT_HYPE); }
/* Le due scelte dello Studio (punto 4: «ogni elemento influenza il
   risultato», e sceglierlo è metà dell'elemento). Se non hai scelto niente —
   o se il pezzo che avevi scelto non è più lì — si torna a `sort()[0]`, che
   è quello che ha sempre fatto: nessuna partita vecchia si accorge di
   niente. */
/* Stessa strada per la strofa e il beat che entrano in cabina: prima si
   incideva sempre il migliore di ognuno, e la strofa tenuta da parte per un
   altro pezzo spariva alla prima registrazione. Adesso li sceglie lo Studio
   (`registrazione_pezzo`: la colonna «CHE COSA INCIDI» ha i pallini), e se
   non hai scelto niente si torna al migliore, come prima. */
const daIncidere = () => (typeof studioStrofa === "function" && studioStrofa()) || bestBar();
const beatDaIncidere = () => (typeof studioBeatSuCui === "function" && studioBeatSuCui()) || bestBeat();
const daMixare = () => (typeof studioDaMixare === "function" && studioDaMixare()) ||
  unmixed().sort((a,b) => b.q-a.q)[0];
/* `s.tenuto` e' la cassaforte dello Studio: un pezzo messo da parte non deve
   uscire per sbaglio dalla plancia, se no «tienilo nel cassetto» e' una
   promessa che il gioco non mantiene. */
const daPubblicare = () => (typeof studioDaPubblicare === "function" && studioDaPubblicare()) ||
  ready().filter(s => !s.tenuto).sort((a,b) => b.q-a.q)[0];
/* punto 4: i tre cursori del banco (voce, bassi, aria) dello Studio. Al
   centro valgono zero — chi non li tocca mixa esattamente come si mixava
   prima che esistessero — e da lì si guadagnano o si perdono fino a tre
   punti a seconda di quanto sta in piedi quello che hai fatto. */
const bancoBonus = () => (typeof studioBancoGuadagno === "function" ? studioBancoGuadagno() : 0);
const mixGain = () => Math.round(6 + G.skills.flow*0.06)
  + studioBonus() + bancoBonus();

function offerJobs(){
  /* «Non ci si può licenziare dal lavoro corrente» (CARLO): con un posto in
     tasca i colloqui non si fanno — accettarne uno voleva dire mollare
     quello di prima. La mossa «Cerca lavoro» lo sa già (avail), questo è
     per chiunque altro arrivi qui. */
  if(G.job){
    showEvent({k:"Colloqui", t:"Hai già un posto",
      d:"Lavori già come " + G.job.n.toLowerCase() +
        ". Da un lavoro non ci si licenzia: lo perdi solo se non ti presenti per tre settimane.",
      opts:[{n:"Va bene", d:"Torni a quello che facevi", run(){ return null; }}]});
    return;
  }
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

/* ================= LA PALESTRA (punto 9) =================
   Non è più un pulsante piatto: al cartello sulla mappa si sceglie tra
   Pesi e Cardio (hub.js), e la costanza conta più della singola seduta.
   Giorni di fila alzano il guadagno di presenza fino al +50% (dieci giorni
   di fila, poi si ferma lì); tornarci due volte nello stesso giorno non
   raddoppia niente — il corpo non recupera così in fretta, e la seconda
   seduta rende molto meno (o toglie benessere invece di darne). */
function palestraGiorno(){
  const sett = typeof totalWeeks === "function" ? totalWeeks() : ((G.year-1)*52 + G.week);
  return (sett - 1) * 7 + (G.day || 1);
}
/* streak valido *adesso*, senza scriverlo: se sono passati più di uno-due
   giorni dall'ultima volta la serie è già persa, anche se G.palestra non
   lo sa ancora — lo scrive solo la prossima sessione vera. */
function palestraStreakOra(){
  if(!G.palestra || G.palestra.ultimo == null) return 0;
  return (palestraGiorno() - G.palestra.ultimo > 1) ? 0 : (G.palestra.streak || 0);
}
function palestraRegistraSessione(){
  if(!G.palestra) G.palestra = {streak:0, ultimo:null, sessioni:0};
  const p = G.palestra, oggi = palestraGiorno();
  if(p.ultimo !== oggi) p.streak = palestraStreakOra() + 1;
  p.ultimo = oggi;
  p.sessioni = (p.sessioni || 0) + 1;
  return p.streak;
}
function palestraMoltiplicatore(){ return 1 + Math.min(10, palestraStreakOra()) * 0.05; }
function palestraFlavor(streak){
  if(streak === 3) return " Terzo giorno di fila: si comincia a vedere.";
  if(streak === 7) return " Una settimana intera senza saltarne uno.";
  if(streak >= 14 && streak % 7 === 0) return " " + (streak/7) + " settimane di fila. Adesso è abitudine.";
  return "";
}
/* per la scheda «Condizione» del profilo (hub.js): la stessa lettura a
   sola lettura di palestraStreakOra(), in una riga per l'utente */
function palestraTesto(){
  const s = palestraStreakOra();
  if(s === 0) return G.palestra && G.palestra.sessioni ? "Persa: da riprendere" : "Non ci sei ancora andato";
  return s + (s === 1 ? " giorno di fila" : " giorni di fila");
}

/* Da smistare, punto 6: la battle di freestyle vera (il minigioco della
   piazza, quello che vale ×1,5) diventa un evento esclusivo — una volta a
   settimana, e solo la sera, fra le 21:00 e le 00:30 (lo stesso orario che
   la card degli eventi dell'hub usa già, orari.js). Farla dieci volte al
   giorno per farmare hype non è più possibile: fuori da lì resta comunque
   il giro veloce, più modesto, sempre disponibile. */
function freestyleBattagliaOk(){
  if(adfSettimana("free_battle") >= 1)
    return {ok:false, motivo:"Il palco vero l'hai già tenuto questa settimana. Torna la prossima."};
  const st = (window.GAME_HOURS && typeof GAME_HOURS.eventStatus === "function")
    ? GAME_HOURS.eventStatus("free") : {open:true};
  if(!st.open){
    const quando = st.phase === "before" ? "apre alle " + st.nextText
      : "riapre stasera alle " + st.nextText;
    return {ok:false, motivo:"Il palco vero è solo la sera, fra le 21:00 e le 00:30 (" + quando + ")."};
  }
  return {ok:true};
}

const ACTIONS = [
  {id:"scrivi", n:"Scrivi barre", e:15, luc:3,
   d:"Il foglio, la penna e quello che hai in testa.",
   need:() => adfOggi("scrivi") >= ADF_MAX_SCRITTURE_GIORNO ? "TORNARE DOMANI" : null,
   give:() => adfOggi("scrivi") === 1
     ? "2ª e ultima strofa di oggi"
     : "veloce · oppure scrivila tu ×1,5",
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

  /* Punto 28: girare a cercare beat non costa più energia (era 25). Non è
     lavoro: è camminare e ascoltare, e far pagare la stanchezza per andare a
     *guardare* la roba da comprare voleva dire che a fine giornata non potevi
     nemmeno farti un giro. Non diventa gratis però: sono comunque due ore di
     gioco (`DURATE.beat` in tempo.js) e si fa solo quando lo studio è aperto,
     13:00–02:00 (orari.js). Il freno resta il tempo, che è quello giusto. */
  {id:"beat", n:"Cerca un beat", e:0, luc:1,
   d:"Giri fra i produttori. Torni con roba da comprare.",
   give:() => "3 beat, 3 generi · +rete",
   run(){
     const out = offriBeat();
     gain("rete", 0.9);
     return "Tre beat sul tavolo: " +
       out.map(b => b.n + " (" + genBeat(b.gen).n.toLowerCase() + ", q" + b.q + ")").join(" · ") +
       ". Sono sul banco dello Studio, nella stanza «Il beat».";
   }},

  /* Non costa energia (era 45): l'energia si paga in cabina, take per take —
     la prima vale la sessione intera, `STUDIO_TAKE_PRIMA` in
     studio-elementi.js — e **tenere** la take buona e' gratis. Prima chi
     insisteva con le take arrivava a «Tieni questa e chiudi» senza i 45 per
     premerlo (15/09/2026). Il tempo in sala e la sala stessa restano qui. */
  {id:"registra", n:"Registra il pezzo", e:0, luc:3,
   /* la mossa in se' costa zero perche' la prima take in Cabina li chiede
      lei (45, dal 21/09/2026 sono 25): la plancia e l'Agenda pero' devono
      dirli, non scrivere «gratis» (15/09/2026). Solo da mostrare — non si
      scala da qui. */
   costoScritto:() => (typeof studioTakeManca === "function" && studioTakeManca())
     ? (typeof STUDIO_TAKE_PRIMA !== "undefined" ? STUDIO_TAKE_PRIMA : 25) : 0,
   /* la sala: 50 € a pezzo. Erano gratis con un microfono tuo, ma
      l'attrezzatura da casa non c'e' piu' (21/09/2026) */
   money:() => 50,
   d:"Strofa più beat, in sala. Esce una traccia grezza.",
   need:() => !G.bars.length ? "1 strofa" : !G.beats.length ? "1 beat"
     : (typeof studioTakeManca === "function" && studioTakeManca()) ? "una take, in cabina" : null,
   give:() => {
     const b = daIncidere(), bt = beatDaIncidere();
     return (b && bt ? "1 traccia · qualità ~" + Math.round(songQ(b,bt) + studioBonus() + featBonus()) : "1 traccia grezza") +
       " · −3 benessere";
   },
   run(){
     const b = daIncidere(), bt = beatDaIncidere();
     /* la parte 2 prenotata dalla Discografia (seguiti.js) porta il suo titolo */
     const titoloSeguito = typeof seguitoTitolo === "function" ? seguitoTitolo() : null;
     chiediTitolo(titoloSeguito || title(), (nome, seed, img) => {
       /* punto 4: il tiro di dado della registrazione non e' piu' invisibile.
          E' la take che hai scelto in cabina (`registrazione_pezzo`), e la
          prima take e' esattamente questo `rnd(-5,6)` — chi non chiede altre
          take registra con lo stesso dado di sempre.
          Si legge **prima** di togliere strofa e beat dalla lista: la take
          porta la targhetta di quella coppia, e con la strofa gia' sfilata la
          targhetta non combaciava piu' — la take scelta non arrivava mai sul
          pezzo, dall'08/09 (controllo mirato del 15/09). */
       const presa = typeof studioTakePresa === "function" ? studioTakePresa() : rnd(-5,6);
       G.bars.splice(G.bars.indexOf(b),1);
       G.beats.splice(G.beats.indexOf(bt),1);
       G.money -= 50;
       /* punto 12: chi sta dietro al vetro conta anche in registrazione — un
          fonico che ti conosce sa dove metterti la voce prima che glielo chiedi */
       /* il feat si legge **prima** di staccarlo (studioConsumaFeat qui
          sotto lo libera): letto dopo vale zero, e in Fuori la riga della
          qualita' non lo nominava mai — trovato da segnala-problemi il 15/09 */
       const conFeat = featBonus(), conFonico = studioBonus();
       const q = clamp(Math.round(songQ(b,bt) + conFonico + conFeat + presa), 5, 100);
       /* chi era in sessione resta scritto sul pezzo — il nome e la fama,
          che e' quella che sim.js legge per far ascoltare il pezzo alla sua
          gente — e poi torna libero */
       const conMe = typeof studioConsumaFeat === "function" ? studioConsumaFeat() : null;
       const s2 = {t:nome, q, mixed:false, released:false, week:0, streams:0, last:0,
         txt:b.txt||"", tema:b.tema||"", seed:seed, img:img||"",
         feat:conMe ? conMe.n : "", featFama:conMe ? conMe.fama : 0,
         /* i numeri per elemento (foglio «LUOGO: STUDIO», idea E del 14/09):
            da cosa e' fatta la qualita', letti poi in Fuori. Il mix li
            completa quando arriva. */
         parti:{beat:bt.q, testo:b.q, fonico:conFonico, feat:conFeat, take:presa}};
       /* se era prenotata una parte 2, e' lui: resta legato al primo (seguiti.js) */
       const primo = typeof seguitoIncidi === "function" ? seguitoIncidi(s2) : null;
       G.songs.push(s2); G.wellbeing = clamp(G.wellbeing-3,0,100);
       /* appena inciso e' lui sul banco dello Studio (punto 10 «ad ogni
          pezzo»): Mix e Uscita si aprono su di lui */
       if(typeof studioMettiSulBanco === "function") studioMettiSulBanco(seed);
       pushLog("Registrato <b>«" + nome + "»</b> su «" + bt.n + "»" +
         (conMe ? " con <b>" + conMe.n + "</b>" : "") +
         (primo ? ", la parte 2 di «" + primo.t + "»" : "") + " — qualità " + q + ".", "");
       SFX.rec(); save(); renderGioco();
       if(typeof renderStudio === "function") renderStudio();
     });
     return "";
   }},

  {id:"mixa", n:"Mixa il pezzo", e:24, luc:2,
   d:"Livelli e spazio. Qui il provino diventa pezzo.",
   need:() => unmixed().length ? null : "1 traccia da mixare",
   give:() => "+" + mixGain() + " qualità · +flow",
   run(){
     const s = daMixare();
     s.q = clamp(s.q + mixGain(), 5, 100); s.mixed = true;
     /* com'e' venuto — «secco», «pesante», «aperto» — resta scritto sul pezzo:
        e' quello che nel riferimento di Fuori si legge sotto al titolo,
        «q78 · mixato · secco» */
     if(typeof studioBancoCarattere === "function") s.car = studioBancoCarattere().n;
     if(s.parti) s.parti.mix = mixGain();
     gain("flow", 1.1);
     return "«" + s.t + "» mixato: qualità " + s.q + ". Pronto per uscire.";
   }},

  {id:"pubblica", n:"Pubblica il pezzo", e:0, luc:1,
   d:"Lo metti fuori. Da qui in poi corre da solo.",
   need:() => ready().some(s => !s.tenuto) ? null : "1 traccia",
   give:() => {
     const s = daPubblicare();
     return s ? "esce «" + s.t + "» · q" + s.q + (s.mixed ? "" : " · non mixato, −8") : "un pezzo esce";
   },
   run(){
     const s = daPubblicare();
     if(!s.mixed) s.q = clamp(s.q - 8, 5, 100);
     s.released = true; s.week = totalWeeks();
     anteprimeAllUscita(s);
     /* una parte 2 che esce rimette in piedi la prima (seguiti.js) */
     if(typeof seguitoUscita === "function") seguitoUscita(s);
     /* uscito: il banco dello Studio si svuota, Mix e Uscita si richiudono */
     if(typeof studioSvuotaBanco === "function") studioSvuotaBanco(s);
     /* un nome grosso sul pezzo muove l'hype quando esce: la sua gente lo
        vede (foglio dell'hype, «feat con nomi piu' grandi») */
     G.hype = clamp(G.hype + 6 + s.q*0.12 + featHypeUscita(s), 0, (typeof hypeCap==="function"?hypeCap():100));
     return "«" + s.t + "» è fuori" + (s.mixed ? "." : ", ma non era mixato: qualità " + s.q + ".");
   }},

  /* Remastered (seguiti.js): si prenota dalla Discografia su un pezzo uscito
     da almeno REMASTER_ETA_MIN settimane e si chiude qui, al banco del Mix.
     La mossa esiste solo finche' ce n'e' una prenotata: nella plancia e
     nell'Agenda non compare a vuoto. */
  {id:"remaster", n:"Remastered", e:24, luc:2,
   d:"Il pezzo vecchio torna al banco: qualche punto in più, e riparte.",
   avail:() => typeof remasterPrenotato === "function" && !!remasterPrenotato(),
   money:() => (typeof REMASTER_COSTO !== "undefined" ? REMASTER_COSTO : 80),
   need:() => (typeof remasterPrenotato === "function" && remasterPrenotato()) ? null : "un pezzo scelto dalla Discografia",
   give:() => {
     const s = remasterPrenotato();
     return s ? "«" + s.t + "» q" + s.q + " → q" + clamp(s.q + remasterGuadagno(), 5, 100) + " · torna a girare" : "";
   },
   run(){
     const r = remasterChiudi();
     if(!r) return "";
     G.money -= (typeof REMASTER_COSTO !== "undefined" ? REMASTER_COSTO : 80);
     G.hype = clamp(G.hype + 4, 0, (typeof hypeCap==="function"?hypeCap():100));
     gain("flow", 0.6);
     return "«" + r.s.t + "» rimasterizzato: qualità " + r.prima + " → " + r.s.q + ". Torna a girare.";
   }},

  {id:"promo", n:"Promo sui social", e:12,
   d:"Clip e provocazioni. Spinge il pezzo che scegli su LaFamegram.",
   need:() => G.songs.some(s => s.released) ? null : "1 pezzo fuori",
   give:() => {
     const mult = promoDailyMult();
     const look = typeof stileBonus === "function" ? stileBonus() : {promo:1, tema:null};
     return "+" + Math.round((6 + G.skills.rete*0.12) * RITMO * mult * look.promo) +
       " hype \u00b7 follower" + (mult < 1 ? " \u00b7 resa ridotta" : "") +
       (look.tema ? " \u00b7 look " + look.tema : "");
   },
   run(){
     const mult = promoDailyMult();
     const peso = (window.AGENDA && typeof AGENDA.consumaPeso === "function")
       ? AGENDA.consumaPeso("promo") : 1;

     const p = promoSettimana();
     /* «Lo stile che conta» (21/09/2026): col look completo — tre capi dello
        stesso tema addosso — la promo rende +25% (stile.js) */
     const look = typeof stileBonus === "function" ? stileBonus() : {promo:1, tema:null};
     const hWanted = (6 + G.skills.rete*0.12) * RITMO * mult * peso * look.promo;
     const hBudget = Math.max(0, ADF_PROMO_WEEKLY_HYPE_CAP - p.hypeUsed);
     const h = Math.min(hWanted, hBudget);
     p.hypeUsed += h;
     G.hype = clamp(G.hype + h, 0, (typeof hypeCap==="function"?hypeCap():100));

     const pctWanted = G.fans * 0.012 * RITMO * mult * peso;
     const pctCap = p.baseFans * ADF_PROMO_WEEKLY_PCT_CAP;
     const pctBudget = Math.max(0, pctCap - p.pctUsed);
     const pctGain = Math.min(pctWanted, pctBudget);

     const flatGain = rnd(4,24) * RITMO * mult * peso;
     const f = Math.max(0, Math.round(flatGain + pctGain));

     p.pctUsed += pctGain;
     G.fans += f;
     G.wellbeing -= 1;
     adfSegnaOggi("promo");

     /* Punto 9 dello Studio: la promo non accende «tutto quello che hai
        fuori» — spinge un pezzo, quello scelto su LaFamegram, dal telefono
        (o l'ultimo uscito). La spinta resta attaccata al pezzo come il video
        (`s.spinta`), sim.js la legge in songWeekly() e la fa scendere ogni
        settimana: un post fa girare il pezzo, non lo rifa' uscire. */
     const sp = typeof studioDaSpingere === "function" ? studioDaSpingere() : null;
     if(sp) sp.spinta = Math.min(ADF_PROMO_SPINTA_MAX, (sp.spinta || 1) + ADF_PROMO_SPINTA * mult * peso);

     const satToday = mult < 1
       ? " Reach ridotta: oggi hai gi\u00e0 spinto parecchio."
       : "";
     const satWeek = pctCap > 0 && p.pctUsed >= pctCap - 1e-9
       ? " La crescita percentuale della settimana \u00e8 satura."
       : "";
     const satHype = hWanted > hBudget + 1e-9
       ? " L'hype non sale pi\u00f9: la settimana ha gi\u00e0 dato il massimo."
       : "";
     const bonusPeso = peso > 1 ? " Oggi vale di pi\u00f9." : "";

     return "Hype +" + Math.round(h) + ", " + f +
       " nuovi follower." + (sp ? " Spingi «" + sp.t + "»." : "") +
       bonusPeso + satToday + satWeek + satHype;
   }},

  /* Punto 8 dello Studio: «non posso spingere una canzone che non è ancora
     uscita, al massimo faccio uscire una preview». Il pezzo lo si sceglie su
     LaFamegram, fra quelli non ancora fuori; qui c'è il costo e quello che dà. */
  {id:"anteprima", n:"Anteprima del pezzo", e:8,
   d:"Quindici secondi sui social. Il pezzo non è fuori, ma la gente lo aspetta.",
   need:() => {
     const s = typeof studioDaAnticipare === "function" ? studioDaAnticipare() : null;
     /* corto: sul telefono la riga e' una sola, e i puntini mangiano la fine */
     return !s ? "un pezzo scelto su LaFamegram"
       : (s.anteprime || 0) >= ADF_ANTEPRIME_MAX ? "un pezzo che non hanno già sentito" : null;
   },
   give:() => {
     const s = typeof studioDaAnticipare === "function" ? studioDaAnticipare() : null;
     const n = s ? (s.anteprime || 0) + 1 : 1;
     return "+" + (s ? Math.round((3 + s.q * 0.05) * RITMO / n) : "?") + " hype · all'uscita parte al " +
       Math.round(100 * (1 + Math.min(ADF_ANTEPRIME_MAX, n) * ADF_ANTEPRIMA_SPINTA)) + "%";
   },
   run(){
     const s = studioDaAnticipare();
     if(!s) return "";
     const n = (s.anteprime || 0) + 1;
     s.anteprime = n;
     /* la prima anteprima rende piena, la seconda la metà, la terza un terzo:
        è un pezzo che non c'è, non si può farlo sentire all'infinito */
     const h = Math.round((3 + s.q * 0.05) * RITMO / n);
     G.hype = clamp(G.hype + h, 0, (typeof hypeCap==="function"?hypeCap():100));
     G.fans += Math.round(rnd(2, 9) * RITMO);
     return "Anteprima di «" + s.t + "»: hype +" + h + ". Quando esce parte al " +
       Math.round(100 * (1 + n * ADF_ANTEPRIMA_SPINTA)) + "%." +
       (n >= ADF_ANTEPRIME_MAX ? " L'hanno sentito abbastanza: adesso deve uscire." : "");
   }},

  {id:"free", n:"Freestyle in piazza", e:26, luc:3,
   d:"Solo il beat e la gente che passa.",
   give:() => {
     const bok = freestyleBattagliaOk();
     return bok.ok ? "veloce · oppure la battle vera ×1,5" : "veloce · battle vera: " + bok.motivo;
   },
   run(){
     const battaglia = freestyleBattagliaOk();
     scegliModo({
       t:"Freestyle in piazza",
       d:"Puoi farti il tuo giro e tornare a casa, oppure metterti lì davvero: andare a tempo e rispondere a chi ti provoca, con la folla che cresce o se ne va.",
       dv:"Un clic. Presenza e qualche fan, senza rischi.",
       dg: battaglia.ok
         ? "Vai a tempo col beat e scegli le risposte giuste. Quello che guadagni dipende da quanta gente resta, e vale 1,5 volte."
         : "La battle vera è un evento esclusivo: " + battaglia.motivo,
       veloce(){
         gain("presenza", 1.4);
         const f = Math.round((rnd(2,12) + presenzaSulPalco()*0.5) * RITMO);
         G.fans += f; G.wellbeing = clamp(G.wellbeing-2,0,100);
         return {t:"Giro veloce in piazza: " + f + " persone si sono fermate.", c:""};
       },
       gioca(){
         if(!battaglia.ok){
           if(typeof toast === "function")
             toast("<b>Non è ancora il momento.</b> " + battaglia.motivo, "bad", "!", ["#B91C1C","#7F1D1D"]);
           gain("presenza", 1.4);
           const f = Math.round((rnd(2,12) + presenzaSulPalco()*0.5) * RITMO);
           G.fans += f; G.wellbeing = clamp(G.wellbeing-2,0,100);
           azioneFatta();
           pushLog("Il palco vero non c'è ancora: giro veloce lo stesso, " + f + " persone si sono fermate.", "");
           save(); renderGioco();
           return;
         }
         apriPiazza(BOOST);
       }
     });
     return "";
   }},

  {id:"live", n:"Serata open mic", e:42, luc:2,
   d:"Palco piccolo, ma la gente ti vede in faccia.",
   need:() => G.songs.some(s => s.released) ? null : "1 pezzo fuori",
   give:() => "~" + Math.round((20 + G.hype*1.4 + 40) * RITMO) + " € · fan · presenza" +
     (adfOggi("live") > 0 ? " · resa ridotta, già fatta oggi" : ""),
   run(){
     const peso = (window.AGENDA && typeof AGENDA.consumaPeso === "function")
       ? AGENDA.consumaPeso("live") : 1;
     const giaOggi = adfOggi("live") > 0;
     const molt = (giaOggi ? 0.45 : 1) * peso;
     const f = Math.round((rnd(8,30) + presenzaSulPalco()*1.4 + G.hype*0.7) * RITMO * molt);
     const m = Math.round((rnd(20,60) + G.hype*1.4) * RITMO * molt);
     const lbb = lifeBonus();
     G.fans += Math.round(f*lbb.live); G.money += Math.round(m*lbb.live);
     gain("presenza", 1.2 * (giaOggi ? 0.5 : 1)); G.wellbeing -= 3;
     adfSegnaOggi("live");
     diarioBordo().live++;
     return "Serata fatta: +" + f + " fan, +" + m + " €." +
       (giaOggi ? " Il palco lo conoscevano già: oggi rende meno." : "");
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
   need:() => adfOggi("stacca") >= 2 ? "TORNARE DOMANI" : null,
   give:() => adfOggi("stacca") === 0
     ? "+10–14 benessere · un po' di rete"
     : "+3–5 benessere · recupero ridotto",
   run(){
     /* il «Piccolo party» della plancia è questa mossa: se era segnato in
        agenda, giocarlo lo toglie (agenda.js, onora) */
     if(window.AGENDA && typeof AGENDA.consumaPeso === "function") AGENDA.consumaPeso("stacca");
     const n = adfOggi("stacca");
     const prima = G.wellbeing;
     const w = n === 0 ? Math.round(rnd(10,15)) : Math.round(rnd(3,6));
     G.wellbeing = clamp(G.wellbeing + w, 0, 100);
     const reale = Math.max(0, Math.round(G.wellbeing - prima));
     if(n === 0) gain("rete", 0.4);
     adfSegnaOggi("stacca");
     let s = "Ti sei fermato. Benessere +" + reale + (n === 0 ? ", rete +0,4." : ".");
     if(n === 1) s += " Per oggi hai recuperato abbastanza.";
     return s;
   }},

  /* La palestra sta nella vita quotidiana: ti tiene su il corpo e ti si vede
     addosso quando sali su un palco. Non fa musica, fa la persona che la
     musica la regge. Due sedute, non una — la scelta sta nel cartello sulla
     mappa (hub.js), qui c'è solo cosa succede quando la fai davvero. */
  {id:"palestra_pesi", n:"Pesi", e:16, luc:1,
   money:() => 18,
   d:"Ferro pesante, poche ripetizioni. Il fisico che si vede sotto le luci.",
   give:() => "+benessere · +presenza",
   run(){
     const giaOggi = adfOggi("palestra") > 0;
     const streak = palestraRegistraSessione();
     const molt = palestraMoltiplicatore();
     adfSegnaOggi("palestra");
     G.money -= 18;
     if(giaOggi){
       const p = Math.round(rnd(4,8));
       G.wellbeing = clamp(G.wellbeing - p, 0, 100);
       gain("presenza", 0.1);
       return "Il corpo non recupera due volte lo stesso giorno: benessere −" + p + ". Hai solo strapazzato quello che avevi già costruito prima.";
     }
     const peso = (window.AGENDA && typeof AGENDA.consumaPeso === "function")
       ? AGENDA.consumaPeso("palestra_pesi") : 1;
     const b = Math.round(rnd(10,16) * molt * peso);
     const pr = Math.round(0.6 * molt * peso * 10) / 10;
     G.wellbeing = clamp(G.wellbeing + b, 0, 100);
     gain("presenza", pr);
     let s = "Serie pesante: benessere +" + b + ", presenza +" + pr + "." + palestraFlavor(streak) +
       (peso > 1 ? " Porte aperte oggi: si sente." : "");
     if(Math.random() < .15){ gain("rete", 0.8); s += " In sala pesi c'era gente del giro."; }
     return s;
   }},

  {id:"palestra_cardio", n:"Cardio leggero", e:9, luc:3,
   d:"Una corsa, la testa che si svuota. Costa poco, ci si torna facile.",
   give:() => "+lucidità · +benessere",
   run(){
     const giaOggi = adfOggi("palestra") > 0;
     const streak = palestraRegistraSessione();
     const molt = palestraMoltiplicatore();
     adfSegnaOggi("palestra");
     if(giaOggi){
       const p = Math.round(rnd(2,5));
       G.wellbeing = clamp(G.wellbeing - p, 0, 100);
       return "Le gambe sono già andate stamattina: benessere −" + p + ". Questa seconda corsa stanca e basta.";
     }
     const b = Math.round(rnd(6,10) * molt);
     const pr = Math.round(0.25 * molt * 10) / 10;
     G.wellbeing = clamp(G.wellbeing + b, 0, 100);
     gain("presenza", pr);
     return "Corsa leggera: benessere +" + b + ", lucidità su." + palestraFlavor(streak);
   }}
];

/* ================= «NON HAI ENERGIA» — UNA RISPOSTA SOLA =================
   Le mosse si lanciano da quattro posti diversi (i cartelli della mappa, le
   card di «Eventi e attività di oggi», le tile della Settimana, l'agenda del
   telefono) e fino a ieri ognuno rispondeva a modo suo quando l'energia non
   bastava: dalla mappa usciva un avviso, altrove il bottone si spegneva e
   basta — ci clicchi sopra e non succede niente, senza che nessuno ti dica
   perché.

   L'energia però non è un ostacolo come gli altri: gli oggetti che mancano o
   i soldi che non hai te li devi andare a prendere, l'energia torna da sola
   dormendo. È l'unico «no» che vale la pena spiegare, ed è per questo che
   qui si comporta diversamente dagli altri: **solo** quando manca l'energia
   la mossa resta cliccabile e risponde con l'avviso. Se manca dell'altro
   (sei in carcere, serve un beat, servono i soldi, è l'ora sbagliata) il
   bottone resta spento come prima, col motivo già scritto sopra. */

/* Quanta energia vuole una mossa: `dyn()` per quelle che cambiano prezzo. */
function energiaChiesta(a){
  if(!a) return 0;
  return a.dyn ? a.dyn() : a.e;
}

/* Vero solo se l'UNICA cosa che manca è l'energia. Se manca anche altro il
   bottone deve restare spento: un avviso che parla di energia mentre il vero
   problema è che sei in carcere farebbe più danni che altro. */
function soloSenzaEnergia(id){
  const a = (typeof ACTIONS !== "undefined") && ACTIONS.find(x => x.id === id);
  if(!a) return false;
  if(typeof hubDetenuto === "function" && hubDetenuto()) return false;
  if(a.avail && !a.avail()) return false;
  if(a.need && a.need()) return false;
  const c = a.money ? a.money() : 0;
  if(c && G.money < c) return false;
  return G.energy < energiaChiesta(a);
}

/* L'avviso vero e proprio, uguale ovunque, col fulmine della barra in alto
   (`HIC.energia`, lo stesso disegno: preso da lì e non ricopiato, così se un
   giorno cambia il fulmine cambia anche qui). */
function avvisoSenzaEnergia(id){
  const a = (typeof ACTIONS !== "undefined") && ACTIONS.find(x => x.id === id);
  const serve = energiaChiesta(a);
  const hai = Math.max(0, Math.round(G.energy));
  const fulmine = (typeof hsvg === "function" && typeof HIC === "object" && HIC.energia)
    ? hsvg("energia") : "\u26A1";
  if(typeof SFX === "object" && SFX.fail) SFX.fail();
  if(typeof toast !== "function") return false;
  toast("<b>Non hai abbastanza energia.</b> " +
    (a ? a.n + " chiede " + serve + ", ne hai " + hai + ". " : "") +
    "L'energia torna dormendo: chiudi la giornata quando non hai più mosse.",
    "bad", fulmine, ["#FACC15", "#B45309"]);
  return true;
}
