/* I generi dei beat: come suonano, come si chiamano, quanto costano.
   È l'unico posto dove sta questa roba: il mercato la usa per le liste,
   il player per suonarli. Gli id sono gli stessi dei generi del creatore. */
"use strict";

/* bpm: il giro del genere · hat: 1 sedicesimi, 2 ottavi · aria: la scala
   kick: i giri di cassa tipici del genere (16 passi per battuta)
   pr: quanto costa quel genere rispetto agli altri */
const BEAT_GEN = {
  trap: {n:"Trap", bpm:[132,150], hat:1, aria:"cupo", pr:1, c:["#B026FF","#3DC7FF"],
    kick:[[0,3,7,8,11],[0,6,10],[0,3,6,10,14]],
    a:["Ghiaccio","Sirene","Lama","Neve","Catene","Vetro","Ferro","Cassaforte"],
    b:["808","di notte","al buio","in tasca","sul cemento","d'inverno"]},

  drill: {n:"Drill", bpm:[138,148], hat:1, aria:"cupo", pr:1, c:["#4A5266","#0E1017"], roll:true,
    kick:[[0,3,6,11],[0,7,10,13],[0,4,7,11]],
    a:["Ombra","Coltello","Passo","Corvo","Cappuccio","Vicolo","Muro","Scia"],
    b:["di traverso","alle spalle","nel buio","senza rumore","di gennaio","in fondo"]},

  boombap: {n:"Boom bap", bpm:[86,96], hat:2, aria:"jazz", pr:.8, c:["#C08A3E","#5A3B18"],
    kick:[[0,7,10],[0,6,8],[0,3,8,10]],
    a:["Polvere","Vinile","Cassa","Cortile","Rullante","Cantina","Campana","Nastro"],
    b:["del '94","di quartiere","a mano","sotto casa","di seconda mano","in cantina"]},

  cloud: {n:"Cloud rap", bpm:[74,86], hat:2, aria:"aperto", pr:.85, c:["#7FB2FF","#D6E3F5"],
    kick:[[0,8],[0,6,8],[0,10]],
    a:["Nuvola","Riverbero","Onda","Nebbia","Eco","Cielo","Sonno","Alone"],
    b:["di mattina","sott'acqua","a occhi chiusi","in bianco","senza fine","dall'alto"]},

  rnb: {n:"R&B", bpm:[88,104], hat:2, aria:"morbido", pr:1.05, c:["#FF4D9D","#7A2B5E"],
    kick:[[0,6,10],[0,3,10],[0,8,11]], snare:[4,12,14],
    a:["Seta","Velluto","Pelle","Luce","Fiato","Cuscino","Rossetto","Lenzuola"],
    b:["sulla pelle","di domenica","a luci spente","d'estate","piano","alle tre"]},

  garage: {n:"UK Garage", bpm:[128,136], hat:1, aria:"aperto", pr:1, c:["#57C98B","#2B7A55"],
    kick:[[0,6,10],[0,5,10,14],[0,6,11]], snare:[4,10,12],
    a:["Passo Doppio","Tacchi","Scale","Corridoio","Pioggia","Metropolitana","Neon","Sabato"],
    b:["alle due","di fretta","in discesa","fuori tempo","a Londra","sotto la pioggia"]},

  plugg: {n:"Plugg", bpm:[136,150], hat:1, aria:"aperto", pr:.9, c:["#B7A6FF","#F2C9FF"],
    kick:[[0,7],[0,6,12],[0,3,9]],
    a:["Tastiera","Bolla","Zucchero","Aria","Cristallo","Piuma","Pixel","Sciroppo"],
    b:["in orbita","senza peso","di zucchero","in loop","a mezz'aria","di vetro"]},

  jersey: {n:"Jersey club", bpm:[130,142], hat:1, aria:"aperto", pr:.95, c:["#FF5A36","#FFC53D"],
    kick:[[0,3,6,8,11,14],[0,3,6,10,13],[0,2,5,8,11,14]], snare:[4,12,15],
    a:["Terzine","Battito","Palestra","Sneakers","Molla","Parquet","Corsa","Fischio"],
    b:["a terra","senza sosta","in palestra","di rimbalzo","a mille","sul parquet"]},

  afro: {n:"Afro", bpm:[100,114], hat:2, aria:"morbido", pr:1.1, c:["#FF9F1C","#E8452F"],
    kick:[[0,3,6,10,12],[0,6,10,13],[0,4,6,11]], snare:[4,12,14],
    a:["Sole","Tamburi","Sabbia","Palme","Mare","Fuoco","Piazza","Estate"],
    b:["a mezzogiorno","d'agosto","sulla pelle","dopo la pioggia","in festa","di sale"]},

  pop: {n:"Pop rap", bpm:[96,112], hat:2, aria:"morbido", pr:1.2, c:["#FFC53D","#FF4D9D"],
    kick:[[0,8],[0,6,8,14],[0,4,8,12]],
    a:["Vetrina","Ritornello","Insegna","Radio","Coriandoli","Specchio","Cartellone","Domenica"],
    b:["in radio","a tutto volume","di plastica","per tutti","in vetrina","da sabato"]},

  conscious: {n:"Conscious", bpm:[88,100], hat:2, aria:"jazz", pr:.85, c:["#9AA0AA","#2B2B34"],
    kick:[[0,7,10],[0,6,11],[0,8,13]],
    a:["Parole","Verità","Piazza","Giornale","Fiato","Domande","Pane","Fabbrica"],
    b:["in fila","di ieri","a voce alta","senza sconti","sul tavolo","di quartiere"]},

  rap: {n:"Rap", bpm:[90,102], hat:2, aria:"jazz", pr:.9, c:["#E8452F","#7A1C12"],
    kick:[[0,7,10],[0,6,10],[0,3,8,11]],
    a:["Strada","Blocco","Quaderno","Panchina","Asfalto","Portone","Sigaretta","Corsa"],
    b:["di sempre","a piedi","senza fretta","dietro casa","all'alba","di lato"]}
};
const BEAT_IDS = Object.keys(BEAT_GEN);
const genBeat = id => BEAT_GEN[id] || BEAT_GEN.rap;
const mioGenere = () => {
  const g = (window.ARTIST || {}).genre;
  return BEAT_GEN[g] ? g : "rap";
};

/* il genere vero del beat: quelli comprati prima dei generi lo ricavano dal seme */
const beatGen = b => BEAT_GEN[b.gen] ? b.gen : beatInfo(b).gen;
const beatCov = b => { const g = genBeat(beatGen(b)); return 'linear-gradient(140deg,' + g.c[0] + ',' + g.c[1] + ')'; };

/* nome del beat: due parole del suo genere, oppure una sola.
   Prova qualche volta prima di rassegnarsi a un doppione. */
function nomeBeat(id, presi){
  const g = genBeat(id);
  for(let i = 0; i < 14; i++){
    const n = Math.random() < .38 ? pick(g.a) : pick(g.a) + " " + pick(g.b);
    if(presi.indexOf(n) < 0) return n;
  }
  return pick(g.a) + " " + pick(g.b);
}

/* I PREZZI DEI BEAT PER FAMA DEL BEATMAKER (ALE: «da 100 a 250 euro beat da
   beatmaker emergenti, da 300 a 1000 per beatmaker affermati e da 1000 a 2000
   per beatmaker famosissimi»). Prima il prezzo guardava solo la qualità
   (q²·0,16 + 14: da 15 a ~1800 €), e un beat q66 al livello quattro costava
   700 € senza che nessuno sapesse chi l'avesse fatto. Adesso decide la fama di
   chi lo fa — la stessa `p.fama` della Sala, 0–100 — in quale **fascia** sta
   il prezzo, e la qualità dove sta dentro alla fascia. Il genere sposta poco
   (`pr`), e mai fuori dalla fascia. Gli sconti per il rapporto (posto.js,
   chat.js, trasferte.js) restano quelli di sempre e si applicano dopo: il
   listino è questo, l'amicizia è un'altra cosa. */
const BEAT_FASCE = [
  {id:"emergente",   n:"emergente",   da:0,  min:100,  max:250},
  {id:"affermato",   n:"affermato",   da:40, min:300,  max:1000},
  {id:"famosissimo", n:"famosissimo", da:75, min:1000, max:2000}
];
const fasciaBeatmaker = fama =>
  BEAT_FASCE.filter(f => (Number(fama) || 0) >= f.da).pop() || BEAT_FASCE[0];
function prezzoBeat(q, id, fama){
  const f = fasciaBeatmaker(fama);
  const dove = clamp((q - 5) / 95, 0, 1);
  const p = (f.min + (f.max - f.min) * dove) * genBeat(id).pr * rnd(0.95, 1.1);
  return clamp(Math.round(p/5)*5, f.min, f.max);
}
/* Un beat del banco senza un beatmaker con un nome — il «giro dei produttori»
   di offriBeat() — è di uno del quartiere: la fama la si legge dal beat, un
   po' di caso compreso. Così i tre del banco sono quasi sempre di emergenti,
   e ogni tanto quello buono è di un affermato. */
const famaDalBeat = q => clamp(Math.round(q * 0.7 + rnd(-10, 12)), 2, 100);

function creaBeat(id, q, presi, fama){
  q = clamp(Math.round(q), 5, 100);
  const n = nomeBeat(id, presi);
  presi.push(n);
  const f = fama == null ? famaDalBeat(q) : fama;
  return {n, q, gen:id, fascia:fasciaBeatmaker(f).id, price:prezzoBeat(q, id, f),
    seed:Math.floor(Math.random()*1e9)};
}
/* la fascia scritta sulla card: i beat di prima non ce l'hanno, e un vecchio
   salvataggio non si rilegge — per loro non si scrive niente */
const fasciaBeat = b => { const f = BEAT_FASCE.find(x => x.id === b.fascia); return f ? f.n : ""; };

/* Il giro dei produttori: tre beat, tre generi diversi, tre fasce di qualità.
   Uno è sempre del tuo genere: quelli del tuo giro li conosci. */
function offriBeat(){
  const presi = G.market.map(b => b.n).concat(G.beats.map(b => b.n));
  const generi = [mioGenere()];
  const resto = BEAT_IDS.filter(x => x !== generi[0]);
  while(generi.length < 3 && resto.length){
    generi.push(resto.splice(Math.floor(Math.random()*resto.length), 1)[0]);
  }
  /* le tre fasce: il colpo buono dipende da quanta gente conosci */
  const qs = [
    rnd(34, 54) + G.skills.rete*0.75,
    rnd(22, 42),
    rnd(8, 26)
  ];
  /* non sempre il migliore è quello del tuo genere */
  generi.sort(() => Math.random() - 0.5);
  const out = generi.map((id, i) => creaBeat(id, qs[i], presi));
  out.sort(() => Math.random() - 0.5);
  out.forEach(b => G.market.push(b));
  return out;
}
