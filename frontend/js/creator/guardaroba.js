/* Il guardaroba: i vestiti e gli accessori dell'avatar che lo Shop vende.

   Il reparto Vestiti dello Shop era nato il 04/09 sul ritratto 2D del creator
   e Mycol l'ha congelato il 09/09 (ADF_ABBIGLIAMENTO_HIBERNATE_V2, negozio.js):
   quel ritratto non c'e' piu', e «finche' non esistera' un catalogo cosmetico
   coerente con i provider avatar reali» non aveva senso vendere niente.
   Il catalogo adesso e' questo: capi VERI del camerino MakeHuman
   (media/makehuman-camerino-v1), gli stessi `raw` del suo catalogo, scelti
   uno per uno fra quelli CC0 o CC-BY (i crediti in media/photo/shop/CREDITI.md).

   La regola e' semplice: **lo Shop sblocca, il camerino veste**.
   - Nello Shop compri un capo: finisce in `G.vestiti[raw] = true`.
   - Nel camerino («Il tuo artista», dal menu o dal tasto «Vai a provarlo» dello
     Shop) le tendine del guardaroba mostrano i capi base — tutto quello che NON
     sta in questa vetrina — piu' quelli che hai comprato, piu' quello che il
     personaggio ha gia' addosso (un salvataggio di prima del 20/09 non deve
     spogliarsi). Un capo in vetrina che non hai comprato nel camerino non c'e'.
   La lista arriva al camerino passando dal ponte del creator
   (js/creator/rpg-v24-bridge.js → creator.html → runtime.js del camerino),
   nel messaggio `adf-makehuman-init`, campo `guardaroba`.

   Gli avatar Avaturn non si vestono con roba MakeHuman: per loro lo Shop lo
   dice, invece di vendere cose che non si vedranno mai addosso.

   File nuovo, come chiede la regola dei punti che non sono fix. Sta in
   js/creator/ e non in js/game/ perche' lo caricano sia gioco.html (lo Shop)
   sia landing.html (il creator alla prima creazione: anche li' i capi in
   vetrina devono restare fuori dalle tendine), e la landing del gioco carica
   solo lo stato e le fasi — e' il suo guardaroba, non una regola di gioco. */
"use strict";

/* Un capo: `raw` e' il percorso nel catalogo MakeHuman, `slot` la tendina del
   camerino in cui sta (SLOT_DEFS di runtime.js), `p` il prezzo in euro, la
   miniatura sta in media/photo/shop/capo-<id>.png.
   Dal 21/09/2026 («Lo stile che conta», CARLO) ogni capo porta anche cosa da
   quando ce l'hai addosso: `b` e' "hype" (si vede da lontano: gioielli,
   occhiali da sole, sneaker, la giacca elegante) o "presenza" (come ti porti:
   camicie, pantaloni, scarpe da giorno), un punto l'uno; `t` e' il tema,
   "street" o "elegante", e con tre capi dello stesso tema e nessuno dell'altro
   il look e' completo e la promo rende di piu'. I maglioni non hanno tema:
   vanno con tutto e non fanno look. Il conto lo fa js/game/stile.js.
   Dal 21/09/2026 («Capi che si sbloccano», CARLO) alcuni capi portano anche
   `req`, cosa deve essere successo nella carriera prima di poterli comprare:
   `{contratto:true}` il primo contratto firmato, `{fan:N}` almeno N fan,
   `{citta:"milano"}` una trasferta in quella citta'. Qui sta solo il dato: chi
   decide se e' sbloccato e' lo Shop (shFitRequisito in js/game/negozio.js),
   perche' guarda la partita e questo file lo carica anche la landing. Un capo
   bloccato non e' tuo, quindi nel camerino non c'e' comunque. */
const VETRINA_VESTITI = [
  {id:"beanie", raw:"clothes/elvs_beanie_slouch/elvs_beanie_slouch.json", n:"Beanie", slot:"hats", p:90, d:"Calato sugli occhi. Sta bene con tutto.", t:"street", b:"hype"},
  {id:"coppola", raw:"clothes/elvs_male_flat_cap1/elvs_male_flat_cap1.json", n:"Coppola", slot:"hats", p:110, d:"Vecchia scuola, tirata avanti.", t:"elegante", b:"presenza"},
  {id:"trilby", raw:"clothes/m_trilby_hat/m_trilby_hat.json", n:"Trilby", slot:"hats", p:140, d:"Tesa corta, testa alta.", t:"elegante", b:"presenza"},
  {id:"cuffia", raw:"clothes/Knitted_Hat_01/Knitted_Hat_01.json", n:"Cuffia di lana", slot:"hats", p:60, d:"L'inverno in provincia dura sei mesi.", t:"street", b:"presenza"},
  {id:"patrol", raw:"clothes/Patrol_Cap/Patrol_Cap.json", n:"Cappello militare", slot:"hats", p:120, d:"Rigido, squadrato, serio.", t:"street", b:"presenza"},
  {id:"bandana", raw:"clothes/bandana_mask/bandana_mask.json", n:"Bandana", slot:"hats", p:40, d:"Sulla faccia o al collo, decidi tu.", t:"street", b:"hype"},
  {id:"sole", raw:"clothes/ladies_sunglass1/ladies_sunglass1.json", n:"Occhiali da sole", slot:"glasses", p:160, d:"Anche di sera. Soprattutto di sera.", t:"street", b:"hype"},
  {id:"sport", raw:"clothes/Sport-Sunglasses/Sport-Sunglasses.json", n:"Occhiali sportivi", slot:"glasses", p:130, d:"Lente avvolgente, faccia da corsa.", t:"street", b:"hype"},
  {id:"vista", raw:"clothes/glasses/glasses.json", n:"Occhiali da vista", slot:"glasses", p:90, d:"Quelli che ti danno l'aria di chi legge.", t:"elegante", b:"presenza"},
  {id:"montatura", raw:"clothes/Sagerfrog_s_Glasses_01/Sagerfrog_s_Glasses_01.json", n:"Montatura sottile", slot:"glasses", p:120, d:"Quasi non si vedono. È il punto.", t:"elegante", b:"presenza"},
  {id:"montatura2", raw:"clothes/Sagerfrog_s_Glasses_02/Sagerfrog_s_Glasses_02.json", n:"Montatura squadrata", slot:"glasses", p:150, d:"Spessa, nera, decisa.", t:"elegante", b:"presenza"},
  {id:"cornici", raw:"clothes/TBM_Glasses_Frames_01/TBM_Glasses_Frames_01.json", n:"Montatura tonda", slot:"glasses", p:140, d:"Tonda come una volta.", t:"elegante", b:"presenza"},
  {id:"anello", raw:"clothes/Ring_1/Ring_1.json", n:"Anello", slot:"jewelry", p:180, d:"Uno solo, quello giusto.", t:"elegante", b:"hype"},
  {id:"diamante", raw:"clothes/diamond_ring_01/diamond_ring_01.json", n:"Anello di diamanti", slot:"jewelry", p:900, d:"Si vede da lontano. È fatto per quello.", t:"elegante", b:"hype", req:{fan:10000}},
  {id:"perle", raw:"clothes/Pearl_Necklace/Pearl_Necklace.json", n:"Collana di perle", slot:"jewelry", p:700, d:"Fuori posto di proposito.", t:"elegante", b:"hype", req:{fan:2500}},
  {id:"fulmini", raw:"clothes/heroine_lightning_earrings/heroine_lightning_earrings.json", n:"Orecchini a fulmine", slot:"jewelry", p:220, d:"Due lampi, uno per lato.", t:"street", b:"hype"},
  {id:"canotta", raw:"clothes/mens_tanks_elv1f/mens_tanks_elv1f.json", n:"Canotta", slot:"tops", p:35, d:"Braccia fuori, niente da nascondere.", t:"street", b:"presenza"},
  {id:"canotta2", raw:"clothes/mens_tanks_elvmuscle1f/mens_tanks_elvmuscle1f.json", n:"Canotta muscle", slot:"tops", p:45, d:"Per chi in palestra ci va davvero.", t:"street", b:"presenza"},
  {id:"polo", raw:"clothes/Polo_t-shirt/Polo_t-shirt.json", n:"Polo", slot:"tops", p:70, d:"Colletto su, per dire.", t:"elegante", b:"presenza"},
  {id:"camicia", raw:"clothes/mens_shirt_untuck_elvbhp1f/mens_shirt_untuck_elvbhp1f.json", n:"Camicia fuori", slot:"tops", p:120, d:"Fuori dai pantaloni, sempre.", t:"elegante", b:"presenza"},
  {id:"maglione", raw:"clothes/Knitted_Sweater_01/Knitted_Sweater_01.json", n:"Maglione di lana", slot:"tops", p:140, d:"Grosso, caldo, da nonno. Va di moda.", t:null, b:"presenza"},
  {id:"pescatore", raw:"clothes/Sweater_Fisherman/Sweater_Fisherman.json", n:"Maglione da pescatore", slot:"tops", p:160, d:"A trecce. Il porto non l'hai mai visto.", t:null, b:"presenza"},
  {id:"vissuto", raw:"clothes/Worn_out_sweater/Worn_out_sweater.json", n:"Maglione vissuto", slot:"tops", p:50, d:"Sdrucito nei punti giusti.", t:"street", b:"hype"},
  {id:"cappotto", raw:"clothes/Coat/Coat.json", n:"Trench bianco", slot:"tops", p:380, d:"Fino al ginocchio, con la cintura. Cammini diverso.", t:"elegante", b:"hype", req:{citta:"milano"}},
  {id:"tecnica", raw:"clothes/rescueteam-jacket-male/rescueteam-jacket-male.json", n:"Giacca da soccorso", slot:"tops", p:260, d:"Rossa, coi catarifrangenti. Del soccorso non sei.", t:"street", b:"hype"},
  {id:"elegante", raw:"clothes/Suit_Dinner_Jacket/Suit_Dinner_Jacket.json", n:"Giacca elegante", slot:"tops", p:520, d:"Per le sere in cui conta chi ti guarda.", t:"elegante", b:"hype", req:{contratto:true}},
  {id:"jeans", raw:"clothes/mens_elv_jeans1f/mens_elv_jeans1f.json", n:"Jeans larghi", slot:"bottoms", p:110, d:"Cadono giusti sulle scarpe.", t:"street", b:"presenza"},
  {id:"slim", raw:"clothes/mens_elv_jeans2slf/mens_elv_jeans2slf.json", n:"Jeans slim", slot:"bottoms", p:130, d:"Stretti dove serve.", t:"street", b:"presenza"},
  {id:"shorts", raw:"clothes/elvs_male_shorts1/elvs_male_shorts1.json", n:"Shorts stampati", slot:"bottoms", p:60, d:"Galassia sulle gambe, da giugno a settembre.", t:"street", b:"hype"},
  {id:"chino", raw:"clothes/mens_trouser_f_elv_chr/mens_trouser_f_elv_chr.json", n:"Chino", slot:"bottoms", p:120, d:"Un gradino sopra i jeans.", t:"elegante", b:"presenza"},
  {id:"pantaloni", raw:"clothes/M_Trousers_02/M_Trousers_02.json", n:"Pantaloni scuri", slot:"bottoms", p:190, d:"Dritti, scuri, con la piega.", t:"elegante", b:"presenza"},
  {id:"sneaker", raw:"clothes/elvs_zombiekiller_sneakers1/elvs_zombiekiller_sneakers1.json", n:"Sneaker alte", slot:"shoes", p:180, d:"La prima cosa che guardano.", t:"street", b:"hype"},
  {id:"stivaletti", raw:"clothes/Boots_Ankle_Male/Boots_Ankle_Male.json", n:"Stivaletti", slot:"shoes", p:210, d:"Alla caviglia, suola grossa.", t:"elegante", b:"presenza"},
  {id:"boots", raw:"clothes/male_boots/male_boots.json", n:"Boots", slot:"shoes", p:240, d:"Pesanti. Si sentono sulle scale.", t:"street", b:"presenza"},
  {id:"anfibi", raw:"clothes/hero_boots_1/hero_boots_1.json", n:"Stivali rossi", slot:"shoes", p:260, d:"Al ginocchio, rossi. Non passi inosservato.", t:"street", b:"hype"},
  {id:"lucide", raw:"clothes/MJ-Shoes/MJ-Shoes.json", n:"Mocassini e calzini", slot:"shoes", p:300, d:"Neri lucidi, calzini bianchi. Da palco.", t:"elegante", b:"hype", req:{citta:"milano"}},
  {id:"oxford", raw:"clothes/Shoes_Oxford_male/Shoes_Oxford_male.json", n:"Oxford", slot:"shoes", p:340, d:"Da giacca elegante, o da contrasto.", t:"elegante", b:"presenza", req:{contratto:true}},
  {id:"pelle", raw:"clothes/exy_leather_boots/exy_leather_boots.json", n:"Stivali di pelle", slot:"shoes", p:320, d:"Di pelle vera, o quasi.", t:"elegante", b:"hype", req:{citta:"milano"}},
  {id:"cuffie", raw:"clothes/Headset/Headset.json", n:"Cuffie al collo", slot:"clothesOther", p:150, d:"Al collo anche quando non ascolti niente.", t:"street", b:"hype"}
];

/* le tendine del camerino, nell'ordine in cui lo Shop le mostra */
const VETRINA_REPARTI = [
  ["hats", "Cappelli"], ["glasses", "Occhiali"], ["jewelry", "Gioielli"],
  ["tops", "Parte alta"], ["bottoms", "Parte bassa"], ["shoes", "Scarpe"],
  ["clothesOther", "Altro"]
];

function guardarobaPosseduti(){
  const g = (typeof G !== "undefined" && G) ? G : null;
  if(!g) return {};
  if(!g.vestiti || typeof g.vestiti !== "object") g.vestiti = {};
  return g.vestiti;
}
const guardarobaPosseduto = raw => !!guardarobaPosseduti()[raw];

/* Quello che il camerino deve sapere: cosa sta in vetrina (da nascondere se
   non e' tuo) e cosa e' tuo. Alla prima creazione, in landing, `G` non c'e':
   niente e' tuo, e la vetrina resta fuori dalle tendine. */
function guardarobaPerCamerino(){
  const tuoi = guardarobaPosseduti();
  return {
    vetrina: VETRINA_VESTITI.map(v => v.raw),
    tuoi: VETRINA_VESTITI.map(v => v.raw).filter(raw => !!tuoi[raw])
  };
}

/* L'avatar puo' vestirsi? Solo quello del camerino MakeHuman (`avatarSource`
   "local"); Avaturn no, e chi non ha ancora un avatar nemmeno. */
function guardarobaVestibile(){
  const art = (typeof window !== "undefined" && window.ARTIST) || null;
  if(!art) return false;
  const d = art.avatarData || {};
  return art.avatarSource === "local" &&
    (d.provider === "makehuman" || !!d.makehumanState ||
     (d.localAvatar && (d.localAvatar.provider === "makehuman" || !!d.localAvatar.makehumanState)));
}

window.ADF_GUARDAROBA = {
  vetrina: VETRINA_VESTITI, reparti: VETRINA_REPARTI,
  posseduto: guardarobaPosseduto, perCamerino: guardarobaPerCamerino, vestibile: guardarobaVestibile
};
