/* I rivali: generazione, volto, vita e crescita settimanale. */
"use strict";

/* ==================== I RIVALI SONO ARTISTI VERI ==================== */
const RIV_NOMI = ["Kobra","Nino Vento","Sara Sette","MC Grezzo","Lupo","Ghiaccio","Vale P.","Trenta","Doppio Zero",
  "Tarma","Bibo","Selva","Nadir","Ciro Nove","Maschera","Rosso","Kalé","Zeta","Farah","Bronx 2","Pisto","Miele",
  "Ossa","Nebbia","Turbo","Santo","Ninna","Falco","Cobra Jr","Ombra"];
const RIV_CITTA = ["Milano","Roma","Napoli","Torino","Bologna","Palermo","Bari","Genova","Firenze","Verona",
  "Catania","Padova","Brescia","Modena","Prato","Rimini","Trieste","Perugia","Latina","Foggia"];
const RIV_GEN = ["trap","drill","hip hop","r&b"];
const RIV_SKIN = ["#F2CBA8","#E8B991","#C68A5C","#B0774A","#9A6238","#82502D","#684023","#4E2F1C"];
const RIV_STORIA = [
  "Ha cominciato in un centro sociale, adesso riempie i club.",
  "Faceva il magazziniere fino all'anno scorso. Poi un pezzo è esploso.",
  "Ha una crew grossa dietro e un fratello che gli fa i beat.",
  "Nessuno sa chi sia davvero, non fa foto senza passamontagna.",
  "Ha rifiutato due contratti e se ne vanta in ogni intervista.",
  "È figlio di gente che conta e nel giro glielo ricordano sempre.",
  "Ha fatto sei anni di gavetta prima che qualcuno lo notasse.",
  "Pubblica un pezzo a settimana e non si ferma mai."
];
function faccia(r2, size){
  const s2 = size || 34;
  const sk = r2.skin, sh = shade2(sk,-0.3), cap = "#100D0C";
  const cap2 = r2.hair === 1 ? '<ellipse cx="17" cy="12.5" rx="10" ry="7.6" fill="' + cap + '"/>'
    : r2.hair === 2 ? '<path d="M7,15 C7,7 11,4 17,4 C23,4 27,7 27,15 L27,12 C24,9 10,9 7,12 Z" fill="' + shade2(r2.col,-0.15) + '"/>'
    : r2.hair === 3 ? '<path d="M7,15 C7,6 11,3 17,3 C23,3 27,6 27,15 C25,10 9,10 7,15 Z" fill="' + cap + '"/>' +
        '<rect x="5.6" y="12" width="2.4" height="12" rx="1.2" fill="' + cap + '"/><rect x="26" y="12" width="2.4" height="12" rx="1.2" fill="' + cap + '"/>'
    : '<path d="M7,16 C7,7 11,4 17,4 C23,4 27,7 27,16 C24,11 10,11 7,16 Z" fill="' + cap + '"/>';
  return '<svg viewBox="0 0 34 34" width="' + s2 + '" height="' + s2 + '" xmlns="http://www.w3.org/2000/svg">' +
    '<rect width="34" height="34" rx="11" fill="' + shade2(r2.col,-0.62) + '"/>' +
    '<path d="M6,34 C6,26 11,23 17,23 C23,23 28,26 28,34 Z" fill="' + r2.col + '"/>' +
    '<ellipse cx="17" cy="16" rx="8.4" ry="9.2" fill="' + sk + '"/>' +
    '<path d="M8.6,16 C8.6,10 12,7 17,7 L17,25 C12,25 8.6,21 8.6,16 Z" fill="' + sh + '" opacity=".22"/>' +
    cap2 +
    '<g fill="#1A1414"><ellipse cx="13.6" cy="16.4" rx="1.15" ry="1.4"/><ellipse cx="20.4" cy="16.4" rx="1.15" ry="1.4"/></g>' +
    '</svg>';
}
function nuovoRivale(forza){
  const usati = (G.rivals||[]).map(x => x.n);
  const pool = RIV_NOMI.filter(n => usati.indexOf(n) < 0);
  return {
    n: pool.length ? pick(pool) : pick(RIV_NOMI) + " " + Math.floor(rnd(2,9)),
    eta: Math.floor(rnd(18, 33)), /* punto 65: stessa fascia del giocatore, sono la sua generazione */
    city: pick(RIV_CITTA), gen: pick(RIV_GEN), col: pick(["#FF5A36","#B026FF","#FFC53D","#3DC7FF","#FF4D9D","#57C98B","#7A5CFF","#E8452F"]),
    skin: pick(RIV_SKIN), hair: Math.floor(rnd(0,4)), storia: pick(RIV_STORIA),
    p: forza, prev: forza, mom: 0, usc: Math.floor(rnd(1,6)), deal: Math.random() < .25,
    seed: Math.floor(Math.random()*1e9), ult: pick(BEATNAMES), hot: 0
  };
}
function sistemaRivali(){
  if(!G.rivals) G.rivals = [];
  G.rivals = G.rivals.map(r2 => {
    if(r2.city) return r2;
    const nuovo = nuovoRivale(r2.p || 500);
    nuovo.n = r2.n || nuovo.n; nuovo.p = r2.p || nuovo.p; nuovo.prev = nuovo.p;
    return nuovo;
  });
  while(G.rivals.length < 9) G.rivals.push(nuovoRivale(rnd(300, 2600)));
}
/* la scena va avanti anche senza di te */
function vitaRivali(mieiStream){
  /* quanto corrono gli altri mentre tu lavori: manopola «rivali» nelle impostazioni */
  const sp = (typeof difRivali === "function" ? difRivali() : 1);
  for(const r2 of G.rivals){
    r2.prev = r2.p;
    r2.mom = (r2.mom || 0) * 0.72;
    r2.p = Math.min(3.2e6, Math.max(120, r2.p * rnd(0.955, 1.075) * (1 + r2.mom * sp) * (1 + (sp - 1) * 0.045)));
    if(r2.hot > 0) r2.hot--;
    const dado = Math.random();
    if(dado < .045){
      r2.usc++; r2.ult = pick(BEATNAMES); r2.seed = Math.floor(Math.random()*1e9);
      r2.mom += rnd(.15,.5); r2.hot = 3;
      pushLog("<b>" + r2.n + "</b> è uscito con «" + r2.ult + "».", "");
    } else if(dado < .06 && !r2.deal && r2.p > 4000){
      r2.deal = true; r2.mom += .3;
      pushLog("<b>" + r2.n + "</b> ha firmato con un'etichetta.", "");
    } else if(dado < .075 && r2.p > 8000){
      r2.p *= rnd(.45,.68);
      pushLog("<b>" + r2.n + "</b> è sparito dai radar. Succede in fretta.", "");
    } else if(dado < .085 && mieiStream > 400 && Math.abs(r2.p - mieiStream) < mieiStream*0.4){
      r2.mom += .2; G.hype = clamp(G.hype + 4, 0, 100);
      pushLog("<b>" + r2.n + "</b> ti ha nominato in un pezzo. Non in modo gentile.", "bad");
    }
    r2.p = Math.max(r2.p, mieiStream * rnd(0.18, 0.96));
  }
  // salendo di fase entra gente più grossa e i più piccoli spariscono
  const soglia = PHASES[G.phase].cap * 0.12;
  for(let i=G.rivals.length-1;i>=0;i--){
    if(G.rivals[i].p < soglia && G.rivals.length > 9 ){
      pushLog("<b>" + G.rivals[i].n + "</b> ha smesso. Non ce l'ha fatta.", "");
      G.rivals.splice(i,1);
    }
  }
  if(G.rivals.length < 11 && Math.random() < .06){
    const nuovo = nuovoRivale(rnd(PHASES[G.phase].cap*0.25, PHASES[G.phase].cap*0.9));
    G.rivals.push(nuovo);
    pushLog("<b>" + nuovo.n + "</b> è spuntato dal niente. Da " + nuovo.city + ".", "");
  }
}
