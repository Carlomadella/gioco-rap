/* LaFamegram: la gente posta per conto suo.
   «sull'app lafamegram non posta nessuno» — nel feed c'erano i tuoi post,
   quelli che nascono dagli incontri (tutti su di te) e due notizie della
   Voce del Giro. Qui postano gli altri: i rivali in classifica quando escono
   con un pezzo, firmano, spuntano dal niente o ti nominano in una strofa;
   la gente della Sala che conosci (rel >= 1) col suo mestiere — il
   beatmaker il beat, il fonico il mix, il giornalista il pezzo — e se ti
   vuole bene ogni tanto ti rilancia un pezzo uscito.
   Si genera una volta a settimana, attaccato a vitaRivali (sim.js), e sta
   in G.lafamegramGente; telPost (telefono.js) lo mescola con i post degli
   incontri, dal più nuovo. */
"use strict";

const FEED_GENTE_MAX = 40;

const FEED_GENTE_TESTI = {
  uscita: ["Fuori «{t}». Link in bio 🔥", "«{t}» è fuori ovunque. Fatemi sapere.",
    "Ci ho messo la faccia. «{t}», adesso.", "Nuovo pezzo: «{t}». Alzate il volume."],
  firma: ["Firmato. Grazie a chi c'era dall'inizio ✍️", "Nuova casa, stessa fame. Ci siamo.",
    "Carta firmata. Adesso si fa sul serio."],
  nuovo: ["Da {c}. Mi conoscerete.", "Primo post qui. {c} sta arrivando.",
    "Nessuno mi ha chiamato. Sono venuto lo stesso."],
  diss: ["Qualcuno parla troppo. Seconda strofa, ascoltate bene 👀",
    "{io}, il pezzo nuovo è per te. Senza rancore. Forse.",
    "C'è chi fa rumore e chi fa musica. {io} lo sa."],
  giro: ["Studio tutta la settimana. Non chiamatemi.", "{c} stanotte. Grazie a tutti 🙏",
    "Sto chiudendo il disco. Manca poco.", "Ogni settimana qualcuno sale. Io resto qui."],
  beatmaker: ["Beat nuovo in cartella. Chi lo vuole scrive in privato 🎹",
    "Tre notti su questo loop. Ci vuole la voce giusta.",
    "Pacchetto di beat pronto. Solo per chi passa dalla Sala."],
  rapper: ["Strofa chiusa stanotte. Esce quando è pronta.",
    "In Sala fino alle quattro. Il giro è piccolo ma è nostro.", "Chi c'è venerdì al contest?"],
  fonico: ["Mix chiuso. Le casse della Sala non perdonano niente.",
    "Oggi ho pulito una voce registrata col telefono. Miracoli.",
    "Le voci troppo compresse mi tolgono il sonno."],
  giornalista: ["Pezzo nuovo sul giro: chi sale, chi si ferma, chi fa rumore.",
    "Trenta demo questa settimana. Una mi è rimasta in testa.",
    "La scena è più viva di quanto dicono le classifiche."],
  videomaker: ["Set di ieri notte. Luce al neon e zero permessi 🎬",
    "Cerco una faccia per un video. Scrivete.", "Girato tutto in un piano sequenza. Fidatevi."],
  spinta: ["Ascoltate «{t}» di {io}. Fidatevi.", "«{t}» di {io} è in loop da giorni.",
    "Se non avete ancora sentito «{t}» di {io}, cosa aspettate?"]
};

/* chi ha appena detto una cosa non la ridice la settimana dopo: si scarta
   quello che ha gia' nei suoi ultimi post, finche' resta altro da dire */
function feedGenteTesto(chiave, v, n){
  const riempi = t => t.replace(/\{(\w+)\}/g, (_, k) => v[k] == null ? "" : v[k]);
  const tutti = FEED_GENTE_TESTI[chiave].map(riempi);
  /* al massimo una frase in meno di quelle che ha: con tre frasi e quattro
     post ricordati non resterebbe niente di nuovo, e ripeterebbe l'ultima */
  const detti = (G.lafamegramGente || []).filter(p => p.n === n)
    .slice(0, Math.min(4, tutti.length - 1)).map(p => p.t);
  const nuovi = tutti.filter(t => detti.indexOf(t) < 0);
  return pick(nuovi.length ? nuovi : tutti);
}
function feedGenteQuando(){
  return "A" + G.year + " S" + String(G.week).padStart(2, "0");
}
function feedGentePosta(n, t, like){
  if(!Array.isArray(G.lafamegramGente)) G.lafamegramGente = [];
  G.lafamegramGente.unshift({n, t, w:feedGenteQuando(), tw:totalWeeks(),
    like:Math.max(3, Math.round(like)), mia:false, gente:true});
  if(G.lafamegramGente.length > FEED_GENTE_MAX) G.lafamegramGente.length = FEED_GENTE_MAX;
}
/* i like di un rivale seguono i suoi ascolti, quelli della Sala la sua fama */
function feedGenteLikeRivale(r2){ return Math.sqrt(Math.max(r2.p || 0, 100)) * rnd(1.6, 4.2); }
function feedGenteLikePersona(p){ return (p.fama || 10) * rnd(2.5, 7) + (p.rel || 0) * 6; }

/* la settimana dei rivali: si guarda cosa è cambiato prima e dopo vitaRivali,
   così i post dicono le stesse cose che finiscono nel diario */
function feedGenteRivali(prima, logPrima){
  const io = ((window.ARTIST || {}).name || "").trim() || "Qualcuno";
  const nuoviLog = [];
  for(const m of G.log){ if(m === logPrima) break; nuoviLog.push(m.t || ""); }
  let postati = 0;
  for(const r2 of G.rivals || []){
    const v = {t:r2.ult, c:r2.city, io};
    const p0 = prima[r2.id];
    let chiave = "";
    if(!p0) chiave = "nuovo";
    else if(nuoviLog.some(t => t.indexOf(r2.n) >= 0 && t.indexOf("ti ha nominato") >= 0)) chiave = "diss";
    else if(r2.usc > p0.usc) chiave = "uscita";
    else if(r2.deal && !p0.deal) chiave = "firma";
    if(!chiave) continue;
    feedGentePosta(r2.n, feedGenteTesto(chiave, v, r2.n), feedGenteLikeRivale(r2) * (chiave === "uscita" ? 1.6 : 1));
    postati++;
  }
  /* una settimana senza niente di grosso: qualcuno in classifica posta comunque */
  if(!postati && (G.rivals || []).length && Math.random() < .6){
    const r2 = pick(G.rivals);
    feedGentePosta(r2.n, feedGenteTesto("giro", {c:r2.city, io}, r2.n), feedGenteLikeRivale(r2));
  }
}
/* la gente della Sala: solo chi conosci, uno o due a settimana */
function feedGenteSala(){
  const io = ((window.ARTIST || {}).name || "").trim() || "uno della Sala";
  const chi = (G.gente || []).filter(p => p && !p.via && !p.rivale && (p.rel || 0) >= 1 && FEED_GENTE_TESTI[p.ruolo]);
  const fuori = (G.songs || []).filter(s => s && s.released && s.t);
  const quanti = Math.min(chi.length, Math.random() < .45 ? 2 : 1);
  for(let i = 0; i < quanti; i++){
    const p = chi.splice(Math.floor(Math.random() * chi.length), 1)[0];
    const spinge = fuori.length && (p.rel || 0) >= 3 && Math.random() < .3;
    const t = spinge ? feedGenteTesto("spinta", {t:pick(fuori.slice(-4)).t, io}, p.n)
      : feedGenteTesto(p.ruolo, {io}, p.n);
    feedGentePosta(p.n, t, feedGenteLikePersona(p));
  }
}

if(typeof vitaRivali === "function"){
  const vitaRivaliSenzaFeed = vitaRivali;
  vitaRivali = function(mieiStream){
    const prima = {};
    (G.rivals || []).forEach(r2 => { prima[r2.id] = {usc:r2.usc, deal:r2.deal}; });
    const logPrima = (G.log || [])[0];
    const esito = vitaRivaliSenzaFeed.apply(this, arguments);
    try{ feedGenteRivali(prima, logPrima); feedGenteSala(); }
    catch(e){ console.warn("[LaFamegram] feed della gente", e); }
    return esito;
  };
}
