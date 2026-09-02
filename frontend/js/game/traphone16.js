/* TRAPHONE 16 — linea criminale separata dal telefono principale. */
"use strict";
(function(){
  const $=s=>document.querySelector(s);
  const wrap=$("#trapWrap"), dock=$("#traphoneDock"), view=$("#trapView"), screen=$("#trapScreen");
  const softL=$("#trapSoftL"), softR=$("#trapSoftR"), badge=$("#trapBadge");
  const toast=$("#trapToast");

  const callPop=document.createElement("div");
  callPop.id="trapCallPopout";
  callPop.className="trap-call-popout";
  callPop.setAttribute("aria-live","polite");
  (document.getElementById("strada")||document.body).appendChild(callPop);

  function positionCallPop(){
    if(!callPop.classList.contains("on")) return;
    const r=wrap.getBoundingClientRect();
    const w=callPop.offsetWidth||320;
    const h=callPop.offsetHeight||220;
    const gap=18;

    let left=r.left-w-gap;
    if(left<10) left=Math.min(window.innerWidth-w-10,r.right+gap);

    let top=r.top+78;
    if(top+h>window.innerHeight-10) top=Math.max(10,window.innerHeight-h-10);

    callPop.style.left=Math.round(left)+"px";
    callPop.style.top=Math.round(top)+"px";
  }

  function hideCallPop(){
    callPop.classList.remove("on");
    callPop.innerHTML="";
  }

  function renderCallPop(){
    if(!PHONE.call || !["callActive","callOptions"].includes(PHONE.mode)){
      hideCallPop();
      return;
    }

    const opts=(PHONE.call.options||[]).map((o,i)=>
      '<button class="tcp-option '+(PHONE.mode==="callOptions"&&PHONE.menu===i?"sel":"")+'" data-callopt="'+i+'" type="button">'+
      '<kbd>'+(i+1)+'</kbd>'+o+'</button>'
    ).join("");

    callPop.innerHTML=
      '<div class="tcp-head">'+
        '<div class="tcp-name"><span>CHIAMATA IN CORSO</span><b>'+PHONE.call.from+'</b></div>'+
        '<div class="tcp-time">'+fmtCallTime()+'</div>'+
      '</div>'+
      '<div class="tcp-text">'+PHONE.call.speech+'</div>'+
      (opts ? '<div class="tcp-hint">Usa 1 / 2 / 3 oppure scegli qui</div><div class="tcp-options">'+opts+'</div>' : '');

    callPop.classList.add("on");
    callPop.querySelectorAll("[data-callopt]").forEach(btn=>{
      btn.onclick=()=>{
        PHONE.menu=Number(btn.dataset.callopt);
        PHONE.mode="callOptions";
        render();
        enter();
      };
    });
    positionCallPop();
    requestAnimationFrame(positionCallPop);
  }

  window.addEventListener("resize",positionCallPop);
  window.addEventListener("scroll",positionCallPop,true);

  if(!wrap || !dock || !view || !screen) return;


  const TRAP_SMS_POOL=[{"id":"sms-001-1","cat":"early","from":"SCONOSCIUTO","text":"Garage est. Pacco pronto. 280 se sparisce da lì entro mezzanotte.","replies":["CI SONO.","ALZA A 350.","PASSO."],"tags":["deal","street"],"job":"consegne","minRep":0,"maxRep":45,"heatMin":0,"heatMax":999,"city":null,"priority":"low","requires":[],"family":"sms-001","voice":"unknown"},{"id":"sms-001-2","cat":"early","from":"SCONOSCIUTO","text":"C'è una busta da spostare. Una tratta sola, 280. Il resto non ti serve saperlo.","replies":["OK, CI STO.","ALZA A 350.","NON FA PER ME."],"tags":["deal","street"],"job":"consegne","minRep":0,"maxRep":45,"heatMin":0,"heatMax":999,"city":null,"priority":"low","requires":[],"family":"sms-001","voice":"unknown"},{"id":"sms-003-1","cat":"early","from":"RICO","text":"Senti: il bar chiude tardi. Dietro resta scoperto per poco. Se vuoi farlo, è stasera.","replies":["CI SONO.","QUANTO C'È?","NON STASERA."],"tags":["heist","street"],"job":"cassa","minRep":0,"maxRep":45,"heatMin":0,"heatMax":999,"city":null,"priority":"low","requires":[],"family":"sms-003","voice":"rico"},{"id":"sms-003-2","cat":"early","from":"RICO","text":"Il bar abbassa la serranda e per qualche minuto dietro non guarda nessuno. Poi basta.","replies":["OK, CI STO.","QUANTO C'È?","NON STASERA."],"tags":["heist","street"],"job":"cassa","minRep":0,"maxRep":45,"heatMin":0,"heatMax":999,"city":null,"priority":"low","requires":[],"family":"sms-003","voice":"rico"},{"id":"sms-005-1","cat":"early","from":"SCONOSCIUTO","text":"Da ora questo numero è per il giro. Non richiamare. Se scrivo, rispondi qui.","replies":["RICEVUTO.","CHI SEI?","NON MI INTERESSA."],"tags":["danger","crew"],"job":null,"minRep":0,"maxRep":45,"heatMin":0,"heatMax":999,"city":null,"priority":"low","requires":[],"family":"sms-005","voice":"unknown"},{"id":"sms-005-2","cat":"early","from":"SCONOSCIUTO","text":"Questo numero è solo per il giro. Se squilla, rispondi. Tu non chiamare.","replies":["CAPITO.","CHI SEI?","NON FA PER ME."],"tags":["danger","crew"],"job":null,"minRep":0,"maxRep":45,"heatMin":0,"heatMax":999,"city":null,"priority":"low","requires":[],"family":"sms-005","voice":"unknown"},{"id":"sms-007-1","cat":"early","from":"RICO","text":"C'è una borsa da spostare. Non aprirla. Se la prendi, ti mando il posto.","replies":["MANDAMI IL POSTO.","QUANTO PAGA?","NO."],"tags":["deal","danger"],"job":"scotta","minRep":0,"maxRep":45,"heatMin":0,"heatMax":999,"city":null,"priority":"low","requires":[],"family":"sms-007","voice":"rico"},{"id":"sms-007-2","cat":"early","from":"RICO","text":"Una borsa è diventata troppo calda per chi ce l'ha. Serve qualcuno che la muova adesso.","replies":["MANDAMI IL POSTO.","QUANTO PAGA?","LASCIA."],"tags":["deal","danger"],"job":"scotta","minRep":0,"maxRep":45,"heatMin":0,"heatMax":999,"city":null,"priority":"low","requires":[],"family":"sms-007","voice":"rico"},{"id":"sms-009-1","cat":"early","from":"SCONOSCIUTO","text":"La grigia è pronta dietro la stazione. 900 se torna senza problemi.","replies":["LA PRENDO.","VOGLIO 1.100.","TROVA UN ALTRO."],"tags":["car","street"],"job":"macchina","minRep":0,"maxRep":45,"heatMin":0,"heatMax":999,"city":null,"priority":"low","requires":[],"family":"sms-009","voice":"unknown"},{"id":"sms-009-2","cat":"early","from":"SCONOSCIUTO","text":"C'è una nera al parcheggio nord. Non è tua e non deve sembrarlo. 900.","replies":["LA PRENDO.","VOGLIO 1.100.","TROVA UN ALTRO."],"tags":["car","street"],"job":"macchina","minRep":0,"maxRep":45,"heatMin":0,"heatMax":999,"city":null,"priority":"low","requires":[],"family":"sms-009","voice":"unknown"},{"id":"sms-011-1","cat":"early","from":"RICO","text":"Il tuo nome ha iniziato a girare. Piano, ma gira. Per ora ascolta e basta.","replies":["CHI PARLA?","CHE DICONO?","NON MI INTERESSA."],"tags":["rep","street"],"job":null,"minRep":0,"maxRep":45,"heatMin":0,"heatMax":999,"city":null,"priority":"low","requires":[],"family":"sms-011","voice":"rico"},{"id":"sms-011-2","cat":"early","from":"RICO","text":"Uno ha chiesto se lavori da solo. Non ho risposto. Il fatto che chiedano è già qualcosa.","replies":["CHI PARLA?","CHE DICONO?","NON FA PER ME."],"tags":["rep","street"],"job":null,"minRep":0,"maxRep":45,"heatMin":0,"heatMax":999,"city":null,"priority":"low","requires":[],"family":"sms-011","voice":"rico"},{"id":"sms-013-1","cat":"early","from":"SCONOSCIUTO","text":"Se ti fermano, questo telefono diventa un mattone. Chiaro?","replies":["RICEVUTO.","PERCHÉ?","CI PENSO."],"tags":["police","danger"],"job":null,"minRep":0,"maxRep":45,"heatMin":0,"heatMax":999,"city":null,"priority":"low","requires":[],"family":"sms-013","voice":"unknown"},{"id":"sms-013-2","cat":"early","from":"SCONOSCIUTO","text":"Controlli in giro. Tieni il TRAPHONE spento finché non sei fuori.","replies":["CAPITO.","CHE SUCCEDE?","CI PENSO."],"tags":["police","danger"],"job":null,"minRep":0,"maxRep":45,"heatMin":0,"heatMax":999,"city":null,"priority":"low","requires":[],"family":"sms-013","voice":"unknown"},{"id":"sms-015-1","cat":"early","from":"RICO","text":"Conosco uno che potrebbe servirti. Prima però vuole capire che tipo sei.","replies":["PORTAMELO.","CHI È?","NON MI SERVE."],"tags":["crew","rep"],"job":null,"minRep":0,"maxRep":45,"heatMin":0,"heatMax":999,"city":null,"priority":"low","requires":[],"family":"sms-015","voice":"rico"},{"id":"sms-015-2","cat":"early","from":"RICO","text":"Ho uno che guida, aspetta e non fa domande. Vuole sapere se sei serio.","replies":["FAMMELO VEDERE.","DIMMI CHI È.","NON MI SERVE ORA."],"tags":["crew","rep"],"job":null,"minRep":0,"maxRep":45,"heatMin":0,"heatMax":999,"city":null,"priority":"low","requires":[],"family":"sms-015","voice":"rico"},{"id":"sms-017-1","cat":"early","from":"SCONOSCIUTO","text":"Due fermate, una consegna, 420. Non è il solito lavoretto.","replies":["CI SONO.","VOGLIO 500.","PASSO."],"tags":["deal","street"],"job":"scotta","minRep":0,"maxRep":45,"heatMin":0,"heatMax":999,"city":null,"priority":"low","requires":[],"family":"sms-017","voice":"unknown"},{"id":"sms-017-2","cat":"early","from":"SCONOSCIUTO","text":"C'è una consegna più pesante del solito. 420. Se vuoi dettagli, rispondi.","replies":["OK, CI STO.","VOGLIO 500.","NON FA PER ME."],"tags":["deal","street"],"job":"scotta","minRep":0,"maxRep":45,"heatMin":0,"heatMax":999,"city":null,"priority":"low","requires":[],"family":"sms-017","voice":"unknown"},{"id":"sms-019-1","cat":"early","from":"RICO","text":"Stasera c'è aria tranquilla. Se hai qualcosa da fare, è una buona notte.","replies":["CHE HAI?","QUANTO PAGA?","STO FERMO."],"tags":["street","heist"],"job":null,"minRep":0,"maxRep":45,"heatMin":0,"heatMax":999,"city":null,"priority":"low","requires":[],"family":"sms-019","voice":"rico"},{"id":"sms-019-2","cat":"early","from":"RICO","text":"Quartiere calmo, poche facce in giro. Rico dice che può esserci un'occasione.","replies":["CHE HAI?","QUANTO PAGA?","STO FERMO."],"tags":["street","heist"],"job":null,"minRep":0,"maxRep":45,"heatMin":0,"heatMax":999,"city":null,"priority":"low","requires":[],"family":"sms-019","voice":"rico"},{"id":"sms-021-1","cat":"heat","from":"M.","text":"Due volanti sono ripassate troppe volte. Stasera niente rumore finché non ti richiamo.","replies":["ASPETTO.","CHE HAI VISTO?","ME LA RISCHIO."],"tags":["heat","police"],"job":null,"minRep":0,"maxRep":999,"heatMin":40,"heatMax":999,"city":null,"priority":"medium","requires":[],"family":"sms-021","voice":"m"},{"id":"sms-021-2","cat":"heat","from":"M.","text":"La stessa pattuglia continua a tornare. Basta per oggi. Fermo tutto.","replies":["RESTO FERMO.","CHE HAI VISTO?","ME LA RISCHIO."],"tags":["heat","police"],"job":null,"minRep":0,"maxRep":999,"heatMin":40,"heatMax":999,"city":null,"priority":"medium","requires":[],"family":"sms-021","voice":"m"},{"id":"sms-023-1","cat":"heat","from":"RICO","text":"Hanno fermato uno dei ragazzi. Non sa tutto, ma sa abbastanza da farmi stare male.","replies":["CHI?","CHE HA DETTO?","TAGLIA I CONTATTI."],"tags":["heat","crew"],"job":null,"minRep":0,"maxRep":999,"heatMin":60,"heatMax":999,"city":null,"priority":"medium","requires":[],"family":"sms-023","voice":"rico"},{"id":"sms-023-2","cat":"heat","from":"RICO","text":"Uno dei nostri è ancora fuori contatto dopo un controllo. Finché non torna, prudenza.","replies":["DIMMI CHI.","CHE HA DETTO?","TAGLIA I CONTATTI."],"tags":["heat","crew"],"job":null,"minRep":0,"maxRep":999,"heatMin":60,"heatMax":999,"city":null,"priority":"medium","requires":[],"family":"sms-023","voice":"rico"},{"id":"sms-025-1","cat":"heat","from":"SCONOSCIUTO","text":"Lascia la macchina vuota e noiosa. Oggi non deve raccontare niente di te.","replies":["OK.","PERCHÉ?","È GIÀ VUOTA."],"tags":["heat","police"],"job":null,"minRep":0,"maxRep":999,"heatMin":50,"heatMax":999,"city":null,"priority":"medium","requires":[],"family":"sms-025","voice":"unknown"},{"id":"sms-025-2","cat":"heat","from":"SCONOSCIUTO","text":"La macchina deve sembrare di uno che non ha niente da nascondere. Fine.","replies":["VA BENE.","CHE SUCCEDE?","È GIÀ VUOTA."],"tags":["heat","police"],"job":null,"minRep":0,"maxRep":999,"heatMin":50,"heatMax":999,"city":null,"priority":"medium","requires":[],"family":"sms-025","voice":"unknown"},{"id":"sms-027-1","cat":"heat","from":"M.","text":"Stasera esci leggero. Non trasformare un controllo in qualcosa di peggio.","replies":["OK.","MI SERVE.","NON ESCO."],"tags":["gun","heat"],"job":null,"minRep":0,"maxRep":999,"heatMin":55,"heatMax":999,"city":null,"priority":"medium","requires":[],"family":"sms-027","voice":"m"},{"id":"sms-027-2","cat":"heat","from":"M.","text":"Se devi uscire, esci leggero. Un ferro trasforma un controllo in un problema grosso.","replies":["VA BENE.","MI SERVE.","NON ESCO."],"tags":["gun","heat"],"job":null,"minRep":0,"maxRep":999,"heatMin":55,"heatMax":999,"city":null,"priority":"medium","requires":[],"family":"sms-027","voice":"m"},{"id":"sms-029-1","cat":"heat","from":"RICO","text":"Uno in divisa ha fatto domande sul garage. Io per oggi non ci metterei piede.","replies":["CHI ERA?","SVUOTALO.","ASPETTO."],"tags":["police","garage"],"job":null,"minRep":0,"maxRep":999,"heatMin":60,"heatMax":999,"city":null,"priority":"medium","requires":[],"family":"sms-029","voice":"rico"},{"id":"sms-029-2","cat":"heat","from":"RICO","text":"Un poliziotto ha guardato il garage più di quanto servisse. Io non ci tornerei.","replies":["CHI ERA?","SVUOTALO.","RESTO FERMO."],"tags":["police","garage"],"job":null,"minRep":0,"maxRep":999,"heatMin":60,"heatMax":999,"city":null,"priority":"medium","requires":[],"family":"sms-029","voice":"rico"},{"id":"sms-031-1","cat":"heat","from":"M.","text":"Per qualche giorno il contante resta fermo. Non voglio numeri strani adesso.","replies":["RICEVUTO.","PERCHÉ?","DEVO FARLO."],"tags":["heat","dirty","launder"],"job":null,"minRep":0,"maxRep":999,"heatMin":55,"heatMax":999,"city":null,"priority":"medium","requires":[],"family":"sms-031","voice":"m"},{"id":"sms-031-2","cat":"heat","from":"M.","text":"Non far girare contante per qualche giorno. Stanno guardando i numeri più delle facce.","replies":["CAPITO.","CHE SUCCEDE?","DEVO FARLO."],"tags":["heat","dirty","launder"],"job":null,"minRep":0,"maxRep":999,"heatMin":55,"heatMax":999,"city":null,"priority":"medium","requires":[],"family":"sms-031","voice":"m"},{"id":"sms-033-1","cat":"business","from":"RICO","text":"L'autolavaggio questa settimana regge qualcosa in più. Poco, però.","replies":["QUANTO?","OK.","LASCIA STARE."],"tags":["business","launder","carwash"],"job":null,"minRep":20,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["business"],"family":"sms-033","voice":"rico"},{"id":"sms-033-2","cat":"business","from":"RICO","text":"Questa settimana l'autolavaggio ha mosso abbastanza da coprire una cifra piccola.","replies":["CHE CIFRA?","VA BENE.","LASCIA STARE."],"tags":["business","launder","carwash"],"job":null,"minRep":20,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["business"],"family":"sms-033","voice":"rico"},{"id":"sms-035-1","cat":"business","from":"M.","text":"Hai troppo contante fermo. Muovine una parte con calma, il resto aspetta.","replies":["ME NE OCCUPO.","QUANTA?","ASPETTO."],"tags":["dirty","launder","business"],"job":null,"minRep":20,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["business"],"family":"sms-035","voice":"m"},{"id":"sms-035-2","cat":"business","from":"M.","text":"Il contante fermo inizia a pesare. Muovine una parte, non tutto.","replies":["ME NE OCCUPO.","QUANTA?","RESTO FERMO."],"tags":["dirty","launder","business"],"job":null,"minRep":20,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["business"],"family":"sms-035","voice":"m"},{"id":"sms-037-1","cat":"business","from":"SCONOSCIUTO","text":"C'è uno che prende contante difficile e lo restituisce più leggero. Ma pulito.","replies":["FAMMI IL NOME.","QUANTO PERDO?","NO."],"tags":["dirty","cash"],"job":null,"minRep":20,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["business"],"family":"sms-037","voice":"unknown"},{"id":"sms-037-2","cat":"business","from":"SCONOSCIUTO","text":"Conosco uno che prende cifre grosse e restituisce meno, ma pulito.","replies":["FAMMI IL NOME.","QUANTO PERDO?","LASCIA."],"tags":["dirty","cash"],"job":null,"minRep":20,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["business"],"family":"sms-037","voice":"unknown"},{"id":"sms-039-1","cat":"business","from":"RICO","text":"Il minimarket sta girando bene. Se devi far passare qualcosa, questa è la settimana.","replies":["QUANTO?","VAI.","NON ORA."],"tags":["business","launder"],"job":null,"minRep":20,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["business"],"family":"sms-039","voice":"rico"},{"id":"sms-039-2","cat":"business","from":"RICO","text":"Il minimarket ha una settimana buona. Se devi far passare qualcosa, fallo adesso.","replies":["CHE CIFRA?","VAI.","NON ADESSO."],"tags":["business","launder"],"job":null,"minRep":20,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["business"],"family":"sms-039","voice":"rico"},{"id":"sms-041-1","cat":"business","from":"M.","text":"I conti devono annoiare chi li guarda. I tuoi stanno iniziando a essere interessanti.","replies":["RICEVUTO.","CHE CAMBIO?","CI PENSA IL COMMERCIALISTA."],"tags":["business","launder"],"job":null,"minRep":20,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["business"],"family":"sms-041","voice":"m"},{"id":"sms-041-2","cat":"business","from":"M.","text":"Un'attività normale non deve mai sembrare improvvisamente brillante. Raffredda i numeri.","replies":["CAPITO.","CHE CAMBIO?","CI PENSA IL COMMERCIALISTA."],"tags":["business","launder"],"job":null,"minRep":20,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["business"],"family":"sms-041","voice":"m"},{"id":"sms-043-1","cat":"business","from":"SCONOSCIUTO","text":"C'è uno che vuole entrare in un'attività con contanti veri. Non mi convince ancora.","replies":["CHI È?","FAMMI INCONTRARE.","NO."],"tags":["business","deal","danger"],"job":null,"minRep":20,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["business"],"family":"sms-043","voice":"unknown"},{"id":"sms-043-2","cat":"business","from":"SCONOSCIUTO","text":"C'è un compratore che porta contanti e poche spiegazioni. Non so ancora se mi piace.","replies":["DIMMI CHI È.","FAMMI INCONTRARE.","LASCIA."],"tags":["business","deal","danger"],"job":null,"minRep":20,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["business"],"family":"sms-043","voice":"unknown"},{"id":"sms-045-1","cat":"crew","from":"M.","text":"Uno dei tuoi arriva tardi e fa domande dopo. Prima o poi scegli cosa significa.","replies":["LO CONTROLLO.","CHI?","TAGLIALO FUORI."],"tags":["crew","protection"],"job":null,"minRep":28,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["crew"],"family":"sms-045","voice":"m"},{"id":"sms-045-2","cat":"crew","from":"M.","text":"Hai uno che ascolta molto e riferisce poco. Tienilo d'occhio.","replies":["LO CONTROLLO.","DIMMI CHI.","TAGLIALO FUORI."],"tags":["crew","protection"],"job":null,"minRep":28,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["crew"],"family":"sms-045","voice":"m"},{"id":"sms-047-1","cat":"crew","from":"RICO","text":"Ho un ragazzo affidabile. Costa più degli altri perché parla molto meno.","replies":["PORTAMELO.","QUANTO VUOLE?","NON MI SERVE."],"tags":["crew"],"job":null,"minRep":28,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["crew"],"family":"sms-047","voice":"rico"},{"id":"sms-047-2","cat":"crew","from":"RICO","text":"Ho uno che guida bene, aspetta ore e non chiede perché. Costa, ma serve.","replies":["FAMMELO VEDERE.","QUANTO VUOLE?","NON MI SERVE ORA."],"tags":["crew"],"job":null,"minRep":28,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["crew"],"family":"sms-047","voice":"rico"},{"id":"sms-049-1","cat":"crew","from":"SCONOSCIUTO","text":"Qualcuno sta chiedendo chi ti copre. Non è una domanda che mi piace sentire.","replies":["CHI?","SCOPRILO.","LASCIA PERDERE."],"tags":["protection","danger"],"job":null,"minRep":28,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["crew"],"family":"sms-049","voice":"unknown"},{"id":"sms-049-2","cat":"crew","from":"SCONOSCIUTO","text":"Uno sta facendo domande sulla tua protezione. Le domande giuste, alla persona sbagliata.","replies":["DIMMI CHI.","SCOPRILO.","LASCIA PERDERE."],"tags":["protection","danger"],"job":null,"minRep":28,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["crew"],"family":"sms-049","voice":"unknown"},{"id":"sms-051-1","cat":"crew","from":"RICO","text":"Uno dei ragazzi ha fatto casino davanti al posto. Troppa scena per niente.","replies":["PARLACI.","MANDALO VIA.","NON È UN PROBLEMA."],"tags":["crew","heat"],"job":null,"minRep":28,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["crew"],"family":"sms-051","voice":"rico"},{"id":"sms-051-2","cat":"crew","from":"RICO","text":"Uno dei tuoi ha trasformato una discussione in uno spettacolo. Devi decidere cosa farne.","replies":["PARLACI.","MANDALO VIA.","NON È UN PROBLEMA."],"tags":["crew","heat"],"job":null,"minRep":28,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["crew"],"family":"sms-051","voice":"rico"},{"id":"sms-053-1","cat":"crew","from":"M.","text":"Da oggi agli incontri entra solo chi è stato chiamato. Nessuna eccezione.","replies":["OK.","NEMMENO RICO?","DECIDO IO."],"tags":["crew","organization"],"job":null,"minRep":28,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["crew"],"family":"sms-053","voice":"m"},{"id":"sms-053-2","cat":"crew","from":"M.","text":"Più sali, meno persone devono sapere dove sei. Niente ospiti non invitati.","replies":["VA BENE.","NEMMENO RICO?","DECIDO IO."],"tags":["crew","organization"],"job":null,"minRep":28,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["crew"],"family":"sms-053","voice":"m"},{"id":"sms-055-1","cat":"crew","from":"SCONOSCIUTO","text":"Uno dei tuoi deve soldi alla gente sbagliata. Prima o poi il conto arriva anche a te.","replies":["CHI?","PAGALI.","MANDALO VIA."],"tags":["crew","danger"],"job":null,"minRep":28,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["crew"],"family":"sms-055","voice":"unknown"},{"id":"sms-055-2","cat":"crew","from":"SCONOSCIUTO","text":"C'è un uomo nella tua gente che deve soldi a persone che non mi piacciono.","replies":["DIMMI CHI.","PAGALI.","MANDALO VIA."],"tags":["crew","danger"],"job":null,"minRep":28,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["crew"],"family":"sms-055","voice":"unknown"},{"id":"sms-057-1","cat":"milan","from":"M.","text":"Domani servono due auto e gente che sappia stare zitta. Se ci sei, dimmelo adesso.","replies":["CI SONO.","QUANTO PAGA?","PASSO."],"tags":["organization","crew","heist"],"job":null,"minRep":45,"maxRep":999,"heatMin":0,"heatMax":999,"city":"milano","priority":"medium","requires":[],"family":"sms-057","voice":"m"},{"id":"sms-057-2","cat":"milan","from":"M.","text":"Domani c'è un lavoro dove contano più la disciplina che i soldi. Due auto, tre uomini.","replies":["OK, CI STO.","QUANTO PAGA?","NON FA PER ME."],"tags":["organization","crew","heist"],"job":null,"minRep":45,"maxRep":999,"heatMin":0,"heatMax":999,"city":"milano","priority":"medium","requires":[],"family":"sms-057","voice":"m"},{"id":"sms-059-1","cat":"milan","from":"RICO","text":"C'è un tavolo nei locali dove non basta pagare per sedersi. Posso farti arrivare alla porta.","replies":["PORTAMI DENTRO.","CHI C'È?","NON MI FIDO."],"tags":["nightclub","organization"],"job":null,"minRep":45,"maxRep":999,"heatMin":0,"heatMax":999,"city":"milano","priority":"medium","requires":[],"family":"sms-059","voice":"rico"},{"id":"sms-059-2","cat":"milan","from":"RICO","text":"C'è un tavolo a cui non compri il posto. Devi essere presentato.","replies":["PORTAMI DENTRO.","CHI C'È?","NON MI FIDO."],"tags":["nightclub","organization"],"job":null,"minRep":45,"maxRep":999,"heatMin":0,"heatMax":999,"city":"milano","priority":"medium","requires":[],"family":"sms-059","voice":"rico"},{"id":"sms-061-1","cat":"milan","from":"SCONOSCIUTO","text":"A Milano non interessa cosa racconti di te. Guardano chi ti saluta quando entri.","replies":["RICEVUTO.","CHI MI APRE?","NON MI INTERESSA."],"tags":["milan","rep"],"job":null,"minRep":45,"maxRep":999,"heatMin":0,"heatMax":999,"city":"milano","priority":"medium","requires":[],"family":"sms-061","voice":"unknown"},{"id":"sms-061-2","cat":"milan","from":"SCONOSCIUTO","text":"Qui nessuno vuole sentire il tuo curriculum. Conta chi ti fa entrare.","replies":["CAPITO.","CHI MI APRE?","NON FA PER ME."],"tags":["milan","rep"],"job":null,"minRep":45,"maxRep":999,"heatMin":0,"heatMax":999,"city":"milano","priority":"medium","requires":[],"family":"sms-061","voice":"unknown"},{"id":"sms-063-1","cat":"milan","from":"M.","text":"Domani ascolta. Se vogliono sapere qualcosa, saranno loro a chiedertelo.","replies":["OK.","CHI CI SARÀ?","PARLO SE SERVE."],"tags":["meeting","organization"],"job":null,"minRep":45,"maxRep":999,"heatMin":0,"heatMax":999,"city":"milano","priority":"medium","requires":[],"family":"sms-063","voice":"m"},{"id":"sms-063-2","cat":"milan","from":"M.","text":"Domani ascolti più di quanto parli. Se vogliono sapere qualcosa, te lo chiedono.","replies":["VA BENE.","CHI CI SARÀ?","PARLO SE SERVE."],"tags":["meeting","organization"],"job":null,"minRep":45,"maxRep":999,"heatMin":0,"heatMax":999,"city":"milano","priority":"medium","requires":[],"family":"sms-063","voice":"m"},{"id":"sms-065-1","cat":"milan","from":"SCONOSCIUTO","text":"È uscita un'informazione su una gioielleria. Vale pochi giorni e costa.","replies":["DIMMI DI PIÙ.","QUANTO VUOI?","NO."],"tags":["heist","organization"],"job":null,"minRep":45,"maxRep":999,"heatMin":0,"heatMax":999,"city":"milano","priority":"medium","requires":[],"family":"sms-065","voice":"unknown"},{"id":"sms-065-2","cat":"milan","from":"SCONOSCIUTO","text":"Una vetrina importante cambia turno di sicurezza. La finestra dura un weekend.","replies":["DIMMI DI PIÙ.","QUANTO VUOI?","LASCIA."],"tags":["heist","organization"],"job":null,"minRep":45,"maxRep":999,"heatMin":0,"heatMax":999,"city":"milano","priority":"medium","requires":[],"family":"sms-065","voice":"unknown"},{"id":"sms-067-1","cat":"milan","from":"RICO","text":"Ho accesso a un garage migliore. Macchine migliori, gente meno curiosa.","replies":["DOVE?","QUANTO?","PASSO."],"tags":["car","organization"],"job":null,"minRep":45,"maxRep":999,"heatMin":0,"heatMax":999,"city":"milano","priority":"medium","requires":[],"family":"sms-067","voice":"rico"},{"id":"sms-067-2","cat":"milan","from":"RICO","text":"Ho accesso a un garage dove le auto non fanno domande. Tu devi fare lo stesso.","replies":["DOVE?","CHE CIFRA?","NON FA PER ME."],"tags":["car","organization"],"job":null,"minRep":45,"maxRep":999,"heatMin":0,"heatMax":999,"city":"milano","priority":"medium","requires":[],"family":"sms-067","voice":"rico"},{"id":"sms-069-1","cat":"la","from":"M.","text":"Domani sulle colline. Poche persone, niente accompagnatori improvvisati.","replies":["CI SONO.","CHI C'È?","NON ORA."],"tags":["villa","meeting","boss"],"job":null,"minRep":65,"maxRep":999,"heatMin":0,"heatMax":999,"city":"los","priority":"medium","requires":[],"family":"sms-069","voice":"m"},{"id":"sms-069-2","cat":"la","from":"M.","text":"Domani sera sulle colline. Pochi posti, nessun accompagnatore non autorizzato.","replies":["OK, CI STO.","CHI C'È?","NON ADESSO."],"tags":["villa","meeting","boss"],"job":null,"minRep":65,"maxRep":999,"heatMin":0,"heatMax":999,"city":"los","priority":"medium","requires":[],"family":"sms-069","voice":"m"},{"id":"sms-071-1","cat":"la","from":"SCONOSCIUTO","text":"C'è movimento al porto prima dell'alba. Se vuoi sapere perché, rispondi.","replies":["MANDAMI IL PUNTO.","QUANTO GIRA?","PASSO."],"tags":["port","organization"],"job":null,"minRep":65,"maxRep":999,"heatMin":0,"heatMax":999,"city":"los","priority":"medium","requires":[],"family":"sms-071","voice":"unknown"},{"id":"sms-071-2","cat":"la","from":"SCONOSCIUTO","text":"C'è una finestra al porto prima dell'alba. Dopo venti minuti non esiste più.","replies":["MANDAMI IL PUNTO.","QUANTO GIRA?","NON FA PER ME."],"tags":["port","organization"],"job":null,"minRep":65,"maxRep":999,"heatMin":0,"heatMax":999,"city":"los","priority":"medium","requires":[],"family":"sms-071","voice":"unknown"},{"id":"sms-073-1","cat":"la","from":"RICO","text":"Adesso non ti chiamano solo per fare un lavoro. Qualcuno vuole sapere chi manderesti.","replies":["HO CAPITO.","CHI PROPONE?","NON MI RIGUARDA."],"tags":["boss","crew"],"job":null,"minRep":65,"maxRep":999,"heatMin":0,"heatMax":999,"city":"los","priority":"medium","requires":[],"family":"sms-073","voice":"rico"},{"id":"sms-073-2","cat":"la","from":"RICO","text":"Sei arrivato al punto in cui qualcuno ti chiede chi mandare, non se vuoi andare tu.","replies":["HO CAPITO.","CHI PROPONE?","NON MI RIGUARDA."],"tags":["boss","crew"],"job":null,"minRep":65,"maxRep":999,"heatMin":0,"heatMax":999,"city":"los","priority":"medium","requires":[],"family":"sms-073","voice":"rico"},{"id":"sms-075-1","cat":"la","from":"M.","text":"Stanotte c'è un incontro lontano dalla città. Se accetti, ti mando dove.","replies":["CI SONO.","DOVE VA?","NO."],"tags":["yacht","smuggling"],"job":null,"minRep":65,"maxRep":999,"heatMin":0,"heatMax":999,"city":"los","priority":"medium","requires":[],"family":"sms-075","voice":"m"},{"id":"sms-075-2","cat":"la","from":"M.","text":"C'è una conversazione che nessuno vuole fare sulla terraferma. Ti mando il molo.","replies":["OK, CI STO.","DOVE VA?","LASCIA."],"tags":["yacht","smuggling"],"job":null,"minRep":65,"maxRep":999,"heatMin":0,"heatMax":999,"city":"los","priority":"medium","requires":[],"family":"sms-075","voice":"m"},{"id":"sms-077-1","cat":"la","from":"SCONOSCIUTO","text":"Una persona resta in città meno di due ore e ha chiesto di te. Vuoi vederla?","replies":["PORTAMELO.","CHI È?","NO."],"tags":["jet","meeting","boss"],"job":null,"minRep":65,"maxRep":999,"heatMin":0,"heatMax":999,"city":"los","priority":"medium","requires":[],"family":"sms-077","voice":"unknown"},{"id":"sms-077-2","cat":"la","from":"SCONOSCIUTO","text":"Un volo privato atterra tra novanta minuti. La persona a bordo ha chiesto di te.","replies":["FAMMELO VEDERE.","DIMMI CHI È.","LASCIA."],"tags":["jet","meeting","boss"],"job":null,"minRep":65,"maxRep":999,"heatMin":0,"heatMax":999,"city":"los","priority":"medium","requires":[],"family":"sms-077","voice":"unknown"},{"id":"sms-079-1","cat":"la","from":"M.","text":"Ormai il punto non è farti vedere. È scegliere quando non esserci.","replies":["RICEVUTO.","CHE SUCCEDE?","LO SO."],"tags":["boss","heat"],"job":null,"minRep":65,"maxRep":999,"heatMin":0,"heatMax":999,"city":"los","priority":"medium","requires":[],"family":"sms-079","voice":"m"},{"id":"sms-079-2","cat":"la","from":"M.","text":"Adesso il problema non è trovare opportunità. È capire quali non devi toccare.","replies":["CAPITO.","CHE SUCCEDE?","LO SO."],"tags":["boss","heat"],"job":null,"minRep":65,"maxRep":999,"heatMin":0,"heatMax":999,"city":"los","priority":"medium","requires":[],"family":"sms-079","voice":"m"}];
  const TRAP_CALL_FAMILIES=[{"id":"early-delivery","category":"early","from":"RICO","variants":["Senti, ho una busta da portare dall'altra parte della città. Prendi, consegni e chiudi lì.","Ho una cosa semplice per te. Una consegna, nessuna storia intorno.","Mi serve qualcuno per una tratta sola. Se dici sì, ti giro il contatto."],"options":["DOVE?","QUANTO PAGA?","PASSO."],"responses":["Ti mando il punto.","Duecentottanta.","Chiamo un altro."],"tags":["deal","street"],"minRep":0,"maxRep":48,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":[],"voice":"rico"},{"id":"early-car","category":"early","from":"SCONOSCIUTO","variants":["C'è una macchina pronta. Tu la prendi, la porti dove ti dico e non ti affezioni.","Ho bisogno che un'auto cambi posto senza diventare una storia.","C'è una macchina che per qualche ora non deve stare dove si trova adesso."],"options":["CI SONO","ALZA IL PREZZO","NO"],"responses":["Hai venti minuti.","Posso salire di cento.","Ricevuto."],"tags":["car","deal"],"minRep":0,"maxRep":48,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":[],"voice":"unknown"},{"id":"early-bar","category":"early","from":"RICO","variants":["Il bar chiude tardi ma dietro resta aperto dieci minuti. Quello è il momento.","Il proprietario fa sempre lo stesso giro prima di chiudere. Stasera potresti approfittarne.","C'è una cassa che resta sola più del dovuto. Domani potrebbe non succedere."],"options":["CI PROVO","QUANTO C'È?","PASSO"],"responses":["Ti mando l'ora.","Abbastanza.","Meglio così."],"tags":["heist","street"],"minRep":0,"maxRep":48,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":[],"voice":"rico"},{"id":"early-hot","category":"early","from":"SCONOSCIUTO","variants":["C'è roba che deve cambiare mani in fretta. Più aspetta, peggio diventa.","Una borsa è diventata troppo calda per chi ce l'ha. Vuole liberarsene stanotte.","Ho qualcosa che nessuno vuole tenere in casa fino a domani."],"options":["LA PRENDO","QUANTO?","NO"],"responses":["Ti mando il posto.","Più del solito.","Capito."],"tags":["deal","danger"],"minRep":0,"maxRep":48,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":[],"voice":"unknown"},{"id":"early-contact","category":"early","from":"RICO","variants":["Senti, conosco uno che potrebbe esserti utile. Prima vuole capire se sei affidabile.","Ho un ragazzo che sa aspettare, guidare e stare zitto. Non lavora con chiunque.","Mi hanno chiesto di te. È presto, ma almeno hanno iniziato a chiedere."],"options":["FAMMELO CONOSCERE","CHI È?","NO"],"responses":["Ti organizzo tutto.","Uno che resta senza nome.","Come vuoi."],"tags":["crew","rep"],"minRep":0,"maxRep":48,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":[],"voice":"rico"},{"id":"early-choice","category":"early","from":"M.","variants":["Hai davanti due occasioni diverse. Una paga subito, l'altra ti apre una porta. Scegli sapendo la differenza.","Se prendi sempre il lavoro con più contanti, resti quello che prende lavori.","C'è una cosa che oggi paga poco e domani potrebbe valerti molto di più."],"options":["DIMMI","QUAL È IL RISCHIO?","VOGLIO I SOLDI"],"responses":["Ti mando i dettagli.","Più sociale che legale.","Allora resterai dove sei."],"tags":["rep","deal"],"minRep":0,"maxRep":48,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":[],"voice":"m"},{"id":"heat-raid","category":"heat","from":"NUMERO PRIVATO","variants":["Non tornare al garage. C'è gente che guarda troppo e non è lì per caso.","Davanti al posto c'è movimento che non mi piace. Stasera sparisci.","La zona è piena di occhi. Se sei fuori, resta fuori."],"options":["RICEVUTO","HANNO VISTO ME?","CI VADO"],"responses":["Sparisci.","Non lo so.","Non dire che non ti avevo avvisato."],"tags":["police","raid","heat"],"minRep":0,"maxRep":999,"heatMin":45,"heatMax":999,"city":null,"priority":"high","requires":[],"voice":"private"},{"id":"heat-freeze","category":"heat","from":"M.","variants":["Per due giorni non voglio iniziative. Niente macchine, niente ferri, niente scene.","Fermo tutto. Chi si muove adesso si prende il rischio da solo.","La pressione è troppo alta. I lavori aspettano, i problemi no."],"options":["FERMO TUTTO","CHE È SUCCESSO?","HO UN LAVORO"],"responses":["È la scelta giusta.","Qualcuno ha parlato.","Rimandalo."],"tags":["heat","crew","police"],"minRep":0,"maxRep":999,"heatMin":45,"heatMax":999,"city":null,"priority":"high","requires":[],"voice":"m"},{"id":"heat-gun","category":"heat","from":"RICO","variants":["Se esci stasera lascia il ferro dov'è. Stanno controllando le macchine.","Non farti trovare armato per un lavoro che non vale la pena.","Una pattuglia sta facendo controlli a caso. Niente ferri, niente eroismi."],"options":["RICEVUTO","MI SERVE","NON ESCO"],"responses":["Meglio.","Allora scegli il rischio.","Ancora meglio."],"tags":["gun","heat","police"],"minRep":0,"maxRep":999,"heatMin":45,"heatMax":999,"city":null,"priority":"high","requires":[],"voice":"rico"},{"id":"heat-missing","category":"heat","from":"M.","variants":["Uno dei ragazzi è sparito da stamattina. Finché non so dov'è, considera tutto compromesso.","Un tuo uomo non risponde. Comportati come se potesse aver parlato.","Da ore non trovo uno che ieri sapeva troppo. Nessuno si muove."],"options":["CHI È?","TAGLIA TUTTO","LO CERCO"],"responses":["Te lo dico a voce.","Sto già facendo sparire il necessario.","Non da solo."],"tags":["crew","danger","police"],"minRep":0,"maxRep":999,"heatMin":45,"heatMax":999,"city":null,"priority":"high","requires":[],"voice":"m"},{"id":"heat-money","category":"heat","from":"M.","variants":["Non muovere contante questa settimana. Stanno guardando i flussi più delle facce.","I soldi possono aspettare. Se li fai girare adesso sembrano più sporchi di prima.","Fermo il riciclaggio per qualche giorno. Meglio perdere tempo che spiegare numeri."],"options":["RICEVUTO","QUANTO ASPETTO?","DEVO MUOVERLI"],"responses":["Perfetto.","Finché non ti richiamo.","Muovine meno."],"tags":["dirty","launder","heat"],"minRep":0,"maxRep":999,"heatMin":45,"heatMax":999,"city":null,"priority":"high","requires":[],"voice":"m"},{"id":"heat-search","category":"heat","from":"AVVOCATO","variants":["Se bussano con un foglio in mano, non discutere sulla porta. Chiamami subito.","Se arrivano a cercare qualcosa, non aiutarli a trovarla parlando.","Stanno preparando controlli. Tieni la testa fredda e la bocca chiusa."],"options":["RICEVUTO","COSA POSSONO FARE?","NON TROVERANNO NIENTE"],"responses":["È tutto.","Più di quanto pensi.","Chiamami comunque."],"tags":["lawyer","police","raid"],"minRep":0,"maxRep":999,"heatMin":45,"heatMax":999,"city":null,"priority":"high","requires":[],"voice":"lawyer"},{"id":"business-launder","category":"business","from":"M.","variants":["Hai troppa roba ferma. Se resta lì diventa un problema. Falla girare con calma.","Il contante non sparisce da solo. Muovine una parte, non tutto.","Hai abbastanza attività da assorbire qualcosa. Usa la testa, non la fretta."],"options":["ME NE OCCUPO","QUANTA?","ASPETTO"],"responses":["Senza rumore.","Meno di quanto vorresti.","Il problema resta."],"tags":["business","launder","dirty"],"minRep":20,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["business"],"voice":"m"},{"id":"business-front","category":"business","from":"RICO","variants":["Il posto può assorbire qualcosa questa settimana. Non tutto.","Il giro è abbastanza normale da coprire una cifra piccola.","Questa settimana il locale ha mosso abbastanza da non far sembrare strano qualcosa in più."],"options":["OK","QUANTO?","NO"],"responses":["Ti mando il resto.","Te lo scrivo.","Va bene."],"tags":["business","launder"],"minRep":20,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["business"],"voice":"rico"},{"id":"business-manager","category":"business","from":"M.","variants":["Se il posto cresce, tu devi comparire meno. Non di più.","Se ogni cosa passa ancora da te, non hai costruito una copertura. Hai messo il tuo nome sulla porta.","Metti qualcuno davanti. Tu devi poter sparire per una settimana senza fermare tutto."],"options":["CERCO QUALCUNO","CHI?","GESTISCO IO"],"responses":["Meglio così.","Uno che non sappia tutto.","Allora ti vedranno sempre."],"tags":["business","crew"],"minRep":20,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["business"],"voice":"m"},{"id":"business-buyer","category":"business","from":"SCONOSCIUTO","variants":["C'è chi compra contante sporco a un prezzo peggiore ma senza domande.","Conosco uno che prende cifre grosse e restituisce meno, ma pulito.","Se vuoi perdere una percentuale per guadagnare silenzio, ho un nome."],"options":["FAMMI IL NOME","QUANTO PERDO?","NO"],"responses":["Non qui.","Abbastanza.","Va bene."],"tags":["cash","dirty","deal"],"minRep":20,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["business"],"voice":"unknown"},{"id":"business-audit","category":"business","from":"M.","variants":["I numeri stanno iniziando a sembrare troppo belli. Falli tornare noiosi.","Il posto sta crescendo troppo in fretta per sembrare naturale.","Continua così e prima o poi qualcuno chiederà perché i conti corrono più del locale."],"options":["RIDUCO","CHE RISCHIO?","CONTINUO"],"responses":["Bene.","Più fiscale che fisico.","Scelta tua."],"tags":["business","heat","police"],"minRep":20,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["business"],"voice":"m"},{"id":"business-partner","category":"business","from":"RICO","variants":["Uno vuole entrare con soldi veri. Potrebbe aiutare o voler vedere troppo.","C'è un socio potenziale che porta contanti e domande. Le prime mi piacciono, le seconde no.","Ho un investitore che non è abbastanza pulito da essere innocente."],"options":["FISSA L'INCONTRO","CHI È?","NO"],"responses":["Ti mando l'ora.","Uno che parla poco.","Scelta tua."],"tags":["business","deal"],"minRep":20,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["business"],"voice":"rico"},{"id":"crew-loyalty","category":"crew","from":"M.","variants":["Uno dei tuoi arriva tardi, ascolta molto e spiega poco. Io lo guarderei meglio.","Hai una persona che ultimamente sembra lavorare più per sé che per te.","Non sto dicendo che hai un problema. Sto dicendo che uno dei tuoi mi fa fare domande."],"options":["LO CONTROLLO","CHI?","TAGLIALO FUORI"],"responses":["Perfetto.","Te lo dico a voce.","Non ancora."],"tags":["crew","rep"],"minRep":30,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["crew"],"voice":"m"},{"id":"crew-recruit","category":"crew","from":"RICO","variants":["C'è un ragazzo che guida bene e parla poco. Non lavora gratis.","Ho uno che sa stare fuori da una porta per ore senza attirare attenzione.","Conosco qualcuno che fa il lavoro sporco senza comportarsi da gangster."],"options":["PORTAMELO","QUANTO?","NO"],"responses":["Ti organizzo tutto.","Più di un dilettante.","Nessun problema."],"tags":["crew"],"minRep":30,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["crew"],"voice":"rico"},{"id":"crew-debt","category":"crew","from":"M.","variants":["Uno dei tuoi ha debiti. I debiti diventano problemi per tutti.","C'è qualcuno nella tua gente che deve soldi a persone che non mi piacciono.","Un uomo con problemi personali è un rischio operativo."],"options":["CHI È?","PAGHIAMO","MANDALO VIA"],"responses":["Te lo dico a voce.","Solo se poi ci deve il doppio.","Prima capiamo."],"tags":["crew","danger"],"minRep":30,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["crew"],"voice":"m"},{"id":"crew-protect","category":"crew","from":"SCONOSCIUTO","variants":["Posso mettere due occhi fissi fuori dal posto. Non sono economici.","Se vuoi smettere di guardarti dietro ogni volta che esci, ti serve gente dedicata.","La protezione improvvisata funziona finché non arriva qualcuno organizzato."],"options":["PRENDILI","QUANTO?","NON SERVE"],"responses":["Ti mando i nomi.","Seicento a settimana.","Spero tu abbia ragione."],"tags":["protection","crew"],"minRep":30,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["crew"],"voice":"unknown"},{"id":"crew-status","category":"crew","from":"M.","variants":["La tua gente ormai aspetta di vedere cosa fai tu. Quindi evita di fare il coglione davanti a loro.","Se perdi la testa tu, domani la perdono tutti. È questo che cambia quando hai gente dietro.","Non sei più solo quello che prende il lavoro. Adesso qualcuno aspetta una tua decisione."],"options":["RICEVUTO","CHE È SUCCESSO?","LO SO"],"responses":["Va bene.","Niente ancora.","Allora comportati così."],"tags":["crew","rep","organization"],"minRep":30,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["crew"],"voice":"m"},{"id":"crew-coup","category":"crew","from":"M.","variants":["Uno dei tuoi sta iniziando a usare il tuo nome come se fosse anche il suo.","C'è qualcuno nella tua gente che prende decisioni e poi ti informa. L'ordine è sbagliato.","Uno ha capito il tuo silenzio come un permesso. Va corretto prima che ci credano anche gli altri."],"options":["PARLACI","CHI È?","TAGLIALO FUORI"],"responses":["Prima di stasera.","Te lo dico faccia a faccia.","Non senza capire chi lo segue."],"tags":["crew","boss","danger"],"minRep":30,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"medium","requires":["crew"],"voice":"m"},{"id":"milan-table","category":"milan","from":"M.","variants":["Domani c'è un tavolo. Non è una serata e non è un provino. Se vieni, arrivi pronto.","Ti vogliono in un locale dove il problema non è entrare: è sapere perché sei stato invitato.","C'è una riunione che può cambiarti il giro di contatti. Non arrivare con la testa da lavoretto."],"options":["CI SONO","CHI C'È?","PASSO"],"responses":["Tieniti libero.","Nomi che non faccio qui.","Chiamo un altro."],"tags":["meeting","organization","nightclub"],"minRep":45,"maxRep":999,"heatMin":0,"heatMax":999,"city":"milano","priority":"high","requires":[],"voice":"m"},{"id":"milan-clubs","category":"milan","from":"RICO","variants":["Senti, nei locali stanno cercando una faccia che sappia stare al tavolo senza fare il fan.","C'è un giro che muove soldi veri, ma prima devi essere presentato da qualcuno di lì.","Uno dei locali vuole conoscerti. Non per una serata: per capire se puoi servire."],"options":["PORTAMI DENTRO","CHI MI PRESENTA?","NO"],"responses":["Ti faccio sapere.","Io ti porto alla porta.","Va bene."],"tags":["nightclub","organization"],"minRep":45,"maxRep":999,"heatMin":0,"heatMax":999,"city":"milano","priority":"high","requires":[],"voice":"rico"},{"id":"milan-jewel","category":"milan","from":"SCONOSCIUTO","variants":["È uscita un'informazione su una gioielleria. È fresca e non resterà fresca a lungo.","Ho un dettaglio che interessa a gente con più soldi che pazienza.","C'è un'informazione su un posto importante. Costa perché non dovrebbe essere fuori."],"options":["DIMMI TUTTO","QUANTO VUOI?","NO"],"responses":["Non qui.","Una percentuale.","Affare chiuso."],"tags":["heist","organization"],"minRep":45,"maxRep":999,"heatMin":0,"heatMax":999,"city":"milano","priority":"high","requires":[],"voice":"unknown"},{"id":"milan-load","category":"milan","from":"M.","variants":["C'è un carico piccolo che apre porte grandi. Se lo prendi, non guardare solo i soldi.","Una consegna grossa sta cercando una squadra che non si faccia notare.","Ti propongono un lavoro che serve più a misurarti che a pagarti."],"options":["CI SONO","CHE RISCHIO?","PASSO"],"responses":["Ti mando i dettagli.","Abbastanza.","Capito."],"tags":["deal","organization","crew"],"minRep":45,"maxRep":999,"heatMin":0,"heatMax":999,"city":"milano","priority":"high","requires":[],"voice":"m"},{"id":"milan-bribe","category":"milan","from":"SCONOSCIUTO","variants":["C'è qualcuno che può far sparire un controllo dal calendario. Non è gratis.","Una firma può arrivare domani o non arrivare mai. Dipende da quanto vale per te.","Uno in ufficio è disposto a non vedere qualcosa. Vuole essere ringraziato."],"options":["QUANTO?","FALLO","NO"],"responses":["Troppo per un problema piccolo.","Ti mando come.","Resta tutto com'è."],"tags":["corruption","organization"],"minRep":45,"maxRep":999,"heatMin":0,"heatMax":999,"city":"milano","priority":"high","requires":[],"voice":"unknown"},{"id":"milan-status","category":"milan","from":"M.","variants":["Qui non devi piacere a tutti. Devi evitare di perdere tempo con quelli che non servono.","Se entri nel giro giusto, saranno i lavori a trovarti. Non vuol dire che devi prenderli tutti.","Impara a dire no senza sembrare spaventato. A volte è tutto lì."],"options":["RICEVUTO","CHI CONTA?","LO SO"],"responses":["È quello che volevo sentire.","Chi non deve dirti che conta.","Dimostralo."],"tags":["organization","rep","boss"],"minRep":45,"maxRep":999,"heatMin":0,"heatMax":999,"city":"milano","priority":"high","requires":[],"voice":"m"},{"id":"la-hills","category":"la","from":"M.","variants":["Domani c'è un incontro sulle colline. Poca gente, niente entourage.","Ti hanno lasciato un posto a un tavolo privato. Se vieni, vieni da solo.","Una persona che non perde tempo ha accettato di vederti domani."],"options":["CI SONO","CHI C'È?","NON ORA"],"responses":["Vestiti bene e parla poco.","Gente che non nomino qui.","Occasioni così non aspettano."],"tags":["villa","meeting","boss"],"minRep":65,"maxRep":999,"heatMin":0,"heatMax":999,"city":"los","priority":"high","requires":[],"voice":"m"},{"id":"la-port","category":"la","from":"SCONOSCIUTO","variants":["C'è movimento al porto e qualcuno vuole una persona affidabile dalla sua parte.","Domattina al porto succede qualcosa che vale la pena ascoltare prima di decidere.","Una cosa grossa sta muovendo persone più che merce. Hanno chiesto se sei disponibile."],"options":["MANDAMI IL PUNTO","QUANTO GIRA?","PASSO"],"responses":["Ti arriva subito.","Più di quanto si dice qui.","Capito."],"tags":["port","smuggling","organization"],"minRep":65,"maxRep":999,"heatMin":0,"heatMax":999,"city":"los","priority":"high","requires":[],"voice":"unknown"},{"id":"la-yacht","category":"la","from":"M.","variants":["C'è un incontro in mare. Poche persone e nessuno che abbia voglia di essere fotografato.","Una conversazione importante è stata spostata lontano dalla città. Ti vogliono lì.","Stanotte c'è un tavolo che galleggia. Il resto te lo spiego quando arrivi."],"options":["CI SONO","CHI SALE?","NO"],"responses":["Ti mando il molo.","Pochi. Quelli giusti.","Va bene."],"tags":["yacht","meeting","boss"],"minRep":65,"maxRep":999,"heatMin":0,"heatMax":999,"city":"los","priority":"high","requires":[],"voice":"m"},{"id":"la-jet","category":"la","from":"SCONOSCIUTO","variants":["Una persona passa in città per poco e ha chiesto di incontrarti.","C'è qualcuno che atterra, parla e riparte. Il tuo nome è nella sua lista.","Hai una finestra corta per vedere una persona che di solito non aspetta nessuno."],"options":["PORTAMELO","CHI È?","NO"],"responses":["Ti mando il punto.","Uno che non aspetta.","Va bene."],"tags":["jet","meeting","boss"],"minRep":65,"maxRep":999,"heatMin":0,"heatMax":999,"city":"los","priority":"high","requires":[],"voice":"unknown"},{"id":"la-empire","category":"la","from":"M.","variants":["Adesso la gente guarda le tue decisioni, non solo i tuoi soldi.","Hai abbastanza peso perché anche una tua assenza venga notata. Usala bene.","Le opportunità non mancano più. Il difficile è capire quali ti costano troppo."],"options":["RICEVUTO","CHI GUARDA?","LO SO"],"responses":["Perfetto.","Più gente di quanta pensi.","Comportati di conseguenza."],"tags":["boss","empire","rep"],"minRep":65,"maxRep":999,"heatMin":0,"heatMax":999,"city":"los","priority":"high","requires":[],"voice":"m"},{"id":"la-choice","category":"la","from":"M.","variants":["Puoi continuare a prendere lavori grossi oppure iniziare a scegliere chi li prende.","Domani puoi dire sì a una cifra enorme o dire no e farti rispettare di più. Non c'è una scelta gratis.","Se vuoi salire ancora, prima o poi devi smettere di essere quello che esegue."],"options":["VOGLIO DECIDERE","DIMMI IL LAVORO","NON ORA"],"responses":["Smetti di pensare come uno che esegue.","Te lo dico faccia a faccia.","Il tempo non aspetta."],"tags":["boss","meeting","empire"],"minRep":65,"maxRep":999,"heatMin":0,"heatMax":999,"city":"los","priority":"high","requires":[],"voice":"m"},{"id":"boss-favor","category":"boss","from":"M.","variants":["C'è una persona importante che ti deve qualcosa. Non bruciartela per una cifra piccola.","Hai credito con gente che non paga in contanti. A volte vale molto di più.","Prima di chiedere quel favore, pensa se tra un mese potresti averne bisogno di più."],"options":["LO TENGO","MI SERVE ORA","CHI È?"],"responses":["È la scelta giusta.","Allora scegli bene.","Te lo dico di persona."],"tags":["boss","rep"],"minRep":60,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"high","requires":[],"voice":"m"},{"id":"boss-refusal","category":"boss","from":"SCONOSCIUTO","variants":["Hai detto no a gente abituata a sentire sì. Non sono arrabbiati: sono curiosi.","Quel rifiuto è arrivato più in alto di quanto pensassi. Adesso vogliono capire perché.","Dire no ti ha fatto notare. Ora devi evitare di sembrare uno che bluffa."],"options":["NESSUNA SPIEGAZIONE","PARLO IO","CHI GUARDA?"],"responses":["Può bastare.","Fallo con calma.","Quelli che contano."],"tags":["boss","rep","danger"],"minRep":60,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"high","requires":[],"voice":"unknown"},{"id":"boss-money","category":"boss","from":"M.","variants":["I soldi ormai li trovi. Quello che non compri facilmente sono tempo e persone affidabili.","Se valuti tutto solo in contanti, prima o poi qualcuno con più contanti decide per te.","Il costo vero adesso è quanta gente deve sapere cosa stai facendo."],"options":["RICEVUTO","CHE FACCIO?","I SOLDI CONTANO"],"responses":["Va bene.","Riduci le persone, non i margini.","Sempre. Ma non solo."],"tags":["boss","cash","rep"],"minRep":60,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"high","requires":[],"voice":"m"},{"id":"boss-legacy","category":"boss","from":"M.","variants":["C'è gente che conosce il tuo nome e tu non sai neanche che esiste. È una cosa da gestire.","Stanno raccontando storie su di te senza che tu sia nella stanza.","Il tuo nome arriva prima di te. Decidi se vuoi lasciarlo correre da solo."],"options":["LO SO","CHE DICONO?","NON MI INTERESSA"],"responses":["Allora usalo bene.","Che sei difficile da leggere.","Dovrebbe interessarti."],"tags":["boss","rep"],"minRep":60,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"high","requires":[],"voice":"m"},{"id":"boss-threat","category":"boss","from":"NUMERO PRIVATO","variants":["Qualcuno sta facendo domande su quanta gente hai intorno. È una domanda che non mi piace.","Hai attirato un'attenzione che non viene con complimenti.","Una persona con mezzi veri vuole capire quanto sei esposto."],"options":["CHI È?","AUMENTO LA PROTEZIONE","NON MI MUOVO"],"responses":["Non qui.","Forse è il momento.","Scelta prudente."],"tags":["boss","danger","protection"],"minRep":60,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"high","requires":[],"voice":"private"},{"id":"boss-succession","category":"boss","from":"M.","variants":["Uno dei vecchi si sta tirando fuori. Il posto che lascia non resterà vuoto.","Si sta liberando spazio in alto e nessuno metterà un annuncio.","C'è una posizione che tra poco avrà un nuovo nome sopra. Potrebbe essere il tuo."],"options":["VOGLIO PARLARGLI","CHI È?","NON ORA"],"responses":["Ti organizzo tutto.","Un nome che conosci già.","Potrebbe non ricapitare."],"tags":["boss","organization","rep"],"minRep":60,"maxRep":999,"heatMin":0,"heatMax":999,"city":null,"priority":"high","requires":[],"voice":"m"},{"id":"legal-warning","category":"legal","from":"AVVOCATO","variants":["Se ti chiamano per chiarimenti, non improvvisare. Prima senti me.","Stanno facendo domande. Per ora non significa molto, a meno che tu non riempia i silenzi.","Tieni il mio numero separato dagli altri. Se serve, chiamami prima di rispondere."],"options":["RICEVUTO","CHE SANNO?","NON SERVIRÀ"],"responses":["Perfetto.","Per ora poco.","Spero tu abbia ragione."],"tags":["lawyer","heat"],"minRep":15,"maxRep":999,"heatMin":30,"heatMax":999,"city":null,"priority":"high","requires":[],"voice":"lawyer"},{"id":"legal-pressure","category":"legal","from":"AVVOCATO","variants":["Mi hanno chiesto del tuo nome. Non ho dato spiegazioni e non dovresti farlo neanche tu.","Se ricevi una chiamata ufficiale, non richiamare d'impulso. Prima passa da me.","C'è movimento, ma ancora niente che richieda panico. Richiede disciplina."],"options":["RICEVUTO","CHE SANNO?","NON MI SERVE"],"responses":["È quello che volevo sentire.","Abbastanza da stare attenti.","Spero tu abbia ragione."],"tags":["lawyer","heat","court"],"minRep":15,"maxRep":999,"heatMin":30,"heatMax":999,"city":null,"priority":"high","requires":[],"voice":"lawyer"},{"id":"legal-search","category":"legal","from":"AVVOCATO","variants":["Se arrivano con documenti ufficiali, non discutere sulla soglia. Chiama me.","Una perquisizione non è il momento di convincere nessuno della tua versione.","Se si presentano per un controllo, tu fai il minimo necessario e poi mi chiami."],"options":["RICEVUTO","COSA POSSONO FARE?","NON TROVANO NIENTE"],"responses":["Perfetto.","Più di quanto pensi.","Chiamami comunque."],"tags":["lawyer","raid","court"],"minRep":15,"maxRep":999,"heatMin":30,"heatMax":999,"city":null,"priority":"high","requires":[],"voice":"lawyer"},{"id":"legal-arrest","category":"legal","from":"AVVOCATO","variants":["Ascoltami: non cercare di sistemare la situazione parlando. Sto arrivando.","Ho saputo. Da questo momento rispondi solo a quello che devi, niente discorsi.","Qualunque cosa sia successa, non aggiungere dettagli per sembrare collaborativo."],"options":["HO CAPITO","QUANTO CI VUOLE?","CHIUDO"],"responses":["Va bene.","Il tempo di arrivare.","La linea cade."],"tags":["lawyer","arrest","court"],"minRep":15,"maxRep":999,"heatMin":30,"heatMax":999,"city":null,"priority":"high","requires":[],"voice":"lawyer"},{"id":"legal-precedents","category":"legal","from":"AVVOCATO","variants":["Con i precedenti, una leggerezza che prima era piccola adesso pesa di più.","Da ora ogni controllo va preso sul serio. Hai meno margine per fare il brillante.","Non puoi più comportarti come se ogni fermo fosse il primo."],"options":["RICEVUTO","CHE CAMBIA?","NON MI FERMO"],"responses":["Perfetto.","Più attenzione, meno margine.","Scelta tua."],"tags":["lawyer","precedents","heat"],"minRep":15,"maxRep":999,"heatMin":30,"heatMax":999,"city":null,"priority":"high","requires":[],"voice":"lawyer"},{"id":"legal-court","category":"legal","from":"AVVOCATO","variants":["Domani puntuale, sobrio e senza racconti creativi. In aula parlo io quando serve.","In tribunale il modo più semplice per peggiorare le cose è voler spiegare troppo.","Domani devi sembrare la persona più noiosa della stanza. È un complimento."],"options":["RICEVUTO","DEVO DIRE QUALCOSA?","CI PENSO IO"],"responses":["Perfetto.","Solo se te lo chiedo.","No. Ci penso io."],"tags":["lawyer","court"],"minRep":15,"maxRep":999,"heatMin":30,"heatMax":999,"city":null,"priority":"high","requires":[],"voice":"lawyer"}];
  const TRAP_HISTORY_KEY="traphone16_history_v4";
  const TRAP_HISTORY=(()=>{try{const h=JSON.parse(sessionStorage.getItem(TRAP_HISTORY_KEY)||"{}");return {sms:Array.isArray(h.sms)?h.sms:[],smsFamilies:Array.isArray(h.smsFamilies)?h.smsFamilies:[],calls:Array.isArray(h.calls)?h.calls:[],contacts:h.contacts||{}};}catch(e){return {sms:[],smsFamilies:[],calls:[],contacts:{}};}})();
  function saveTrapHistory(){try{sessionStorage.setItem(TRAP_HISTORY_KEY,JSON.stringify(TRAP_HISTORY));}catch(e){}}
  function rememberTrap(kind,id,max){const a=TRAP_HISTORY[kind]||(TRAP_HISTORY[kind]=[]),i=a.indexOf(id);if(i>=0)a.splice(i,1);a.unshift(id);if(a.length>max)a.length=max;saveTrapHistory();}
  function bumpContact(name){TRAP_HISTORY.contacts[name]=(TRAP_HISTORY.contacts[name]||0)+1;saveTrapHistory();}
  function trapBand(s){const rep=Number(s.rep||0),city=String(s.city||"provincia").toLowerCase();if(s.goat||city.includes("los")||rep>=75)return "la";if(city.includes("milano"))return "milan";if(rep>=60)return "boss";if(rep>=50)return "milan";if(rep>=30)return "crew";return "early";}
  function cityOK(rule,s){if(!rule)return true;const city=String(s.city||"provincia").toLowerCase(),rep=Number(s.rep||0);if(rule==="milano")return city.includes("milano")||rep>=50;if(rule==="los")return city.includes("los")||s.goat||rep>=75;return city.includes(rule);}
  function reqOK(req,s){if(req==="business")return Number(s.businessCount||0)>0;if(req==="crew")return Number(s.men||s.uomini||0)>0||Number(s.rep||0)>=35;return true;}
  function weightedPick(items,fn){if(!items.length)return null;const w=items.map(x=>Math.max(.001,Number(fn(x))||.001));let r=Math.random()*w.reduce((a,b)=>a+b,0);for(let i=0;i<items.length;i++){r-=w[i];if(r<=0)return items[i];}return items[items.length-1];}
  function smsEligible(x,s){const rep=Number(s.rep||0),heat=Number(s.heat||0);if(rep<(x.minRep||0)||rep>(x.maxRep??999)||heat<(x.heatMin||0)||heat>(x.heatMax??999))return false;if(!cityOK(x.city,s)||(x.requires||[]).some(r=>!reqOK(r,s)))return false;if(x.cat==="heat"&&heat<35)return false;if(x.cat==="milan"&&!(String(s.city||"").toLowerCase().includes("milano")||rep>=50))return false;if(x.cat==="la"&&!(String(s.city||"").toLowerCase().includes("los")||s.goat||rep>=75))return false;return true;}
  function smsWeight(x,s){let w=1,idx=TRAP_HISTORY.sms.indexOf(x.id),heat=Number(s.heat||0);const fam=x.family||String(x.id||"").replace(/-[^-]+$/,""),fidx=(TRAP_HISTORY.smsFamilies||[]).indexOf(fam);if(x.cat===trapBand(s))w*=2.6;if(x.cat==="heat"&&heat>=55)w*=3.4;if(x.cat==="business"&&Number(s.businessCount||0)>0)w*=2;if(x.cat==="crew"&&Number(s.men||s.uomini||0)>=2)w*=2;if(idx>=0)w*=idx<14?.025:.15;if(fidx>=0)w*=fidx<18?.035:.22;return w;}
  function generateSms(s=currentGameState(),mark=true,priority=null){
    let pool=TRAP_SMS_POOL.filter(x=>smsEligible(x,s)&&(!priority||x.priority===priority));
    if(!pool.length)pool=TRAP_SMS_POOL.filter(x=>smsEligible(x,s));
    if(!pool.length)pool=TRAP_SMS_POOL.filter(x=>x.cat==="early");

    const recentFamilies=(TRAP_HISTORY.smsFamilies||[]).slice(0,6);
    const fresh=pool.filter(x=>!recentFamilies.includes(x.family||String(x.id||"").replace(/-[^-]+$/,"")));
    if(fresh.length) pool=fresh;

    const x=weightedPick(pool,a=>smsWeight(a,s));
    if(!x)return null;

    const fam=x.family||String(x.id||"").replace(/-[^-]+$/,"");
    if(mark){
      rememberTrap("sms",x.id,36);
      rememberTrap("smsFamilies",fam,28);
    }
    bumpContact(x.from);

    return {
      id:x.id,family:fam,voice:x.voice,from:x.from,time:"ADESSO",unread:true,
      text:x.text,replies:[...x.replies],tags:[...x.tags],job:x.job||null,
      priority:x.priority,cat:x.cat,lastReply:null
    };
  }

  function callEligible(f,s){const rep=Number(s.rep||0),heat=Number(s.heat||0);if(rep<(f.minRep||0)||rep>(f.maxRep??999)||heat<(f.heatMin||0)||heat>(f.heatMax??999))return false;if(!cityOK(f.city,s)||(f.requires||[]).some(r=>!reqOK(r,s)))return false;if(f.category==="heat"&&heat<40&&!(s.arrest||s.arresto))return false;if(f.category==="legal"&&heat<30&&!(s.arrest||s.arresto||s.precedents||s.precedenti))return false;if(f.category==="milan"&&!(String(s.city||"").toLowerCase().includes("milano")||rep>=50))return false;if(f.category==="la"&&!(String(s.city||"").toLowerCase().includes("los")||s.goat||rep>=75))return false;if(f.category==="boss"&&rep<60)return false;return true;}
  function callWeight(f,s){
    let w=1,heat=Number(s.heat||0),idx=TRAP_HISTORY.calls.findIndex(v=>String(v).startsWith(f.id+"#"));
    const band=trapBand(s);

    if(f.category===band)w*=2.7;
    if(f.category==="heat"&&heat>=65)w*=4;

    if(f.category==="legal"){
      if(s.arrest||s.arresto) w*=8;
      else if(heat>=75) w*=4;
      else if(s.precedents||s.precedenti) w*=1.45;
      else if(heat>=45) w*=1.25;
    }

    if(f.category==="business"&&Number(s.businessCount||0)>0)w*=1.8;
    if(f.category==="crew"&&Number(s.men||s.uomini||0)>=2)w*=2;

    /* La crescita non cancella i vecchi contatti, ma li rende meno dominanti. */
    if(band==="milan"&&f.category==="early")w*=.18;
    if(band==="boss"&&f.category==="early")w*=.08;
    if(band==="boss"&&f.category==="crew")w*=.72;
    if(band==="la"&&f.category==="early")w*=.04;
    if(band==="la"&&f.category==="crew")w*=.55;
    if(band==="la"&&f.category==="milan")w*=.72;

    if(idx>=0)w*=idx<10?.02:.14;
    return w;
  }
  function generateCall(s=currentGameState(),mark=true){
    let pool=TRAP_CALL_FAMILIES.filter(f=>callEligible(f,s));
    if(!pool.length)pool=TRAP_CALL_FAMILIES.filter(f=>f.category==="early");

    const recentFamilies=[];
    for(const v of TRAP_HISTORY.calls){
      const fam=String(v).split("#")[0];
      if(!recentFamilies.includes(fam)) recentFamilies.push(fam);
      if(recentFamilies.length>=4) break;
    }

    const fresh=pool.filter(f=>!recentFamilies.includes(f.id));
    if(fresh.length) pool=fresh;

    const f=weightedPick(pool,a=>callWeight(a,s));
    if(!f)return null;

    const recent=TRAP_HISTORY.calls
      .filter(v=>String(v).startsWith(f.id+"#"))
      .slice(0,2)
      .map(v=>Number(String(v).split("#")[1]));

    let choices=[0,1,2].filter(i=>!recent.includes(i));
    if(!choices.length)choices=[0,1,2];

    const vi=choices[Math.floor(Math.random()*choices.length)];
    if(mark)rememberTrap("calls",f.id+"#"+vi,30);
    bumpContact(f.from);

    return {
      id:f.id,familyId:f.id,variant:vi,from:f.from,
      sub:f.priority==="high"?"CHIAMATA PRIORITARIA":"CHIAMATA IN ARRIVO",
      speech:f.variants[vi],options:[...f.options],responses:[...f.responses],
      tags:[...f.tags],priority:f.priority,category:f.category
    };
  }

  function seedInbox(n=6){const s=currentGameState(),out=[],used=new Set(),usedFamilies=new Set();let guard=0;while(out.length<n&&guard++<160){const m=generateSms(s,false);if(!m||used.has(m.id)||usedFamilies.has(m.family))continue;used.add(m.id);usedFamilies.add(m.family);rememberTrap("sms",m.id,36);rememberTrap("smsFamilies",m.family,28);m.time=out.length===0?"21:06":out.length===1?"19:42":out.length===2?"18:11":"IERI";m.unread=out.length<3;out.push(m);}return out;}

  const PHONE = {
    mode:"home",
    menu:0,
    msgIndex:0,
    callIndex:0,
    replyIndex:0,
    focused:false,
    ringing:false,
    call:null,
    callStartedAt:0,
    callTimer:null,
    unread:3,
    lastIncomingId:null,
    messages:seedInbox(6),
    calls:[
      {from:"NUMERO PRIVATO",time:"20:51",kind:"persa"},
      {from:"RICO",time:"18:24",kind:"ricevuta"},
      {from:"M.",time:"IERI",kind:"ricevuta"}
    ]
  };
  PHONE.messages.forEach(m=>{if(typeof m.lastReply==="undefined")m.lastReply=null;});

  let homeParent=dock.parentNode;
  let homeNext=dock.nextSibling;
  let placeholder=null;
  let overlay=null;
  let stage=null;

  function notify(msg){
    if(!toast) return;
    toast.innerHTML=msg;
    toast.classList.add("on");
    clearTimeout(notify.t);
    notify.t=setTimeout(()=>toast.classList.remove("on"),2600);
  }

  function clickTone(freq=520,dur=.035){
    try{
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC) return;
      const c=clickTone.ctx||(clickTone.ctx=new AC());
      const o=c.createOscillator(), g=c.createGain();
      o.type="square";o.frequency.value=freq;
      g.gain.setValueAtTime(.022,c.currentTime);
      g.gain.exponentialRampToValueAtTime(.001,c.currentTime+dur);
      o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+dur);
    }catch(e){}
  }

  function currentGameState(){
    try{
      if(typeof crimeVisualState==="function") return crimeVisualState();
    }catch(e){}
    try{
      if(typeof state!=="undefined") return state;
    }catch(e){}
    return {};
  }

  function dynamicIncoming(){
    return generateCall(currentGameState(),true);
  }

  function ensureOverlay(){
    // Non serve più: il TRAPHONE resta fisicamente nel pannello.
    return;
  }

  function focus(on=true){
    const panel=dock.closest(".right");
    const pane=dock.closest(".tabpane");

    PHONE.focused=!!on;
    if(!PHONE.focused && !["callActive","callOptions"].includes(PHONE.mode)) hideCallPop();
    wrap.classList.toggle("focus",PHONE.focused);
    dock.classList.toggle("trap-phone-open",PHONE.focused);
    if(panel) panel.classList.toggle("trap-phone-open",PHONE.focused);
    if(pane) pane.classList.toggle("trap-phone-open",PHONE.focused);
  }

  function setBadge(){
    PHONE.unread=PHONE.messages.filter(m=>m.unread).length;
    if(badge){
      badge.textContent=PHONE.unread;
      badge.classList.toggle("on",PHONE.unread>0);
    }
    const ds=document.getElementById("trapDockStatus");
    if(ds) ds.textContent=PHONE.unread ? PHONE.unread+" NON LETTI" : "NESSUN MESSAGGIO";
  }

  function setSoft(l="",r=""){
    softL.textContent=l;
    softR.textContent=r;
  }

  function fmtCallTime(){
    if(!PHONE.callStartedAt) return "00:00";
    const sec=Math.max(0,Math.floor((Date.now()-PHONE.callStartedAt)/1000));
    return "00:"+String(sec).padStart(2,"0");
  }

  function startCallTimer(){
    stopCallTimer();
    PHONE.callStartedAt=Date.now();
    PHONE.callTimer=setInterval(()=>{
      if(PHONE.mode==="callActive") render();
    },1000);
  }

  function stopCallTimer(){
    if(PHONE.callTimer) clearInterval(PHONE.callTimer);
    PHONE.callTimer=null;
    PHONE.callStartedAt=0;
  }

  function fitSmsMessage(){
    view.classList.remove("sms-compact","sms-tight");
    if(view.scrollHeight > view.clientHeight + 1){
      view.classList.add("sms-compact");
    }
    if(view.scrollHeight > view.clientHeight + 1){
      view.classList.add("sms-tight");
    }
  }

  function render(){
    setBadge();
    view.classList.toggle("reply-compact",PHONE.mode==="reply");
    view.classList.toggle("sms-message",PHONE.mode==="message");
    if(PHONE.mode!=="message") view.classList.remove("sms-compact","sms-tight");
    if(!["callActive","callOptions"].includes(PHONE.mode)) hideCallPop();
    screen.classList.toggle("trap-lcd-flash",PHONE.ringing);

    if(PHONE.ringing && PHONE.call){
      view.innerHTML='<span class="call-name">'+PHONE.call.from+'</span>'+
        '<span class="call-sub">'+PHONE.call.sub+'</span>'+
        '<div class="center tiny" style="margin-top:4px">☎  ☎  ☎</div>';
      setSoft("RISPONDI","RIFIUTA");
      return;
    }

    if(PHONE.mode==="home"){
      view.innerHTML=
        '<span class="big">TRAPHONE 16</span>'+
        '<span class="tiny">SIM PREPAGATA</span>'+
        '<div style="margin-top:5px">'+PHONE.unread+' NUOVI SMS</div>';
      setSoft("MENU","ESCI");
      return;
    }

    if(PHONE.mode==="menu"){
      const rows=[
        '<span class="menu-row '+(PHONE.menu===0?"sel":"")+'">1 MESSAGGI ('+PHONE.unread+')</span>',
        '<span class="menu-row '+(PHONE.menu===1?"sel":"")+'">2 CHIAMATE</span>'
      ];
      view.innerHTML='<span class="tiny">MENU</span>'+rows.join("");
      setSoft("APRI","INDIETRO");
      return;
    }

    if(PHONE.mode==="messages"){
      const rows=PHONE.messages.map((m,i)=>{
        const pre=m.unread?"*":" ";
        return '<span class="menu-row '+(PHONE.msgIndex===i?"sel":"")+'">'+pre+' '+m.from+' '+m.time+'</span>';
      });
      view.innerHTML='<span class="tiny">MESSAGGI</span>'+rows.join("");
      setSoft("LEGGI","INDIETRO");
      return;
    }

    if(PHONE.mode==="message"){
      const m=PHONE.messages[PHONE.msgIndex];
      view.innerHTML='<div class="row"><b>'+m.from+'</b><span>'+m.time+'</span></div>'+
        '<div class="sms-body" style="margin-top:2px">'+m.text+'</div>';
      setSoft((m.replies&&m.replies.length)?"RISPONDI":"CHIUDI","INDIETRO");
      fitSmsMessage();
      return;
    }

    if(PHONE.mode==="reply"){
      const m=PHONE.messages[PHONE.msgIndex];
      const opts=m.replies||["OK.","DIMMI DI PIÙ.","NO."];
      view.innerHTML='<span class="tiny">RISPOSTA A '+m.from+'</span>'+
        opts.map((o,i)=>'<span class="menu-row '+(PHONE.replyIndex===i?"sel":"")+'">'+(i+1)+' '+o+'</span>').join("");
      setSoft("INVIA","ANNULLA");
      return;
    }

    if(PHONE.mode==="replySent"){
      const m=PHONE.messages[PHONE.msgIndex];
      view.innerHTML=
        '<span class="sms-sent-title">SMS INVIATO</span>'+
        '<span class="sms-sent-to">A: '+m.from+'</span>'+
        '<span class="sms-sent-text">'+(m.lastReply||"OK.")+'</span>';
      setSoft("OK","INDIETRO");
      return;
    }

    if(PHONE.mode==="calls"){
      const rows=PHONE.calls.map((c,i)=>
        '<span class="menu-row '+(PHONE.callIndex===i?"sel":"")+'">'+
        (c.kind==="persa"?"! ":"  ")+c.from+' '+c.time+'</span>');
      view.innerHTML='<span class="tiny">REGISTRO CHIAMATE</span>'+rows.join("");
      setSoft("DETTAGLI","INDIETRO");
      return;
    }

    if(PHONE.mode==="callDetail"){
      const c=PHONE.calls[PHONE.callIndex];
      view.innerHTML='<span class="tiny">DETTAGLI CHIAMATA</span>'+
        '<span class="call-name">'+c.from+'</span>'+
        '<span class="call-sub">'+(c.kind==="persa"?"CHIAMATA PERSA":"CHIAMATA RICEVUTA")+' · '+c.time+'</span>';
      setSoft("CHIAMA","INDIETRO");
      return;
    }

    if(PHONE.mode==="callActive"){
      view.innerHTML=
        '<div class="row"><b>'+PHONE.call.from+'</b><span>'+fmtCallTime()+'</span></div>'+
        '<div class="center tiny" style="margin-top:9px">CHIAMATA IN CORSO</div>'+
        '<div class="center tiny" style="margin-top:6px">TESTO A FIANCO</div>';
      setSoft("OPZIONI","CHIUDI");
      renderCallPop();
      return;
    }

    if(PHONE.mode==="callOptions"){
      view.innerHTML=
        '<div class="row"><b>'+PHONE.call.from+'</b><span>'+fmtCallTime()+'</span></div>'+
        '<div class="center tiny" style="margin-top:9px">SCEGLI RISPOSTA</div>'+
        '<div class="center tiny" style="margin-top:6px">1 / 2 / 3</div>';
      setSoft("SCEGLI","CHIUDI");
      renderCallPop();
      return;
    }
  }

  function sendReply(index=PHONE.replyIndex){
    const m=PHONE.messages[PHONE.msgIndex];
    const labels=m.replies||["OK.","DIMMI DI PIÙ.","NO."];
    const safeIndex=Math.max(0,Math.min(Number(index)||0,labels.length-1));
    const label=labels[safeIndex];

    m.unread=false;
    m.lastReply=label;
    m.replyCount=(m.replyCount||0)+1;
    PHONE.replyIndex=safeIndex;
    PHONE.mode="replySent";

    notify("<b>SMS inviato a "+m.from+":</b> "+label);

    if(typeof window.setCrimeVisualEvent==="function"){
      window.setCrimeVisualEvent(m.tags||["street"],45000);
    }
    render();
  }

  function enter(){
    if(PHONE.ringing){
      answerCall();
      return;
    }

    if(PHONE.mode==="home"){
      PHONE.mode="menu";
      PHONE.menu=0;
    }
    else if(PHONE.mode==="menu"){
      PHONE.mode=PHONE.menu===0?"messages":"calls";
      PHONE.msgIndex=0;
      PHONE.callIndex=0;
    }
    else if(PHONE.mode==="messages"){
      PHONE.messages[PHONE.msgIndex].unread=false;
      PHONE.mode="message";
    }
    else if(PHONE.mode==="message"){
      const m=PHONE.messages[PHONE.msgIndex];
      if(m.replies&&m.replies.length){
        PHONE.mode="reply";
        PHONE.replyIndex=0;
      }else{
        PHONE.mode="messages";
      }
    }
    else if(PHONE.mode==="reply"){
      sendReply(PHONE.replyIndex);
      return;
    }
    else if(PHONE.mode==="replySent"){
      PHONE.mode="messages";
    }
    else if(PHONE.mode==="calls"){
      PHONE.mode="callDetail";
    }
    else if(PHONE.mode==="callDetail"){
      const c=PHONE.calls[PHONE.callIndex];
      PHONE.call={
        from:c.from,
        sub:"CHIAMATA IN USCITA",
        speech:"Il numero squilla, ma in questa preview le chiamate in uscita non aprono nuovi lavori.",
        options:["CHIUDI"],
        tags:["street"]
      };
      PHONE.mode="callActive";
      startCallTimer();
    }
    else if(PHONE.mode==="callActive"){
      PHONE.mode="callOptions";
      PHONE.menu=0;
    }
    else if(PHONE.mode==="callOptions"){
      const choice=PHONE.call.options[PHONE.menu];
      if(choice){
        const answer=(PHONE.call.responses||[])[PHONE.menu];
        notify("<b>"+choice+"</b>"+(answer?" — "+answer:""));
        if(typeof window.setCrimeVisualEvent==="function"){
          window.setCrimeVisualEvent(PHONE.call.tags||["street"],60000);
        }
      }
      endCall();
      return;
    }
    render();
  }

  function back(){
    if(PHONE.ringing){
      declineCall();
      return;
    }

    if(PHONE.mode==="home"){
      focus(false);
      return;
    }
    if(PHONE.mode==="menu") PHONE.mode="home";
    else if(PHONE.mode==="messages"||PHONE.mode==="calls") PHONE.mode="menu";
    else if(PHONE.mode==="message") PHONE.mode="messages";
    else if(PHONE.mode==="reply") PHONE.mode="message";
    else if(PHONE.mode==="replySent") PHONE.mode="messages";
    else if(PHONE.mode==="callDetail") PHONE.mode="calls";
    else if(PHONE.mode==="callActive"||PHONE.mode==="callOptions"){
      endCall();
      return;
    }
    render();
  }

  function nav(dir){
    if(PHONE.ringing) return;
    const plus=(dir==="down"||dir==="right")?1:-1;

    if(PHONE.mode==="menu"){
      PHONE.menu=(PHONE.menu+plus+2)%2;
    }
    else if(PHONE.mode==="messages"){
      PHONE.msgIndex=(PHONE.msgIndex+plus+PHONE.messages.length)%PHONE.messages.length;
    }
    else if(PHONE.mode==="calls"){
      PHONE.callIndex=(PHONE.callIndex+plus+PHONE.calls.length)%PHONE.calls.length;
    }
    else if(PHONE.mode==="reply"){
      PHONE.replyIndex=(PHONE.replyIndex+plus+3)%3;
    }
    else if(PHONE.mode==="callOptions"){
      PHONE.menu=(PHONE.menu+plus+PHONE.call.options.length)%PHONE.call.options.length;
    }
    render();
  }

  function incoming(){
    if(PHONE.ringing || PHONE.mode==="callActive" || PHONE.mode==="callOptions") return;
    PHONE.call=dynamicIncoming();
    PHONE.ringing=true;
    wrap.classList.add("ringing");
    const led=document.getElementById("trapLed");
    if(led) led.classList.add("on");
    screen.classList.add("trap-lcd-flash");
    focus(true);
    render();
    notify("<b>TRAPHONE 16</b> — chiamata in arrivo");
  }

  function answerCall(){
    if(!PHONE.ringing||!PHONE.call) return;
    PHONE.ringing=false;
    wrap.classList.remove("ringing");
    const led=document.getElementById("trapLed");
    if(led) led.classList.remove("on");
    PHONE.mode="callActive";
    PHONE.calls.unshift({from:PHONE.call.from,time:"ADESSO",kind:"ricevuta"});
    PHONE.calls=PHONE.calls.slice(0,6);
    startCallTimer();
    clickTone(660,.06);
    render();
  }

  function declineCall(){
    if(!PHONE.ringing) return;
    PHONE.calls.unshift({from:PHONE.call.from,time:"ADESSO",kind:"persa"});
    PHONE.calls=PHONE.calls.slice(0,6);
    PHONE.ringing=false;
    wrap.classList.remove("ringing");
    const led=document.getElementById("trapLed");
    if(led) led.classList.remove("on");
    PHONE.call=null;
    PHONE.mode="home";
    hideCallPop();
    stopCallTimer();
    render();
    notify("Chiamata rifiutata.");
  }

  function endCall(){
    PHONE.ringing=false;
    wrap.classList.remove("ringing");
    const led=document.getElementById("trapLed");
    if(led) led.classList.remove("on");
    PHONE.call=null;
    PHONE.mode="home";
    hideCallPop();
    stopCallTimer();
    render();
  }

  /* Clic sul corpo: apre sempre la modalità grande, non la richiude. */
  wrap.addEventListener("click",e=>{
    if(e.target.closest("button")) return;
    if(!PHONE.focused) focus(true);
    clickTone();
  });

  $("#trapLeft").onclick=()=>{clickTone();enter()};
  $("#trapRight").onclick=()=>{clickTone();back()};
  $("#trapOk").onclick=()=>{clickTone();enter()};
  $("#trapGreen").onclick=()=>{clickTone(720);PHONE.ringing?answerCall():enter()};
  $("#trapRed").onclick=()=>{clickTone(310);PHONE.ringing?declineCall():back()};

  document.querySelectorAll("[data-trap-nav]").forEach(b=>{
    b.onclick=()=>{clickTone();nav(b.dataset.trapNav)};
  });

  document.querySelectorAll("[data-num]").forEach(b=>{
    b.onclick=()=>{
      const n=b.dataset.num;
      clickTone(430+(Number(n)||0)*28);

      if(PHONE.ringing) return;

      if(PHONE.mode==="home" && n==="1"){
        PHONE.mode="messages";
        PHONE.msgIndex=0;
      }
      else if(PHONE.mode==="home" && n==="2"){
        PHONE.mode="calls";
        PHONE.callIndex=0;
      }
      else if(PHONE.mode==="menu" && n==="1"){
        PHONE.mode="messages";
        PHONE.msgIndex=0;
      }
      else if(PHONE.mode==="menu" && n==="2"){
        PHONE.mode="calls";
        PHONE.callIndex=0;
      }
      else if(PHONE.mode==="reply"){
        const m=PHONE.messages[PHONE.msgIndex];
        const opts=m.replies||[];
        const pick=Number(n)-1;
        if(Number.isInteger(pick) && pick>=0 && pick<opts.length){
          sendReply(pick);
          return;
        }
      }
      else if(["callActive","callOptions"].includes(PHONE.mode) && PHONE.call &&
              Number(n)>=1 && Number(n)<=PHONE.call.options.length){
        PHONE.menu=Number(n)-1;
        PHONE.mode="callOptions";
        enter();
        return;
      }
      render();
    };
  });

  const trapTestCall=$("#trapTestCall");
  if(trapTestCall) trapTestCall.onclick=()=>{clickTone();incoming()};
  const trapTestSms=$("#trapTestSms");
  if(trapTestSms)trapTestSms.onclick=()=>{clickTone();receiveSms();if(!PHONE.focused)focus(true);PHONE.mode="messages";PHONE.msgIndex=0;render();};

  function receiveSms(priority=null){
    const m=generateSms(currentGameState(),true,priority);if(!m)return null;
    PHONE.messages.unshift(m);PHONE.messages=PHONE.messages.slice(0,18);
    notify("<b>"+m.from+"</b> — nuovo SMS");setBadge();
    if(typeof window.setCrimeVisualEvent==="function")window.setCrimeVisualEvent(m.tags||["street"],30000);
    return m;
  }
  function triggerTrapEvent(level="auto"){
    const s=currentGameState(),heat=Number(s.heat||0),rep=Number(s.rep||0);
    if(level==="high"){incoming();return "call";}
    if(level==="medium"){if(Math.random()<.45){incoming();return "call";}receiveSms("medium");return "sms";}
    if(level==="low"){receiveSms("low");return "sms";}
    if((heat>=70||s.arrest||s.arresto||rep>=65)&&Math.random()<.52){incoming();return "call";}
    receiveSms();return "sms";
  }
  function trapContentStats(){return {sms:TRAP_SMS_POOL.length,callFamilies:TRAP_CALL_FAMILIES.length,callVariants:TRAP_CALL_FAMILIES.reduce((n,x)=>n+x.variants.length,0),total:TRAP_SMS_POOL.length+TRAP_CALL_FAMILIES.reduce((n,x)=>n+x.variants.length,0),recentSms:[...TRAP_HISTORY.sms],recentSmsFamilies:[...(TRAP_HISTORY.smsFamilies||[])],recentCalls:[...TRAP_HISTORY.calls],contacts:{...TRAP_HISTORY.contacts}};}

  function syncClock(){
    const c=$("#trapClock");
    if(!c) return;
    try{ c.textContent=window.GAME_TIME?GAME_TIME.text():(document.querySelector("#crimeClock")||{}).textContent||"08:00"; }catch(_){ c.textContent="08:00"; }
  }
  syncClock();
  window.addEventListener("game-time:advanced",syncClock);
  window.addEventListener("game-time:day-start",syncClock);
  window.addEventListener("crime-ui:closed",()=>{ try{ focus(false); }catch(_){} hideCallPop(); });
  render();

  /* Produzione: nessuna chiamata automatica dimostrativa. Gli ingressi arrivano dagli eventi reali. */
  window.TRAPHONE16={
    incoming,
    receiveSms,
    triggerTrapEvent,
    contentStats:trapContentStats,
    generateSms:()=>generateSms(currentGameState(),false),
    generateCall:()=>generateCall(currentGameState(),false),
    focus,
    enter,
    back,
    nav,
    answerCall,
    declineCall,
    render,
    openMessages(){focus(true);PHONE.mode="messages";PHONE.msgIndex=0;render()},
    snapshot(){
      return {
        mode:PHONE.mode,
        menu:PHONE.menu,
        msgIndex:PHONE.msgIndex,
        callIndex:PHONE.callIndex,
        replyIndex:PHONE.replyIndex,
        focused:PHONE.focused,
        ringing:PHONE.ringing,
        unread:PHONE.messages.filter(m=>m.unread).length,
        lastReply:(PHONE.messages[PHONE.msgIndex]||{}).lastReply||null,
        callFrom:PHONE.call&&PHONE.call.from,
        screen:view.innerText,
        softL:softL.textContent,
        softR:softR.textContent
      };
    },
    reset(){
      stopCallTimer();
      PHONE.mode="home";
      PHONE.menu=0;
      PHONE.msgIndex=0;
      PHONE.callIndex=0;
      PHONE.replyIndex=0;
      PHONE.ringing=false;
      PHONE.call=null;
      wrap.classList.remove("ringing");
      const led=document.getElementById("trapLed");
      if(led) led.classList.remove("on");
      render();
    },
    state:PHONE
  };
  window.trapPhoneDemo=window.TRAPHONE16; /* alias compatibilità test legacy */
})();
