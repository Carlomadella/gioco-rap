/* Spese fisse, livelli di lifestyle e loro effetti. */
"use strict";

/* ==================== LIFESTYLE ==================== */
const LIFE = [
  {id:"casa", n:"Dove vivi", ic:"🏠", c:["#FF5A36","#B026FF"], t:[
    {n:"Da tua madre",      w:0,   d:"Zero affitto, zero privacy. Registri col cuscino sulla porta.", e:{}},
    {n:"Stanza in affitto", w:70,  d:"Un letto tuo e una porta che si chiude.", e:{well:2}},
    {n:"Monolocale",        w:150, d:"Piccolo ma tuo. Ci puoi mettere la sala.", e:{well:4, energy:1}},
    {n:"Bilocale in centro",w:340, d:"Indirizzo che conta, vicino a tutto.", e:{well:5, energy:1, hype:2}},
    {n:"Attico",            w:820, d:"Quello delle foto. Costa come tre stipendi.", e:{well:7, energy:1, hype:6, fan:1.12}}
  ]},
  {id:"auto", n:"Come ti muovi", ic:"🚗", c:["#3DC7FF","#B026FF"], t:[
    {n:"A piedi e mezzi",  w:0,   d:"Un'ora per andare in sala. Tempo perso.", e:{}},
    {n:"Motorino",         w:30,  d:"Arrivi ovunque, torni a casa alle quattro.", e:{live:1.08}},
    {n:"Utilitaria",       w:85,  d:"Ci carichi l'attrezzatura e la crew.", e:{live:1.18, well:1}},
    {n:"Berlina tedesca",  w:230, d:"Quando arrivi si gira qualcuno.", e:{live:1.3, hype:3}},
    {n:"Macchina da video",w:560, d:"Quella che metti nei video. Beve.", e:{live:1.45, hype:8, fan:1.1}}
  ]},
  {id:"look", n:"Come ti vesti", ic:"💎", c:["#FFC53D","#FF5A36"], t:[
    {n:"Quello che hai",   w:0,   d:"Felpa e scarpe consumate.", e:{}},
    {n:"Streetwear",       w:55,  d:"Pezzi giusti, niente di folle.", e:{hype:2}},
    {n:"Roba firmata",     w:180, d:"Si vede da lontano quanto costa.", e:{hype:5, fan:1.08}},
    {n:"Gioielli veri",    w:430, d:"Catene che pesano davvero. E si vede.", e:{hype:10, fan:1.16, live:1.1}}
  ]},
  {id:"uscite", n:"Come vivi le notti", ic:"🌃", c:["#B026FF","#FF4D9D"], t:[
    {n:"Casa e studio",    w:0,   d:"Nessuno ti vede, ma sei sempre lucido.", e:{well:3}},
    {n:"Qualche serata",   w:45,  d:"Ti fai vedere dove serve.", e:{rete:0.4}},
    {n:"Sempre in giro",   w:140, d:"Conosci tutti, dormi poco.", e:{rete:1, hype:3, well:-3}},
    {n:"Vita da party",    w:390, d:"Ogni sera un locale. Il conto lo paghi due volte.", e:{rete:1.8, hype:8, well:-8}}
  ]},
  {id:"crew", n:"Chi hai intorno", ic:"👥", c:["#57C98B","#2B7A55"], t:[
    {n:"Da solo",          w:0,   d:"Fai tutto tu, dalle basi ai social.", e:{}},
    {n:"Un amico che aiuta",w:90, d:"Ti porta l'attrezzatura e ti dice la verità.", e:{energy:1}},
    {n:"Piccola crew",     w:260, d:"Uno alle luci, uno ai social, uno che guida.", e:{energy:1, live:1.15, rete:0.6}},
    {n:"Crew e manager",   w:620, d:"Non pensi più alla logistica. Pensi ai pezzi.", e:{energy:2, live:1.25, rete:1.2, hype:4}}
  ]}
];

function lifeCost(){ return LIFE.reduce((a,c) => a + c.t[G.life[c.id] || 0].w, 0); }

/* ==================== RISCHIO LIFESTYLE · PUNTO STRADA 18 ====================
   Il giocatore non compila contabilità. Internamente teniamo soltanto:
   - entrate chiaramente giustificabili della settimana;
   - spese visibili extra (vestiti/viaggi ecc.);
   - quattro snapshot settimanali, per non punire un singolo picco.
   Il risultato è una frase leggibile: coerente / tirato / sopra le entrate /
   troppo esposto. */
function lifestyleWeekKey(){
  return String(Number(G.year||1))+":"+String(Number(G.week||1));
}

function lifestyleRischioStato(){
  if(!G.strada || typeof G.strada!=="object") G.strada={};
  let st=G.strada.rischioLifestyle;
  if(!st || typeof st!=="object"){
    st=G.strada.rischioLifestyle={
      key:null,entrate:0,fonti:{},speseExtra:0,speseFonti:{},
      history:[],closedKey:null,last:null
    };
  }
  if(!Array.isArray(st.history)) st.history=[];
  if(!st.fonti || typeof st.fonti!=="object") st.fonti={};
  if(!st.speseFonti || typeof st.speseFonti!=="object") st.speseFonti={};
  const key=lifestyleWeekKey();
  if(st.key!==key){
    st.key=key;
    st.entrate=0;
    st.fonti={};
    st.speseExtra=0;
    st.speseFonti={};
  }
  return st;
}

function lifestyleRegistraEntrata(importo,fonte){
  importo=Math.max(0,Number(importo)||0);
  if(!importo) return 0;
  const st=lifestyleRischioStato();
  const k=String(fonte||"altro");
  st.entrate+=importo;
  st.fonti[k]=Number(st.fonti[k]||0)+importo;
  /* compatibilità: altri moduli legacy leggono ancora questo totale. */
  G._entratePulite=st.entrate;
  return importo;
}

function lifestyleRegistraSpesaVisibile(importo,fonte,peso){
  importo=Math.max(0,Number(importo)||0);
  peso=Math.max(0,Number(peso==null?1:peso)||0);
  const pesata=importo*peso;
  if(!pesata) return 0;
  const st=lifestyleRischioStato();
  const k=String(fonte||"altro");
  st.speseExtra+=pesata;
  st.speseFonti[k]=Number(st.speseFonti[k]||0)+pesata;
  return pesata;
}

function lifestyleValoreVestitiVisibili(){
  if(typeof stileAddosso!=="function") return 0;
  return stileAddosso().reduce((n,v)=>n+Math.max(0,Number(v&&v.p)||0),0);
}

function lifestyleOstentazione(){
  const life=G.life||{};
  const livelli=LIFE.reduce((n,c)=>n+((Number(life[c.id]||0))/Math.max(1,c.t.length-1)),0);
  const media=livelli/Math.max(1,LIFE.length);
  const vestiti=lifestyleValoreVestitiVisibili();
  return Math.max(0,Math.min(10,media*7+Math.min(3,vestiti/700)));
}

function lifestyleSnapshotCorrente(){
  const st=lifestyleRischioStato();
  const ricorrente=Math.max(0,Number(lifeCost())||0);
  const vestiti=lifestyleValoreVestitiVisibili();
  /* Un outfit costoso è un segnale di ricchezza, non una spesa ripetuta ogni
     settimana: gli attribuiamo solo un piccolo peso equivalente. */
  const segnaleVestiti=vestiti*.05;
  return {
    key:st.key,
    entrate:Math.max(0,Number(st.entrate)||0),
    ricorrente,
    extra:Math.max(0,Number(st.speseExtra)||0),
    vestiti,
    visibile:ricorrente+Math.max(0,Number(st.speseExtra)||0)+segnaleVestiti,
    fonti:Object.assign({},st.fonti),
    speseFonti:Object.assign({},st.speseFonti)
  };
}

function lifestyleMediaRischio(includiCorrente){
  const st=lifestyleRischioStato();
  const righe=st.history.slice(-3).map(x=>({
    entrate:Number(x.entrate||0),
    visibile:Number(x.visibile||0)
  }));
  if(includiCorrente!==false) righe.push(lifestyleSnapshotCorrente());
  if(!righe.length) return {entrate:0,visibile:0,settimane:0};
  return {
    entrate:righe.reduce((n,x)=>n+x.entrate,0)/righe.length,
    visibile:righe.reduce((n,x)=>n+x.visibile,0)/righe.length,
    settimane:righe.length
  };
}

function lifestyleClassificaRischio(media){
  media=media||lifestyleMediaRischio(true);
  const tolleranza=media.entrate*1.35+90;
  const gap=media.visibile-tolleranza;
  if(gap<=0) return {id:"coerente",label:"Coerente",gap:0};
  if(gap<=120) return {id:"tirato",label:"Tirato",gap};
  if(gap<=300) return {id:"sopra",label:"Sopra le entrate",gap};
  return {id:"esposto",label:"Troppo esposto",gap};
}

function lifestyleRiepilogoRischio(){
  const st=lifestyleRischioStato();
  const media=lifestyleMediaRischio(true);
  const classe=lifestyleClassificaRischio(media);
  return {
    ...classe,
    entrate:media.entrate,
    visibile:media.visibile,
    settimane:media.settimane,
    ostentazione:lifestyleOstentazione(),
    testo:classe.id==="coerente"
      ? "Il tuo tenore di vita è compatibile con quello che puoi giustificare."
      : classe.id==="tirato"
        ? "Stai iniziando a vivere sopra quello che riesci a giustificare."
        : classe.id==="sopra"
          ? "Il tuo tenore di vita è chiaramente sopra le entrate giustificabili."
          : "Stai mostrando e spendendo molto più di quanto puoi giustificare.",
    last:st.last||null
  };
}

function lifestyleChiudiSettimanaRischio(){
  const st=lifestyleRischioStato();
  if(st.closedKey===st.key && st.last) return st.last;

  const snap=lifestyleSnapshotCorrente();
  const media=lifestyleMediaRischio(true);
  const classe=lifestyleClassificaRischio(media);
  const giro=(typeof stradaGiroAvviato==="function")
    ? !!stradaGiroAvviato()
    : !!(G.strada&&(G.strada.giroAvviato||G.strada.badgeSbloccato));

  let heatDelta=0;
  if(giro && !G.strada.arresto && classe.gap>0){
    heatDelta=Math.max(.6,Math.min(8,.7+classe.gap/130+lifestyleOstentazione()*.28));
    G.strada.heat=clamp(Number(G.strada.heat||0)+heatDelta,0,100);
    if(typeof pushLog==="function"){
      pushLog("<b>Tenore di vita: "+classe.label+".</b> "+lifestyleRiepilogoRischio().testo+
        " Attenzione +"+heatDelta.toFixed(1)+".","bad");
    }
  }

  const chiusa={
    ...snap,
    status:classe.id,
    label:classe.label,
    gap:classe.gap,
    heatDelta:Number(heatDelta.toFixed(2)),
    ostentazione:Number(lifestyleOstentazione().toFixed(2))
  };
  st.history.push(chiusa);
  if(st.history.length>8) st.history.shift();
  st.closedKey=st.key;
  st.last=chiusa;
  G._entratePulite=snap.entrate;
  return chiusa;
}
/* punto 63: un riassunto per la sidebar del profilo, non i venticinque numeri
   del pannello Lifestyle vero — solo quante categorie hai alzato dal livello
   base e quanto, in media, sei sopra quel base */
function lifestyleRiepilogo(){
  const alzati = LIFE.filter(c => (G.life[c.id] || 0) > 0).length;
  const pct = LIFE.reduce((a,c) => a + (G.life[c.id] || 0) / (c.t.length - 1), 0) / LIFE.length * 100;
  return {alzati:alzati, pct:pct};
}
function lifeBonus(){
  const b = {well:0, energy:0, hype:0, rete:0, fan:1, live:1};
  for(const c of LIFE){
    const e = c.t[G.life[c.id] || 0].e || {};
    b.well += e.well || 0; b.energy += e.energy || 0; b.hype += e.hype || 0;
    b.rete += e.rete || 0; b.fan *= e.fan || 1; b.live *= e.live || 1;
  }
  return b;
}
/* Punto 39: l'energia è a 100 al giorno, non più a settimana. La scala vecchia
   (3 di base, ±1 la provincia, ±1/±2 il lifestyle, ±1/±2 le impostazioni) resta
   la stessa proporzione, solo moltiplicata per K — così tutta la messa a punto
   già fatta sul lifestyle e sulla difficoltà vale ancora, non si riscrive lei. */
const ENERGIA_K = 13;
function syncEnergy(){
  const art = window.ARTIST || {};
  const base = Math.max(40, 100 + (art.scene === "provincia" ? ENERGIA_K : 0) +
    Math.round(lifeBonus().energy * ENERGIA_K) + difEnergia() * ENERGIA_K);
  if(G.maxEnergy !== base){
    const diff = base - G.maxEnergy;
    G.maxEnergy = base;
    G.energy = clamp(G.energy + Math.max(0, diff), 0, base);
  }
}
