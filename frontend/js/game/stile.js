/* Lo stile che conta: quello che l'artista ha addosso pesa sulla partita.

   «Lo stile che conta — ogni capo del reparto Vestiti che hai addosso da' un
   punto di presenza o di hype (si legge da makehumanState.slots, quello che
   il camerino ha messo sull'artista); un look completo a tema — tutto
   elegante, tutto street — da' un bonus alla promo. Cosi' comprare serve a
   qualcosa oltre alla foto.» (CARLO, «Shop (20/09/2026)» 1.)

   Fino al 20/09 lo Shop sbloccava e il camerino vestiva, e li' finiva: un capo
   comprato cambiava la foto e basta. Adesso ogni capo della vetrina che sta
   addosso all'artista — non comprato: ADDOSSO, cioe' scelto nelle tendine del
   camerino MakeHuman e salvato in `ARTIST.avatarData.makehumanState.slots` —
   conta. Il catalogo dice cosa da' ognuno (`b` in guardaroba.js): «hype» per
   quello che si vede da lontano, «presenza» per come ti porti; e a che tema
   appartiene (`t`: street, elegante, o niente per i maglioni che vanno con
   tutto).

   Dove si sente:
   - l'hype: ogni capo da «hype» addosso vale un punto di hype a settimana,
     nel conto di `advanceWeek()` (sim.js), accanto a quello del lifestyle —
     e' la stessa cosa che fa «Come ti vesti» del lifestyle, ma con i capi
     veri invece di un gradino astratto;
   - la presenza: ogni capo da «presenza» vale un punto sul palco, cioe'
     dove `G.skills.presenza` conta — la serata open mic e il freestyle in
     piazza (actions.js) leggono `stilePresenza()` invece della sola abilita'.
     L'abilita' non cambia: togli la camicia, il punto se ne va;
   - la promo: con un look completo — almeno STILE_LOOK_MIN capi addosso,
     tutti dello stesso tema, e nessuno dell'altro — «Promo sui social» rende
     +25% di hype (`stileBonus().promo`). Un maglione senza tema non rompe il
     look, un capo dell'altro tema si'.

   Vale solo per chi si veste nel camerino MakeHuman (`guardarobaVestibile`):
   un avatar Avaturn non ha slot, e lo Shop glielo dice gia'. Tutto si legge
   dallo stato del personaggio ogni volta: niente da salvare in `G`, niente da
   migrare.

   File nuovo, come chiede la regola dei punti che non sono fix; il catalogo
   resta in js/creator/guardaroba.js perche' lo carica anche la landing. */
"use strict";

const STILE_LOOK_MIN = 3;        /* capi a tema per un look completo */
const STILE_PROMO_BONUS = 0.25;  /* quanto rende in piu' la promo col look */
const STILE_TEMI = {street:"street", elegante:"elegante"};

/* le tendine del camerino com'erano salvate: `{slot: raw}` */
function stileSlots(){
  if(typeof guardarobaVestibile === "function" && !guardarobaVestibile()) return {};
  const art = (typeof window !== "undefined" && window.ARTIST) || {};
  const d = art.avatarData || {};
  const st = d.makehumanState ||
    (d.localAvatar && (d.localAvatar.makehumanState || d.localAvatar.state)) || null;
  return (st && st.slots && typeof st.slots === "object") ? st.slots : {};
}

/* i capi della vetrina che l'artista ha addosso adesso */
function stileAddosso(){
  if(typeof VETRINA_VESTITI === "undefined") return [];
  const addosso = new Set(Object.values(stileSlots()).map(String));
  return VETRINA_VESTITI.filter(v => addosso.has(v.raw));
}

/* Il conto: quanti punti di hype e di presenza, e se il look e' completo.
   `tema` e' "street" o "elegante" quando lo e', null se no; `promo` e' il
   moltiplicatore della promo (1 senza look). */
function stileBonus(){
  const capi = stileAddosso();
  const b = {hype:0, presenza:0, capi:capi, tema:null, promo:1};
  for(const v of capi){
    if(v.b === "hype") b.hype++;
    else if(v.b === "presenza") b.presenza++;
  }
  const temi = capi.map(v => v.t).filter(Boolean);
  if(temi.length >= STILE_LOOK_MIN && temi.every(t => t === temi[0])){
    b.tema = temi[0];
    b.promo = 1 + STILE_PROMO_BONUS;
  }
  return b;
}

/* la presenza come conta sul palco: l'abilita' piu' i capi addosso */
function stilePresenza(){
  const base = (typeof G !== "undefined" && G && G.skills) ? (G.skills.presenza || 0) : 0;
  return base + stileBonus().presenza;
}

/* Una riga da leggere — nello Shop e nel riepilogo del lifestyle — con
   quello che il look sta dando: «3 capi addosso · +2 hype a settimana · +1
   presenza sul palco · look street completo: promo +25%». Vuota se non c'e'
   niente addosso. */
function stileRiga(){
  const b = stileBonus();
  if(!b.capi.length) return "";
  const parti = [b.capi.length + (b.capi.length === 1 ? " capo addosso" : " capi addosso")];
  if(b.hype) parti.push("+" + b.hype + " hype a settimana");
  if(b.presenza) parti.push("+" + b.presenza + " presenza sul palco");
  if(b.tema) parti.push("look " + b.tema + " completo: promo +" + Math.round(STILE_PROMO_BONUS * 100) + "%");
  return parti.join(" · ");
}

/* Cosa manca al look, per dirlo nello Shop: quanti capi a tema servono
   ancora, o quale capo dell'altro tema lo rompe. Null se il look c'e'. */
function stileLookManca(){
  const b = stileBonus();
  if(b.tema) return null;
  const temi = b.capi.map(v => v.t).filter(Boolean);
  if(!temi.length) return "Con tre capi dello stesso tema — tutto street o tutto elegante — la promo rende +" +
    Math.round(STILE_PROMO_BONUS * 100) + "%.";
  const conta = {};
  for(const t of temi) conta[t] = (conta[t] || 0) + 1;
  const tema = Object.keys(conta).sort((x, y) => conta[y] - conta[x])[0];
  const altri = b.capi.filter(v => v.t && v.t !== tema);
  if(altri.length)
    return "Look " + tema + " a metà: " + altri.map(v => v.n.toLowerCase()).join(", ") +
      (altri.length === 1 ? " è dell'altro tema" : " sono dell'altro tema") + ".";
  const mancano = STILE_LOOK_MIN - conta[tema];
  return "Look " + tema + ": " + (mancano === 1 ? "manca un capo " : "mancano " + mancano + " capi ") +
    tema + " per la promo a +" + Math.round(STILE_PROMO_BONUS * 100) + "%.";
}

window.ADF_STILE = {bonus: stileBonus, addosso: stileAddosso, presenza: stilePresenza, riga: stileRiga, manca: stileLookManca};
