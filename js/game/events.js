/* Eventi casuali con scelte multiple. */
"use strict";

/* ==================== EVENTI ==================== */
const EVENTS = [
  {id:"beat", when:g => g.money >= 200, k:"Proposta", t:"Un beat che spacca",
   d:"Un produttore ti manda una base. Chiede <b>250 €</b> per l'esclusiva. È la cosa migliore che ti sia capitata sotto le mani.",
   opts:[
     {n:"Compra l'esclusiva", d:"−250 €, il prossimo pezzo parte da molto più in alto",
      run(){ G.money -= 250; G.beats.push({n:"Esclusiva", q:74});
        return {t:"Beat comprato: «Esclusiva», qualità 74. È in cartella.", c:"good"}; }},
     {n:"Lascia perdere", d:"Tieni i soldi",
      run(){ return {t:"Hai lasciato andare il beat. Un altro lo comprerà.", c:""}; }}
   ]},
  {id:"dissing", when:g => g.fans >= 500, k:"Attrito", t:"Ti hanno nominato",
   d:"Un artista più grosso ti ha citato male in un'intervista. Il tuo nome sta girando, ma non per i motivi giusti.",
   opts:[
     {n:"Rispondi con un pezzo", d:"Hype alto, ma ti giochi la reputazione se è debole",
      run(){ if(G.skills.scrittura > 30){ G.hype = clamp(G.hype+22,0,100); G.fans += Math.round(G.fans*0.08+120);
          return {t:"Hai risposto e hai vinto lo scambio. Il tuo nome è ovunque.", c:"good"}; }
        G.hype = clamp(G.hype-8,0,100); G.wellbeing -= 8;
        return {t:"Hai risposto male. Ti hanno sotterrato nei commenti.", c:"bad"}; }},
     {n:"Ignora e lavora", d:"Niente hype, ma niente rischi",
      run(){ G.skills.scrittura += 2; G.wellbeing += 4;
        return {t:"Hai lasciato correre e sei tornato al quaderno.", c:""}; }}
   ]},
  {id:"feat", when:g => g.skills.rete >= 18, k:"Collaborazione", t:"Un feat sul tavolo",
   d:"Un artista con più seguito di te propone un pezzo insieme. Vuole <b>metà dei diritti</b>.",
   opts:[
     {n:"Accetta", d:"Tanti fan subito, metà degli incassi di quel pezzo",
      run(){ const f = Math.round(rnd(400,1400) + G.fans*0.25); G.fans += f; G.hype = clamp(G.hype+14,0,100);
        return {t:"Feat fatto: +" + fmt(f) + " fan. Metà del pezzo non è tua.", c:"good"}; }},
     {n:"Rifiuta", d:"Resti padrone di quello che fai",
      run(){ G.skills.rete -= 3;
        return {t:"Hai rifiutato. Si è offeso, ma i tuoi pezzi restano tuoi.", c:""}; }}
   ]},
  {id:"crollo", when:g => g.wellbeing <= 30, k:"Corpo", t:"Non ti reggi in piedi",
   d:"Sono settimane che dormi poco. Stamattina non ti sei alzato.",
   opts:[
     {n:"Fermati una settimana", d:"Perdi tempo, recuperi davvero",
      run(){ G.wellbeing = clamp(G.wellbeing+35,0,100); G.energy = 0;
        return {t:"Una settimana persa, ma sei tornato in piedi.", c:""}; }},
     {n:"Tira dritto", d:"Vai avanti lo stesso, a un prezzo",
      run(){ G.wellbeing = clamp(G.wellbeing-10,0,100); G.hype = clamp(G.hype-5,0,100);
        return {t:"Sei andato avanti. Si sente in tutto quello che fai.", c:"bad"}; }}
   ]},
  {id:"radio", when:g => g.songs.some(s=>s.released && s.q >= 55), k:"Radio", t:"Una radio ti ha chiamato",
   d:"Vogliono passare un tuo pezzo, ma chiedono <b>400 €</b> di «contributo promozionale». È legale, è comune, ed è comunque una cosa che ti lascia l'amaro.",
   opts:[
     {n:"Paga", d:"−400 €, spinta reale",
      run(){ if(G.money < 400) return {t:"Non avevi i soldi. Hanno chiamato un altro.", c:"bad"};
        G.money -= 400; const f = Math.round(rnd(600,2200)); G.fans += f; G.hype = clamp(G.hype+16,0,100);
        return {t:"Sei passato in radio: +" + fmt(f) + " fan.", c:"good"}; }},
     {n:"Rifiuta", d:"Non paghi per essere ascoltato",
      run(){ G.skills.rete += 1;
        return {t:"Hai detto no. Qualcuno l'ha notato, in senso buono.", c:""}; }}
   ]},
  {id:"furto", when:g => g.money >= 900, k:"Sfortuna", t:"Ti hanno svuotato la sala",
   d:"Sei arrivato in studio e mancava metà dell'attrezzatura.",
   opts:[
     {n:"Ricompra il necessario", d:"−700 €",
      run(){ G.money -= 700; return {t:"Hai rimesso in piedi la sala. Settecento euro andati.", c:"bad"}; }},
     {n:"Arrangiati con quello che resta", d:"Le prossime registrazioni ne risentono",
      run(){ for(const k of Object.keys(G.gear)){ delete G.gear[k]; break; }
        return {t:"Vai avanti con quello che è rimasto.", c:"bad"}; }}
   ]},
  {id:"sfratto", when:g => g.money < -150 && (g.life.casa||0) > 0, k:"Casa", t:"L'affitto è indietro",
   d:"Il proprietario ti ha scritto per la terza volta. O rientri, o entro il mese sei fuori.",
   opts:[
     {n:"Trovi i soldi come puoi", d:"−300 € e una settimana bruciata",
      run(){ G.money -= 300; G.energy = Math.max(0, G.energy-1);
        return {t:"Hai tappato il buco. Sei rimasto indietro di una settimana.", c:""}; }},
     {n:"Torni a stare più in basso", d:"Scendi di un livello di casa, niente debiti",
      run(){ G.life.casa = Math.max(0, (G.life.casa||0) - 1); G.hype = clamp(G.hype-6,0,100);
        return {t:"Hai fatto le valigie e sei sceso di un gradino. Nessuno lo dirà mai in un'intervista.", c:"bad"}; }}
   ]},
  {id:"famiglia", when:g => g.wellbeing <= 55 && !g.contract, k:"Casa", t:"«Quando ti trovi una cosa seria?»",
   d:"A tavola te l'hanno chiesto di nuovo. Non sono cattivi, sono solo stanchi di vederti stanco.",
   opts:[
     {n:"Dici che smetti", d:"Pace in casa, ma qualcosa dentro si spegne",
      run(){ G.wellbeing = clamp(G.wellbeing+18,0,100); G.hype = clamp(G.hype-10,0,100);
        return {t:"Hai promesso che rallenti. Il quaderno è rimasto chiuso qualche giorno.", c:""}; }},
     {n:"Tieni il punto", d:"Nessuno ti capisce, ma la fame resta intera",
      run(){ G.wellbeing = clamp(G.wellbeing-10,0,100); G.hype = clamp(G.hype+8,0,100);
        gain("scrittura", 2);
        return {t:"Hai tenuto il punto. Quella sera hai scritto la strofa migliore del mese.", c:"good"}; }}
   ]},
  {id:"campione", when:g => g.songs.some(s=>s.released && s.streams > 8000), k:"Guai", t:"Il campione non era libero",
   d:"Uno dei tuoi pezzi usa un pezzo di disco che non era tuo. Ti hanno mandato una lettera.",
   opts:[
     {n:"Paghi la licenza", d:"−1.200 €, il pezzo resta online",
      run(){ if(G.money < 1200) return {t:"Non avevi i soldi. Il pezzo è sparito da tutte le piattaforme.", c:"bad"};
        G.money -= 1200;
        return {t:"Licenza pagata. Il pezzo resta dov'è.", c:""}; }},
     {n:"Togli il pezzo", d:"Perdi il pezzo e gli stream che faceva",
      run(){ const s2 = G.songs.filter(x=>x.released).sort((a,b)=>b.streams-a.streams)[0];
        if(s2){ s2.released = false; s2.last = 0; }
        G.hype = clamp(G.hype-12,0,100);
        return {t:"«" + (s2?s2.t:"Il pezzo") + "» è stato tolto. Chi l'aveva salvato non lo trova più.", c:"bad"}; }}
   ]},
  {id:"ghost", when:g => g.skills.scrittura >= 24, k:"Lavoro", t:"Scrivere per un altro",
   d:"Uno con più numeri di te ti chiede tre strofe. Paga bene e il tuo nome non compare da nessuna parte.",
   opts:[
     {n:"Accetti", d:"+900 €, nessun fan, una settimana di scrittura persa",
      run(){ G.money += 900; G.energy = Math.max(0, G.energy-1); gain("scrittura", 1.5);
        return {t:"Novecento euro e tre strofe che canterà un altro.", c:""}; }},
     {n:"Rifiuti", d:"Niente soldi, ma le tue barre restano tue",
      run(){ G.hype = clamp(G.hype+4,0,100);
        return {t:"Hai detto no. Quelle tre strofe le hai tenute per te.", c:""}; }}
   ]},
  {id:"facili", when:g => g.money < 0, k:"Bivio", t:"Soldi che arrivano subito",
   d:"Un tizio del giro ti offre <b>1.500 €</b> per una serata privata di cui è meglio non chiedere troppo.",
   opts:[
     {n:"Ci vai", d:"+1.500 € adesso, e un rischio che resta",
      run(){ G.money += 1500;
        if(Math.random() < .35){ G.hype = clamp(G.hype-18,0,100); G.wellbeing = clamp(G.wellbeing-15,0,100);
          return {t:"Hai preso i soldi. È venuta fuori una foto che non doveva uscire.", c:"bad"}; }
        return {t:"Millecinquecento euro e nessuna domanda. Per ora.", c:""}; }},
     {n:"Lasci stare", d:"Resti al verde e pulito",
      run(){ return {t:"Hai detto di no. Il conto resta rosso.", c:""}; }}
   ]},
  {id:"manager", once:true, when:g => g.fans >= 3000, k:"Proposta", t:"Un manager ti vuole seguire",
   d:"Dice che ti porta dove vuoi tu. Chiede il <b>15% su tutto</b>, per due anni.",
   opts:[
     {n:"Firma con lui", d:"Più opportunità, meno soldi in tasca",
      run(){ G.manager = true; G.hype = clamp(G.hype+10,0,100);
        return {t:"Hai un manager. Il quindici per cento se ne va prima di arrivare a te.", c:""}; }},
     {n:"Fai da solo", d:"Tieni tutto, fai tutto",
      run(){ return {t:"Continui a gestirti da solo. Più fatica, più controllo.", c:""}; }}
   ]}
];
