/* I nomi della gente che sta in classifica.

   Regola del punto 30: un bot in classifica non si deve riconoscere. Quindi
   niente «Bot_17» e niente numeri progressivi: nomi da rapper veri, con una
   città vera dietro e una storia sua. Sono nomi inventati — nessuno di questi
   è un artista che esiste davvero — ma sono fatti come si fanno i nomi d'arte
   in Italia: un soprannome, un nome con l'iniziale, ogni tanto un prefisso. */
"use strict";

const PRENOMI = ["Marco","Luca","Simone","Ciro","Nino","Sara","Vale","Giulia","Dario","Fabio","Matteo","Sofia",
  "Andrea","Gabriel","Samir","Karim","Alessio","Emanuele","Chiara","Noemi","Davide","Gianni","Rocco","Elia",
  "Salvo","Tonio","Pietro","Nadia","Amina","Youssef","Denis","Ivan","Manuel","Alba","Greta","Enzo"];

const INIZIALI = "ABCDFGLMNPRSTVZ".split("");

const SOPRANNOMI = ["Kobra","Vento","Selva","Tarma","Nebbia","Ossa","Ghiaccio","Falco","Ombra","Miele","Turbo",
  "Maschera","Asfalto","Ruggine","Cemento","Sabbia","Fumo","Ferro","Cardine","Grezzo","Bronx","Pisto","Bibo",
  "Nadir","Zeta","Farah","Kalé","Santo","Ninna","Scintilla","Bora","Trenta","Doppio Zero","Fango","Vetro",
  "Corda","Lampo","Serranda","Rame","Piombo","Cardo","Mistral","Tramontana","Scalo","Binario","Muro Nord",
  "Quinto Piano","Ultimo Treno","Diesel","Verona Sud","Kappa","Nove","Ics","Bocca","Rosso","Cenere"];

const PREFISSI = ["Lil","Young","MC","Baby","Don","Nino","Zio","Frate"];

const CITTA = ["Milano","Roma","Napoli","Torino","Bologna","Palermo","Bari","Genova","Firenze","Verona",
  "Catania","Padova","Brescia","Modena","Prato","Rimini","Trieste","Perugia","Latina","Foggia","Vicenza",
  "Rovereto","Taranto","Salerno","Reggio Calabria","Sassari","Pescara","Monza","Bergamo","Ancona","Terni",
  "Cosenza","Lecce","Novara","Piacenza","Udine","Como","Varese","Caserta","Trapani"];

const GENERI = ["trap","drill","hip hop","r&b","boom bap","urban pop"];

const STORIE = [
  "Ha cominciato in un centro sociale, adesso riempie i club.",
  "Faceva il magazziniere fino all'anno scorso. Poi un pezzo è esploso.",
  "Ha una crew grossa dietro e un fratello che gli fa i beat.",
  "Nessuno sa chi sia davvero, non fa foto senza passamontagna.",
  "Ha rifiutato due contratti e se ne vanta in ogni intervista.",
  "È figlio di gente che conta e nel giro glielo ricordano sempre.",
  "Ha fatto sei anni di gavetta prima che qualcuno lo notasse.",
  "Pubblica un pezzo a settimana e non si ferma mai.",
  "Registra ancora nella cameretta e non vuole cambiare.",
  "Si è fatto tutta la provincia coi live nei bar prima di firmare.",
  "Ha sfondato con un pezzo vecchio ripescato da un profilo morto.",
  "Vive fra due città e non dice mai quale delle due è casa."
];

const TITOLI = ["Niente di personale","Ultimo piano","Corri","Fuori orario","Zona industriale","Come prima",
  "Neve sporca","Mezzanotte e dieci","Non chiamarmi","Tutto bene","Vetri","Quartiere basso","Fame vecchia",
  "Piove ancora","Doppio turno","Casa mia","Freddo","Semaforo","Cinque euro","Domenica","Cassa dritta",
  "Portone","Chiavi in tasca","Sabato di merda","Testa bassa","Fuori dal giro","Numeri","Palazzine",
  "Non torno","Ancora qui","Bagnato","Fine mese","Nessun rimpianto","Tredici","Scale antincendio"];

const scegli = a => a[Math.floor(Math.random() * a.length)];

/* Un nome nuovo che non sia già in giro. Le forme sono quattro, così la
   classifica non sembra generata dalla stessa macchina. */
function nuovoNome(usati){
  for(let tentativo = 0; tentativo < 200; tentativo++){
    const dado = Math.random();
    let n;
    if(dado < 0.34)      n = scegli(PRENOMI) + " " + scegli(INIZIALI) + ".";
    else if(dado < 0.72) n = scegli(SOPRANNOMI);
    else if(dado < 0.90) n = scegli(PREFISSI) + " " + scegli(SOPRANNOMI);
    else                 n = scegli(SOPRANNOMI) + " " + Math.floor(2 + Math.random() * 97);
    if(!usati.has(n.toLowerCase())) return n;
  }
  return scegli(SOPRANNOMI) + " " + Math.floor(100 + Math.random() * 899);
}

module.exports = { PRENOMI, SOPRANNOMI, CITTA, GENERI, STORIE, TITOLI, scegli, nuovoNome };
