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
