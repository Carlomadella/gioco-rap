/* «Chat» nel telefono (punto 66, poi rifatta per il punto 3 di «Da smistare»).

   Non è il diario degli eventi — quello resta «Messaggi». Qui ci sono persone
   che ti scrivono, e la differenza fra le due cose è che a queste **puoi
   rispondere**, e quello che rispondi conta.

   ---

   COM'ERA, E PERCHÉ ANDAVA IN LOOP

   Ogni contatto aveva tre o quattro frasi fisse, pescate a caso senza memoria:
   dopo due settimane le avevi viste tutte, e spesso due volte di fila. Le
   risposte poi erano **sempre le stesse due**, attaccate al contatto e non al
   messaggio: mamma ti chiedeva se avevi mangiato e tu potevi solo dire «tutto
   ok» o «ti chiamo dopo», per sempre. E finiva lì: una battuta, una risposta,
   una controrisposta, chiuso.

   COM'È ADESSO — quattro cose, in ordine di quanto si sentono

   1. **Parlano di quello che è successo davvero.** Uno spunto non è una frase,
      è una frase **con la sua condizione**: mamma scrive dei soldi solo se sei
      a secco, del pezzo solo se ne è uscito uno (e lo chiama per nome), dei
      «signori che ti cercavano» solo se hai preso calore sulla Strada. Con
      cento euro in tasca e con diecimila non ti scrive la stessa cosa.

   2. **Le risposte stanno dentro al messaggio**, non nel contatto. Ogni spunto
      si porta le sue, e cambiano con lui.

   3. **Si va avanti a botta e risposta.** Una risposta può aprirne altre
      (`poi`), quindi una conversazione è di due o tre giri, non di uno.

   4. **Puoi scrivere tu per primo.** È la cosa che più di tutte la fa sembrare
      una chat e non una casella della posta: quando non c'è niente in sospeso,
      in fondo trovi «scrivi tu», e le aperture cambiano con quello che sta
      succedendo nella tua carriera.

   Più: niente ripetizioni finché non sono finiti gli spunti buoni, scrivono
   anche in mezzo alla settimana e non solo al cambio di settimana, e la gente
   si sblocca con quello che fai — il produttore quando cominci coi beat, il
   promoter quando sai stare su un palco, il giornalista quando sei qualcuno,
   tuo cugino appena hai due soldi.

   ---

   COME SI SCRIVE UNO SPUNTO, E UNA TRAPPOLA DA NON RIFARE

   Uno **spunto** è `{id, quando(m), peso, testo(m), opts}`.
   Un'**opzione** è `{n, d, poi, blocca, run(m)}`:
     - `run` fa gli effetti e torna quello che rispondono: una stringa, un
       elenco di stringhe (due bolle di fila, come scrive la gente vera), o
       niente;
     - `poi` è l'elenco di opzioni che si apre dopo, e **sta accanto a `run`,
       non dentro**.

   Quel «non dentro» è la trappola, e ci sono cascato scrivendola la prima
   volta. `G` finisce in `localStorage` come JSON, quindi nello stato non ci
   possono stare funzioni: delle opzioni aperte si salva solo *la strada*
   (`aperto: {sp, via:[indici]}`) e l'albero si ripercorre da qui. Se il ramo
   lo restituisse `run()`, dopo un ricaricamento della pagina non ci sarebbe
   più niente da ripercorrere — e chi aveva una conversazione a metà si
   ritroverebbe dei bottoni che non fanno niente. Statico, quindi. */
"use strict";

/* quanti spunti si ricorda ognuno prima di poterli ripetere */
const CHAT_MEMORIA = 7;
/* oltre questi messaggi la conversazione si accorcia da sé: il salvataggio sta
   in localStorage, e una chat di mille bolle se lo mangia tutto */
const CHAT_TETTO = 44;

/* ==================== QUELLO CHE SANNO DI TE ====================
   Gli spunti leggono di qui invece che frugare in `G` ognuno per conto suo:
   così una frase nuova si scrive in una riga e non si sbaglia un campo. */
function chatMondo(){
  const usciti = (G.songs || []).filter(s => s.released);
  const ultimo = usciti.slice().sort((a, b) => (b.week || 0) - (a.week || 0))[0] || null;
  const sett = totalWeeks();
  return {
    sett,
    ultimo,                                             /* l'ultimo pezzo uscito */
    fresco: !!ultimo && (sett - (ultimo.week || 0)) <= 2,
    usciti: usciti.length,
    fan: G.fans || 0,
    soldi: G.money || 0,
    hype: G.hype || 0,
    bene: G.wellbeing == null ? 80 : G.wellbeing,
    testa: luc(),
    calore: (G.strada && G.strada.heat) || 0,
    lavoro: G.job || null,
    deal: !!G.contract,
    palco: (G.skills && G.skills.presenza) || 0,
    rete: (G.skills && G.skills.rete) || 0,
    beat: (G.beats || []).length,
    rivale: (G.rivals && G.rivals.length) ? G.rivals[0].n : null
  };
}
/* il titolo dell'ultimo pezzo, virgolette comprese, o un ripiego */
const chatPezzo = m => m.ultimo ? "«" + m.ultimo.t + "»" : "il pezzo";

/* scorciatoie per gli effetti, così le opzioni restano leggibili */
const chBene = n => { G.wellbeing = clamp(G.wellbeing + n, 0, 100); };
const chHype = n => { G.hype = clamp(G.hype + n, 0, 100); };
const chRete = n => { G.skills.rete = clamp(G.skills.rete + n, 0, 999); };
const chPalco = n => { G.skills.presenza = clamp(G.skills.presenza + n, 0, 999); };
const chEnergia = n => { G.energy = clamp(G.energy + n, 0, G.maxEnergy); };

/* ==================== LA GENTE ==================== */
const CHAT_GENTE = [

  /* ---------------------------------------------------------------- MAMMA */
  {id:"mamma", n:"Mamma", ic:"cuore", k:"#FF4D9D", sempre:true, spesso:.6,
   tu:[
     {n:"Ciao ma', tutto bene?",
      run:() => ["Amore! Sì sì, tutto tranquillo.", "Tu piuttosto, mangi?"],
      poi:[
        {n:"Mangio, tranquilla", d:"+benessere",
         run(){ chBene(4); return "Bravo. Mi hai fatto contenta."; }},
        {n:"Diciamo di sì", run:() => "Diciamo di sì vuol dire no. Passa a pranzo domenica."}
      ]},
     {n:"Ti mando una cosa che ho fatto", d:"+benessere", quando: m => m.usciti > 0,
      run(){ chBene(5);
        return ["L'ho messa su subito.",
                "Non capisco tutte le parole, ma la voce è la tua, e quella la riconosco."]; }}
   ],
   spunti:[
     {id:"soldi", quando: m => m.soldi < 120, peso:3,
      testo: () => "Ho visto che non chiedi mai niente. Ti servono soldi? Dimmelo, che non è una vergogna.",
      opts:[
        {n:"No ma', me la cavo", d:"+benessere",
         run(){ chBene(5); return "Lo so che te la cavi. Però io lo chiedo lo stesso."; }},
        {n:"Un po' sì, a dire il vero", d:"+50 €",
         run(){ G.money += 50; return ["Te li ho mandati.", "E non dirmi grazie che mi offendo."]; },
         poi:[
           {n:"Grazie lo stesso", run:() => "Ti ho detto di no. Mangia."},
           {n:"Te li ridò col primo pezzo", run:() => "Va bene. Intanto però mangia."}
         ]}
      ]},
     {id:"stanco", quando: m => m.bene < 45 || m.testa < 45, peso:3,
      testo: () => "Ti sento strano da un po'. Dormi la notte, o stai sempre lì a scrivere?",
      opts:[
        {n:"Sto scrivendo tanto", run:() => "Scrivere va bene. Anche dormire, però.",
         poi:[
           {n:"Stanotte spengo tutto", d:"+benessere, +lucidità",
            run(){ chBene(8); addLuc(5); return "Bravo. Domani ti sveglio io."; }},
           {n:"Domani, promesso", run:() => "Domani è sempre domani, con te."}
         ]},
        {n:"Sto bene ma', giuro",
         run:() => "Ai figli si crede sempre. Anche quando dicono le bugie."}
      ]},
     {id:"pezzo", quando: m => m.fresco, peso:4,
      testo: m => "Ho sentito " + chatPezzo(m) + ". L'ho fatta sentire anche alla zia.",
      opts:[
        {n:"E allora?",
         run:() => ["Ha detto che si sente che sei tu.", "Che secondo me è un complimento."],
         poi:[
           {n:"Ringraziala", d:"+benessere", run(){ chBene(4); return "Gliel'ho già detto."; }},
           {n:"La zia ascolta Sanremo, ma'", run:() => "E allora? Le orecchie sono orecchie."}
         ]},
        {n:"Non farla sentire in giro, ti prego",
         run:() => "Troppo tardi. L'ha mandata al gruppo della parrocchia."}
      ]},
     {id:"vicina", quando: m => m.fan >= 400, peso:2,
      testo: () => "Mi ha fermato la signora del piano di sotto per chiedere di te. Sapeva il tuo nome d'arte.",
      opts:[
        {n:"E tu che le hai detto?",
         run:() => "Che sei mio figlio e che studi. Non sapevo cosa dire.",
         poi:[
           {n:"Dille che faccio musica, ma'", d:"+benessere",
            run(){ chBene(5); return "Va bene. La prossima volta lo dico."; }},
           {n:"Hai fatto benissimo", run:() => "Ho fatto quello che mi è venuto."}
         ]},
        {n:"Comincia a succedere", run:() => "Me ne sto accorgendo."}
      ]},
     {id:"lavoro", quando: m => !!m.lavoro, peso:2,
      testo: () => "Il lavoro lo tieni ancora, vero? Non lasciarlo per la musica. Promettimelo.",
      opts:[
        {n:"Lo tengo, tranquilla", run:() => "Bene. Una cosa non toglie l'altra."},
        {n:"Non posso prometterlo", d:"−benessere",
         run(){ chBene(-3); return ["Lo sapevo.", "Fai come devi fare. Però dimmelo prima, non dopo."]; },
         poi:[{n:"Te lo dirò prima", run:() => "Basta quello."}]}
      ]},
     {id:"signori", quando: m => m.calore >= 35, peso:5,
      testo: () => "Sono venuti dei signori a chiedere di te. Non li conoscevo. Chi erano?",
      opts:[
        {n:"Gente del giro, niente di che", d:"−benessere",
         run(){ chBene(-5); return "Non mi piace. Non mi piace per niente."; }},
        {n:"Ma', non aprire a nessuno", d:"−benessere",
         run(){ chBene(-7);
           return ["Adesso mi stai facendo preoccupare davvero.", "In che cosa ti sei messo?"]; },
         poi:[
           {n:"In niente. Sto sistemando", run:() => "Sistemalo in fretta."},
           {n:"Non ti posso dire", d:"−benessere",
            run(){ chBene(-4); return "Va bene. Però io la notte non dormo."; }}
         ]}
      ]},
     {id:"pranzo", peso:1,
      testo: () => "Quando vieni a trovarmi? Anche solo un'ora, anche solo un caffè.",
      opts:[
        {n:"Domenica ci sono", d:"+benessere",
         run(){ chBene(6); return "Allora faccio il ragù."; }},
        {n:"Questa settimana è piena", run:() => "È sempre piena. Va bene, quando puoi."}
      ]},
     {id:"eta", quando: m => (G.age || 19) >= 24 && m.usciti >= 3, peso:1,
      testo: () => "Ti ricordi che a quindici anni dicevi che avresti fatto il rapper, e io ridevo?",
      opts:[
        {n:"Me lo ricordo benissimo", d:"+benessere",
         run(){ chBene(7);
           return ["Ecco. Volevo solo dirti che adesso non rido più.", "Buonanotte, amore."]; }},
        {n:"Ridevi tanto", run:() => "Ridevo perché avevo paura. È diverso."}
      ]}
   ]},

  /* ---------------------------------------------------------------- DARIO */
  {id:"amico", n:"Dario", ic:"persona", k:"#38BDF8", sempre:true, spesso:.55,
   tu:[
     {n:"Bro ci sei?", run:() => "Sempre. Dimmi.",
      poi:[
        {n:"Niente, volevo sentirti", d:"+benessere",
         run(){ chBene(4); return "Ci sto. Quando vuoi si esce."; }},
        {n:"Mi serve una mano con una cosa", d:"+rete",
         run(){ chRete(1); return "Dimmi, che ti trovo la gente giusta."; }}
      ]},
     {n:"Senti l'ultima?", quando: m => m.fresco,
      run:() => ["Già sentita tre volte.", "Il ritornello non mi esce dalla testa, brutto stronzo."],
      poi:[{n:"Allora funziona", d:"+hype",
        run(){ chHype(3); return "Funziona sì. Mandala in giro."; }}]}
   ],
   spunti:[
     {id:"pezzo", quando: m => m.fresco, peso:4,
      testo: m => "Ho messo " + chatPezzo(m) + " in macchina stamattina. L'ho fatta sentire a tutti quelli che salivano.",
      opts:[
        {n:"E che dicono?",
         run:() => "Che è tua. Cioè che si capisce che è tua senza guardare il telefono.",
         poi:[
           {n:"Questa mi serviva", d:"+hype",
            run(){ chHype(4); return "Lo so. Per quello te l'ho detta."; }},
           {n:"Falla girare in quartiere", d:"+rete",
            run(){ chRete(1); return "Già fatto ieri sera. Sono in tre che ti vogliono conoscere."; }}
         ]},
        {n:"Non rompere", run:() => "Ti faccio i complimenti e mi mandi a quel paese. Bravo."}
      ]},
     {id:"sale", quando: m => m.fan >= 600, peso:3,
      testo: () => "Fra, stai diventando famoso davvero. Me lo dicono anche quelli che non mi parlano più.",
      opts:[
        {n:"Non è cambiato niente",
         run:() => "Per te no. Per loro sì, e quello è il problema.",
         poi:[
           {n:"Tu resta te", d:"+benessere", run(){ chBene(5); return "Non so fare altro."; }},
           {n:"Che vogliano pure", run:() => "Ecco, bravo. Basta che te ne accorgi."}
         ]},
        {n:"Cominciamo appena adesso", run:() => "Vero. Vai."}
      ]},
     {id:"esci", peso:3,
      testo: () => "Stasera si esce, ci sei? C'è un paio di persone che ti conviene conoscere.",
      opts:[
        {n:"Ci sono", d:"−energia, +rete, +benessere",
         run(){ chEnergia(-18); chRete(1); chBene(6);
           return ["Perfetto, passo io.", "Mettiti qualcosa di decente, per una volta."]; },
         poi:[{n:"Mi metto quello che voglio", run:() => "Come sempre."}]},
        {n:"Stasera scrivo", d:"+lucidità",
         run(){ addLuc(4); return "Va bene. Però poi non dire che non ti chiamo."; }},
        {n:"Chi c'è?",
         run:() => "Gente che fa beat, e uno che organizza serate. Poi decidi tu.",
         poi:[
           {n:"Allora vengo", d:"−energia, +rete",
            run(){ chEnergia(-16); chRete(2); return "Bravo. Ti presento io."; }},
           {n:"Un'altra volta", run:() => "Come vuoi."}
         ]}
      ]},
     {id:"brucia", quando: m => m.testa < 40 || m.bene < 35, peso:4,
      testo: () => "Oh. Ti stai bruciando. Lo vedo da come scrivi anche solo qui.",
      opts:[
        {n:"Sto bene", run:() => "No.",
         poi:[
           {n:"Va bene, non sto bene", d:"+benessere, +lucidità",
            run(){ chBene(8); addLuc(6);
              return "Ecco. Domani non fai niente: ci penso io a romperti le scatole."; }},
           {n:"Lasciami lavorare", d:"−benessere",
            run(){ chBene(-3); return "Come vuoi. Io però resto qua."; }}
         ]},
        {n:"Ho bisogno di staccare", d:"+benessere, +lucidità",
         run(){ chBene(9); addLuc(6);
           return "Allora si stacca. Domani non si parla di musica, promesso."; }}
      ]},
     {id:"rivale", quando: m => !!m.rivale && m.fan >= 300, peso:3,
      testo: m => "Hai visto cosa ha scritto " + m.rivale + "? Secondo me ce l'aveva con te.",
      opts:[
        {n:"Lascia stare", d:"+lucidità",
         run(){ addLuc(3); return "Fai bene. Rispondi coi pezzi."; }},
        {n:"Mandami il link", d:"−lucidità, +hype",
         run(){ addLuc(-4); chHype(3);
           return ["Te l'ho mandato.", "Adesso però non stare tutta la notte a leggere i commenti."]; },
         poi:[{n:"Troppo tardi", d:"−lucidità", run(){ addLuc(-3); return "Lo sapevo."; }}]}
      ]},
     {id:"beat", quando: m => m.beat === 0 && m.usciti === 0, peso:2,
      testo: () => "Ma i beat da dove li prendi? Ho un tipo che ne fa di buoni, se ti serve.",
      opts:[
        {n:"Passamelo", d:"+rete", run(){ chRete(1); return "Fatto. Digli che ti mando io."; }},
        {n:"Me li faccio da solo", run:() => "Ancora meglio. Fammeli sentire."}
      ]}
   ]},

  /* -------------------------------------------------------------- IL FAN */
  {id:"fan", n:"Un fan", ic:"fama", k:"#FACC15", apri: m => m.fan >= 80, spesso:.35,
   spunti:[
     {id:"shout", peso:2,
      testo: () => "Ciao!! Puoi fare uno shoutout alla mia pagina? Ti prego ti prego ti prego",
      opts:[
        {n:"Lo faccio", d:"+hype",
         run(){ chHype(3); return ["AAAA GRAZIE", "Lo dico a tutti che mi hai risposto"]; }},
        {n:"Non li faccio, scusa", run:() => "Va bene lo stesso, ti seguo comunque"},
        {n:"Fammi sentire cosa fai", d:"+hype, +rete",
         run(){ chHype(2); chRete(1); return "Te la mando subito!! Non ci credo"; },
         poi:[
           {n:"Non è male, davvero", d:"+hype",
            run(){ chHype(3); return "Sto piangendo, giuro"; }},
           {n:"Lavora sulle rime interne",
            run:() => "Me lo segno. Grazie davvero, nessuno mi dice mai niente"}
         ]}
      ]},
     {id:"quando", quando: m => !m.fresco && m.usciti > 0, peso:3,
      testo: () => "Quando esce il prossimo?? Sono due settimane che riascolto sempre le stesse cose",
      opts:[
        {n:"Presto, sto lavorando", d:"+hype",
         run(){ chHype(2); return "OK aspetto. Però sbrigati"; }},
        {n:"Quando è pronto", run:() => "Giusto. Meglio aspettare che una roba fatta male"}
      ]},
     {id:"testo", quando: m => !!m.ultimo && (m.ultimo.txt || "").length > 10, peso:3,
      testo: m => "Ma quella frase in " + chatPezzo(m) + "… l'hai scritta pensando a qualcuno?",
      opts:[
        {n:"A qualcuno sì", d:"+hype",
         run(){ chHype(3); return "Lo sapevo. Si sente quando è vero"; }},
        {n:"Me la sono inventata",
         run:() => "Allora sei bravo davvero, perché a me è sembrata vera",
         poi:[{n:"È tutte e due le cose", d:"+hype",
           run(){ chHype(2); return "Questa me la segno"; }}]}
      ]},
     {id:"tatuaggio", quando: m => m.fan >= 1500, peso:2,
      testo: () => "Mi sono tatuato una frase tua. Volevo che lo sapessi.",
      opts:[
        {n:"Mandami la foto", d:"+hype",
         run(){ chHype(5); return ["Eccola.", "Non sono nemmeno pentito"]; },
         poi:[{n:"Portala bene", d:"+benessere",
           run(){ chBene(6); return "Lo farò."; }}]},
        {n:"Spero tu non te ne penta", run:() => "Mai."}
      ]}
   ]},

  /* ------------------------------------------------------------ L'HATER */
  {id:"hater", n:"Un hater", ic:"maschera", k:"#F87171", apri: m => m.fan >= 250, spesso:.3,
   spunti:[
     {id:"pezzo", quando: m => m.fresco, peso:3,
      testo: m => "Ho ascoltato " + chatPezzo(m) + ". Quaranta secondi e ho tolto. Fai un favore a tutti e smetti.",
      opts:[
        {n:"Rispondi a tono", d:"Può girare bene o male",
         run(){ if(Math.random() < .5){ chHype(5); return "…"; }
           chBene(-6); return "Ah, quindi ti ho toccato. Troppo facile."; }},
        {n:"Grazie dell'ascolto", d:"+lucidità",
         run(){ addLuc(4); return "…e questa cosa mi dà ancora più fastidio."; }},
        {n:"Blocca", d:"Non scrive più per un pezzo", blocca:8, run:() => null},
        {n:"Ignora", run:() => null}
      ]},
     {id:"venduto", quando: m => m.deal || m.fan >= 3000, peso:3,
      testo: () => "Ti sei venduto. Quando facevi le cose in cameretta eri un'altra cosa.",
      opts:[
        {n:"In cameretta non mi ascoltavi", d:"+hype",
         run(){ chHype(4); return "Ti seguivo da prima di tutti."; }},
        {n:"Forse hai ragione", d:"−benessere",
         run(){ chBene(-5); return "Almeno lo ammetti. Rispetto."; }},
        {n:"Blocca", d:"Non scrive più per un pezzo", blocca:8, run:() => null}
      ]},
     {id:"copiato", quando: m => !!m.rivale, peso:2,
      testo: m => "Hai copiato tutto da " + m.rivale + ", e lo sanno tutti tranne te.",
      opts:[
        {n:"Ascolta meglio", d:"+hype",
         run(){ chHype(3); return "Ho ascoltato fin troppo, purtroppo."; }},
        {n:"Blocca", d:"Non scrive più per un pezzo", blocca:8, run:() => null},
        {n:"Ignora", run:() => null}
      ]},
     {id:"fine", peso:2,
      testo: () => "Fra tre mesi non ti si ricorda più nessuno. Segnati questo messaggio.",
      opts:[
        {n:"Me lo segno", run:() => "Bravo. Ci risentiamo."},
        {n:"Blocca", d:"Non scrive più per un pezzo", blocca:8, run:() => null},
        {n:"Ignora", run:() => null}
      ]}
   ]},

  /* --------------------------------------------------------- IL PROMOTER */
  {id:"promo", n:"Vale (serate)", ic:"mic", k:"#34D399",
   apri: m => m.palco >= 8 || m.fan >= 500, spesso:.22,
   spunti:[
     {id:"data", peso:3,
      testo: () => "Ho una data che si è liberata venerdì. Venti minuti, prima del nome grosso. Ti interessa?",
      opts:[
        {n:"La prendo", d:"−energia, +hype, +presenza",
         run(){ chEnergia(-22); chHype(6); chPalco(1);
           return "Bene. Ti mando gli orari: non arrivare tardi come l'altra volta."; }},
        {n:"Quanto si paga?",
         run:() => "Poco. Ma davanti ci sono trecento persone che non ti conoscono.",
         poi:[
           {n:"Allora ci sto", d:"−energia, +hype",
            run(){ chEnergia(-22); chHype(6); return "Sapevo che capivi."; }},
           {n:"Non lavoro gratis", run:() => "Rispetto. Ti chiamo quando ho qualcosa di pagato."}
         ]},
        {n:"Venerdì no", run:() => "Va bene. Ti tengo presente."}
      ]},
     {id:"aperto", quando: m => m.fan >= 2000, peso:2,
      testo: () => "Mi hanno chiesto un opening per un tour. Ho fatto il tuo nome. Preparati.",
      opts:[
        {n:"Sono pronto", d:"+hype, +presenza",
         run(){ chHype(8); chPalco(2); return "Lo so. Per questo l'ho fatto."; },
         poi:[
           {n:"Quante date?", run:() => "Otto. E in due si va fuori regione.",
            poi:[{n:"Ci sto", d:"+presenza", run(){ chPalco(1); return "Sapevo."; }}]},
           {n:"Grazie per averci pensato", d:"+benessere",
            run(){ chBene(5); return "Ho fatto il mio lavoro. Tu fai il tuo."; }}
         ]},
        {n:"Non lo sono", d:"+lucidità",
         run(){ addLuc(4); return "Nessuno lo è. Si va lo stesso."; },
         poi:[{n:"Allora andiamo", d:"+presenza", run(){ chPalco(1); return "Ecco."; }}]}
      ]},
     {id:"provino", quando: m => m.palco < 12, peso:3,
      testo: () => "Domanda seria: quante volte sei salito su un palco vero? Non al bar, un palco.",
      opts:[
        {n:"Poche", run:() => "Si sente. Non è un difetto, è una cosa che si aggiusta salendoci.",
         poi:[
           {n:"Trovami dove salire", d:"+presenza, −energia",
            run(){ chPalco(1); chEnergia(-10); return "Martedì, open mic. Venti persone. Si comincia da lì."; }},
           {n:"Preferisco prepararmi ancora", d:"+lucidità",
            run(){ addLuc(3); return "Preparati quanto vuoi. Poi però sali."; }}
         ]},
        {n:"Abbastanza", run:() => "Bene. Allora smettila di suonare come se avessi paura."}
      ]},
     {id:"cachet", quando: m => m.fan >= 1200, peso:2,
      testo: () => "Mi hanno chiesto quanto costi. Che gli dico?",
      opts:[
        {n:"Digli una cifra alta", d:"+hype",
         run(){ chHype(4); return "L'ho detta. Se la prendono, da domani sei un altro artista."; },
         poi:[{n:"E l'hanno presa?", run:() => "Hanno detto che ci pensano. Che è già un sì lento."}]},
        {n:"Quello che è giusto", run:() => "Risposta da persona seria. Purtroppo qui non serve."},
        {n:"Decidi tu", d:"+rete", run(){ chRete(1); return "Allora decido bene. Fidati."; }}
      ]}
   ]},

  /* ------------------------------------------------------ IL GIORNALISTA */
  {id:"stampa", n:"Redazione", ic:"giornale", k:"#94A3B8",
   apri: m => m.fan >= 1200, spesso:.18,
   spunti:[
     {id:"intervista", peso:3,
      testo: () => "Buongiorno, vorremmo farle qualche domanda per un pezzo sulla scena. Dieci minuti al telefono.",
      opts:[
        {n:"Volentieri", d:"+hype",
         run(){ chHype(5); return "Perfetto. Prima domanda: da dove viene quello che scrive?"; },
         poi:[
           {n:"Da dove vengo io", d:"+hype",
            run(){ chHype(3); return "Risposta corta. Mi piace, la lascio così."; }},
           {n:"Da quello che vedo, non da quello che invento", d:"+hype",
            run(){ chHype(4); return "Questa la mettiamo in apertura."; }}
         ]},
        {n:"Non rilascio interviste", d:"+lucidità",
         run(){ addLuc(4); return "Capito. Se cambia idea sa dove trovarci."; }}
      ]},
     {id:"voce", quando: m => m.calore >= 30, peso:3,
      testo: () => "Ci è arrivata una voce su di lei che non riguarda la musica. Vuole commentare?",
      opts:[
        {n:"Nessun commento", run:() => "Lo scriveremo così."},
        {n:"Sono voci e basta", d:"−benessere",
         run(){ chBene(-4); return "Allora ci sarà scritto che lei le smentisce."; },
         poi:[
           {n:"Scrivete quello che volete", d:"−benessere",
            run(){ chBene(-3); return "Lo faremo comunque. Buona giornata."; }},
           {n:"Mi dia una settimana", run:() => "Le do due giorni. Poi esce lo stesso."}
         ]}
      ]},
     {id:"classifica", quando: m => m.fan >= 2500, peso:2,
      testo: () => "Stiamo facendo la classifica di fine anno. Un nome che secondo lei manca sempre?",
      opts:[
        {n:"Il mio", d:"+hype", run(){ chHype(4); return "Diretto. Lo scriviamo tra virgolette."; }},
        {n:"Ne faccio un altro", d:"+rete",
         run(){ chRete(1); return "Bella risposta. Gliela giro, così sa che è stato lei."; }},
        {n:"Le classifiche non le leggo", d:"+lucidità",
         run(){ addLuc(3); return "Nemmeno noi, in fondo."; }}
      ]},
     {id:"recensione", quando: m => m.fresco, peso:3,
      testo: m => "Recensiamo " + chatPezzo(m) + " questa settimana. Vuole aggiungere qualcosa prima?",
      opts:[
        {n:"Il pezzo parla da solo", run:() => "Di solito è vero. Buona fortuna."},
        {n:"Ascoltatelo due volte", d:"+hype",
         run(){ chHype(3); return "Lo faremo. La seconda dice sempre di più."; }}
      ]}
   ]},

  /* ----------------------------------------------------------- IL CUGINO */
  {id:"cugino", n:"Cugino", ic:"soldi", k:"#FBBF24",
   apri: m => m.soldi >= 2500, spesso:.18,
   spunti:[
     {id:"prestito", peso:3,
      testo: () => "Cugì, lo so che adesso giri. Mi presti trecento euro? Te li rendo, giuro.",
      opts:[
        {n:"Te li mando", d:"−300 €",
         run(){ G.money -= 300; return ["Sei un fratello.", "Te li rendo appena posso."]; },
         poi:[{n:"Non ti preoccupare", run:() => "Mi preoccupo, mi preoccupo."}]},
        {n:"Adesso non posso", run:() => "Va bene, dai. Non è che sei cambiato, eh?"},
        {n:"Te ne do cento, e non me li rendi", d:"−100 €, +benessere",
         run(){ G.money -= 100; chBene(4); return "Questa è la risposta giusta. Grazie cugì."; }}
      ]},
     {id:"lavoro", quando: m => m.fan >= 1000, peso:2,
      testo: () => "Ma nel tuo giro serve gente? Faccio qualsiasi cosa, pure portare le casse.",
      opts:[
        {n:"Ti faccio sapere", run:() => "Mi raccomando, eh."},
        {n:"Vieni alla prossima data", d:"+rete",
         run(){ chRete(1); return "Ci sono. Dimmi ora e posto."; },
         poi:[{n:"Non farmi fare figure", run:() => "Cugì. Sono io."}]}
      ]},
     {id:"zia", peso:2,
      testo: () => "Zia mi ha chiesto se guadagni davvero con la musica o se è una cosa che fai e basta.",
      opts:[
        {n:"Dille che è un lavoro", run:() => "Gliel'ho detto. Non ci ha creduto lo stesso."},
        {n:"Dille quello che vuoi", d:"+lucidità",
         run(){ addLuc(3); return "Bravo. Tanto poi si risponde da sola."; }}
      ]},
     {id:"vanto", quando: m => m.fan >= 3000, peso:2,
      testo: () => "Ho detto in giro che sei mio cugino. Spero non ti dia fastidio.",
      opts:[
        {n:"Figurati", d:"+benessere",
         run(){ chBene(4); return "Sapevo. Però te lo chiedo lo stesso."; }},
        {n:"Non usarmi come biglietto da visita", run:() => "Hai ragione. Scusa.",
         poi:[{n:"Non volevo essere duro", d:"+benessere",
           run(){ chBene(3); return "Lo so. Siamo a posto."; }}]}
      ]}
   ]}
];

/* ==================== CHI TI HA DATO IL NUMERO ====================
   («Da smistare», punto 4.) I fonici e i beatmaker de La Sala non sono nomi
   scritti qui: sono le persone vere di `G.gente`, con la loro faccia, il loro
   carattere e il rapporto che ci hai costruito. Quando vi scambiate il numero
   (`azionePosto("numero")`, `posto.js`) compaiono qui dentro, e da quel momento
   ti scrivono come tutti gli altri.

   Prima c'era un beatmaker finto, sempre in rubrica, che non avevi mai
   incontrato: le sue battute erano buone ma la sua presenza non se l'era
   guadagnata nessuno. Adesso quelle battute le dicono le persone che hai
   conosciuto davvero, chiamandoti per nome — e la rubrica te la fai tu.

   I contatti si ricostruiscono a ogni giro da `G.gente`: le funzioni stanno
   dentro a chiusure su `p`, e va bene, perche' **nello stato non ci finisce
   niente di tutto questo** — li' c'e' solo `G.chat["sala:<id>"]` con i
   messaggi e la strada della conversazione, che sono dati e basta. */

/* parlare avvicina, come parlarsi di persona: stessi punti, stessa soglia */
function chatAvvicina(p, quanti){
  p.pt = (p.pt || 0) + quanti;
  while(typeof relSoglia === "function" && p.pt >= relSoglia(p) && p.rel < 5){
    p.pt -= relSoglia(p); p.rel++;
  }
  if(p.pt < 0 && p.rel > 0){ p.rel--; p.pt = 0; }
}

/* il beat che ti manda davvero: finisce nel catalogo, come se te l'avesse
   fatto sentire in sala. E' il motivo per cui vale la pena avere il numero. */
function chatMandaBeat(p){
  if(typeof creaBeat !== "function" || typeof mioGenere !== "function") return null;
  const presi = (G.market || []).map(b => b.n).concat((G.beats || []).map(b => b.n));
  const q = rnd(28, 48) + (p.fama || 10) * 0.3 + (p.rel || 0) * 7;
  const b = creaBeat(p.gen || mioGenere(), q, presi);
  b.price = Math.max(20, Math.round(b.price * (1 - (p.rel || 0) * 0.12)));
  b.da = p.n;
  G.market.push(b);
  if(typeof pushLog === "function")
    pushLog("<b>" + p.n + "</b> ti ha mandato «" + b.n + "» in chat — qualità " + b.q +
      ", " + b.price + " €. È nel catalogo.", "");
  return b;
}

function chatSpuntiBeatmaker(p){
  return [
    {id:"manda", peso:3,
     testo: () => "Ti ho buttato giù una cosa stanotte. Te la mando?",
     opts:[
       {n:"Mandamela", d:"Finisce nel catalogo",
        run(){ chatAvvicina(p, 1);
          const b = chatMandaBeat(p);
          return b ? ["Mandata. Si chiama «" + b.n + "».",
                      "Sta nel tuo catalogo, " + b.price + " €. Per te è già scontata."]
                   : "Te la faccio sentire quando passi."; }},
       {n:"Che roba è?",
        run:() => "Roba tua. Se non ti piace la do a un altro, ma non ti piacerà non averla presa.",
        poi:[
          {n:"Va bene, mandamela", d:"Finisce nel catalogo",
           run(){ chatAvvicina(p, 1);
             const b = chatMandaBeat(p);
             return b ? "Fatto. «" + b.n + "», " + b.price + " €, è nel catalogo."
                      : "Te la faccio sentire quando passi."; }},
          {n:"Dalla a un altro", run:() => "Come vuoi. Poi non venirmi a dire niente."}
        ]},
       {n:"Adesso no", run:() => "Quando vuoi. Tanto sta lì."}
     ]},
    {id:"sessione", quando: () => (p.rel || 0) >= 2, peso:2,
     testo: () => "Sabato ho la sala libera. Se passi, facciamo qualcosa da zero.",
     opts:[
       {n:"Ci sono", d:"−energia, +rete",
        run(){ chEnergia(-20); chRete(2); chatAvvicina(p, 1);
          return "Perfetto. Porta anche le barre non finite, quelle servono di più."; }},
       {n:"Sabato no", run:() => "Peccato. La prossima volta avvisa prima."}
     ]},
    {id:"genere", peso:2,
     testo: () => "Ma adesso su che roba stai? Che se lo so ti preparo le cose giuste.",
     opts:[
       {n:"Roba dura", d:"+rete",
        run(){ chRete(1); chatAvvicina(p, 1); return "Ottimo. Ti mando qualcosa che spacca il vetro."; }},
       {n:"Qualcosa di più aperto", d:"+rete",
        run(){ chRete(1); chatAvvicina(p, 1); return "Ho capito. Ti tiro fuori due accordi e vediamo."; }},
       {n:"Non lo so ancora",
        run:() => "Allora vieni in sala. Si capisce li', non al telefono."}
     ]},
    {id:"lento", quando: m => !m.fresco && m.usciti >= 2, peso:2,
     testo: () => "Sono due settimane che non esce niente. Tutto a posto, o ti sei bloccato?",
     opts:[
       {n:"Mi sono bloccato",
        run:() => "Capita a tutti. Vieni in sala senza l'idea: l'idea arriva lì.",
        poi:[{n:"Ci provo", d:"+lucidità", run(){ addLuc(5); chatAvvicina(p, 1); return "Bravo."; }}]},
       {n:"Sto preparando una cosa grossa", run:() => "Allora aspetto. Ma non troppo."}
     ]},
    {id:"soldi", quando: m => m.soldi < 200, peso:2,
     testo: () => "Se sei a corto, il prossimo te lo do e mi paghi quando esce. Fidati che ci guadagno lo stesso.",
     opts:[
       {n:"Grazie davvero", d:"+benessere",
        run(){ chBene(5); chatAvvicina(p, 2); return "Figurati. Poi però esci qualcosa."; }},
       {n:"Preferisco pagarti subito", d:"+rete",
        run(){ chRete(1); return "Come vuoi. Rispetto."; }}
     ]}
  ];
}

function chatSpuntiFonico(p){
  return [
    {id:"portamelo", quando: m => (G.songs || []).some(x => !x.mixed), peso:3,
     testo: () => "Hai roba da mixare? Ho una finestra libera e le orecchie fresche.",
     opts:[
       {n:"Ce l'ho, passo in sala", d:"+rete",
        run(){ chRete(1); chatAvvicina(p, 1);
          return "Portala. E portala grezza, non toccarla ancora tu."; }},
       {n:"Non è pronta",
        run:() => "Meglio. Una cosa non pronta mixata bene resta una cosa non pronta."}
     ]},
    {id:"ascolto", quando: m => m.fresco, peso:3,
     testo: m => "Ho sentito " + chatPezzo(m) + ". Vuoi che ti dica la verità o che ti faccia i complimenti?",
     opts:[
       {n:"La verità", d:"+lucidità",
        run(){ addLuc(6); chatAvvicina(p, 1);
          return ["La voce sta troppo dentro. Si perde una parola su tre nel ritornello.",
                  "Il pezzo però c'è. È solo la mano che manca."]; },
        poi:[
          {n:"Me lo rifai tu?", d:"+rete",
           run(){ chRete(1); chatAvvicina(p, 1); return "Portamelo. Due ore e te lo cambio."; }},
          {n:"Ci lavoro io", run:() => "Bene. Alza la voce di tre dB e senti che succede."}
        ]},
       {n:"I complimenti", d:"−lucidità",
        run(){ addLuc(-3); return "È bellissima. Ecco, contento?"; }}
     ]},
    {id:"attrezzi", quando: m => m.soldi >= 900, peso:2,
     testo: () => "Con quello che stai girando, prenditi un microfono decente. Ti cambia più di dieci ore di mix.",
     opts:[
       {n:"Che mi consigli?", d:"+lucidità",
        run(){ addLuc(4); chatAvvicina(p, 1);
          return "Roba da studio, non da streaming. Ti scrivo due nomi, li trovi nel negozio."; }},
       {n:"Registro con quello che ho", run:() => "Si sente. Ma va bene, si è sempre fatto così."}
     ]},
    {id:"gavetta", peso:2,
     testo: () => "Lo sai quanti pezzi ho mixato prima che uno andasse da qualche parte? Non te lo dico, ti passa la voglia.",
     opts:[
       {n:"Dimmelo lo stesso", d:"+lucidità",
        run(){ addLuc(4); chatAvvicina(p, 1);
          return "Quattrocento e passa. Il numero non conta: conta che sono ancora qui."; }},
       {n:"Allora non me lo dire", run:() => "Bravo. Vai avanti e basta."}
     ]},
    {id:"stanco", quando: m => m.bene < 40, peso:2,
     testo: () => "Ti ho sentito strano l'altro giorno in sala. Tutto a posto?",
     opts:[
       {n:"Sono cotto", d:"+benessere",
        run(){ chBene(6); chatAvvicina(p, 1);
          return "Fermati un giorno. Il pezzo non scappa, tu sì."; }},
       {n:"Tutto a posto", run:() => "Se lo dici tu. Io comunque ci sono."}
     ]}
  ];
}

/* Le aperture: quello che puoi scrivere tu per primo. */
function chatTuSala(p, fonico){
  return fonico ? [
    {n:"Quando hai un buco in sala?",
     run:() => "Questa settimana ho martedì e giovedì. Dimmi tu.",
     poi:[{n:"Martedì", d:"+rete", run(){ chRete(1); chatAvvicina(p, 1); return "Segnato."; }},
          {n:"Ti faccio sapere", run:() => "Fammi sapere presto, che si riempie."}]},
    {n:"Mi dai un parere onesto?", quando: m => m.usciti > 0, d:"+lucidità",
     run(){ addLuc(4); chatAvvicina(p, 1);
       return ["Sempre.", "Mandami la traccia e dammi mezz'ora."]; }}
  ] : [
    {n:"Hai qualcosa di nuovo?",
     run:() => "Ho sempre qualcosa di nuovo.",
     poi:[
       {n:"Mandamela", d:"Finisce nel catalogo",
        run(){ chatAvvicina(p, 1);
          const b = chatMandaBeat(p);
          return b ? "Vai: «" + b.n + "», " + b.price + " €. È nel catalogo."
                   : "Passa in sala che te la faccio sentire."; }},
       {n:"Passo in sala", d:"+rete", run(){ chRete(1); return "Ti aspetto."; }}
     ]},
    {n:"Su che roba stai lavorando?",
     run:() => "Cose. Se vuoi sentirle prima degli altri, sai dove trovarmi.",
     poi:[{n:"Fammi sentire", d:"+rete", run(){ chRete(1); chatAvvicina(p, 1); return "Domani ti mando."; }}]}
  ];
}

function chatContattoSala(p){
  const fonico = p.ruolo === "fonico";
  const r = (typeof POSTO_RUOLI === "object" && POSTO_RUOLI[p.ruolo]) || {k:"#94A3B8", n:"Contatto"};
  return {
    id: "sala:" + p.id,
    n: p.n,
    sotto: r.n,
    ic: fonico ? "cursori" : "manopole",
    k: r.k,
    sempre: true,
    spesso: .3,
    dallaSala: true,
    persona: p,
    spunti: fonico ? chatSpuntiFonico(p) : chatSpuntiBeatmaker(p),
    tu: chatTuSala(p, fonico)
  };
}

/* chi ti ha dato il numero ed è ancora in giro.

   Il mestiere si controlla **qui** e non solo sul bottone che lo chiede: sono
   due punti diversi, e se un domani il numero lo si potesse chiedere anche a
   un rapper, questo si ritroverebbe in chat con le battute di un beatmaker.
   Il filtro sta dove stanno i dati, non dove sta il bottone. */
const CHAT_MESTIERI = ["beatmaker", "fonico"];
function chatDaSala(){
  return (G.gente || [])
    .filter(x => x.numero && !x.via && CHAT_MESTIERI.indexOf(x.ruolo) >= 0)
    .map(chatContattoSala);
}

/* Appena vi scambiate il numero si fa vivo: una chat vuota è peggio che non
   averla, e questo è anche il modo di dire «ha funzionato». */
function chatPresentazione(p){
  const c = chatContattoSala(p);
  const t = chatTraccia(c.id);
  if(t.msgs.length) return;
  /* Come si presentano: senza aggettivi che diano un genere a chi parla. I nomi
     de La Sala sono un misto (Sara, Gigi, Andre, Nico...), e «quello del mixer»
     su Sara suona sbagliato — non e' un dettaglio da niente, e' il primo
     messaggio che leggi di quella persona. */
  chatBolla(t, "loro", p.ruolo === "fonico"
    ? "Sono " + p.n + ". Sto dietro al mixer: quando hai qualcosa da sistemare, scrivimi."
    : "Sono " + p.n + ". Se ti serve roba nuova scrivimi, non aspettare di passare in sala.");
  t.nonLetti = (t.nonLetti || 0) + 1;
}

/* ==================== CHI C'È ==================== */
function chatAttivi(){
  const m = chatMondo();
  return CHAT_GENTE.filter(c => c.sempre || (c.apri && c.apri(m))).concat(chatDaSala());
}
/* Un contatto per id, fisso o venuto da La Sala. Tutto quello che lo cerca
   deve passare di qui: `CHAT_GENTE.find()` da solo non vedrebbe le persone
   vere, e i loro bottoni non farebbero niente. */
function chatChi(id){
  return CHAT_GENTE.find(x => x.id === id) ||
    chatDaSala().find(x => x.id === id) || null;
}
function chatTraccia(id){
  if(!G.chat) G.chat = {};
  if(!G.chat[id]) G.chat[id] = {msgs:[], nonLetti:0, bloccatoFino:0, visti:[], aperto:null};
  const t = G.chat[id];
  if(!t.visti) t.visti = [];
  if(t.aperto === undefined) t.aperto = null;
  return t;
}
function chatNonLetti(){
  if(!G.chat) return 0;
  return chatAttivi().reduce((a, c) => a + ((G.chat[c.id] && G.chat[c.id].nonLetti) || 0), 0);
}

/* ==================== CHI SCRIVE, E COSA ====================
   Si guardano solo gli spunti che possono succedere adesso, saltando quelli
   già usati di recente: è questo che toglie il loop. Se sono finiti tutti si
   dimentica il più vecchio e si riparte, così la chat non ammutolisce mai. */
function chatSpunto(c, m){
  const t = chatTraccia(c.id);
  const buoni = (c.spunti || []).filter(s => !s.quando || s.quando(m));
  if(!buoni.length) return null;
  const ultimo = t.visti.length ? t.visti[t.visti.length - 1] : null;
  let liberi = buoni.filter(s => t.visti.indexOf(s.id) < 0);
  if(!liberi.length){
    /* Ha gia' detto tutto quello che poteva dire adesso. **Sta zitto**: e' la
       differenza fra una persona e un distributore di frasi. Solo dopo un po'
       di settimane si riparte, e comunque mai con la stessa cosa dell'ultima
       volta — che era esattamente il difetto da togliere. */
    if(m.sett - (t.ultimaSett || 0) < 6) return null;
    liberi = buoni.filter(s => s.id !== ultimo);
    if(!liberi.length) return null;
    t.visti = ultimo ? [ultimo] : [];
  }
  /* il peso: quello che sta succedendo adesso esce più spesso del contorno, se
     no del pezzo appena uscito non se ne accorge nessuno */
  const totale = liberi.reduce((a, s) => a + (s.peso || 1), 0);
  let n = Math.random() * totale;
  for(const s of liberi){ n -= (s.peso || 1); if(n <= 0) return s; }
  return liberi[liberi.length - 1];
}

function chatBolla(t, chi, testo){
  t.msgs.push({chi, testo, s: totalWeeks()});
  if(t.msgs.length > CHAT_TETTO) t.msgs = t.msgs.slice(-CHAT_TETTO);
}

function chatScrive(c, m){
  const t = chatTraccia(c.id);
  if(t.bloccatoFino > m.sett) return false;
  if(t.aperto) return false;                 /* aspetta una risposta: non accavalla */
  const s = chatSpunto(c, m);
  if(!s) return false;
  chatBolla(t, "loro", s.testo(m));
  t.visti.push(s.id);
  if(t.visti.length > CHAT_MEMORIA) t.visti = t.visti.slice(-CHAT_MEMORIA);
  t.aperto = { sp: s.id, via: [] };
  t.ultimaSett = m.sett;
  t.nonLetti = (t.nonLetti || 0) + 1;
  return true;
}

/* ==================== IL TEMPO CHE PASSA ====================
   Una volta a settimana ognuno può farsi vivo; in più c'è una possibilità al
   giorno, perché una chat che si muove solo al cambio di settimana si sente
   che è finta. */
function chatSettimana(){
  const m = chatMondo();
  for(const c of chatAttivi()) if(Math.random() < (c.spesso || .4)) chatScrive(c, m);
}
function chatGiorno(){
  const attivi = chatAttivi();
  if(!attivi.length) return;
  if(Math.random() < .28) chatScrive(pick(attivi), chatMondo());
}

/* ==================== RITROVARE LE OPZIONI ====================
   Nello stato c'è solo la strada (`{sp, via}`) e l'albero si ripercorre da qui:
   è il motivo per cui una conversazione a metà sopravvive al ricaricamento
   della pagina invece di lasciare dei bottoni che non fanno niente. */
function chatRadice(c, sp){
  if(sp && sp.indexOf("tu:") === 0){
    const a = (c.tu || [])[Number(sp.slice(3))];
    return a ? a.poi : null;
  }
  const s = (c.spunti || []).find(x => x.id === sp);
  return s ? s.opts : null;
}
function chatOpzioni(c, t){
  if(!t.aperto) return null;
  let opts = chatRadice(c, t.aperto.sp);
  for(const i of (t.aperto.via || [])){
    const o = opts && opts[i];
    if(!o || !o.poi) return null;
    opts = o.poi;
  }
  return (opts && opts.length) ? opts : null;
}

/* ==================== RISPONDERE ==================== */
function chatDici(t, esito){
  for(const r of [].concat(esito || [])) if(r) chatBolla(t, "loro", r);
}
function chatRispondi(contactId, idx){
  const c = chatChi(contactId);
  if(!c) return;
  const t = chatTraccia(contactId);
  const opts = chatOpzioni(c, t);
  const o = opts && opts[idx];
  if(!o) return;

  chatBolla(t, "io", o.n);
  chatDici(t, o.run ? o.run(chatMondo()) : null);
  if(o.blocca) t.bloccatoFino = totalWeeks() + o.blocca;

  if(o.poi && o.poi.length) t.aperto = { sp: t.aperto.sp, via: (t.aperto.via || []).concat([idx]) };
  else t.aperto = null;

  save(); renderTelefono(); renderGioco();
}

/* ==================== SCRIVERE PER PRIMI ====================
   È la cosa che più di tutte fa sembrare una chat una chat: non aspetti che
   qualcuno si faccia vivo, apri tu. */
function chatMieAperture(c, m){
  return (c.tu || []).filter(a => !a.quando || a.quando(m));
}
function chatIniziaTu(contactId, idx){
  const c = chatChi(contactId);
  if(!c || !c.tu) return;
  const t = chatTraccia(contactId);
  if(t.aperto) return;
  const m = chatMondo();
  const a = chatMieAperture(c, m)[idx];
  if(!a) return;
  const vero = c.tu.indexOf(a);          /* l'indice nell'elenco intero, non in quello filtrato */

  chatBolla(t, "io", a.n);
  chatDici(t, a.run ? a.run(m) : null);
  t.aperto = (a.poi && a.poi.length) ? { sp: "tu:" + vero, via: [] } : null;
  save(); renderTelefono(); renderGioco();
}

/* ==================== LE SCHERMATE (dentro al telefono, telefono.js) ==================== */
let TEL_CHAT_APERTA = null;

function schermataChat(){
  const attivi = chatAttivi();
  if(!attivi.length)
    return '<div class="tempty">Non ti scrive ancora nessuno. Fatti notare con la musica, e qualcuno si fa sotto.</div>';
  return '<div class="tlist">' + attivi.map(c => {
    const t = chatTraccia(c.id);
    const ultimo = t.msgs.length ? t.msgs[t.msgs.length - 1] : null;
    const anteprima = ultimo
      ? (ultimo.chi === "io" ? "Tu: " : "") + spoglia(ultimo.testo)
      : "Tocca per scrivere";
    return '<button class="tli" data-chat="' + c.id + '">' +
      '<span class="tliav" style="--k:' + c.k + '">' + hsvg(c.ic) + '</span>' +
      '<span class="tlitx"><b>' + c.n +
        (c.sotto ? ' <em class="tliruolo">' + c.sotto + '</em>' : '') +
        '</b><i>' + tronca(anteprima, 44) + '</i></span>' +
      (t.nonLetti ? '<span class="tbadge2">' + t.nonLetti + '</span>' : '') +
      '</button>';
  }).join("") + '</div>';
}

function schermataChatThread(){
  const c = chatChi(TEL_CHAT_APERTA);
  if(!c) return schermataChat();
  const m = chatMondo();
  const t = chatTraccia(c.id);
  t.nonLetti = 0;

  const bolle = t.msgs.length
    ? t.msgs.map(x => '<div class="tbolla ' + (x.chi === "io" ? "io" : "loro") + '">' + x.testo + '</div>').join("")
    : '<div class="tempty">Ancora niente con ' + c.n + '. Comincia tu.</div>';

  let sotto;
  if(t.bloccatoFino > totalWeeks()){
    const quante = t.bloccatoFino - totalWeeks();
    sotto = '<p class="tchatstop">L’hai bloccato. Torna a scrivere fra ' +
      quante + (quante === 1 ? " settimana." : " settimane.") + '</p>';
  } else {
    const opts = chatOpzioni(c, t);
    if(opts){
      sotto = opts.map((o, i) => '<button class="tbtn" data-chatopt="' + i + '">' + o.n +
        (o.d ? ' <small>(' + o.d + ')</small>' : '') + '</button>').join("");
    } else {
      const mie = chatMieAperture(c, m);
      sotto = mie.length
        ? '<p class="tchattu">Scrivi tu</p>' + mie.map((a, i) =>
            '<button class="tbtn" data-chattu="' + i + '">' + a.n +
            (a.d ? ' <small>(' + a.d + ')</small>' : '') + '</button>').join("")
        : '<p class="tchatstop">Per ora non c’è niente da dirsi. Torna quando succede qualcosa.</p>';
    }
  }
  return '<button class="tback2" data-chathome="1">‹ Chat</button>' +
    '<div class="tchat">' + bolle + '</div><div class="tchatopts">' + sotto + '</div>';
}
