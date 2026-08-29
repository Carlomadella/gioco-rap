/* Cataloghi del creatore: scene, generi, vestiti, colori, tratti del viso. */
"use strict";

/* ================= DATI ================= */
const SCENES = [
  {id:"metropoli", n:"Metropoli", d:"Il giro è sotto casa. Contatti facili, vita cara.",
   eff:["Più occasioni di collaborazione","Spese di vita più alte del 25%"]},
  {id:"citta", n:"Città media", d:"Qualche locale, qualche studio, niente di garantito.",
   eff:["Sale di registrazione più economiche","Serve viaggiare per i live grossi"]},
  {id:"provincia", n:"Provincia", d:"Non c'è niente. Devi inventarti tutto.",
   eff:["Parti con più fame: un turno di energia in più","Nessun contatto, zero scena locale"]}
];

const GENRES = [
  {id:"trap", n:"Trap", d:"808 lunghi, autotune, ritornelli che restano in testa.",
   b:"+ hype su ogni uscita", eff:["L'hype cresce più in fretta","I pezzi durano meno nel tempo"]},
  {id:"rap", n:"Rap", d:"La strada di mezzo: parola al centro, produzione che non copre.",
   b:"+ equilibrio", eff:["Nessuna debolezza vera","Nessuna scorciatoia: cresci col lavoro"]},
  {id:"boombap", n:"Boom bap", d:"Cassa e rullante secchi, campioni sporchi, niente fronzoli.",
   b:"+ rispetto nel giro", eff:["I tuoi pezzi invecchiano benissimo","Le playlist grosse ti guardano poco"]},
  {id:"drill", n:"Drill", d:"Ritmo spezzato, hi-hat scivolati, testi diretti.",
   b:"+ presenza dal vivo", eff:["Cresci molto più in fretta sul palco","Le radio ti prendono meno"]},
  {id:"rnb", n:"R&B", d:"Voce in primo piano, armonie, produzioni morbide.",
   b:"+ fan fedeli", eff:["Chi ti segue non se ne va più","Le classifiche rap ti considerano meno"]},
  {id:"garage", n:"UK Garage", d:"Ritmo saltellante, basso caldo, voci tagliate.",
   b:"+ serate e club", eff:["I locali ti chiamano prima","Fuori dal club fai più fatica"]},
  {id:"plugg", n:"Plugg", d:"Tastiere ariose, batterie leggere, tutto sospeso.",
   b:"+ passaparola online", eff:["Più probabilità che un pezzo giri da solo","Numeri instabili: sali e scendi"]},
  {id:"jersey", n:"Jersey club", d:"Kick a terzine, campioni tagliati, roba da ballare.",
   b:"+ pezzi virali corti", eff:["I pezzi esplodono subito","E si spengono altrettanto in fretta"]},
  {id:"afro", n:"Afro", d:"Percussioni, melodie calde, ritornelli larghi.",
   b:"+ pubblico fuori dall'Italia", eff:["Cresci anche dove non sei mai stato","Serve più tempo per il primo colpo"]},
  {id:"cloud", n:"Cloud rap", d:"Riverberi lunghi, voce dentro al beat, atmosfera.",
   b:"+ pezzi che durano", eff:["Gli stream calano molto più lentamente","Poca resa dal vivo"]},
  {id:"pop", n:"Pop rap", d:"Ritornelli larghi, produzione pulita, tutti lo capiscono.",
   b:"+ numeri grossi", eff:["Molti più stream a parità di qualità","Nel giro ti prendono meno sul serio"]},
  {id:"conscious", n:"Conscious", d:"Hai qualcosa da dire e lo dici, senza girarci intorno.",
   b:"+ credibilità", eff:["Chi ti segue ti difende","Le mode ti passano accanto"]}
];

const FITS = [
  {id:"felpa",   n:"Felpa oversize",   top:"#39404C", hood:true,  collar:"crew"},
  {id:"tuta",    n:"Tuta sportiva",    top:"#2B6CF0", hood:false, collar:"zip", accent:true},
  {id:"pelle",   n:"Giacca di pelle",  top:"#141416", hood:false, collar:"lapel", shine:true},
  {id:"black",   n:"Total black",      top:"#0E0E11", hood:true,  collar:"crew"},
  {id:"street",  n:"Streetwear",       top:"#E8452F", hood:false, collar:"crew", accent:true},
  {id:"canotta", n:"Canotta",          top:"#EDEDEF", hood:false, collar:"tank"},
  {id:"elegante",n:"Giacca elegante",  top:"#26313F", hood:false, collar:"lapel"},
  {id:"piumino", n:"Piumino",          top:"#3A3F49", hood:true,  collar:"puffer"}
];

const SKINS = ["#FBE0C4","#F2CBA8","#E8B991","#DDA679","#C68A5C","#B0774A","#9A6238","#82502D","#684023","#4E2F1C","#3A2214"];
const HAIRS = [
  {id:"corti",n:"Corti"},{id:"rasati",n:"Rasati"},{id:"fade",n:"Fade"},{id:"spazzola",n:"A spazzola"},
  {id:"treccine",n:"Treccine"},{id:"dread",n:"Dread"},{id:"afro",n:"Afro"},{id:"ricci",n:"Ricci"},
  {id:"lunghi",n:"Lunghi"},{id:"coda",n:"Coda"},{id:"durag",n:"Durag"},{id:"cappuccio",n:"Cappuccio su"}
];
const HAIRCOLS = [
  {c:"#100D0C",n:"Nero"},{c:"#3A2418",n:"Castano"},{c:"#6B4426",n:"Castano chiaro"},
  {c:"#B98A3C",n:"Biondo"},{c:"#E3DCC9",n:"Platino"},{c:"#8C3A1E",n:"Rosso"},
  {c:"#2B3E8C",n:"Blu"},{c:"#2C6B4A",n:"Verde"},{c:"#7A2C8C",n:"Viola"},{c:"#C7C7CF",n:"Grigio"}
];
const FACES = [{id:"ovale",n:"Ovale"},{id:"squadrato",n:"Squadrato"},{id:"tondo",n:"Tondo"},{id:"affilato",n:"Affilato"}];
const EYECOLS = [
  {c:"#3A2A1A",n:"Scuri"},{c:"#6B4E2A",n:"Nocciola"},{c:"#2E4A6B",n:"Azzurri"},
  {c:"#3B6B4A",n:"Verdi"},{c:"#1A1414",n:"Neri"},{c:"#5F6570",n:"Grigi"}
];
const BROWS = [{id:"naturali",n:"Naturali"},{id:"folte",n:"Folte"},{id:"sottili",n:"Sottili"},{id:"taglio",n:"Col taglio"}];
const MOODS = [
  {id:"neutro",     n:"Neutro",      brow:0,  lift:0,  occhi:"normale",   bocca:"normale"},
  {id:"sicuro",     n:"Sicuro",      brow:-5, lift:1,  occhi:"stretti",   bocca:"mezzo"},
  {id:"determinato",n:"Determinato", brow:-13,lift:-1, occhi:"stretti",   bocca:"serrata"},
  {id:"arrabbiato", n:"Arrabbiato",  brow:-22,lift:-3, occhi:"stretti",   bocca:"giu"},
  {id:"sorriso",    n:"Sorriso",     brow:4,  lift:1,  occhi:"chiusi",    bocca:"su"},
  {id:"sfida",      n:"Sfida",       brow:-9, lift:0,  occhi:"storti",    bocca:"ghigno"},
  {id:"stanco",     n:"Stanco",      brow:9,  lift:-2, occhi:"socchiusi", bocca:"giu"},
  {id:"sorpreso",   n:"Sorpreso",    brow:12, lift:4,  occhi:"spalancati",bocca:"o"},
  {id:"freddo",     n:"Di ghiaccio", brow:-3, lift:0,  occhi:"socchiusi", bocca:"piatta"}
];
const MOUTHS = [{id:"normale",n:"Normale"},{id:"carnosa",n:"Carnosa"},{id:"sottile",n:"Sottile"},{id:"seria",n:"Seria"}];
const HATS = [
  {id:"no",n:"Niente"},{id:"cappellino",n:"Cappellino"},{id:"lato",n:"Cappellino di lato"},
  {id:"dietro",n:"Cappellino al contrario"},{id:"beanie",n:"Beanie"},{id:"bandana",n:"Bandana"}
];
const EARS = [{id:"no",n:"Niente"},{id:"cerchio",n:"Cerchio"},{id:"brillante",n:"Brillante"},{id:"doppio",n:"Doppio"}];
const GRILLZ = [{id:"no",n:"Niente"},{id:"oro",n:"Oro"},{id:"diamanti",n:"Diamanti"}];
const COLORS = ["#FF5A36","#B026FF","#FFC53D","#3DC7FF","#FF4D9D","#57C98B","#EDEDEF","#111114"];
const GLASSES = [{id:"no",n:"Niente"},{id:"scuri",n:"Scuri"},{id:"piccoli",n:"Lenti piccole"},{id:"vista",n:"Da vista"}];
const CHAINS  = [{id:"no",n:"Niente"},{id:"sottile",n:"Sottile"},{id:"grossa",n:"Grossa"},{id:"doppia",n:"Doppia"}];
const BEARDS  = [{id:"no",n:"Rasato"},{id:"ombra",n:"Ombra"},{id:"baffi",n:"Baffi"},
  {id:"pizzetto",n:"Pizzetto"},{id:"corta",n:"Corta"},{id:"piena",n:"Piena"}];
const TATTOOS = [{id:"no",n:"Niente"},{id:"collo",n:"Sul collo"},{id:"lacrima",n:"Sotto l'occhio"},
  {id:"stelle",n:"Stelle sul viso"},{id:"croce",n:"Croce"},{id:"scritta",n:"Scritta sullo zigomo"}];
