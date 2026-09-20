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
   miniatura sta in media/photo/shop/capo-<id>.png. */
const VETRINA_VESTITI = [
  {id:"beanie", raw:"clothes/elvs_beanie_slouch/elvs_beanie_slouch.json", n:"Beanie", slot:"hats", p:90, d:"Calato sugli occhi. Sta bene con tutto."},
  {id:"coppola", raw:"clothes/elvs_male_flat_cap1/elvs_male_flat_cap1.json", n:"Coppola", slot:"hats", p:110, d:"Vecchia scuola, tirata avanti."},
  {id:"trilby", raw:"clothes/m_trilby_hat/m_trilby_hat.json", n:"Trilby", slot:"hats", p:140, d:"Tesa corta, testa alta."},
  {id:"cuffia", raw:"clothes/Knitted_Hat_01/Knitted_Hat_01.json", n:"Cuffia di lana", slot:"hats", p:60, d:"L'inverno in provincia dura sei mesi."},
  {id:"patrol", raw:"clothes/Patrol_Cap/Patrol_Cap.json", n:"Cappello militare", slot:"hats", p:120, d:"Rigido, squadrato, serio."},
  {id:"bandana", raw:"clothes/bandana_mask/bandana_mask.json", n:"Bandana", slot:"hats", p:40, d:"Sulla faccia o al collo, decidi tu."},
  {id:"sole", raw:"clothes/ladies_sunglass1/ladies_sunglass1.json", n:"Occhiali da sole", slot:"glasses", p:160, d:"Anche di sera. Soprattutto di sera."},
  {id:"sport", raw:"clothes/Sport-Sunglasses/Sport-Sunglasses.json", n:"Occhiali sportivi", slot:"glasses", p:130, d:"Lente avvolgente, faccia da corsa."},
  {id:"vista", raw:"clothes/glasses/glasses.json", n:"Occhiali da vista", slot:"glasses", p:90, d:"Quelli che ti danno l'aria di chi legge."},
  {id:"montatura", raw:"clothes/Sagerfrog_s_Glasses_01/Sagerfrog_s_Glasses_01.json", n:"Montatura sottile", slot:"glasses", p:120, d:"Quasi non si vedono. È il punto."},
  {id:"montatura2", raw:"clothes/Sagerfrog_s_Glasses_02/Sagerfrog_s_Glasses_02.json", n:"Montatura squadrata", slot:"glasses", p:150, d:"Spessa, nera, decisa."},
  {id:"cornici", raw:"clothes/TBM_Glasses_Frames_01/TBM_Glasses_Frames_01.json", n:"Montatura tonda", slot:"glasses", p:140, d:"Tonda come una volta."},
  {id:"anello", raw:"clothes/Ring_1/Ring_1.json", n:"Anello", slot:"jewelry", p:180, d:"Uno solo, quello giusto."},
  {id:"diamante", raw:"clothes/diamond_ring_01/diamond_ring_01.json", n:"Anello di diamanti", slot:"jewelry", p:900, d:"Si vede da lontano. È fatto per quello."},
  {id:"perle", raw:"clothes/Pearl_Necklace/Pearl_Necklace.json", n:"Collana di perle", slot:"jewelry", p:700, d:"Fuori posto di proposito."},
  {id:"fulmini", raw:"clothes/heroine_lightning_earrings/heroine_lightning_earrings.json", n:"Orecchini a fulmine", slot:"jewelry", p:220, d:"Due lampi, uno per lato."},
  {id:"canotta", raw:"clothes/mens_tanks_elv1f/mens_tanks_elv1f.json", n:"Canotta", slot:"tops", p:35, d:"Braccia fuori, niente da nascondere."},
  {id:"canotta2", raw:"clothes/mens_tanks_elvmuscle1f/mens_tanks_elvmuscle1f.json", n:"Canotta muscle", slot:"tops", p:45, d:"Per chi in palestra ci va davvero."},
  {id:"polo", raw:"clothes/Polo_t-shirt/Polo_t-shirt.json", n:"Polo", slot:"tops", p:70, d:"Colletto su, per dire."},
  {id:"camicia", raw:"clothes/mens_shirt_untuck_elvbhp1f/mens_shirt_untuck_elvbhp1f.json", n:"Camicia fuori", slot:"tops", p:120, d:"Fuori dai pantaloni, sempre."},
  {id:"maglione", raw:"clothes/Knitted_Sweater_01/Knitted_Sweater_01.json", n:"Maglione di lana", slot:"tops", p:140, d:"Grosso, caldo, da nonno. Va di moda."},
  {id:"pescatore", raw:"clothes/Sweater_Fisherman/Sweater_Fisherman.json", n:"Maglione da pescatore", slot:"tops", p:160, d:"A trecce. Il porto non l'hai mai visto."},
  {id:"vissuto", raw:"clothes/Worn_out_sweater/Worn_out_sweater.json", n:"Maglione vissuto", slot:"tops", p:50, d:"Sdrucito nei punti giusti."},
  {id:"cappotto", raw:"clothes/Coat/Coat.json", n:"Trench bianco", slot:"tops", p:380, d:"Fino al ginocchio, con la cintura. Cammini diverso."},
  {id:"tecnica", raw:"clothes/rescueteam-jacket-male/rescueteam-jacket-male.json", n:"Giacca da soccorso", slot:"tops", p:260, d:"Rossa, coi catarifrangenti. Del soccorso non sei."},
  {id:"elegante", raw:"clothes/Suit_Dinner_Jacket/Suit_Dinner_Jacket.json", n:"Giacca elegante", slot:"tops", p:520, d:"Per le sere in cui conta chi ti guarda."},
  {id:"jeans", raw:"clothes/mens_elv_jeans1f/mens_elv_jeans1f.json", n:"Jeans larghi", slot:"bottoms", p:110, d:"Cadono giusti sulle scarpe."},
  {id:"slim", raw:"clothes/mens_elv_jeans2slf/mens_elv_jeans2slf.json", n:"Jeans slim", slot:"bottoms", p:130, d:"Stretti dove serve."},
  {id:"shorts", raw:"clothes/elvs_male_shorts1/elvs_male_shorts1.json", n:"Shorts stampati", slot:"bottoms", p:60, d:"Galassia sulle gambe, da giugno a settembre."},
  {id:"chino", raw:"clothes/mens_trouser_f_elv_chr/mens_trouser_f_elv_chr.json", n:"Chino", slot:"bottoms", p:120, d:"Un gradino sopra i jeans."},
  {id:"pantaloni", raw:"clothes/M_Trousers_02/M_Trousers_02.json", n:"Pantaloni scuri", slot:"bottoms", p:190, d:"Dritti, scuri, con la piega."},
  {id:"sneaker", raw:"clothes/elvs_zombiekiller_sneakers1/elvs_zombiekiller_sneakers1.json", n:"Sneaker alte", slot:"shoes", p:180, d:"La prima cosa che guardano."},
  {id:"stivaletti", raw:"clothes/Boots_Ankle_Male/Boots_Ankle_Male.json", n:"Stivaletti", slot:"shoes", p:210, d:"Alla caviglia, suola grossa."},
  {id:"boots", raw:"clothes/male_boots/male_boots.json", n:"Boots", slot:"shoes", p:240, d:"Pesanti. Si sentono sulle scale."},
  {id:"anfibi", raw:"clothes/hero_boots_1/hero_boots_1.json", n:"Stivali rossi", slot:"shoes", p:260, d:"Al ginocchio, rossi. Non passi inosservato."},
  {id:"lucide", raw:"clothes/MJ-Shoes/MJ-Shoes.json", n:"Mocassini e calzini", slot:"shoes", p:300, d:"Neri lucidi, calzini bianchi. Da palco."},
  {id:"oxford", raw:"clothes/Shoes_Oxford_male/Shoes_Oxford_male.json", n:"Oxford", slot:"shoes", p:340, d:"Da giacca elegante, o da contrasto."},
  {id:"pelle", raw:"clothes/exy_leather_boots/exy_leather_boots.json", n:"Stivali di pelle", slot:"shoes", p:320, d:"Di pelle vera, o quasi."},
  {id:"cuffie", raw:"clothes/Headset/Headset.json", n:"Cuffie al collo", slot:"clothesOther", p:150, d:"Al collo anche quando non ascolti niente."}
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
